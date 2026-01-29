export enum TableEnrichTask {
	Description = "description",
	ColumnDescriptions = "column_descriptions",
}

export enum ImageEnrichTask {
	Description = "description",
	DetailedDescription = "detailed_description",
	GenerativeOcr = "generative_ocr",
	ObjectDetection = "object_detection",
}

export type EnrichTask =
	| { inputType: "table"; task: TableEnrichTask }
	| { inputType: "image"; task: ImageEnrichTask };

export interface EnrichConfig {
	tasks: EnrichTask[];
	overridePrompt?: string;
}
