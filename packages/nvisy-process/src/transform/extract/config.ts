export enum TableConvertTask {
	ToHtml = "to_html",
	ToMarkdown = "to_markdown",
	ToCsv = "to_csv",
	ToJson = "to_json",
}

export type TextConvertTask =
	| { task: "to_json" }
	| { task: "to_structured_json"; schema: string };

export type ConvertTask =
	| { inputType: "table"; convertTask: TableConvertTask }
	| { inputType: "text"; convertTask: TextConvertTask };

export type AnalyzeTask =
	| { task: "named_entity_recognition" }
	| { task: "keyword_extraction" }
	| { task: "classification"; labels: string[] }
	| { task: "sentiment_analysis" }
	| { task: "relationship_extraction" };

export interface ExtractConfig {
	tasks: Array<ConvertTask | AnalyzeTask>;
	schema?: Record<string, unknown>;
}
