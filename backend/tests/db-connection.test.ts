import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock better-sqlite3 so this test file runs without the native binding
// (the tests in `tests/db/**` need the real binding and are excluded from
// the default `pnpm test` target).
vi.mock("better-sqlite3", () => {
	const Database = vi.fn().mockImplementation(() => ({
		pragma: vi.fn(),
		close: vi.fn(),
		open: true,
	}));
	return { default: Database };
});

import { createDb } from "../src/db/connection.js";

const tmpRoots: string[] = [];

afterEach(() => {
	for (const root of tmpRoots.splice(0)) {
		fs.rmSync(root, { recursive: true, force: true });
	}
	delete process.env.DB_PATH;
});

function newTmpRoot(): string {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "finan-createdb-"));
	tmpRoots.push(root);
	return root;
}

describe("createDb — directory creation", () => {
	it("creates the enclosing directory when it does not exist yet", () => {
		const root = newTmpRoot();
		const missing = path.join(root, "nested", "deep", "finanzas.db");

		createDb(missing);

		expect(fs.existsSync(path.dirname(missing))).toBe(true);
	});

	it("is idempotent when the directory already exists", () => {
		const root = newTmpRoot();
		const dbPath = path.join(root, "finanzas.db");

		expect(() => createDb(dbPath)).not.toThrow();
		expect(() => createDb(dbPath)).not.toThrow();
	});

	it("reads DB_PATH from the environment when no path is passed", () => {
		const root = newTmpRoot();
		const envPath = path.join(root, "from-env", "finanzas.db");
		process.env.DB_PATH = envPath;

		createDb();

		expect(fs.existsSync(path.dirname(envPath))).toBe(true);
	});

	it("does not touch the filesystem for the ':memory:' sentinel", () => {
		const spy = vi.spyOn(fs, "mkdirSync");

		createDb(":memory:");

		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});
});
