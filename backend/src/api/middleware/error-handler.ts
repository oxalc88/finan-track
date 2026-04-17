import type { Context } from "hono";

export class AppError extends Error {
	readonly statusCode: number;

	constructor(message: string, statusCode = 400) {
		super(message);
		this.statusCode = statusCode;
	}
}

export function errorHandler(err: Error, c: Context): Response {
	if (err instanceof AppError) {
		return c.json(
			{ error: err.message },
			err.statusCode as 400 | 404 | 409 | 500
		);
	}

	// SQLite constraint errors
	if (err.message?.includes("UNIQUE constraint failed")) {
		return c.json({ error: "Resource already exists" }, 409);
	}
	if (err.message?.includes("FOREIGN KEY constraint failed")) {
		return c.json({ error: "Referenced resource not found" }, 400);
	}

	console.error("Unhandled error:", err);
	return c.json({ error: "Internal server error" }, 500);
}
