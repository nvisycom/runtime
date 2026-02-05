import { getLogger } from "@logtape/logtape";
import { aiPlugin } from "@nvisy/plugin-ai";
import { objectPlugin } from "@nvisy/plugin-object";
import { pandocPlugin } from "@nvisy/plugin-pandoc";
import { sqlPlugin } from "@nvisy/plugin-sql";
import { vectorPlugin } from "@nvisy/plugin-vector";
import { Engine } from "@nvisy/runtime";

const logger = getLogger(["nvisy", "engine"]);

/** Create and initialize the Engine with all standard plugins. */
export function createEngine(): Engine {
	logger.info("Initializing engine");

	try {
		const engine = new Engine()
			.register(aiPlugin)
			.register(objectPlugin)
			.register(pandocPlugin)
			.register(sqlPlugin)
			.register(vectorPlugin);

		const { actions, providers } = engine.schema;
		logger.info(
			"Engine initialized (actions={actions}, providers={providers})",
			{
				actions: actions.length,
				providers: providers.length,
			},
		);

		return engine;
	} catch (error) {
		logger.fatal("Failed to initialize engine: {error}", { error });
		throw error;
	}
}
