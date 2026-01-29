import { ConnectionNotFoundError } from "@nvisy/core";
import type { ProviderConnection } from "./types.js";

export class ConnectionRegistry {
	private readonly connections = new Map<string, ProviderConnection>();

	register(id: string, connection: ProviderConnection): void {
		this.connections.set(id, connection);
	}

	get(id: string): ProviderConnection {
		const conn = this.connections.get(id);
		if (!conn) throw new ConnectionNotFoundError(id);
		return conn;
	}

	has(id: string): boolean {
		return this.connections.has(id);
	}

	remove(id: string): boolean {
		return this.connections.delete(id);
	}

	clear(): void {
		this.connections.clear();
	}

	get size(): number {
		return this.connections.size;
	}
}
