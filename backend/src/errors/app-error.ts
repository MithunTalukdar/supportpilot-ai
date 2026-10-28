import { HttpStatus, HttpStatusCode } from '../constants/http-status.js';
import { ErrorCode, ErrorCodeType } from '../constants/error-codes.js';

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errorCode: ErrorCodeType;
  public readonly details?: ErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCodeType = ErrorCode.INTERNAL_ERROR,
    details?: ErrorDetail[],
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: ErrorDetail[]) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: ErrorDetail[]) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict detected') {
    super(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT);
  }
}
