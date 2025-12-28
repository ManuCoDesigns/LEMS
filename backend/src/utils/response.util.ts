import { Response } from 'express';

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  errors?: any[];
}

/**
 * Send success response
 */
export const sendSuccess = (
  res: Response,
  statusCode: number = 200,
  message: string,
  data?: any
) => {
  const response: ApiResponse = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  statusCode: number = 500,
  message: string,
  error?: string,
  errors?: any[]
) => {
  const response: ApiResponse = {
    success: false,
    message,
  };

  if (error) {
    response.error = error;
  }

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: any[]
) => {
  return sendError(
    res,
    400,
    'Validation failed',
    undefined,
    errors
  );
};