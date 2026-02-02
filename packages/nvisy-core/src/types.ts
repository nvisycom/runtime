/** Constructor reference for runtime class checks. */
export type ClassRef<T> = abstract new (...args: never[]) => T;
