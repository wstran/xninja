import dotenv from 'dotenv';
import NextAuth from 'next-auth';
import TwitterProvider from "next-auth/providers/twitter";
import Database from '@/libs/database';

dotenv.config();

function generateRandomString(length: number): string {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export const authOptions = {
    providers: [
        TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
            version: "2.0",
            //@ts-ignore
            async profile({ data }) {
                if (!data.id || !data.username) {
                    console.error('Error login:', data);
                    return;
                };

                const dbInstance = Database.getInstance();
                const db = await dbInstance.getDb();
                const userCollection = db.collection('users');

                while (true) {
                    const generate_code = 'xninja_' + generateRandomString(8);

                    const count = await userCollection.countDocuments({ invite_code: generate_code });

                    if (count === 0) {
                        data.invite_code = generate_code;
                        break;
                    };
                };

                const { id, username, name, profile_image_url, invite_code } = data;

                await userCollection.updateOne({ id }, {
                    $setOnInsert: { id, invite_code },
                    $set: { username, name, profile_image_url, last_login: new Date() }
                }, { upsert: true });

                return data;
            },
        })
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
            console.log
            sessions.user = {
                id: token.id,
                name: token.name,
                username: token.username,
                profile_image_url: token.profile_image_url,
                invite_code: token.invite_code
            };
            return sessions;
        },
    },
};

export default NextAuth(authOptions);
