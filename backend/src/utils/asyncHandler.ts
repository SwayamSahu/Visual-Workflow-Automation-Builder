import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler and forwards any thrown errors to Express's
 * next() so they reach the global error handler middleware.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
