const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface CloudinaryUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    duration?: number;
    resourceType: string;
    bytes?: number;
    uploadTime?: number; // Upload time in seconds
    uploadMode?: 'fast' | 'chunked' | 'large'; // Upload strategy used
    breakpoints?: Array<{
      width: number;
      height: number;
      secure_url: string;
    }>;
    optimizedUrls?: {
      original?: string;
      hd: string;
      sd: string;
      mobile?: string;
    };
    eagerStatus?: 'processing' | 'complete';
  };
  error?: string;
}

export const cloudinaryApi = {
  /**
   * Upload image file to Cloudinary
   */
  uploadImage: async (file: File): Promise<CloudinaryUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/cloudinary/upload/image`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error uploading image:", error);
      return {
        success: false,
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Upload video file to Cloudinary
   */
  uploadVideo: async (file: File): Promise<CloudinaryUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/cloudinary/upload/video`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error uploading video:", error);
      return {
        success: false,
        message: "Failed to upload video",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Upload image from URL to Cloudinary
   */
  uploadImageFromUrl: async (url: string): Promise<CloudinaryUploadResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cloudinary/upload/image/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error uploading image from URL:", error);
      return {
        success: false,
        message: "Failed to upload image from URL",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Upload video from URL to Cloudinary
   */
  uploadVideoFromUrl: async (url: string): Promise<CloudinaryUploadResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cloudinary/upload/video/url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error uploading video from URL:", error);
      return {
        success: false,
        message: "Failed to upload video from URL",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Delete resource from Cloudinary
   */
  deleteResource: async (
    publicId: string,
    resourceType: "image" | "video" = "image"
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cloudinary/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId, resourceType }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error deleting resource:", error);
      return {
        success: false,
        message: "Failed to delete resource",
      };
    }
  },
};
