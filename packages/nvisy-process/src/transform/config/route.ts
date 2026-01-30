export enum FileCategory {
	Text = "text",
	Image = "image",
	Audio = "audio",
	Video = "video",
	Document = "document",
	Archive = "archive",
	Spreadsheet = "spreadsheet",
	Presentation = "presentation",
	Code = "code",
}

export type SwitchCondition =
	| { type: "file_category"; categories: FileCategory[] }
	| { type: "language"; languages: string[]; confidenceThreshold?: number }
	| { type: "custom"; expression: string };
