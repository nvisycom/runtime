import { Context, Effect, Layer } from "effect";
import type { AnyData } from "@nvisy/core";

export type ActionFn = (
	items: ReadonlyArray<AnyData>,
	config: Record<string, unknown>,
) => Effect.Effect<ReadonlyArray<AnyData>>;

export class ActionRegistry extends Context.Tag("@nvisy/ActionRegistry")<
	ActionRegistry,
	{
		readonly get: (
			name: string,
		) => Effect.Effect<ActionFn, Error>;
		readonly register: (
			name: string,
			fn: ActionFn,
		) => Effect.Effect<void>;
		readonly list: () => Effect.Effect<ReadonlyArray<string>>;
	}
>() {
	static Live = Layer.sync(ActionRegistry, () => {
		const actions = new Map<string, ActionFn>();
		return {
			get: (name) =>
				Effect.suspend(() => {
					const action = actions.get(name);
					if (!action) {
						return Effect.fail(new Error(`Unknown action: ${name}`));
					}
					return Effect.succeed(action);
				}),
			register: (name, fn) =>
				Effect.sync(() => {
					actions.set(name, fn);
				}),
			list: () => Effect.sync(() => [...actions.keys()]),
		};
	});
}
