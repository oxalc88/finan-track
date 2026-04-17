import type { MiddlewareHandler } from "hono";
import { ZodError } from "zod";

// Hono's internal compose loop catches route-handler exceptions at dispatch
// level and routes them to `app.onError`, so a classic `try { await next() }
// catch` wrapper never sees them. Inspect `c.error` after next() instead.
export const validationMiddleware: MiddlewareHandler = async (c, next) => {
	await next();
	const err = c.error;
	if (err instanceof ZodError) {
		c.res = c.json(
			{
				error: "Validation failed",
				issues: err.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
					code: issue.code,
				})),
			},
			422,
		);
	}
};
