import { config } from "dotenv";
import { Network, getNetworkInfo } from "@injectivelabs/networks";
import {
  ChainRestAuthApi,
  MsgExecuteContractCompat,
  PrivateKey,
  TxClient,
  TxGrpcClient,
  createTransaction,
} from "@injectivelabs/sdk-ts";
import { BigNumberInBase, DEFAULT_STD_FEE } from "@injectivelabs/utils";

config();

// Environment Variables
const contractAddress = process.env.ELEM_CONTRACT_ADDRESS as string;
const ownerPrivateKeyHash = process.env.PRIVATE_KEY_1 as string; // Owner's private key
const userPrivateKeyHash = process.env.PRIVATE_KEY_2 as string; // User's private key

// Network Configuration
const network = getNetworkInfo(Network.Testnet);

// Backend Signing Process
async function backendSign() {
  const ownerPrivateKey = PrivateKey.fromHex(ownerPrivateKeyHash);
  const amount = new BigNumberInBase(100).toWei().toFixed();
  const userAddress = PrivateKey.fromHex(userPrivateKeyHash).toBech32();

  // Create the message
  const message = {
    recipient: userAddress,
    amount: amount,
  };

  // Convert the message to a Buffer and sign
  const messageBuffer = Buffer.from(JSON.stringify(message));
  const signature = await ownerPrivateKey.sign(messageBuffer);
  return signature.toString();
}

// User Transaction Submission
async function userSubmitTransaction(signature: string) {
  console.log("signature", signature);
  const userPrivateKey = PrivateKey.fromHex(userPrivateKeyHash);
  const userAddress = userPrivateKey.toBech32();

  // Prepare the transaction message
  const msgs_claim_exec = MsgExecuteContractCompat.fromJSON({
    contractAddress: contractAddress,
    sender: userAddress,
    msg: {
      mint: {
        recipient: userAddress,
        amount: new BigNumberInBase(100).toWei().toFixed(),
        // signature: signature,
      },
    },
  });

  // Fetch user account details for sequence and account number
  const userAccountDetails = await new ChainRestAuthApi(
    network.rest
  ).fetchAccount(userAddress);

  // Create and sign the transaction
  const { signBytes, txRaw } = createTransaction({
    message: msgs_claim_exec,
    memo: "",
    fee: DEFAULT_STD_FEE,
    pubKey: userPrivateKey.toPublicKey().toBase64(),
    sequence: parseInt(userAccountDetails.account.base_account.sequence, 10),
    accountNumber: parseInt(
      userAccountDetails.account.base_account.account_number,
      10
    ),
    chainId: network.chainId,
  });

  const userSignature = await userPrivateKey.sign(Buffer.from(signBytes));
  txRaw.signatures = [userSignature];

  // Broadcast the transaction
  const txService = new TxGrpcClient(network.grpc);
  const txResponse = await txService.broadcast(txRaw);
  return txResponse;
}

// Main Execution
(async () => {
  try {
    console.log("Backend is signing the transaction...");
    const signature = await backendSign();

    console.log("User is submitting the transaction...");
    const txResponse = await userSubmitTransaction(signature);

    console.log("Transaction Response:", txResponse);
  } catch (error) {
    console.error("Error occurred:", error);
  }
})();
