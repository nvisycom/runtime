/**
 * Constructor reference for runtime type checks.
 *
 * Used to pass class constructors as values for instanceof checks
 * and generic type inference.
 */
export type ClassRef<T> = abstract new (...args: never[]) => T;
