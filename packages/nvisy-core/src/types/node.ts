/**
 * Pipeline node identifier. Branded string type for compile-time safety.
 */
export type NodeId = string & { readonly __brand: "NodeId" };

/** Cast a UUID string to a NodeId. */
export function nodeId(uuid: string): NodeId {
	return uuid as NodeId;
}

/** Generate a new random NodeId. */
export function newNodeId(): NodeId {
	return crypto.randomUUID() as NodeId;
}
