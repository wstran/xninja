import {
  ChainGrpcAuthApi,
  createTransaction,
  MsgExecuteContract,
  PrivateKey,
  TxGrpcClient,
} from "@injectivelabs/sdk-ts";
import {
  ADMIN_PRIVATE_KEY_HASH,
  CONTRACT_ADDRESS_CONVERT,
  KAGE_NODE,
  NETWORK_INFO,
  STD_FEE,
} from "./config";
import * as secp256k1 from "secp256k1";
import { createHash } from "crypto";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";

function sha256(message: string): Buffer {
  return createHash("sha256").update(message).digest();
}

export default async function claim(privateKeyHash: string, amount: number) {
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