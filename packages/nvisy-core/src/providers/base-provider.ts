/**
 * A connectable provider that manages a lifecycle around external resources.
 *
 * Implementers call {@link connect} with credentials and parameters to
 * initialise the underlying resource, and {@link disconnect} to tear it down.
 *
 * @typeParam TCred  - Credential / connection-info type required to connect.
 * @typeParam TParam - Parameter type forwarded to the provider on connect.
 */
export interface Provider<TCred = unknown, TParam = unknown> {
	/** Establish a connection using the supplied credentials and parameters. */
	connect(credentials: TCred, params: TParam): Promise<this>;

	/** Release the connection and any held resources. */
	disconnect(): Promise<void>;
}

/**
 * Abstract helper that implements {@link Provider} and tracks a client
 * instance, provider name, and connection timestamp.
 *
 * Subclasses supply the concrete `TClient` (e.g. a database driver handle)
 * and override {@link connect} / {@link disconnect} as needed.
 *
 * @typeParam TClient - The underlying client type managed by this provider.
 * @typeParam TCred   - Credential / connection-info type required to connect.
 * @typeParam TParam  - Parameter type forwarded to the provider on connect.
 */
export abstract class BaseProvider<
	TClient = unknown,
	TCred = unknown,
	TParam = unknown,
> implements Provider<TCred, TParam>
{
	readonly #name: string;
	readonly #client: TClient;
	readonly #connectedAt: Date;

	constructor(name: string, client: TClient) {
		this.#name = name;
		this.#client = client;
		this.#connectedAt = new Date();
	}

	/** Provider name supplied at construction time. */
	get name(): string {
		return this.#name;
	}

	/** The underlying client instance. */
	get client(): TClient {
		return this.#client;
	}

	/** Timestamp recorded at construction time. */
	get connectedAt(): Date {
		return this.#connectedAt;
	}

	abstract connect(credentials: TCred, params: TParam): Promise<this>;

	abstract disconnect(): Promise<void>;
}
