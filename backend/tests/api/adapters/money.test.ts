import { describe, expect, it } from "vitest";
import {
	basisPointsToPercent,
	centavosToDecimal,
} from "../../../src/api/adapters/money.js";

describe("centavosToDecimal", () => {
	it("converts a whole-number centavo amount to decimal soles", () => {
		expect(centavosToDecimal(4250)).toBe(42.5);
	});

	it("returns 0 for 0 centavos", () => {
		expect(centavosToDecimal(0)).toBe(0);
	});

	it("handles negative centavos (expense-style sums)", () => {
		expect(centavosToDecimal(-1299)).toBe(-12.99);
	});

	it("rounds non-integer inputs to the nearest centavo before converting", () => {
		// Defensive: the DB schema is integer-only, but SUM(...) results can be
		// float when values exceed safe integer range. Round-trip must not emit
		// fractional centavos.
		expect(centavosToDecimal(1234.6)).toBe(12.35);
	});
});

describe("basisPointsToPercent", () => {
	it("converts 550 basis points to 5.5%", () => {
		expect(basisPointsToPercent(550)).toBe(5.5);
	});

	it("converts 0 basis points to 0%", () => {
		expect(basisPointsToPercent(0)).toBe(0);
	});

	it("supports negative rates", () => {
		expect(basisPointsToPercent(-150)).toBe(-1.5);
	});
});
