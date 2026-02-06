import { getLogger } from "@logtape/logtape";
import { aiPlugin } from "@nvisy/plugin-ai";
import { markupPlugin } from "@nvisy/plugin-markup";
import { nosqlPlugin } from "@nvisy/plugin-nosql";
import { objectPlugin } from "@nvisy/plugin-object";
import { tesseractPlugin } from "@nvisy/plugin-tesseract";
import { pandocPlugin } from "@nvisy/plugin-pandoc";
import { queuePlugin } from "@nvisy/plugin-queue";
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
			.register(markupPlugin)
			.register(nosqlPlugin)
			.register(objectPlugin)
			.register(tesseractPlugin)
			.register(pandocPlugin)
			.register(queuePlugin)
			.register(sqlPlugin)
			.register(vectorPlugin);

		const { actions, providers, streams, loaders, datatypes } = engine.schema;
		logger.info("Engine initialized", {
			providers: providers.length,
			streams,
			actions: actions.length,
			loaders,
			datatypes,
		});

		return engine;
	} catch (error) {
		logger.fatal("Failed to initialize engine: {error}", { error });
		throw error;
	}
}
