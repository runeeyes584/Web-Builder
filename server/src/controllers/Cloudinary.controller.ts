import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

// Video size thresholds
const SMALL_VIDEO_THRESHOLD = 50 * 1024 * 1024; // 50MB - fast direct upload
const MEDIUM_VIDEO_THRESHOLD = 100 * 1024 * 1024; // 100MB - chunked upload
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB max

/**
 * Fast upload for small videos (<50MB)
 * Uses direct upload without chunking for maximum speed
 */
const uploadSmallVideo = async (filePath: string, originalName: string): Promise<any> => {
  console.log(`⚡ Fast upload mode for small video: ${originalName}`);
  
  return cloudinary.uploader.upload(filePath, {
    folder: 'web-builder/videos',
    resource_type: 'video',
    // No chunking for small files - faster direct upload
    timeout: 60000, // 1 minute timeout for small files
    // Apply quality optimization directly since file is small
    transformation: [{ quality: 'auto:good' }],
    // Eager transformations for multiple resolutions
    eager: [
      { width: 1280, height: 720, crop: 'limit', quality: 'auto:good', format: 'mp4' },
      { width: 640, height: 360, crop: 'limit', quality: 'auto:eco', format: 'mp4' },
    ],
    eager_async: true,
  });
};

/**
 * Chunked upload for medium videos (50-100MB)
 * Uses parallel chunk uploading for faster speeds
 */
const uploadMediumVideo = async (filePath: string, originalName: string): Promise<any> => {
  console.log(`📦 Chunked upload mode for medium video: ${originalName}`);
  
  return cloudinary.uploader.upload(filePath, {
    folder: 'web-builder/videos',
    resource_type: 'video',
    chunk_size: 20000000, // 20MB chunks - fewer chunks = faster
    timeout: 300000, // 5 minute timeout
    // No transformation on upload to avoid sync processing error
    eager: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good', format: 'mp4' },
      { width: 854, height: 480, crop: 'limit', quality: 'auto:eco', format: 'mp4' },
    ],
    eager_async: true,
  });
};

/**
 * Large file upload for videos (>100MB)
 * Uses smaller chunks with async processing
 */
const uploadLargeVideo = async (filePath: string, originalName: string): Promise<any> => {
  console.log(`🐘 Large file upload mode for video: ${originalName}`);
  
  return cloudinary.uploader.upload(filePath, {
    folder: 'web-builder/videos',
    resource_type: 'video',
    chunk_size: 10000000, // 10MB chunks for reliability
    timeout: 600000, // 10 minute timeout
    // No transformation for large files - processed asynchronously
    eager: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good', format: 'mp4' },
      { width: 854, height: 480, crop: 'limit', quality: 'auto:eco', format: 'mp4' },
    ],
    eager_async: true,
  });
};

/**
 * Upload image to Cloudinary with optimization and responsive transformations
 */
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Handle both buffer (memoryStorage) and file path (diskStorage)
    let result;
    
    if (req.file.path) {
      // Upload from disk file
      result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'web-builder/images',
        resource_type: 'image',
        transformation: [
          {
            quality: 'auto:good',
            fetch_format: 'auto',
          },
        ],
        responsive_breakpoints: [
          {
            create_derived: true,
            bytes_step: 20000,
            min_width: 320,
            max_width: 1920,
            max_images: 5,
          },
        ],
      });
      
      // Clean up temp file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    } else {
      // Upload from buffer (memory storage)
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);

      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'web-builder/images',
            resource_type: 'image',
            transformation: [
              {
                quality: 'auto:good',
                fetch_format: 'auto',
              },
            ],
            responsive_breakpoints: [
              {
                create_derived: true,
                bytes_step: 20000,
                min_width: 320,
                max_width: 1920,
                max_images: 5,
              },
            ],
          },
          (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        bufferStream.pipe(uploadStream);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: (result as any).secure_url,
        publicId: (result as any).public_id,
        width: (result as any).width,
        height: (result as any).height,
        format: (result as any).format,
        resourceType: (result as any).resource_type,
        breakpoints: (result as any).responsive_breakpoints?.[0]?.breakpoints || [],
      },
    });
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Upload video to Cloudinary with optimization
 * Supports files up to 500MB with tiered upload strategies:
 * - Small (<50MB): Fast direct upload in seconds
 * - Medium (50-100MB): Chunked upload for speed
 * - Large (>100MB): Reliable chunked upload with async processing
 */
export const uploadVideo = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Validate file size
    if (req.file.size > MAX_VIDEO_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Video file too large. Maximum size is 500MB, received ${(req.file.size / 1024 / 1024).toFixed(1)}MB`,
      });
    }

    const fileSizeMB = (req.file.size / 1024 / 1024).toFixed(2);
    const originalName = req.file.originalname;
    
    console.log(`\n📹 Starting video upload: ${originalName} (${fileSizeMB}MB)`);

    // Must have file path for video uploads (using disk storage)
    if (!req.file.path) {
      return res.status(400).json({
        success: false,
        message: 'Video upload requires disk storage configuration',
      });
    }

    let result;
    let uploadMode: string;
    
    // Choose upload strategy based on file size
    if (req.file.size <= SMALL_VIDEO_THRESHOLD) {
      // FAST PATH: Small videos (<50MB) - direct upload, completes in seconds
      uploadMode = 'fast';
      result = await uploadSmallVideo(req.file.path, originalName);
    } else if (req.file.size <= MEDIUM_VIDEO_THRESHOLD) {
      // CHUNKED PATH: Medium videos (50-100MB)
      uploadMode = 'chunked';
      result = await uploadMediumVideo(req.file.path, originalName);
    } else {
      // LARGE FILE PATH: Large videos (>100MB)
      uploadMode = 'large';
      result = await uploadLargeVideo(req.file.path, originalName);
    }
    
    // Clean up temp file after successful upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp video file:', err);
      else console.log('✓ Temp video file cleaned up');
    });

    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Video uploaded successfully in ${uploadTime}s (${uploadMode} mode)`);
    console.log(`   Public ID: ${result.public_id}`);
    console.log(`   Size: ${result.bytes ? (result.bytes / 1024 / 1024).toFixed(2) : fileSizeMB}MB`);

    // Generate optimized URL using Cloudinary's on-the-fly transformation
    const generateOptimizedUrl = (publicId: string, width: number, quality: string) => {
      return cloudinary.url(publicId, {
        resource_type: 'video',
        width,
        crop: 'limit',
        quality,
        format: 'mp4',
      });
    };

    return res.status(200).json({
      success: true,
      message: `Video uploaded successfully in ${uploadTime}s`,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        duration: result.duration,
        resourceType: result.resource_type,
        bytes: result.bytes,
        uploadTime: parseFloat(uploadTime),
        uploadMode,
        optimizedUrls: {
          original: result.secure_url,
          hd: generateOptimizedUrl(result.public_id, 1920, 'auto:good'),
          sd: generateOptimizedUrl(result.public_id, 854, 'auto:eco'),
          mobile: generateOptimizedUrl(result.public_id, 480, 'auto:low'),
        },
        eagerStatus: 'processing',
      },
    });
  } catch (error: any) {
    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Error uploading video after ${uploadTime}s:`, {
      message: error.message,
      name: error.name,
      http_code: error.http_code,
    });
    
    // Provide more helpful error messages
    let userMessage = 'Failed to upload video';
    if (error.http_code === 400 && error.message?.includes('too large')) {
      userMessage = 'Video is too large for immediate processing. Please try a smaller file.';
    } else if (error.http_code === 413) {
      userMessage = 'Video file exceeds maximum upload size.';
    } else if (error.message?.includes('timeout')) {
      userMessage = 'Upload timed out. Please try again or use a smaller file.';
    }
    
    // Clean up temp file on error
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    
    return res.status(500).json({
      success: false,
      message: userMessage,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Upload image from URL
 */
export const uploadImageFromUrl = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required',
      });
    }

    // Upload from URL
    const result = await cloudinary.uploader.upload(url, {
      folder: 'web-builder/images',
      resource_type: 'image',
      transformation: [
        {
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      ],
      responsive_breakpoints: [
        {
          create_derived: true,
          bytes_step: 20000,
          min_width: 320,
          max_width: 1920,
          max_images: 5,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resource_type,
        breakpoints: result.responsive_breakpoints?.[0]?.breakpoints || [],
      },
    });
  } catch (error) {
    console.error('Error uploading image from URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image from URL',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Upload video from URL
 * Uses async processing for large videos
 */
export const uploadVideoFromUrl = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required',
      });
    }

    console.log(`Uploading video from URL: ${url}`);

    // Upload from URL with optimized settings
    // No transformation on initial upload to avoid sync processing issues
    const result = await cloudinary.uploader.upload(url, {
      folder: 'web-builder/videos',
      resource_type: 'video',
      chunk_size: 10000000, // 10MB chunks
      timeout: 600000, // 10 minute timeout
      // Use eager_async for post-upload processing
      eager: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good', format: 'mp4' },
        { width: 854, height: 480, crop: 'limit', quality: 'auto:eco', format: 'mp4' },
      ],
      eager_async: true, // Process transformations asynchronously
    });

    console.log(`Video from URL uploaded successfully: ${result.public_id}`);

    // Generate optimized URL using Cloudinary's on-the-fly transformation
    const generateOptimizedUrl = (publicId: string, width: number, quality: string) => {
      return cloudinary.url(publicId, {
        resource_type: 'video',
        width,
        crop: 'limit',
        quality,
        format: 'mp4',
      });
    };

    return res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        duration: result.duration,
        resourceType: result.resource_type,
        bytes: result.bytes,
        optimizedUrls: {
          original: result.secure_url,
          hd: generateOptimizedUrl(result.public_id, 1920, 'auto:good'),
          sd: generateOptimizedUrl(result.public_id, 854, 'auto:eco'),
          mobile: generateOptimizedUrl(result.public_id, 480, 'auto:low'),
        },
        eagerStatus: 'processing',
      },
    });
  } catch (error: any) {
    console.error('Error uploading video from URL:', {
      message: error.message,
      name: error.name,
      http_code: error.http_code,
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to upload video from URL',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete resource from Cloudinary
 */
export const deleteResource = async (req: Request, res: Response) => {
  try {
    const { publicId, resourceType } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'publicId is required',
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || 'image',
    });

    return res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error deleting resource from Cloudinary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete resource',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
