import { generateWithFallback } from "./fallback.js";
import {
	type CategoryAssignment,
	CategoryAssignmentSchema,
	type RawTransaction,
} from "./schemas.js";

export async function categorizeTransactions(
	transactions: RawTransaction[],
	existingCategories: string[]
): Promise<{ result: CategoryAssignment; provider: string }> {
	const { object, provider } =
		await generateWithFallback<CategoryAssignment>({
			schema: CategoryAssignmentSchema,
			prompt: buildCategorizationPrompt(transactions, existingCategories),
		});

	return { result: object, provider };
}

function buildCategorizationPrompt(
	transactions: RawTransaction[],
	existingCategories: string[]
): string {
	const transactionList = transactions
		.map(
			(t, i) =>
				`[${i}] ${t.fecha} | ${t.comercio} | ${t.monto} ${t.moneda} | ${t.tipo_pago}`
		)
		.join("\n");

	return `You are a financial transaction categorizer for a Peruvian personal finance app.

## Existing categories
${existingCategories.length > 0 ? existingCategories.join("\n") : "(none yet)"}

## Rules
1. PREFER existing categories (case-insensitive match). Only create new ones when no existing category fits.
2. Category names should be in Spanish, descriptive, and general enough to group similar merchants.
3. Common categories for Peru: Restaurantes, Supermercados, Transporte, Salud, Educacion, Entretenimiento, Servicios, Seguros, Telecomunicaciones, Combustible, Ropa, Hogar, Viajes, Mascotas.
4. For SUNAT deductible expenses, use categories that align with SUNAT deduction categories: Restaurantes y Hoteles, Servicios Profesionales, Alquiler de Inmuebles.
5. Confidence: 90-100 for clear matches (e.g., "Wong" → Supermercados), 60-89 for reasonable guesses, below 60 for uncertain.

## Transactions
${transactionList}

## Task
Assign a category to each transaction by index. Set es_nueva=true only if the category does not exist in the existing list above.`;
}
