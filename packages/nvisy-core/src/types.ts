/** Constructor reference for runtime `instanceof` checks and generic type inference. */
export type ClassRef<T> = abstract new (...args: never[]) => T;
