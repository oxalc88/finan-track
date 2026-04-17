import type { TipoCuenta } from "../../domain/types.js";

export type FrontendAccountType = "checking" | "savings" | "investment";

const ACCOUNT_TYPE_MAP: Record<TipoCuenta, FrontendAccountType> = {
	CORRIENTE: "checking",
	AHORRO: "savings",
	CTS: "savings",
	PLAZO_FIJO: "savings",
};

export function tipoCuentaToAccountType(tipo: TipoCuenta): FrontendAccountType {
	return ACCOUNT_TYPE_MAP[tipo];
}
