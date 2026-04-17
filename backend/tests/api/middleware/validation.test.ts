import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validationMiddleware } from "../../../src/api/middleware/validation.js";

describe("validationMiddleware", () => {
	it("passes through when the handler does not throw", async () => {
		const app = new Hono();
		app.use("*", validationMiddleware);
		app.get("/ok", (c) => c.json({ hello: "world" }, 200));

		const res = await app.request("/ok");

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ hello: "world" });
	});

	it("returns 422 with {error, issues[]} when a ZodError is thrown", async () => {
		const schema = z.object({
			foo: z.object({
				bar: z.string(),
			}),
		});

		const app = new Hono();
		app.use("*", validationMiddleware);
		// Silence Hono's default errorHandler (which would console.error the
		// ZodError before our middleware rewrites the response).
		app.onError((_err, c) => c.body(null, 500));
		app.post("/parse", async (c) => {
			const body = schema.parse(await c.req.json());
			return c.json(body, 200);
		});

		const res = await app.request("/parse", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ foo: { bar: 42 } }),
		});

		expect(res.status).toBe(422);
		const payload = (await res.json()) as {
			error: string;
			issues: { path: string; message: string; code: string }[];
		};

		expect(payload.error).toBe("Validation failed");
		expect(Array.isArray(payload.issues)).toBe(true);
		expect(payload.issues.length).toBeGreaterThan(0);

		const issue = payload.issues[0];
		expect(typeof issue.path).toBe("string");
		expect(typeof issue.message).toBe("string");
		expect(typeof issue.code).toBe("string");
		expect(issue.path).toBe("foo.bar");
	});

	it("rethrows non-Zod errors so the global error handler can catch them", async () => {
		const app = new Hono();
		app.use("*", validationMiddleware);
		app.get("/boom", () => {
			throw new Error("boom");
		});

		let caught: Error | null = null;
		app.onError((err, c) => {
			caught = err;
			return c.json({ error: err.message }, 500);
		});

		const res = await app.request("/boom");

		expect(res.status).toBe(500);
		expect(caught).not.toBeNull();
		expect((caught as unknown as Error).message).toBe("boom");
	});
});
