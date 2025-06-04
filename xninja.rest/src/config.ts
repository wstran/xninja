import jwt from "jsonwebtoken";
import Database from "./libs/database";
import dotenv from 'dotenv';
import { generateWallet } from './libs/wallet';
import { getInjectiveAddress, getEthereumAddress } from '@injectivelabs/sdk-ts';
import CryptoJS from 'crypto-js';
import { Request, Response, NextFunction } from "express";

dotenv.config();

export const EXT_URL = process.env.EXT_URL!;
export const CLIENT_WEB_URL = process.env.CLIENT_WEB_URL!;
export const CLIENT_URL = process.env.CLIENT_URL!;
export const SERVER_URI = process.env.SERVER_URI!;
export const SERVER_PORT = process.env.SERVER_PORT!;
export const TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY!;
export const TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET!;
export const JWT_SECRET = process.env.JWT_SECRET!;

function generateRandomString(length: number): string {
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function upsertUser(twitterUser: any, client_infos: { clientIp: string; location: any }) {
  if (!twitterUser.tw_id || !twitterUser.username) {
    console.error('Error login:', twitterUser);
    return;
  }

  const dbInstance = Database.getInstance();
  const db = await dbInstance.getDb();
  const userCollection = db.collection('users');

  const { tw_id, username, name, profile_image_url } = twitterUser;

  const user = await userCollection.findOne({ tw_id }, { projection: { invite_code: 1, addresses: 1, two_factor_enabled: 1, privateKey: 1 } });

  if (user) {
    twitterUser.invite_code = user.invite_code;
    twitterUser.two_factor_enabled = user.two_factor_enabled;
    if (user.privateKey === undefined || user.privateKey === null) {
      const { address, privateKey } = generateWallet();
      const serverSecretKey = process.env.SECRET_KEY;
      // @ts-ignore
      const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, serverSecretKey).toString();
      const injectiveAddress = getInjectiveAddress(address);
      const ethereumAddress = getEthereumAddress(injectiveAddress);
      const addresses = { injectiveAddress, ethereumAddress };

      twitterUser.addresses = addresses;
      twitterUser.privateKey = encryptedPrivateKey;

      await userCollection.updateOne({ tw_id }, { $set: { addresses, privateKey: encryptedPrivateKey } });
    } else {
      twitterUser.addresses = user.addresses;
    }
  } else {
    while (true) {
      const generate_code = 'xninja_' + generateRandomString(8);

      const count = await userCollection.countDocuments({ invite_code: generate_code });

      if (count === 0) {
        const { address, privateKey } = generateWallet();
        const serverSecretKey = process.env.SECRET_KEY;
        // @ts-ignore
        const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, serverSecretKey).toString();
        const injectiveAddress = getInjectiveAddress(address);
        const ethereumAddress = getEthereumAddress(injectiveAddress);

        twitterUser.invite_code = generate_code;
        twitterUser.addresses = { injectiveAddress, ethereumAddress };
        twitterUser.privateKey = encryptedPrivateKey;
        break;
      }
    }
  }

  const { invite_code, addresses, privateKey } = twitterUser;

  const date = new Date();

  const $set: { username: string, name: string, profile_image_url: string, last_login: Date, wallet?: { ELEM: number } } = { username, name, profile_image_url, last_login: date };

  if (process.env.APP_VERSION === 'DEVELOPMENT') {
    $set.wallet = { ELEM: 1000000 };
  };

  await userCollection.updateOne(
    { tw_id },
    {
      $setOnInsert: { tw_id, invite_code, addresses, privateKey, two_factor_enabled: false, created_at: date },
      $push: { client_infos: { ...client_infos, login_at: new Date() } },
      $set,
    },
    { upsert: true },
  );

  delete twitterUser.privateKey;

  const accessToken = jwt.sign({
    tw_id: twitterUser.tw_id,
    name: twitterUser.name,
    username: twitterUser.username,
    accessToken: twitterUser.accessToken,
    exp: new Date(Date.now() + 7200 * 1000).getTime(),
  }, JWT_SECRET);

  twitterUser.accessToken = accessToken;

  return twitterUser;
}

export type PAYLOAD = {
  tw_id: string;
  name: string;
  username: string;
  accessToken: string;
};

export interface RequestWithUser extends Request {
  payload?: PAYLOAD;
};

export function middleWare(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const token = req.headers['xninja-type'] === 'web' ? req.cookies['xninja-auth_token'] : req.headers['xninja-auth_token'] as string;

    if (!token) {
      throw new Error("Not Authenticated");
    };

    const payload = (jwt.verify(token, JWT_SECRET)) as PAYLOAD;

    if (!payload.accessToken) {
      throw new Error("Not Authenticated");
    };

    req.payload = payload;

    next();
  } catch (err) {
    res.status(403).json("Not Authenticated");
  };
};