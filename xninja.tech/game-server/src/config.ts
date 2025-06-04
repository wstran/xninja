import { PrismaClient } from "@prisma/client";
import { CookieOptions, Response } from "express";
import { TwitterUser } from "./oauth2";
import jwt from "jsonwebtoken";

export const CLIENT_URL = process.env.CLIENT_URL!;
export const SERVER_PORT = process.env.SERVER_PORT!;
export const prisma = new PrismaClient();

// step 3
export function upsertUser(twitterUser: TwitterUser) {
  // create a new user in our database or return an old user who already signed up earlier
  const userFromDb = prisma.users.findUnique({
    where: { tw_id: twitterUser.id },
  });

  return userFromDb;
  return prisma.users.upsert({
    create: {
      tw_id: twitterUser.id,
      username: twitterUser.username,
      name: twitterUser.name,
      addresses: { ethereumAddress: "", injectiveAddress: "" },
      invite_code: "",
      last_login: "",
      privateKey: "",
      profile_image_url: "",
    },
    update: {
      tw_id: twitterUser.id,
    },
    where: { tw_id: twitterUser.id },
  });
}

// JWT_SECRET from our environment variable file
export const JWT_SECRET = process.env.JWT_SECRET!;

// cookie name
export const COOKIE_NAME = "oauth2_token";

// cookie setting options
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
};

// step 4
export function addCookieToRes(res: Response, user: any, accessToken: string) {
  const { id } = user;
  const token = jwt.sign(
    {
      // Signing the token to send to client side
      id,
      accessToken,
    },
    JWT_SECRET
  );
  res.cookie(COOKIE_NAME, token, {
    // adding the cookie to response here
    ...cookieOptions,
    expires: new Date(Date.now() + 7200 * 1000),
  });
}
