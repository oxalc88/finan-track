import { describe, expect, it } from "vitest";
import { tipoCuentaToAccountType } from "../../../src/api/adapters/enums.js";

describe("tipoCuentaToAccountType", () => {
	it("maps CORRIENTE to 'checking'", () => {
		expect(tipoCuentaToAccountType("CORRIENTE")).toBe("checking");
	});

	it("maps AHORRO / CTS / PLAZO_FIJO to 'savings'", () => {
		expect(tipoCuentaToAccountType("AHORRO")).toBe("savings");
		expect(tipoCuentaToAccountType("CTS")).toBe("savings");
		expect(tipoCuentaToAccountType("PLAZO_FIJO")).toBe("savings");
	});
});
