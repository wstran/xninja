import { Router } from "express";
import { middleWare, RequestWithUser } from "../../config";
import queueRequest from "../../libs/queue-request";
import Database from "../../libs/database";
import {
    PrivateKey,
    ChainGrpcAuthApi,
    createTransaction,
    TxGrpcClient,
    MsgExecuteContract,
    toBase64,
    ChainGrpcWasmApi,
} from "@injectivelabs/sdk-ts";
import {
    CONTRACT_ADDRESS_CONVERT,
    CONTRACT_ADDRESS_XNJ,
    CONTRACT_ADDRESS_ELEM,
    getBalance,
    getCW20Balance,
    STD_FEE,
    NETWORK_INFO,
    KAGE_NODE,
    ADMIN_PRIVATE_KEY_HASH,
} from "./config";
import { createHash } from "crypto";
import * as secp256k1 from "secp256k1";
import CryptoJS from "crypto-js";
import { ethers } from "ethers";
import getAppConfig from "../../app.config";

function sha256(message: string): Buffer {
    return createHash("sha256").update(message).digest();
};

const [StartRequest, EndRequest] = queueRequest();

/* async function query(privateKeyHash: string) {
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
}; */

async function convert(privateKeyHash: string, action: "convert_xnj_to_elem" | "convert_elem_to_xnj", amount: number) {
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

    const convert_amount = ethers.parseEther(amount.toFixed(18)).toString();
    const messageToSign = `${action === "convert_xnj_to_elem" ? 'xtoe' : 'etox'}:${injectiveAddress.toString()}:${convert_amount}:${nonce.toString()}:${timestampSeconds.toString()}`;
    const msgHash = sha256(messageToSign);
    const sigObj = secp256k1.ecdsaSign(msgHash, privateKeyAdmin);
    const signatureBase64 = Buffer.from(sigObj.signature).toString("base64");

    const actionMessage = {
        [action]: {
            nonce: nonce.toString(),
            timestamp: timestampSeconds.toString(),
            signature: signatureBase64,
        },
    };

    const msgs_borrow_exec = new MsgExecuteContract({
        contractAddress: action === "convert_xnj_to_elem" ? CONTRACT_ADDRESS_XNJ : CONTRACT_ADDRESS_ELEM,
        sender: injectiveAddress,
        msg: {
            send: {
                amount: ethers.parseEther(amount.toFixed(18)).toString(),
                contract: CONTRACT_ADDRESS_CONVERT,
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

async function claim(privateKeyHash: string, amount: number) {
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

    const convert_amount = ethers.parseEther(amount.toFixed(18)).toString();
    const messageToSign = `eclaim:${injectiveAddress.toString()}:${convert_amount}:${nonce.toString()}:${timestampSeconds.toString()}`;
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

export default function (router: Router) {
    router.get(
        "/blockchain/get-convert",
        middleWare,
        async (req: RequestWithUser, res) => {
            try {
                if (!req.payload) {
                    res.sendStatus(403);
                    return;
                };

                const dbInstance = Database.getInstance();
                const db = await dbInstance.getDb();
                const userCollection = db.collection("users");
                const userConvertCollection = db.collection("user_converts");
                const queueConvertCollection = db.collection("queue_converts");

                const appConfig = await getAppConfig();

                const dbUser = await userCollection.findOne(
                    { tw_id: req.payload.tw_id },
                    { projection: { privateKey: 1 } }
                );

                if (!dbUser || !dbUser.privateKey) {
                    res.status(403).end();
                    return;
                };

                const queueConvertResult = await queueConvertCollection.find({ tw_id: req.payload.tw_id, status: 'pending' }).sort({ created_at: -1 }).project({ _id: 1, created_at: 1, amount: 1 }).next();

                let expected_claim_at;
                let can_claim_convert;

                if (queueConvertResult) {
                    const startOfDay = new Date(queueConvertResult.created_at.toISOString());
                    startOfDay.setHours(1, 0, 0, 0);

                    const totalQueueConverts = await queueConvertCollection.find({
                        created_at: {
                            $gte: startOfDay,
                            $lte: queueConvertResult.created_at,
                        }
                    }).sort({ created_at: 1 }).project({ created_at: 1, amount: 1 }).toArray();

                    const total_daily = totalQueueConverts.reduce((previousValue, currentValue) => previousValue + currentValue.amount, 0) / (appConfig.max_convert_daily + 1);

                    expected_claim_at = queueConvertResult.created_at;

                    expected_claim_at.setTime(expected_claim_at.getTime() + (1000 * 60 * 60 * 24 * (total_daily >= 1 ? total_daily : 1)));

                    const date = new Date();
                    const date_string = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    can_claim_convert = new Date(date_string).getTime() >= new Date(`${expected_claim_at.getFullYear()}-${expected_claim_at.getMonth()}-${expected_claim_at.getDate()}`).getTime();
                };

                const thirtyDaysAgo = new Date();

                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const historys = await userConvertCollection.find({ tw_id: req.payload.tw_id, status: 'success', created_at: { $gte: thirtyDaysAgo }, convertAction: 'convert_xnj_to_elem' }, { projection: { amount: 1, created_at: 1 } }).sort({ created_at: -1 }).toArray();

                const reverse_historys = await queueConvertCollection.find({ tw_id: req.payload.tw_id, status: 'success', created_at: { $gte: thirtyDaysAgo } }).sort({ created_at: -1 }).project({ _id: 0, created_at: 1, amount: 1 }).toArray();

                const claims = await queueConvertCollection.find({ tw_id: req.payload.tw_id, status: 'pending' }).sort({ created_at: -1 }).project({ _id: 0, created_at: 1, amount: 1 }).toArray();

                res.status(200).json({ claims, reverse_historys, historys, can_claim_convert, expected_claim_at });

            } catch (error) {
                console.error(error);
                res.status(500).end();
            };
        }
    );

    router.post(
        "/blockchain/convert",
        middleWare,
        StartRequest,
        async (req: RequestWithUser, res, next) => {
            try {
                if (!req.payload) {
                    res.sendStatus(403);
                    return;
                };

                const { reverse, amount } = req.body as {
                    reverse: boolean;
                    amount: number;
                };

                if (typeof reverse !== "boolean" || typeof amount !== "number") {
                    res.status(404).json({ status: "BAD_REQUEST" });
                    return;
                };

                const appConfig = await getAppConfig();

                if (appConfig.convert_elem_to_xnj_state !== 'enable' && !reverse) {
                    res.status(404).json({ status: "CONVERT_DISABLED" });
                    return;
                } else if (appConfig.convert_xnj_to_elem_state !== 'enable' && reverse) {
                    res.status(404).json({ status: "CONVERT_DISABLED" });
                    return;
                };

                const dbInstance = Database.getInstance();
                const db = await dbInstance.getDb();
                const client = dbInstance.getClient();
                const userCollection = db.collection("users");
                const userConvertCollection = db.collection("user_converts");
                const queueConvertCollection = db.collection("queue_converts");

                const dbUser = await userCollection.findOne(
                    { tw_id: req.payload.tw_id },
                    { projection: { privateKey: 1 } }
                );

                if (!dbUser || !dbUser.privateKey) {
                    res.status(403).end();
                    return;
                };

                const bytes = CryptoJS.AES.decrypt(dbUser.privateKey, process.env.SECRET_KEY as string);
                const privateKey = bytes.toString(CryptoJS.enc.Utf8);
                const injectiveAddress = PrivateKey.fromHex(privateKey).toBech32();

                const convertAction = reverse ? "convert_xnj_to_elem" : 'convert_elem_to_xnj';

                const insert = await userConvertCollection.insertOne({ tw_id: req.payload.tw_id, convertAction, amount, created_at: new Date(), status: 'pending' });

                const session = client.startSession();

                session.startTransaction();

                if (convertAction === 'convert_elem_to_xnj') {
                    if (amount >= appConfig.min_user_convert && amount <= appConfig.max_user_convert) {
                        try {
                            const convert_xnj_to_elem_count = await userConvertCollection.countDocuments({ tw_id: req.payload.tw_id, convertAction: 'convert_xnj_to_elem', status: 'success' });

                            const more_data: { akatsuki?: true } = {};

                            const created_at = new Date();

                            if (convert_xnj_to_elem_count === 0) {
                                more_data.akatsuki = true;

                                res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                                return;
                            };

                            const count = await queueConvertCollection.countDocuments({ tw_id: req.payload.tw_id, status: 'pending' });

                            if (count === 0) {
                                const convertResult = await queueConvertCollection.updateOne({
                                    tw_id: req.payload.tw_id, status: 'pending',
                                },
                                    {
                                        $setOnInsert: {
                                            tw_id: req.payload.tw_id,
                                            status: 'pending',
                                            created_at,
                                            amount,
                                            ...more_data,
                                        },
                                    }, { upsert: true, session });

                                if (convertResult.upsertedCount > 0) {
                                    const txResponse = await convert(privateKey, convertAction, amount);

                                    await session.commitTransaction();

                                    await userConvertCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, queueConvertId: convertResult.upsertedId, success_at: new Date(), status: 'success' } });
                                } else {
                                    await session.abortTransaction();
                                    res.status(404).json({ status: 'ALREADY_HAVE_A_CONVERSION' });
                                    return;
                                };
                            } else {
                                res.status(404).json({ status: 'ALREADY_HAVE_A_CONVERSION' });
                                return;
                            };
                        } catch (error: any) {
                            await session.abortTransaction();
                            await userConvertCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
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
                            return;
                        } finally {
                            await session.endSession();
                        };

                        const thirtyDaysAgo = new Date();

                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const [INJ, XNJ, ELEM] = await Promise.all([getBalance(injectiveAddress, 'inj'), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_XNJ), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_ELEM)]);

                        const queueConvertResult = await queueConvertCollection.find({ tw_id: req.payload.tw_id, status: 'pending' }).sort({ created_at: -1 }).project({ _id: 1, created_at: 1, amount: 1 }).next();

                        let expected_claim_at;
                        let can_claim_convert;

                        if (queueConvertResult) {
                            const startOfDay = new Date(queueConvertResult.created_at.toISOString());
                            startOfDay.setHours(1, 0, 0, 0);

                            const totalQueueConverts = await queueConvertCollection.find({
                                created_at: {
                                    $gte: startOfDay,
                                    $lte: queueConvertResult.created_at,
                                }
                            }).sort({ created_at: 1 }).project({ created_at: 1, amount: 1 }).toArray();

                            const total_daily = totalQueueConverts.reduce((previousValue, currentValue) => previousValue + currentValue.amount, 0) / (appConfig.max_convert_daily + 1);

                            expected_claim_at = queueConvertResult.created_at;

                            expected_claim_at.setTime(expected_claim_at.getTime() + (1000 * 60 * 60 * 24 * (total_daily >= 1 ? total_daily : 0)));

                            const date = new Date();
                            const date_string = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                            can_claim_convert = new Date(date_string).getTime() >= new Date(`${expected_claim_at.getFullYear()}-${expected_claim_at.getMonth()}-${expected_claim_at.getDate()}`).getTime();
                        };

                        const historys = await queueConvertCollection.find({ tw_id: req.payload.tw_id, status: 'success', created_at: { $gte: thirtyDaysAgo } }).sort({ created_at: -1 }).project({ _id: 0, created_at: 1, amount: 1 }).toArray();
                        const claims = await queueConvertCollection.find({ tw_id: req.payload.tw_id, status: 'pending' }).sort({ created_at: -1 }).project({ _id: 0, created_at: 1, amount: 1 }).toArray();

                        res.status(200).json({ INJ, XNJ, ELEM, claims, reverse_historys: historys, expected_claim_at, can_claim_convert });
                    };
                } else {
                    try {
                        const txResponse = await convert(privateKey, convertAction, amount);

                        await userConvertCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, success_at: new Date(), status: 'success' } });
                    } catch (error: any) {
                        console.error(error);
                        await userConvertCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
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
                        return;
                    };

                    const [INJ, XNJ, ELEM] = await Promise.all([getBalance(injectiveAddress, 'inj'), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_XNJ), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_ELEM)]);

                    const thirtyDaysAgo = new Date();

                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    const historys = await userConvertCollection.find({ tw_id: req.payload.tw_id, status: 'success', created_at: { $gte: thirtyDaysAgo }, convertAction }, { projection: { amount: 1, created_at: 1 } }).sort({ created_at: -1 }).toArray();

                    res.status(200).json({ INJ, XNJ, ELEM, historys });
                };
            } catch (error) {
                console.error(error);
                res.status(500).end();
            } finally {
                next();
            }
        },
        EndRequest
    );

    router.post(
        "/blockchain/claim_convert",
        middleWare,
        StartRequest,
        async (req: RequestWithUser, res, next) => {
            try {
                if (!req.payload) {
                    res.sendStatus(403);
                    return;
                };

                const dbInstance = Database.getInstance();
                const db = await dbInstance.getDb();
                const client = dbInstance.getClient();
                const userCollection = db.collection("users");
                const userClaimCollection = db.collection("user_claims");
                const queueConvertCollection = db.collection("queue_converts");
                const appConfig = await getAppConfig();

                const dbUser = await userCollection.findOne(
                    { tw_id: req.payload.tw_id },
                    { projection: { privateKey: 1 } }
                );

                if (!dbUser || !dbUser.privateKey) {
                    res.status(403).end();
                    return;
                };

                const bytes = CryptoJS.AES.decrypt(dbUser.privateKey, process.env.SECRET_KEY as string);
                const privateKey = bytes.toString(CryptoJS.enc.Utf8);

                const insert = await userClaimCollection.insertOne({ tw_id: req.payload.tw_id, type: 'convert', created_at: new Date(), status: 'pending' });

                const session = client.startSession();

                session.startTransaction();

                try {
                    const queueConvertResult = await queueConvertCollection.find({ tw_id: req.payload.tw_id, status: 'pending' }).sort({ created_at: -1 }).project({ _id: 1, created_at: 1, akatsuki: 1, amount: 1 }).next();

                    if (queueConvertResult && !queueConvertResult.akatsuki) {
                        const startOfDay = new Date(queueConvertResult.created_at.toISOString());
                        startOfDay.setHours(1, 0, 0, 0);

                        const totalQueueConverts = await queueConvertCollection.find({
                            created_at: {
                                $gte: startOfDay,
                                $lte: queueConvertResult.created_at,
                            }
                        }).project({ created_at: 1, amount: 1 }).toArray();

                        const total_daily = totalQueueConverts.reduce((previousValue, currentValue) => previousValue + currentValue.amount, 0) / (appConfig.max_convert_daily + 1);

                        const expected_claim_at = queueConvertResult.created_at;

                        expected_claim_at.setTime(expected_claim_at.getTime() + (1000 * 60 * 60 * 24 * (total_daily >= 1 ? total_daily : 1)));

                        const date = new Date();
                        const date_string = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                        const can_claim_convert = new Date(date_string).getTime() >= new Date(`${expected_claim_at.getFullYear()}-${expected_claim_at.getMonth()}-${expected_claim_at.getDate()}`).getTime();

                        if (can_claim_convert) {
                            const { _id, amount } = queueConvertResult;

                            const txResponse = await claim(privateKey, amount);

                            await queueConvertCollection.updateOne({ _id }, { $set: { success_at: new Date(), status: 'success' } }, { session });

                            await session.commitTransaction();

                            await userClaimCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, amount, success_at: new Date(), status: 'success' } });

                            const injectiveAddress = PrivateKey.fromHex(privateKey).toBech32();

                            const [INJ, XNJ, ELEM] = await Promise.all([getBalance(injectiveAddress, 'inj'), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_XNJ), getCW20Balance(injectiveAddress, CONTRACT_ADDRESS_ELEM)]);

                            const thirtyDaysAgo = new Date();

                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                            const historys = await queueConvertCollection.find({ tw_id: req.payload.tw_id, status: 'success', created_at: { $gte: thirtyDaysAgo } }).sort({ created_at: -1 }).project({ _id: 0, created_at: 1, amount: 1 }).toArray();
                            const claims = await queueConvertCollection.find({ tw_id: req.payload.tw_id, status: 'pending' }).sort({ created_at: -1 }).project({ _id: 0, created_at: 1, amount: 1 }).toArray();

                            res.status(200).json({ INJ, XNJ, ELEM, claims, reverse_historys: historys, can_claim_convert, expected_claim_at });
                        } else {
                            res.status(404).json({ status: 'CLAIM_DATE_HAS_NOT_YET_ARRIVED' });
                            return;
                        };
                    } else {
                        res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                        return;
                    };
                } catch (error: any) {
                    console.error(error);
                    await session.abortTransaction();
                    await userClaimCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
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
                    return;
                } finally {
                    await session.endSession();
                };
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
