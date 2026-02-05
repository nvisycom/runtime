import type { Engine } from "@nvisy/runtime";
import type { Context, MiddlewareHandler } from "hono";

const ENGINE_KEY = "engine" as const;

declare module "hono" {
	interface ContextVariableMap {
		[ENGINE_KEY]: Engine;
	}
}

/** Middleware that injects the Engine into Hono context. */
export function engineMiddleware(engine: Engine): MiddlewareHandler {
	return async (c, next) => {
		c.set(ENGINE_KEY, engine);
		await next();
	};
}

/** Retrieve the Engine from Hono context. */
export function getEngine(c: Context): Engine {
	return c.get(ENGINE_KEY);
}
