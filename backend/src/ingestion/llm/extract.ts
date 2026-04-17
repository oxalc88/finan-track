import type { TipoDocumento } from "../../domain/types.js";
import { generateWithFallback } from "./fallback.js";
import { type ExtractionResult, ExtractionResultSchema } from "./schemas.js";

export type ExtractionInput =
	| { kind: "text"; text: string }
	| { kind: "image"; buffer: Buffer; mediaType?: string };

export async function extractTransactions(
	input: ExtractionInput,
	documentType: TipoDocumento
): Promise<{ result: ExtractionResult; provider: string }> {
	const systemPrompt = buildSystemPrompt(documentType);

	if (input.kind === "text") {
		const { object, provider } = await generateWithFallback<ExtractionResult>({
			schema: ExtractionResultSchema,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: `## Document text\n${input.text}` },
			],
		});
		return { result: object, provider };
	}

	const { object, provider } = await generateWithFallback<ExtractionResult>({
		schema: ExtractionResultSchema,
		messages: [
			{ role: "system", content: systemPrompt },
			{
				role: "user",
				content: [
					{
						type: "image",
						image: input.buffer,
						mediaType: input.mediaType ?? "image/jpeg",
					},
					{
						type: "text",
						text: "Extract all financial transactions from this receipt/boleta image.",
					},
				],
			},
		],
	});
	return { result: object, provider };
}

function buildSystemPrompt(documentType: TipoDocumento): string {
	return `You are a financial document parser specialized in Peruvian banking documents.

## Context
- Document type: ${documentType}
- Currency: PEN (Peruvian soles) or USD (US dollars)
- Peruvian banks: BCP, BBVA, Interbank, Scotiabank, IO (BCP fintech)
- Digital wallets: Yape (BCP), Plin (multi-bank) — classify as YAPE_PLIN payment type
- RUC: Peruvian tax ID for businesses (11 digits). DNI: Peruvian national ID for individuals (8 digits).

## Peruvian boleta/factura structure (CRITICAL)
In Peruvian receipts (boletas de venta electrónica):
- The **MERCHANT/BUSINESS** name and RUC appear at the TOP/HEADER of the receipt (before "BOLETA DE VENTA")
- "RAZÓN SOCIAL" or "CLIENTE" fields contain the CUSTOMER name, NOT the merchant
- "RUC/DNI" below RAZÓN SOCIAL is the CUSTOMER's ID, NOT the merchant's
- The merchant RUC is always 11 digits and appears in the header near the business name
- NEVER use the customer name as the merchant name

## Task
Extract all financial transactions from the document. For each transaction, identify:
- fecha: Transaction date in YYYY-MM-DD format
- monto: Amount as a positive decimal number (expenses are positive, payments/credits are negative)
- moneda: PEN or USD
- comercio: Merchant/business name from the HEADER of the receipt (NOT the customer/RAZÓN SOCIAL)
- comercio_ruc: Merchant RUC from the HEADER (11-digit number, NOT the customer DNI/RUC)
- tipo_pago: TARJETA (card purchase), EFECTIVO (cash), TRANSFERENCIA (transfer), YAPE_PLIN (Yape/Plin)
- cuotas: Number of installments if mentioned

${
	documentType === "ESTADO_CUENTA"
		? `For credit card statements, also extract:
- periodo_inicio: Statement period start date (YYYY-MM-DD)
- periodo_fin: Statement period end date (YYYY-MM-DD)
- fecha_pago: Payment due date (YYYY-MM-DD)
- deuda_total: Total debt amount
- pago_minimo: Minimum payment amount
- linea_disponible: Available credit line`
		: ""
}`;
}
