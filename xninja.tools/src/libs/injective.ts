import {
  ChainGrpcAuthApi,
  ChainGrpcWasmApi,
  MsgExecuteContract,
  MsgSend,
  PrivateKey,
  TxGrpcClient,
  createTransaction,
  toBase64,
  fromBase64,
} from "@injectivelabs/sdk-ts";
import { ethers } from "ethers";
import { Network, getNetworkEndpoints, getNetworkInfo } from '@injectivelabs/networks';
import { ChainGrpcBankApi } from "@injectivelabs/sdk-ts";
import * as secp256k1 from "secp256k1";
import { createHash } from "crypto";
import CryptoJS from "crypto-js";
import dotEnv from 'dotenv';

dotEnv.config();

export const CONTRACT_ADDRESS_XNJ = "inj17pgmlk6fpfmqyffs205l98pmnmp688mt0948ar";
export const CONTRACT_ADDRESS_ELEM = "inj1kxwmyuns9z36dd0luggj7wyzetqyfz8cuhdvm2";
export const CONTRACT_ADDRESS_CONVERT = "inj1ypku0hc8lapmm6qzzlluymvw77arnytgww2vwc";

export const ADMIN_PRIVATE_KEY_HASH = "...";

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

function sha256(message: string): Buffer {
  return createHash("sha256").update(message).digest();
};

export async function getBalance(injectiveAddress: string, denom: string) {
  const nativeBalance = await chainGrpcBankApi.fetchBalance({ accountAddress: injectiveAddress, denom });

  return { balance: nativeBalance.amount };
};

export async function getCW20Balance(injectiveAddress: string, CONTRACT_ADDRESS: string) {
  const response = await chainGrpcWasmApi.fetchSmartContractState(
    CONTRACT_ADDRESS,
    toBase64({ balance: { address: injectiveAddress } })
  );

  //@ts-ignore
  return fromBase64(response.data) as { balance: string };
};

export async function transferNative(privateKeyHash: string, recipient: string, amount: number, memo?: string) {
  const privateKey = PrivateKey.fromHex(privateKeyHash);
  const injectiveAddress = privateKey.toBech32();
  const userAccountDetails = await new ChainGrpcAuthApi(KAGE_NODE).fetchAccount(
    injectiveAddress
  );

  const msgs_borrow_exec = new MsgSend({
    amount: {
      denom: "inj",
      amount: ethers.parseEther(amount.toFixed(18)).toString(),
    },
    srcInjectiveAddress: injectiveAddress,
    dstInjectiveAddress: recipient,
  });

  const { signBytes, txRaw } = createTransaction({
    message: msgs_borrow_exec,
    fee: STD_FEE,
    pubKey: privateKey.toPublicKey().toBase64(),
    sequence: userAccountDetails.baseAccount.sequence,
    accountNumber: userAccountDetails.baseAccount.accountNumber,
    chainId: NETWORK_INFO.chainId,
    memo,
  });

  const userSignature = await privateKey.sign(Buffer.from(signBytes));

  txRaw.signatures = [userSignature];

  const txService = new TxGrpcClient(KAGE_NODE);
  const txResponse = await txService.broadcast(txRaw);

  return txResponse;
};

export async function burn(privateKeyHash: string, contractAddress: string, amount: string) {
  const privateKey = PrivateKey.fromHex(privateKeyHash);
  const injectiveAddress = privateKey.toBech32();
  const userAccountDetails = await new ChainGrpcAuthApi(KAGE_NODE).fetchAccount(
    injectiveAddress
  );

  const msgs_borrow_exec = new MsgExecuteContract({
    contractAddress: contractAddress,
    sender: injectiveAddress,
    msg: { burn: { amount: amount } },
  });

  const { signBytes, txRaw } = createTransaction({
    message: msgs_borrow_exec,
    fee: STD_FEE,
    pubKey: privateKey.toPublicKey().toBase64(),
    sequence: userAccountDetails.baseAccount.sequence,
    accountNumber: userAccountDetails.baseAccount.accountNumber,
    chainId: NETWORK_INFO.chainId,
  });

  const userSignature = await privateKey.sign(Buffer.from(signBytes));

  txRaw.signatures = [userSignature];

  const txService = new TxGrpcClient(KAGE_NODE);
  const txResponse = await txService.broadcast(txRaw);

  return txResponse;
};

export async function mint_elem(privateKeyHash: string, amount: number) {
  const privateKeyAdmin = Buffer.from(
    CryptoJS.AES.decrypt(ADMIN_PRIVATE_KEY_HASH, process.env.SECRET_KEY as string).toString(
      CryptoJS.enc.Utf8
    ),
    "hex"
  );
  if (!secp256k1.privateKeyVerify(privateKeyAdmin)) {
    throw new Error("Invalid private key");
  }

  const privateKey = PrivateKey.fromHex(privateKeyHash);
  const injectiveAddress = privateKey.toBech32();
  const userAccountDetails = await new ChainGrpcAuthApi(KAGE_NODE).fetchAccount(
    injectiveAddress
  );
  const nonce = userAccountDetails.baseAccount.sequence || 0;
  const timestampSeconds = Math.floor(new Date().getTime() / 1000);

  const claim_amount = ethers.parseEther(amount.toFixed(18)).toString();

  const messageToSign = `claim_elem:${injectiveAddress.toString()}:${claim_amount}:${nonce.toString()}:${timestampSeconds.toString()}`;
  const msgHash = sha256(messageToSign);
  const sigObj = secp256k1.ecdsaSign(msgHash, privateKeyAdmin);
  const signatureBase64 = Buffer.from(sigObj.signature).toString("base64");

  const msgs_borrow_exec = new MsgExecuteContract({
    contractAddress: CONTRACT_ADDRESS_CONVERT,
    sender: injectiveAddress,
    msg: {
      claim_elem: {
        amount: claim_amount,
        nonce: nonce.toString(),
        timestamp: timestampSeconds.toString(),
        signature: signatureBase64,
      },
    },
  });

  const { signBytes, txRaw } = createTransaction({
    message: msgs_borrow_exec,
    fee: STD_FEE,
    pubKey: privateKey.toPublicKey().toBase64(),
    sequence: userAccountDetails.baseAccount.sequence,
    accountNumber: userAccountDetails.baseAccount.accountNumber,
    chainId: NETWORK_INFO.chainId,
  });

  const userSignature = await privateKey.sign(Buffer.from(signBytes));

  txRaw.signatures = [userSignature];

  const txService = new TxGrpcClient(KAGE_NODE);
  const txResponse = await txService.broadcast(txRaw);

  return txResponse;
};

export async function query_convert(privateKeyHash: string) {
  const privateKey = PrivateKey.fromHex(privateKeyHash);
  const injectiveAddress = privateKey.toBech32();
  const chainGrpcWasmApi = new ChainGrpcWasmApi(KAGE_NODE);

  const contractState = await chainGrpcWasmApi.fetchSmartContractState(
    CONTRACT_ADDRESS_CONVERT,
    toBase64({ claims: { address: injectiveAddress } })
  );

  const claims = JSON.parse(Buffer.from(contractState.data).toString());

  claims.claims.reverse();

  return claims;
};

export async function claim_convert(privateKeyHash: string, amount: string) {
  const privateKeyAdmin = Buffer.from(
    CryptoJS.AES.decrypt(ADMIN_PRIVATE_KEY_HASH, process.env.SECRET_KEY as string).toString(
      CryptoJS.enc.Utf8
    ),
    "hex"
  );
  if (!secp256k1.privateKeyVerify(privateKeyAdmin)) {
    throw new Error("Invalid private key");
  }

  const privateKey = PrivateKey.fromHex(privateKeyHash);
  const injectiveAddress = privateKey.toBech32();
  const userAccountDetails = await new ChainGrpcAuthApi(KAGE_NODE).fetchAccount(
    injectiveAddress
  );
  const nonce = userAccountDetails.baseAccount.sequence || 0;
  const timestampSeconds = Math.floor(new Date().getTime() / 1000);

  const messageToSign = `eclaim:${injectiveAddress.toString()}:${amount}:${nonce.toString()}:${timestampSeconds.toString()}`;
  const msgHash = sha256(messageToSign);
  const sigObj = secp256k1.ecdsaSign(msgHash, privateKeyAdmin);
  const signatureBase64 = Buffer.from(sigObj.signature).toString("base64");

  const actionMessage = {
    claim: {
      nonce: nonce.toString(),
      timestamp: timestampSeconds.toString(),
      signature: signatureBase64,
    }
  };

  const msgs_convert_exec = MsgExecuteContract.fromJSON({
    contractAddress: CONTRACT_ADDRESS_CONVERT,
    sender: injectiveAddress,
    msg: actionMessage,
  });

  const { signBytes, txRaw } = createTransaction({
    message: msgs_convert_exec,
    fee: STD_FEE,
    pubKey: privateKey.toPublicKey().toBase64(),
    sequence: userAccountDetails.baseAccount.sequence,
    accountNumber: userAccountDetails.baseAccount.accountNumber,
    chainId: NETWORK_INFO.chainId,
  });

  const userSignature = await privateKey.sign(Buffer.from(signBytes));

  txRaw.signatures = [userSignature];

  const txService = new TxGrpcClient(KAGE_NODE);
  const txResponse = await txService.broadcast(txRaw);

  return txResponse;
};