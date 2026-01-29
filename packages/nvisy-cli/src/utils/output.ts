/** Print a success message to stdout. */
export function success(message: string): void {
	console.log(`[ok] ${message}`);
}

/** Print an error message to stderr. */
export function error(message: string): void {
	console.error(`[error] ${message}`);
}

/** Print an info message to stdout. */
export function info(message: string): void {
	console.log(`[info] ${message}`);
}
