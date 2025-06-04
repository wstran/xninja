import dotenv from 'dotenv'
import { NextApiRequest, NextApiResponse } from 'next';
// @ts-ignore
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";
import { manager } from '@/lib/db';
dotenv.config();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "web3",
      name: "web3",
      credentials: {
        message: { label: "Message", type: "text" },
        signedMessage: { label: "Signed Message", type: "text" }, // aka signature
      },
      async authorize(credentials, req) {
        // console.log("\n\nHIT", credentials)
        if (!credentials?.signedMessage || !credentials?.message) {
          return null;
        }

        try {
          // On the Client side, the SiweMessage()
          // will be constructed like this:
          //
          // const siwe = new SiweMessage({
          //   address: address,
          //   statement: process.env.NEXT_PUBLIC_SIGNIN_MESSAGE,
          //   nonce: await getCsrfToken(),
          //   expirationTime: new Date(Date.now() + 2*60*60*1000).toString(),
          //   chainId: chain?.id
          // });

          const siwe = new SiweMessage(JSON.parse(credentials?.message));
          const result = await siwe.verify({
            signature: credentials.signedMessage,
            nonce: await getCsrfToken({ req: { headers: req.headers } }),
          });

          if (!result.success) throw new Error("Invalid Signature");

          if (result.data.statement !== process.env.NEXT_PUBLIC_SIGNIN_MESSAGE)
            throw new Error("Statement Mismatch");

          if (new Date(result.data.expirationTime as string) < new Date())
            throw new Error("Signature Already expired");

          // console.log("Returning")

          return {
            id: siwe.address,
          };
        } catch (error) {
          console.log(error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },

  // debug: process.env.NODE_ENV === "development",

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account }: { token: any; account: any }) {
      if (account) {
        token.accessToken = account.access_token
      }
      try {
        const dbInstance = manager.getDatabase("dashDB");
        const db = await dbInstance.connect();
        const collection = db.collection('config-user');

        const result = await collection.findOne({ user_address: token.sub });

        if (result && result.role) {
          token.role = result.role;
        } else {
          token.role = 'subcriber';
        }
      } catch (error) {
        console.error('Error finding user in the database:', error);
      }

      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      try {
        const dbInstance = manager.getDatabase("dashDB");
        const db = await dbInstance.connect();
        const collection = db.collection('config-user');

        const result = await collection.findOne({ user_address: token.sub });

        if (result && result.role) {
          session.user.role = result.role;
          session.user.email = result.user_email;
        } else {
          await collection.updateOne(
            { user_address: token.sub },
            {
              $setOnInsert: { user_address: token.sub, role: 'subcriber', user_email: null, user_teleid: null, user_teleusername: null, created_at: new Date() },
              $set: { updated_at: new Date() }
            },
            { upsert: true }
          );
          session.user.role = 'subcriber';
        }
      } catch (error) {
        console.error('Error handling user in the database:', error);
      }
      session.address = token.sub;
      session.user!.name = '';
      session.user!.image = '';
      session.token = token;
      return session;
    },
  },
};
// @ts-ignore
const nextAuthHandler = (req: NextApiRequest, res: NextApiResponse) => NextAuth(req, res, authOptions);
export default nextAuthHandler;
