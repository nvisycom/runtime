import { Context, Effect, Layer } from "effect";
import type { DataSink } from "@nvisy/core";

export type SinkFactory = (
	config: Record<string, unknown>,
) => Effect.Effect<DataSink<unknown>>;

export class SinkRegistry extends Context.Tag("@nvisy/SinkRegistry")<
	SinkRegistry,
	{
		readonly get: (
			name: string,
		) => Effect.Effect<SinkFactory, Error>;
		readonly register: (
			name: string,
			factory: SinkFactory,
		) => Effect.Effect<void>;
		readonly list: () => Effect.Effect<ReadonlyArray<string>>;
	}
>() {
	static Live = Layer.sync(SinkRegistry, () => {
		const sinks = new Map<string, SinkFactory>();
		return {
			get: (name) =>
				Effect.suspend(() => {
					const factory = sinks.get(name);
					if (!factory) {
						return Effect.fail(new Error(`Unknown sink: ${name}`));
					}
					return Effect.succeed(factory);
				}),
			register: (name, factory) =>
				Effect.sync(() => {
					sinks.set(name, factory);
				}),
			list: () => Effect.sync(() => [...sinks.keys()]),
		};
	});
}
