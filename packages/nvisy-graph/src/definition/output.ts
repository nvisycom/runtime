export type Output =
	| { target: "provider"; connectionId: string }
	| { target: "cache_slot"; slot: string };
