/** JSON schema shape for connection definitions in workflow requests. */
export interface ConnectionSchema {
	id: string;
	type: string;
	credentials: Record<string, unknown>;
	params?: Record<string, unknown>;
}
