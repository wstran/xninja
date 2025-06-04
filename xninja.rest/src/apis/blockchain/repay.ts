import { Router } from "express";
import { middleWare, RequestWithUser } from "../../config";
import queueRequest from "../../libs/queue-request";
import Database from "../../libs/database";
import {
  ChainGrpcWasmApi,
  ChainGrpcAuthApi,
  createTransaction,
  MsgExecuteContract,
  PrivateKey,
  toBase64,
  TxGrpcClient,
} from "@injectivelabs/sdk-ts";
import CryptoJS from "crypto-js";
import {
  ADMIN_PRIVATE_KEY_HASH,
  CONTRACT_ADDRESS_BORROW,
  CONTRACT_ADDRESS_ELEM,
  CONTRACT_ADDRESS_XNJ,
  getBalance,
  getCW20Balance,
  STD_FEE,
  NETWORK_INFO,
  KAGE_NODE,
} from "./config";
import { createHash } from "crypto";
import * as secp256k1 from "secp256k1";
import { ethers } from "ethers";
function sha256(message: string): Buffer {
  return createHash("sha256").update(message).digest();
}

const [StartRequest, EndRequest] = queueRequest();

async function query(injectiveAddress: string) {
  const chainGrpcWasmApi = new ChainGrpcWasmApi(KAGE_NODE);

  const contractState = await chainGrpcWasmApi.fetchSmartContractState(
    CONTRACT_ADDRESS_BORROW,
    toBase64({ staked: { address: injectiveAddress } })
  );

  const staked = JSON.parse(Buffer.from(contractState.data).toString());

  return {
    total_inj_staked: staked.total_inj_staked,
    total_xnj_received: staked.total_xnj_received,
  } as { total_inj_staked: string; total_xnj_received: string };
}

async function repay(privateKeyHash: string, amount: number) {
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

  const repay_amount = ethers.parseEther(amount.toFixed(18)).toString();
  const messageToSign = `repay:${injectiveAddress.toString()}:${repay_amount}:${nonce.toString()}:${timestampSeconds.toString()}`;
  const msgHash = sha256(messageToSign);
  const sigObj = secp256k1.ecdsaSign(msgHash, privateKeyAdmin);
  const signatureBase64 = Buffer.from(sigObj.signature).toString("base64");

  const actionMessage = {
    repay: {
      nonce: nonce.toString(),
      timestamp: timestampSeconds.toString(),
      signature: signatureBase64,
    },
  };

  const msgs_borrow_exec = new MsgExecuteContract({
    contractAddress: CONTRACT_ADDRESS_XNJ,
    sender: injectiveAddress,
    msg: {
      send: {
        amount: ethers.parseEther(amount.toFixed(18)).toString(),
        contract: CONTRACT_ADDRESS_BORROW,
        msg: Buffer.from(JSON.stringify(actionMessage)).toString("base64"),
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

export default function (router: Router) {
  router.get(
    "/blockchain/get-repay",
    middleWare,
    async (req: RequestWithUser, res, next) => {
      try {
        if (!req.payload) {
          res.sendStatus(403);
          return;
        }

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection("users");
        const userRepayCollection = db.collection("user_repays");

        const dbUser = await userCollection.findOne(
          { tw_id: req.payload.tw_id },
          { projection: { privateKey: 1 } }
        );

        if (!dbUser || !dbUser.privateKey) {
          res.status(403).end();
          return;
        };

        const privateKey = CryptoJS.AES.decrypt(
          dbUser.privateKey,
          process.env.SECRET_KEY as string
        ).toString(CryptoJS.enc.Utf8);

        const injectiveAddress = PrivateKey.fromHex(privateKey).toBech32();

        const thirtyDaysAgo = new Date();

        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [{ total_inj_staked, total_xnj_received }, historys] = await Promise.all([query(injectiveAddress), userRepayCollection.find({ tw_id: req.payload.tw_id, status: 'success', created_at: { $gte: thirtyDaysAgo } }, { projection: { amount: 1, repayAmount: 1, created_at: 1 } }).sort({ created_at: -1 }).toArray()]);

        res.status(200).json({ historys, total_inj_staked, total_xnj_received });
      } catch (error) {
        console.error(error);
        res.status(500).end();
      } finally {
        next();
      }
    }
  );

  router.post(
    "/blockchain/repay",
    middleWare,
    StartRequest,
    async (req: RequestWithUser, res, next) => {
      try {
        if (!req.payload) {
          res.sendStatus(403);
          return;
        }

        const { amount } = req.body as { amount: number };

        if (typeof amount !== "number") {
          res.status(404).json({ status: "BAD_REQUEST" });
          return;
        }

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection("users");
        const userRepayCollection = db.collection("user_repays");

        const dbUser = await userCollection.findOne(
          { tw_id: req.payload.tw_id },
          { projection: { privateKey: 1 } }
        );

        if (!dbUser || !dbUser.privateKey) {
          res.status(403).end();
          return;
        }

        const privateKey = CryptoJS.AES.decrypt(
          dbUser.privateKey,
          process.env.SECRET_KEY as string
        ).toString(CryptoJS.enc.Utf8);

        const injectiveAddress = PrivateKey.fromHex(privateKey).toBech32();

        const insert = await userRepayCollection.insertOne({ tw_id: req.payload.tw_id, amount: ethers.parseEther(amount.toFixed(18)).toString(), created_at: new Date(), status: 'pending' });

        try {
          const txResponse = await repay(privateKey, amount);

          if (txResponse.events) {
            const repayAmountEvent = txResponse.events[
              txResponse.events.length - 1
            ]?.attributes?.find((i: { key: Buffer; value: Buffer }) => Buffer.from(i.key).toString("utf8") === "amount") as { key: Buffer; value: Buffer };

            if (repayAmountEvent) {
              await userRepayCollection.updateOne({
                _id: insert.insertedId
              }, {
                $set: {
                  repayAmount: Buffer.from(repayAmountEvent.value).toString().replace('inj', ''),
                  txResponse,
                  status: 'success',
                }
              });

              const thirtyDaysAgo = new Date();

              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            };
          };

          await userRepayCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, status: 'success' } });
        } catch (error: any) {
          console.error(error);
          if (error.contextCode === 5 || !error.contextCode) {
            if (error.type === 'chain-error' || error.errorClass === 'TransactionException') {
              if (error.contextModule === 'wasm') {
                res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
              } else if (error.contextModule === 'sdk') {
                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
              };
              return;
            } else if (error.type === 'http-request' && error.errorClass === 'HttpRequestException') {
              res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
              return;
            };
          };
          res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
          await userRepayCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
          return;
        };

        const thirtyDaysAgo = new Date();

        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [{ total_inj_staked, total_xnj_received }, INJ, XNJ, ELEM, historys] = await Promise.all([query(injectiveAddress), getBalance(injectiveAddress, 'inj'), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_XNJ), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_ELEM), userRepayCollection.find({ tw_id: req.payload.tw_id, status: 'success', created_at: { $gte: thirtyDaysAgo } }, { projection: { amount: 1, repayAmount: 1, created_at: 1 } }).sort({ created_at: -1 }).toArray()]);

        res.status(200).json({ INJ, XNJ, ELEM, historys, total_inj_staked, total_xnj_received });
      } catch (error) {
        console.error(error);
        res.status(500).end();
      } finally {
        next();
      }
    },
    EndRequest
  );
}
