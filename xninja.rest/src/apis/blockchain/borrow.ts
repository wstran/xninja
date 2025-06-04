import { Router } from "express";
import { middleWare, RequestWithUser } from "../../config";
import queueRequest from "../../libs/queue-request";
import Database from "../../libs/database";
import {
  ChainGrpcAuthApi,
  createTransaction,
  MsgExecuteContract,
  PrivateKey,
  TxGrpcClient,
} from "@injectivelabs/sdk-ts";
import CryptoJS from "crypto-js";
import {
  ADMIN_PRIVATE_KEY_HASH,
  CONTRACT_ADDRESS_BORROW,
  CONTRACT_ADDRESS_ELEM,
  CONTRACT_ADDRESS_XNJ,
  NETWORK_INFO,
  getBalance,
  getCW20Balance,
  STD_FEE,
  KAGE_NODE,
} from "./config";
import * as secp256k1 from "secp256k1";
import { createHash } from "crypto";
import { ethers } from "ethers";
import getAppConfig from "../../app.config";
import { roundDown } from "../../libs/custom";

const [StartRequest, EndRequest] = queueRequest();

function sha256(message: string): Buffer {
  return createHash("sha256").update(message).digest();
}

async function borrow(privateKeyHash: string, amount: number, inj_price_usd: string) {
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

  const borrow_amount = ethers.parseEther(amount.toFixed(18)).toString();

  const messageToSign = `borrow:${injectiveAddress.toString()}:${borrow_amount}:${inj_price_usd.toString()}:${nonce.toString()}:${timestampSeconds.toString()}`;
  const msgHash = sha256(messageToSign);
  const sigObj = secp256k1.ecdsaSign(msgHash, privateKeyAdmin);
  const signatureBase64 = Buffer.from(sigObj.signature).toString("base64");

  const msgs_borrow_exec = new MsgExecuteContract({
    contractAddress: CONTRACT_ADDRESS_BORROW,
    sender: injectiveAddress,
    msg: {
      borrow: {
        inj_price_usd: inj_price_usd.toString(),
        nonce: nonce.toString(),
        timestamp: timestampSeconds.toString(),
        signature: signatureBase64,
      },
    },
    funds: [
      {
        denom: "inj",
        amount: borrow_amount,
      },
    ],
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
    router.get("/blockchain/get-borrow", middleWare, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };
            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const userBorrowCollection = db.collection("user_borrows");

            const thirtyDaysAgo = new Date();

            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const [response, historys] = await Promise.all([
                fetch(
                    "https://api.chainbase.online/v1/token/price?chain_id=1&contract_address=0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30",
                    {
                        method: "GET",
                        headers: {
                            accept: "application/json",
                            "x-api-key": "2bsq57OFyKk5BgEDIXusDPzDtoB",
                        },
                    }
                ),
                userBorrowCollection
                    .find(
                        { tw_id: req.payload.tw_id, status: 'success', created_at: { $gte: thirtyDaysAgo } },
                        { projection: { amount: 1, loanAmount: 1, created_at: 1 } }
                    )
                    .sort({ created_at: -1 })
                    .toArray(),
            ]);

            const result = (await response.json()) as {
                code: number;
                data: { price: number; symbol: string; decimals: 18; updated_at: string };
            };

            if (result.code === 0) {
                res.status(200).json({ inj_price: result.data.price, historys });
                return;
            }

            res.status(500).end();
        } catch (error) {
            console.error(error);
            res.status(500).end();
        } finally {
            next();
        }
    });

    router.post(
        "/blockchain/borrow",
        middleWare,
        StartRequest,
        async (req: RequestWithUser, res, next) => {
            try {
                if (!req.payload) {
                    res.sendStatus(403);
                    return;
                };

                const appConfig = await getAppConfig();

                if (appConfig.borrow_state !== 'enable') {
                    res.status(404).json({ status: 'CANNOT_BORROW', state: appConfig.borrow_state });
                    return;
                };

                const { amount } = req.body as { amount: number };

                if (typeof amount !== "number") {
                    res.status(404).json({ status: "BAD_REQUEST" });
                    return;
                }

                const dbInstance = Database.getInstance();
                const db = await dbInstance.getDb();
                const userCollection = db.collection("users");
                const userBorrowCollection = db.collection("user_borrows");

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

                const response = await fetch(
                    "https://api.chainbase.online/v1/token/price?chain_id=1&contract_address=0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30",
                    {
                        method: "GET",
                        headers: {
                            accept: "application/json",
                            "x-api-key": "2bsq57OFyKk5BgEDIXusDPzDtoB",
                        },
                    }
                );

                const result = (await response.json()) as {
                    code: number;
                    data: { price: number; symbol: string; decimals: 18; updated_at: string };
                };

                if (result.code === 0) {
                    const insert = await userBorrowCollection.insertOne({
                        tw_id: req.payload.tw_id,
                        amount: ethers.parseEther(amount.toFixed(18)).toString(),
                        created_at: new Date(),
                        inj_price_usd: roundDown(result.data.price, 2).replaceAll(".", ""),
                        status: 'pending',
                    });

                    try {
                        const txResponse = await borrow(
                            privateKey,
                            amount,
                            roundDown(result.data.price, 2).replaceAll(".", "")
                        );

                        if (txResponse.events) {
                            const loanAmountEvent = txResponse.events[
                                txResponse.events.length - 1
                            ]?.attributes?.find((i: { key: Buffer; value: Buffer }) => {
                                return Buffer.from(i.key).toString("utf8") === "amount";
                            }) as { key: Buffer; value: Buffer };

                            if (loanAmountEvent) {
                                await userBorrowCollection.updateOne({
                                    _id: insert.insertedId
                                }, {
                                    $set: {
                                        loanAmount: Buffer.from(loanAmountEvent.value).toString(),
                                        txResponse,
                                        status: 'success',
                                    }
                                });

                                const thirtyDaysAgo = new Date();

                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                                const [INJ, XNJ, ELEM, historys] = await Promise.all([
                                    getBalance(injectiveAddress, "inj"),
                                    getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_XNJ),
                                    getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_ELEM),
                                    userBorrowCollection
                                        .find(
                                            { tw_id: req.payload.tw_id, status: 'success', created_at: { $gte: thirtyDaysAgo } },
                                            { projection: { amount: 1, loanAmount: 1, created_at: 1 } }
                                        )
                                        .sort({ created_at: -1 })
                                        .toArray(),
                                ]);

                                res.status(200).json({ INJ, XNJ, ELEM, inj_price: result.data.price, historys });
                            }
                        }
                    } catch (error: any) {
                        console.error(error);
                        if (error.contextCode === 5 || !error.contextCode) {
                            if (error.type === 'chain-error' || error.errorClass === 'TransactionException') {
                                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                            } else if (error.type === 'http-request' && error.errorClass === 'HttpRequestException') {
                                res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                            };
                        };
                        res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                        await userBorrowCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
                    };
                    return;
                }

                res.status(500).end();
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
