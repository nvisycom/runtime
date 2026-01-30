/**
 * Configuration shape for a connector.
 *
 * @typeParam TCred   - Credential type required to authenticate.
 * @typeParam TParams - Configuration parameters for the connection.
 */
export interface ProviderConfig<TCred, TParams> {
	readonly creds: TCred;
	readonly params: TParams;
}
