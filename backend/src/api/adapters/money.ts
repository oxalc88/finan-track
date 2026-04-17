// Money in this codebase is stored as integer centavos (S/42.50 = 4250).
// The frontend DashboardData DTO expects decimal soles/dollars.
export function centavosToDecimal(centavos: number): number {
	return Math.round(centavos) / 100;
}

// Rates are stored as integer basis points (5.5% = 550).
export function basisPointsToPercent(basisPoints: number): number {
	return basisPoints / 100;
}
