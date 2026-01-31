import { Context, Effect, Layer } from "effect";
import type { DataSource } from "@nvisy/core";

export type SourceFactory = (
	config: Record<string, unknown>,
) => Effect.Effect<DataSource<unknown>>;

export class SourceRegistry extends Context.Tag("@nvisy/SourceRegistry")<
	SourceRegistry,
	{
		readonly get: (
			name: string,
		) => Effect.Effect<SourceFactory, Error>;
		readonly register: (
			name: string,
			factory: SourceFactory,
		) => Effect.Effect<void>;
		readonly list: () => Effect.Effect<ReadonlyArray<string>>;
	}
>() {
	static Live = Layer.sync(SourceRegistry, () => {
		const sources = new Map<string, SourceFactory>();
		return {
			get: (name) =>
				Effect.suspend(() => {
					const factory = sources.get(name);
					if (!factory) {
						return Effect.fail(new Error(`Unknown source: ${name}`));
					}
					return Effect.succeed(factory);
				}),
			register: (name, factory) =>
				Effect.sync(() => {
					sources.set(name, factory);
				}),
			list: () => Effect.sync(() => [...sources.keys()]),
		};
	});
}
