export function normalizeL2(vector: number[]): number[] {
	const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
	if (norm === 0) {
		return vector;
	}
	return vector.map((v) => v / norm);
}
