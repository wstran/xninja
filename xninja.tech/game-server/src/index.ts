import { CLIENT_URL, COOKIE_NAME, JWT_SECRET, prisma, SERVER_PORT } from "./config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
// import { getTwitterUser } from "./oauth2";
import { twitterOauth } from "./oauth2";
import { users } from "@prisma/client";
import dotenv from "dotenv";

//For env File
dotenv.config();

const app = express();
const origin = [CLIENT_URL];
app.use(cookieParser());
app.use(
  cors({
    origin,
    credentials: true,
  })
);
app.get("/ping", (_, res) => res.json("pong"));

type UserJWTPayload = Pick<users, "id"> & { accessToken: string };

app.get("/me", async (req, res) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      throw new Error("Not Authenticated");
    }
    const payload = (await jwt.verify(token, JWT_SECRET)) as UserJWTPayload;

    const userFromDb = await prisma.users.findUnique({
      where: { id: payload?.id },
    });

    if (!userFromDb) throw new Error("Not Authenticated");
    if (!payload.accessToken) {
      throw new Error("Not Authenticated");
    }
    // const twUser = await getTwitterUser(payload.accessToken);
    // console.log("twUser", twUser);
    // if (twUser?.id !== userFromDb.tw_id) {
    //   throw new Error("Not Authenticated");
    // }
    res.json(userFromDb);
  } catch (err) {
    res.status(401).json("Not Authenticated");
  }
});

// activate twitterOauth function when visiting the route
app.get("/oauth/twitter", twitterOauth);
app.listen(SERVER_PORT, () => console.log(`Server listening on port ${SERVER_PORT}`));
