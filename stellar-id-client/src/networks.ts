/**
 * Network configuration: how the SDK reaches the contract.
 *
 * Contract addresses and passphrases come from config, never from code
 * (PLAYBOOK §5.1.5). The default testnet contract ID is copied from
 * `stellar-id-core/deployments/testnet.json` at bindings-sync time and
 * embedded in the vendored `src/generated` module.
 */
import { networks as generatedNetworks } from "./generated/index.js";
import type { DidNetwork } from "./did.js";

/** Everything the SDK needs to talk to one network. */
export interface NetworkConfig {
  /** The DID network segment (`testnet` or `public`). */
  network: DidNetwork;
  /** Stellar network passphrase used for signing. */
  networkPassphrase: string;
  /** Soroban RPC endpoint. */
  rpcUrl: string;
  /** Deployed `stellar-id-core` contract ID (`C...`). */
  contractId: string;
}

/** Default Soroban RPC endpoint for Stellar testnet. */
export const TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";

/**
 * Network configuration for Stellar testnet.
 *
 * @param overrides - Optional `rpcUrl` and/or `contractId` overrides
 * (e.g. after a testnet reset + redeploy).
 * @returns The testnet configuration.
 */
export function testnetConfig(
  overrides?: Partial<Pick<NetworkConfig, "rpcUrl" | "contractId">>,
): NetworkConfig {
  return {
    network: "testnet",
    networkPassphrase: generatedNetworks.testnet.networkPassphrase,
    rpcUrl: overrides?.rpcUrl ?? TESTNET_RPC_URL,
    contractId: overrides?.contractId ?? generatedNetworks.testnet.contractId,
  };
}

/**
 * Network configuration for Stellar public network (mainnet).
 *
 * There is intentionally no default contract ID: v1 is testnet-only and
 * mainnet deployment is an explicit non-goal, so callers must supply the
 * contract they mean.
 *
 * @param contractId - The deployed contract ID on the public network.
 * @param rpcUrl - The Soroban RPC endpoint to use.
 * @returns The public-network configuration.
 */
export function publicConfig(contractId: string, rpcUrl: string): NetworkConfig {
  return {
    network: "public",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    rpcUrl,
    contractId,
  };
}
