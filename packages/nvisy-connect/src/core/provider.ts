/**
 * Abstract base class for all connectors / providers in the Nvisy runtime.
 *
 * Every storage backend — object stores, relational databases, vector
 * databases — extends this class. It stores the credentials and
 * configuration parameters as immutable private fields, exposing them
 * through read-only getters.
 *
 * Subclasses implement {@link connect} and {@link disconnect} for their
 * specific backend.
 *
 * @typeParam TCred   - Credential type required to authenticate.
 * @typeParam TParams - Configuration parameters for the connection.
 *
 * @example
 * ```ts
 * class MyConnector extends Provider<MyCreds, MyConfig> {
 *   async connect(): Promise<void> { ... }
 *   async disconnect(): Promise<void> { ... }
 * }
 * const c = new MyConnector({ token: "..." }, { table: "docs" });
 * c.creds;  // { token: "..." }
 * c.params; // { table: "docs" }
 * ```
 */
export abstract class Provider<TCred, TParams> {
	readonly #creds: TCred;
	readonly #params: TParams;

	constructor(creds: TCred, params: TParams) {
		this.#creds = creds;
		this.#params = params;
	}

	/** Credentials used to authenticate with the backend. */
	get creds(): TCred {
		return this.#creds;
	}

	/** Configuration parameters for this provider. */
	get params(): TParams {
		return this.#params;
	}

	/** Establish a connection to the backend. */
	abstract connect(): Promise<void>;

	/** Tear down the connection and release resources. */
	abstract disconnect(): Promise<void>;
}
