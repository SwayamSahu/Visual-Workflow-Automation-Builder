import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Factory that returns Express middleware validating req.body against a Zod schema.
 * Replaces req.body with the parsed (and transformed) output on success.
 * Calls next(ValidationError) on failure — caught by the global error handler.
 */
export function validateBody(schema: ZodSchema): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ');
        next(new ValidationError(messages));
      } else {
        next(err);
      }
    }
  };
}
