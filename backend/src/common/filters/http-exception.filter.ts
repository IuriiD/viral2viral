/**
 * HttpExceptionFilter
 *
 * Centralized exception filter for consistent error responses.
 * Transforms exceptions into standardized API error format.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
    path?: string;
  };
}

/**
 * HttpExceptionFilter catches all HTTP exceptions and formats them consistently
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected error occurred';

    // Handle HttpException instances
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorMessage = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        errorMessage = (responseObj.message as string) || errorMessage;
        errorCode =
          (responseObj.error as string) || this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      // Handle standard Error instances
      errorMessage = exception.message;
    }

    // Log the error for debugging
    console.error('Exception caught:', {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      errorCode,
      errorMessage,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Build error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Map HTTP status code to error code
   * @param status - HTTP status code
   * @returns Error code string
   */
  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      case HttpStatus.INTERNAL_SERVER_ERROR:
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
