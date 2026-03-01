export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: 400 | 401 | 403 | 404 | 409 | 500 = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Narrow an unknown catch value into something with a message + optional statusCode. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";
  return new AppError(message, 500);
}
