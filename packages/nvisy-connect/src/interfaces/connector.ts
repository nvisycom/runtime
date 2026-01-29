/**
 * Lifecycle interface for storage connectors.
 *
 * @typeParam TCred   - Credential type required to authenticate.
 * @typeParam TParams - Configuration parameters for the connection.
 */
export interface Connector<TCred, TParams> {
	/** Establish a connection using the given credentials and parameters. */
	connect(creds: TCred, params: TParams): Promise<void>;
	/** Tear down the connection and release resources. */
	disconnect(): Promise<void>;
}
