import type { Response } from 'express';

export function sendError(response: Response, statusCode: number, message: string) {
  return response.status(statusCode).json({
    message,
  });
}