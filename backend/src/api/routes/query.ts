import { Hono } from "hono";
import {
	executeDuckDbQuery,
	formatResultAsText,
} from "../../query/executor.js";
import {
	sanitizeSql,
	validateSqlReadOnly,
	validateSqlTableScope,
} from "../../query/guard.js";
import { QueryRequestSchema } from "../../query/schemas.js";
import { translateQuery } from "../../query/translate.js";
import { AppError } from "../middleware/error-handler.js";

export function createQueryRoutes() {
	const app = new Hono();

	app.post("/", async (c) => {
		// 1. Validate input
		const body = await c.req.json();
		const parsed = QueryRequestSchema.safeParse(body);
		if (!parsed.success) {
			throw new AppError("Campo 'question' requerido (1-500 caracteres)", 400);
		}

		const { question } = parsed.data;

		// 2. LLM translation
		const translation = await translateQuery(question);

		// 3. Scope guard — reject non-financial questions
		if (!translation.is_financial_query) {
			return c.json({
				answer:
					translation.rejection_reason ??
					"Solo puedo responder preguntas sobre tus finanzas personales.",
				data: null,
				sql: null,
				explanation: translation.explanation,
				execution_time_ms: null,
			});
		}

		if (!translation.sql) {
			throw new AppError("El LLM no generó una consulta SQL", 500);
		}

		// 4. SQL read-only validation
		const readOnlyResult = validateSqlReadOnly(translation.sql);
		if (!readOnlyResult.valid) {
			console.error(
				"SQL guard blocked (read-only):",
				translation.sql,
				readOnlyResult.errors
			);
			return c.json({
				answer: "No puedo ejecutar esa consulta por razones de seguridad.",
				data: null,
				sql: null,
				explanation: translation.explanation,
				execution_time_ms: null,
			});
		}

		// 5. Table scope validation
		const scopeResult = validateSqlTableScope(translation.sql);
		if (!scopeResult.valid) {
			console.error(
				"SQL guard blocked (scope):",
				translation.sql,
				scopeResult.errors
			);
			return c.json({
				answer: "No puedo ejecutar esa consulta por razones de seguridad.",
				data: null,
				sql: null,
				explanation: translation.explanation,
				execution_time_ms: null,
			});
		}

		// 6. Sanitize SQL
		const sanitizedSql = sanitizeSql(translation.sql);

		// 7. Execute query
		try {
			const result = await executeDuckDbQuery(sanitizedSql);

			// 8. Format result
			const answer = formatResultAsText(result.rows, translation.explanation);

			return c.json({
				answer,
				data: result.rows,
				sql: sanitizedSql,
				explanation: translation.explanation,
				execution_time_ms: result.executionTimeMs,
			});
		} catch (error) {
			console.error("DuckDB execution error:", error);
			return c.json({
				answer:
					"Hubo un error al ejecutar la consulta. Intenta reformular tu pregunta.",
				data: null,
				sql: null,
				explanation: translation.explanation,
				execution_time_ms: null,
			});
		}
	});

	return app;
}
