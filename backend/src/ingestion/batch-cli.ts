import { readFile, readdir } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { basename, extname, join } from "node:path";
import { createDb } from "../db/connection.js";
import { runMigrations } from "../db/schema.js";
import { seedDefaultData } from "../db/seed.js";
import type { Canal, FormatoDocumento, TipoDocumento } from "../domain/types.js";
import { getAvailableProviders } from "./llm/client.js";
import { processDocument } from "./pipeline.js";

const args = process.argv.slice(2);
const dirPath = args[0];

if (!dirPath) {
	console.error(
		"Usage: npx tsx src/ingestion/batch-cli.ts <directory> [--canal <TELEGRAM|EMAIL|DRIVE>] [--tipo <tipo>] [--limit <n>] [--db <path>] [--delay <ms>]"
	);
	process.exit(1);
}

function parseArgs(argv: string[]): Record<string, string> {
	const result: Record<string, string> = {};
	for (let i = 1; i < argv.length; i++) {
		if (argv[i].startsWith("--") && i + 1 < argv.length) {
			result[argv[i].slice(2)] = argv[i + 1];
			i++;
		}
	}
	return result;
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const PDF_EXTENSIONS = new Set([".pdf"]);

function detectFormato(filePath: string): FormatoDocumento | null {
	const ext = extname(filePath).toLowerCase();
	if (IMAGE_EXTENSIONS.has(ext)) return "IMAGEN";
	if (PDF_EXTENSIONS.has(ext)) return "PDF";
	return null;
}

const options = parseArgs(args);
const canal = (options.canal as Canal) ?? "DRIVE";
const tipo = (options.tipo as TipoDocumento) ?? "FACTURA";
const limit = options.limit ? Number.parseInt(options.limit, 10) : undefined;
const delay = options.delay ? Number.parseInt(options.delay, 10) : 2000;
const dbPath = options.db;

const db = createDb(dbPath);
runMigrations(db);
seedDefaultData(db);

const providers = getAvailableProviders();
console.log(
	`Providers: ${providers.map((p) => p.name).join(" → ")} (fallback chain)`
);

const allFiles = await readdir(dirPath);
const supportedFiles = allFiles
	.filter((f) => detectFormato(f) !== null)
	.sort();

const filesToProcess = limit ? supportedFiles.slice(0, limit) : supportedFiles;

console.log(`Found ${supportedFiles.length} supported files in ${dirPath}`);
if (limit) console.log(`Processing first ${filesToProcess.length} (--limit)`);
console.log(`Canal: ${canal} | Tipo: ${tipo}\n`);

let normalized = 0;
let duplicates = 0;
let errors = 0;
let totalTransactions = 0;
const allNewCategories = new Set<string>();
const errorDetails: Array<{ file: string; error: string }> = [];

for (let i = 0; i < filesToProcess.length; i++) {
	const fileName = filesToProcess[i];
	const filePath = join(dirPath, fileName);
	const formato = detectFormato(fileName)!;

	const progress = `[${i + 1}/${filesToProcess.length}]`;

	try {
		const buffer = await readFile(filePath);

		const result = await processDocument(db, {
			buffer,
			canal,
			formato,
			nombre_archivo: fileName,
			tipo,
		});

		const isDuplicate =
			result.warnings.some((w) => w.startsWith("Documento duplicado"));

		if (isDuplicate) {
			duplicates++;
			console.log(`${progress} SKIP (dup) ${basename(fileName)}`);
		} else if (result.estado === "NORMALIZADO") {
			normalized++;
			totalTransactions += result.transacciones_creadas;
			for (const cat of result.categorias_nuevas) allNewCategories.add(cat);
			console.log(
				`${progress} OK ${basename(fileName)} -> ${result.transacciones_creadas} tx`
			);
		} else {
			errors++;
			const errMsg = result.warnings.at(-1) ?? "unknown";
			errorDetails.push({ file: fileName, error: errMsg });
			console.log(`${progress} ERR ${basename(fileName)}: ${errMsg}`);
		}
	} catch (err) {
		errors++;
		const errMsg = err instanceof Error ? err.message : "unknown";
		errorDetails.push({ file: fileName, error: errMsg });
		console.log(`${progress} CRASH ${basename(fileName)}: ${errMsg}`);
	}

	if (i < filesToProcess.length - 1 && delay > 0) {
		await sleep(delay);
	}
}

console.log("\n=== SUMMARY ===");
console.log(`Total files:        ${filesToProcess.length}`);
console.log(`Normalized:         ${normalized}`);
console.log(`Duplicates skipped: ${duplicates}`);
console.log(`Errors:             ${errors}`);
console.log(`Transactions:       ${totalTransactions}`);
if (allNewCategories.size > 0) {
	console.log(`New categories:     ${[...allNewCategories].join(", ")}`);
}
if (errorDetails.length > 0) {
	console.log("\n=== ERRORS ===");
	for (const { file, error } of errorDetails) {
		console.log(`  ${file}: ${error}`);
	}
}

process.exit(errors > 0 ? 1 : 0);
