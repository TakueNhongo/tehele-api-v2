import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

@Catch(MongoError, MongooseError)
export class MongooseExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError | MongooseError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = 400;
    let message = 'Bad Request';

    if (exception instanceof MongoError) {
      if (exception.code === 11000) {
        message = 'Duplicate key error';
      }
    } else if (exception instanceof MongooseError.ValidationError) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: exception.message,
    });
  }
}
