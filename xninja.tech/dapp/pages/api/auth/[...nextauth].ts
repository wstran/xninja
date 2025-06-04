import dotenv from 'dotenv';
import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import Database from '@/libs/database';
import { generateWallet } from '@/libs/wallet';
import { getInjectiveAddress, getEthereumAddress } from '@injectivelabs/sdk-ts';
import CryptoJS from 'crypto-js';

dotenv.config();

function generateRandomString(length: number): string {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export const authOptions = {
    providers: [
        TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
            version: '2.0',
            //@ts-ignore
            async profile({ data }) {
                if (!data.id || !data.username) {
                    console.error('Error login:', data);
                    return;
                }

                data.tw_id = data.id;

                const dbInstance = Database.getInstance();
                const db = await dbInstance.getDb();
                const userCollection = db.collection('users');

                const { tw_id, username, name, profile_image_url } = data;

                const user = await userCollection.findOne({ tw_id: tw_id }, { projection: { invite_code: 1, addresses: 1, two_factor_enabled: 1, privateKey: 1 } });

                if (user) {
                    data.invite_code = user.invite_code;
                    data.two_factor_enabled = user.two_factor_enabled;
                    if (user.privateKey === undefined || user.privateKey === null) {
                        const { address, privateKey } = generateWallet();
                        const serverSecretKey = process.env.SECRET_KEY;
                        // @ts-ignore
                        const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, serverSecretKey).toString();
                        const injectiveAddress = getInjectiveAddress(address);
                        const ethereumAddress = getEthereumAddress(injectiveAddress);
                        const addresses = { injectiveAddress, ethereumAddress };

                        data.addresses = addresses;
                        data.privateKey = encryptedPrivateKey;

                        await userCollection.updateOne({ tw_id: tw_id }, { $set: { addresses, privateKey: encryptedPrivateKey } });
                    } else {
                        data.addresses = user.addresses;
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

                            data.invite_code = generate_code;
                            data.addresses = { injectiveAddress, ethereumAddress };
                            data.privateKey = encryptedPrivateKey;
                            break;
                        }
                    }
                }

                const { invite_code, addresses, privateKey } = data;

                const date = new Date();

                const $set: { username: string; name: string; profile_image_url: string; last_login: Date; wallet?: { ELEM: number } } = { username, name, profile_image_url, last_login: date };

                if (process.env.APP_VERSION === 'DEVELOPMENT') {
                    $set.wallet = { ELEM: 1000000 };
                }

                await userCollection.updateOne(
                    { tw_id: tw_id },
                    {
                        $setOnInsert: { tw_id, invite_code, addresses, privateKey, two_factor_enabled: false, created_at: date },
                        $set,
                    },
                    { upsert: true },
                );

                delete data.privateKey;

                return data;
            },
        }),
    ],
    callbacks: {
        //@ts-ignore
        jwt: async ({ token, user }) => {
            const tokens = { ...token, ...user };

            delete tokens.sub;

            return tokens;
        },
        //@ts-ignore
        session: async ({ session, token }) => {
            const sessions = { ...session };

            const dbInstance = Database.getInstance();
            const db = await dbInstance.getDb();
            const userCollection = db.collection('users');

            const dbUser = await userCollection.findOne({ tw_id: token.tw_id }, { projection: { _id: 0, invite_code: 1, two_factor_enabled: 1, wallet: 1, discordId: 1 } });

            sessions.user = {
                tw_id: token.tw_id,
                name: token.name,
                username: token.username,
                profile_image_url: token.profile_image_url,
                invite_code: dbUser?.invite_code || token.invite_code,
                addresses: token.addresses,
                two_factor_enabled: !!dbUser?.two_factor_enabled,
                wallet: dbUser?.wallet || { ELEM: 0 },
                discordId: dbUser?.discordId,
                boosts: dbUser?.boosts || {},
            };
            return sessions;
        },
    },
    secret: process.env.NEXTAUTH_SECRET!,
};

export default NextAuth(authOptions);
