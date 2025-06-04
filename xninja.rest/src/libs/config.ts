import { Network } from "@injectivelabs/networks";
import { ChainId } from "@injectivelabs/ts-types";

const NETWORK = (process.env.NETWORK || Network.Public) as Network;
const CHAIN_ID = (process.env.CHAIN_ID || ChainId.Mainnet) as ChainId;
const INJECTIVE_CHAIN_ID = [Network.Public, Network.Mainnet].includes(NETWORK)
  ? "injective-1"
  : NETWORK === Network.Devnet
  ? "injective-777"
  : "injective-888";

const PRIVATE_KEY = "6215ae4de47f346be277c6e8002531f48398eec82ffe632721cf9ca166fa5077";

export { NETWORK, CHAIN_ID, INJECTIVE_CHAIN_ID, PRIVATE_KEY };
