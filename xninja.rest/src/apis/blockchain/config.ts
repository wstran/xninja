import dotenv from "dotenv";
dotenv.config();

import { Network, getNetworkEndpoints, getNetworkInfo } from "@injectivelabs/networks";
import { ChainGrpcBankApi, ChainGrpcWasmApi, fromBase64, toBase64 } from "@injectivelabs/sdk-ts";

export const CONTRACT_ADDRESS_XNJ = "inj17pgmlk6fpfmqyffs205l98pmnmp688mt0948ar";
export const CONTRACT_ADDRESS_ELEM = "inj1kxwmyuns9z36dd0luggj7wyzetqyfz8cuhdvm2";
export const CONTRACT_ADDRESS_CONVERT = "inj1ypku0hc8lapmm6qzzlluymvw77arnytgww2vwc";
export const CONTRACT_ADDRESS_BORROW = "inj1vssg4v75vr03j59n9634v238zd39k0scf49utz";
export const POCKET_ADDRESS = "inj1ypku0hc8lapmm6qzzlluymvw77arnytgww2vwc";

export const ADMIN_PRIVATE_KEY_HASH = process.env.ADMIN_PRIVATE_KEY_HASH as string;

export const STD_FEE = {
  amount: [{ amount: "1500000000000000", denom: "inj" }],
  gas: "4000000",
};

export const NETWORK = Network.MainnetSentry;
export const NETWORK_INFO = getNetworkInfo(NETWORK);
export const ENDPOINTS = getNetworkEndpoints(NETWORK);
export const KAGE_NODE = "...private_node";

const chainGrpcBankApi = new ChainGrpcBankApi(KAGE_NODE);
const chainGrpcWasmApi = new ChainGrpcWasmApi(KAGE_NODE);

export async function getBalance(injectiveAddress: string, denom: string) {
  const nativeBalance = await chainGrpcBankApi.fetchBalance({
    accountAddress: injectiveAddress,
    denom,
  });

  return { balance: nativeBalance.amount };
}

export async function getCW20Balance(injectiveAddress: string, CONTRACT_ADDRESS: string) {
  const response = await chainGrpcWasmApi.fetchSmartContractState(
    CONTRACT_ADDRESS,
    toBase64({ balance: { address: injectiveAddress } })
  );

  //@ts-ignore
  return fromBase64(response.data) as { balance: string };
}
