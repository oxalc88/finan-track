import type { MiddlewareHandler } from "hono";
import { ZodError } from "zod";

export const validationMiddleware: MiddlewareHandler = async (c, next) => {
	try {
		await next();
	} catch (err) {
		if (err instanceof ZodError) {
			return c.json(
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
		throw err;
	}
};
