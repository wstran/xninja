import {
  ChainGrpcAuthApi,
  MsgExecuteContract,
  MsgSend,
  PrivateKey,
  TxGrpcClient,
  createTransaction,
} from "@injectivelabs/sdk-ts";
import { KAGE_NODE, NETWORK_INFO, STD_FEE } from "../apis/blockchain/config";
import { ethers } from "ethers";

export async function burn(privateKeyHash: string, contractAddress: string, amount: number) {
  const privateKey = PrivateKey.fromHex(privateKeyHash);
  const injectiveAddress = privateKey.toBech32();
  const userAccountDetails = await new ChainGrpcAuthApi(KAGE_NODE).fetchAccount(
    injectiveAddress
  );

  const msgs_borrow_exec = new MsgExecuteContract({
    contractAddress: contractAddress,
    sender: injectiveAddress,
    msg: { burn: { amount: ethers.parseEther(amount.toFixed(18)).toString() } },
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
}

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
}

export async function transferCW20(
  privateKeyHash: string,
  contractAddress: string,
  recipient: string,
  amount: number,
  memo?: string
) {
  const privateKey = PrivateKey.fromHex(privateKeyHash);
  const injectiveAddress = privateKey.toBech32();
  const userAccountDetails = await new ChainGrpcAuthApi(KAGE_NODE).fetchAccount(
    injectiveAddress
  );

  const msgs_borrow_exec = new MsgExecuteContract({
    contractAddress: contractAddress,
    sender: injectiveAddress,
    msg: { transfer: { recipient, amount: ethers.parseEther(amount.toFixed(18)).toString() } },
  });

  const { signBytes, txRaw } = createTransaction({
    message: msgs_borrow_exec,
    fee: STD_FEE,
    pubKey: privateKey.toPublicKey().toBase64(),
    sequence: userAccountDetails.baseAccount.sequence,
    accountNumber: userAccountDetails.baseAccount.accountNumber,
    chainId: NETWORK_INFO.chainId,
    memo
  });

  const userSignature = await privateKey.sign(Buffer.from(signBytes));

  txRaw.signatures = [userSignature];

  const txService = new TxGrpcClient(KAGE_NODE);
  const txResponse = await txService.broadcast(txRaw);

  return txResponse;
}

export async function fetchTx(txHash: string) {
  const txService = new TxGrpcClient(KAGE_NODE);
  const txResponse = await txService.fetchTx(txHash);

  return txResponse;
}