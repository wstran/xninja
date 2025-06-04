import { Router } from 'express';
import { middleWare, RequestWithUser } from "../../config";
import queueRequest from '../../libs/queue-request';
import Database from '../../libs/database';
import { BigNumberInWei } from '@injectivelabs/utils';
import { CONTRACT_ADDRESS_ELEM, CONTRACT_ADDRESS_XNJ, getBalance, getCW20Balance } from './config';
import CryptoJS from 'crypto-js';
import { transferCW20, transferNative } from '../../libs/blockchain';
import { ethers } from 'ethers';
import { ErrorCode } from '../../libs/ErrorCode';
import { symmetricDecrypt } from '../../libs/crypto';
import { authenticator } from 'otplib';

const [StartRequest, EndRequest] = queueRequest();

const configTokens: { [key: string]: { native: boolean; contractAddress?: string } } = {
    INJ: { native: true },
    XNJ: { native: false, contractAddress: CONTRACT_ADDRESS_XNJ },
    ELEM: { native: false, contractAddress: CONTRACT_ADDRESS_ELEM },
};

export default function (router: Router) {
    router.post("/blockchain/withdraw", middleWare, StartRequest, async (req: RequestWithUser, res, next) => {
        try {
            if (!req.payload) {
                res.sendStatus(403);
                return;
            };

            const { recipient, amount, token, totpCode, memo } = req.body as { recipient: string, amount: number, token: string; totpCode: string; memo?: string };

            if (!totpCode) {
                res.status(400).json({ error: ErrorCode.SecondFactorRequired });
                return;
            };

            if (typeof memo !== 'string' && typeof memo !== 'undefined') {
                res.status(400).json({ error: 'BAD_REQUEST' });
                return;
            };

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const userCollection = db.collection('users');
            const withdrawCollection = db.collection("user_withdraws");

            const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { two_factor_enabled: 1, two_factor_secret: 1, addresses: 1, privateKey: 1 } });

            if (!dbUser) {
                res.status(403).end();
                return;
            };

            if (!dbUser.two_factor_enabled || !dbUser.two_factor_secret) {
                res.status(400).json({ error: ErrorCode.TwoFactorSetupRequired });
                return;
            };

            if (!process.env.ENCRYPTION_KEY) {
                console.error(`"Missing encryption key; cannot proceed with two factor login."`);
                throw new Error(ErrorCode.InternalServerError);
            };

            const secret = symmetricDecrypt(dbUser.two_factor_secret, process.env.ENCRYPTION_KEY);

            if (secret.length !== 32) {
                console.error(`Two factor secret decryption failed. Expected key with length 32 but got ${secret.length}`);
                throw new Error(ErrorCode.InternalServerError);
            };

            const isValidToken = authenticator.check(totpCode, secret);

            if (!isValidToken) {
                res.status(400).json({ error: ErrorCode.IncorrectTwoFactorCode });
                return;
            };

            const getToken = configTokens[token];

            if (!recipient || typeof recipient !== "string" || !getToken) {
                res.status(400).json({ message: "BAD_REQUEST" });
                return;
            }

            if (recipient.toLowerCase() === String(dbUser.addresses.injectiveAddress).toLowerCase()) {
                res.status(404).json({ status: 'SAME_ADDRESS' });
                return;
            };

            const privateKey = CryptoJS.AES.decrypt(
                dbUser.privateKey,
                process.env.SECRET_KEY as string
            ).toString(CryptoJS.enc.Utf8);

            if (getToken.native) {
                const balance = new BigNumberInWei((await getBalance(dbUser.addresses.injectiveAddress, 'inj')).balance).toBase().toNumber();

                if (balance < amount) {
                    res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                    return;
                };

                const insert = await withdrawCollection.insertOne({ tw_id: req.payload.tw_id, dataToken: { ...getToken, token }, amount: ethers.parseEther(amount.toFixed(18)).toString(), memo, created_at: new Date(), status: 'pending' });

                try {
                    const txResponse = await transferNative(privateKey, recipient, amount, memo);

                    if (!txResponse || txResponse.code !== 0) return;

                    await withdrawCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, success_at: new Date(), status: 'success' } });
                } catch (error: any) {
                    if (error.contextCode === 5 || !error.contextCode) {
                        if (error.type === 'chain-error' || error.contextModule === 'wasm' || error.errorClass === 'TransactionException') {
                            res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                            return;
                        } else if (error.type === 'http-request' && error.errorClass === 'HttpRequestException') {
                            res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                            return;
                        };
                    };
                    res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    await withdrawCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
                };
            } else if (getToken.contractAddress) {
                const balance = new BigNumberInWei((await getCW20Balance(dbUser.addresses.injectiveAddress, getToken.contractAddress)).balance).toBase().toNumber();

                if (balance < amount) {
                    res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                    return;
                };

                const insert = await withdrawCollection.insertOne({ tw_id: req.payload.tw_id, dataToken: { ...getToken, token }, amount: ethers.parseEther(amount.toFixed(18)).toString(), memo, created_at: new Date(), status: 'pending' });

                try {
                    const txResponse = await transferCW20(privateKey, getToken.contractAddress, recipient, amount, memo);

                    await withdrawCollection.updateOne({ _id: insert.insertedId }, { $set: { txResponse, success_at: new Date(), status: 'success' } });
                } catch (error: any) {
                    if (error.contextCode === 5 || !error.contextCode) {
                        if (error.type === 'chain-error' || error.contextModule === 'wasm' || error.errorClass === 'TransactionException') {
                            res.status(404).json({ status: 'NOT_ENOUGH_MONEY' });
                            return;
                        } else if (error.type === 'http-request' && error.errorClass === 'HttpRequestException') {
                            res.status(404).json({ status: 'NOT_ENOUGH_GAS' });
                            return;
                        };
                    };
                    res.status(404).json({ status: 'SOMETHING_WENT_WRONG' });
                    await withdrawCollection.updateOne({ _id: insert.insertedId }, { $set: { failed_at: new Date(), status: 'failed' } });
                };
            };

            setTimeout(() => res.status(200).end(), 2000);
        } catch (error) {
            console.error(error);
            res.status(500).end();
        } finally {
            next();
        };
    }, EndRequest);
};