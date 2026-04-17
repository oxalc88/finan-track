import { z } from "zod";

export const RawTransactionSchema = z.object({
	fecha: z.string().describe("Transaction date in YYYY-MM-DD format"),
	monto: z
		.number()
		.describe("Amount in original currency, as decimal (e.g. 42.50)"),
	moneda: z
		.enum(["PEN", "USD"])
		.describe("Currency: PEN (soles) or USD (dollars)"),
	comercio: z.string().describe("Merchant/commerce name"),
	comercio_ruc: z
		.string()
		.nullable()
		.describe("Merchant RUC (Peruvian tax ID), null if not visible"),
	tipo_pago: z
		.enum(["TARJETA", "EFECTIVO", "TRANSFERENCIA", "YAPE_PLIN"])
		.describe("Payment type"),
	cuotas: z
		.number()
		.nullable()
		.describe("Number of installments, null if not applicable"),
});

export const ExtractionResultSchema = z.object({
	transactions: z.array(RawTransactionSchema),
	periodo_inicio: z
		.string()
		.nullable()
		.describe("Statement period start date YYYY-MM-DD"),
	periodo_fin: z
		.string()
		.nullable()
		.describe("Statement period end date YYYY-MM-DD"),
	fecha_pago: z.string().nullable().describe("Payment due date YYYY-MM-DD"),
	deuda_total: z
		.number()
		.nullable()
		.describe("Total debt amount in original currency"),
	pago_minimo: z
		.number()
		.nullable()
		.describe("Minimum payment amount in original currency"),
	linea_disponible: z
		.number()
		.nullable()
		.describe("Available credit line in original currency"),
});

export const CategoryAssignmentSchema = z.object({
	assignments: z.array(
		z.object({
			index: z.number().describe("Zero-based index of the transaction"),
			categoria: z.string().describe("Category name in Spanish"),
			es_nueva: z
				.boolean()
				.describe("True if this is a new category not in the existing list"),
			confianza: z.number().min(0).max(100).describe("Confidence score 0-100"),
		})
	),
});

export type RawTransaction = z.infer<typeof RawTransactionSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export type CategoryAssignment = z.infer<typeof CategoryAssignmentSchema>;
