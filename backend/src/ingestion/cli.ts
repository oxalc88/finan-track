import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { createDb } from "../db/connection.js";
import { runMigrations } from "../db/schema.js";
import type {
	Canal,
	FormatoDocumento,
	TipoDocumento,
} from "../domain/types.js";
import { processDocument } from "./pipeline.js";

const args = process.argv.slice(2);
const filePath = args[0];

if (!filePath) {
	console.error(
		"Usage: npx tsx src/ingestion/cli.ts <file> [--password <pwd>] [--canal <TELEGRAM|EMAIL|DRIVE>] [--entidad <id>] [--producto <id>] [--tipo <tipo>]"
	);
	process.exit(1);
}

function parseArgs(args: string[]): Record<string, string> {
	const result: Record<string, string> = {};
	for (let i = 1; i < args.length; i++) {
		if (args[i].startsWith("--") && i + 1 < args.length) {
			const key = args[i].slice(2);
			result[key] = args[i + 1];
			i++;
		}
	}
	return result;
}

function detectFormato(filePath: string): FormatoDocumento {
	const ext = extname(filePath).toLowerCase();
	if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return "IMAGEN";
	if (ext === ".pdf") return "PDF";
	if ([".html", ".htm"].includes(ext)) return "EMAIL_HTML";
	return "PDF";
}

const options = parseArgs(args);

const db = createDb();
runMigrations(db);

const buffer = await readFile(filePath);
const formato =
	(options.formato as FormatoDocumento) ?? detectFormato(filePath);

console.log(
	`Processing: ${basename(filePath)} (${buffer.length} bytes, ${formato})`
);

const result = await processDocument(db, {
	buffer,
	canal: (options.canal as Canal) ?? "DRIVE",
	entidad_financiera_id: options.entidad,
	formato,
	nombre_archivo: basename(filePath),
	password: options.password,
	producto_credito_id: options.producto,
	tipo: (options.tipo as TipoDocumento) ?? "FACTURA",
});

console.log(`\nResult: ${result.estado}`);
console.log(`Document ID: ${result.documento_id}`);
console.log(`Transactions created: ${result.transacciones_creadas}`);

if (result.categorias_nuevas.length > 0) {
	console.log(`New categories: ${result.categorias_nuevas.join(", ")}`);
}

if (result.warnings.length > 0) {
	console.log("\nWarnings:");
	for (const w of result.warnings) {
		console.log(`  - ${w}`);
	}
}

process.exit(result.estado === "NORMALIZADO" ? 0 : 1);
