export type Input =
	| { source: "provider"; connectionId: string }
	| { source: "cache_slot"; slot: string };
