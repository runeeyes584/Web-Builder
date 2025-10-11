import { Request, Response, NextFunction } from 'express';

export const getExample = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Example endpoint - replace with real logic
    const data = {
      message: 'Example API endpoint',
      timestamp: new Date().toISOString(),
      data: { sample: 'data' },
    };

    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const createExample = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;

    // Basic validation
    if (!name) {
      const error = new Error('Name is required') as any;
      error.statusCode = 400;
      throw error;
    }

    const created = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};