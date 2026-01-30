export {
	describeImage,
	describeImageDetailed,
	detectObjects,
	generativeOcr,
} from "./image-enrich.js";
export { EnrichProcessor } from "./processor.js";
export {
	GENERATIVE_OCR_PROMPT,
	IMAGE_DESCRIPTION_PROMPT,
	IMAGE_DETAILED_DESCRIPTION_PROMPT,
	OBJECT_DETECTION_PROMPT,
	TABLE_COLUMN_DESCRIPTIONS_PROMPT,
	TABLE_DESCRIPTION_PROMPT,
} from "./prompts.js";
export { describeTable, describeTableColumns } from "./table-enrich.js";
