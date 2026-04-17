import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface ExtractionResult {
	pages: number;
	text: string;
}

export async function extractTextFromPdf(
	filePath: string,
	password?: string
): Promise<ExtractionResult> {
	const args: string[] = [];

	if (password) {
		args.push("-upw", password);
	}

	// -layout preserves the original layout (important for table alignment)
	args.push("-layout", filePath, "-");

	const { stdout } = await execFileAsync("pdftotext", args);

	const pages = (stdout.match(/\f/g) || []).length + 1;

	return { text: stdout, pages };
}
