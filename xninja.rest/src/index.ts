import {
  middleWare,
  EXT_URL,
  CLIENT_URL,
  JWT_SECRET,
  SERVER_URI,
  SERVER_PORT,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  CLIENT_WEB_URL,
} from "./config";
import type { RequestWithUser } from "./config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { twitterOauth1a, twitterOauth1aWeb } from "./oauth";
import dotenv from "dotenv";
import Apis from "./apis/index";
import Database from "./libs/database";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Passport } from "passport";
import session from "express-session";
import IORedis from 'ioredis';
import RedisStore from "connect-redis";
import appConfig from "./app.config";
import geoIpLite from 'geoip-lite';

dotenv.config();

const allowedDomains = [
  CLIENT_WEB_URL,
  CLIENT_URL,
  EXT_URL,
  "http://www.localhost:3000",
  "https://twitter.com"
]

const corsOptions = {
  origin: allowedDomains,
  credentials: true,
};

const app = express();

const redisClient = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

redisClient.on('ready', () => {
  console.log('Connected to Redis successfully!');
});

redisClient.on('error', (err) => {
  console.error('Error connecting to Redis:', err);
});

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax"
    },
  })
)

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

const passport = new Passport();
const passport_web = new Passport();

passport.use(
  new TwitterStrategy(
    {
      consumerKey: TWITTER_CONSUMER_KEY,
      consumerSecret: TWITTER_CONSUMER_SECRET,
      callbackURL: `${SERVER_URI}/auth/twitter/callback`,
    },
    //@ts-ignore
    function (token, tokenSecret, profile, done) {
      const user = {
        tw_id: profile.id,
        name: profile.displayName,
        username: profile.username,
        profile_image_url: profile._json.profile_image_url,
        created_at: profile._json.created_at,
        accessToken: token,
      };
      done(null, user);
    }
  )
);

passport_web.use(
  new TwitterStrategy(
    {
      consumerKey: TWITTER_CONSUMER_KEY,
      consumerSecret: TWITTER_CONSUMER_SECRET,
      callbackURL: `${SERVER_URI}/auth2/twitter/callback`,
    },
    //@ts-ignore
    function (token, tokenSecret, profile, done) {
      const user = {
        tw_id: profile.id,
        name: profile.displayName,
        username: profile.username,
        profile_image_url: profile._json.profile_image_url,
        created_at: profile._json.created_at,
        accessToken: token,
      };
      done(null, user);
    }
  )
);

app.use("/api", Apis);
app.get("/auth/twitter", passport.authenticate("twitter", { session: false }));
app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", { session: false, failureRedirect: "/login" }),
  async (req, res) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const location = geoIpLite.lookup(clientIp?.split(',')[0] as string);

    const client_infos = { clientIp, location } as { clientIp: string; location: any };

    return twitterOauth1a(req, res, client_infos);
  },
);

app.get("/auth2/twitter", passport_web.authenticate("twitter", { session: false }));
app.get(
  "/auth2/twitter/callback",
  passport_web.authenticate("twitter", { session: false, failureRedirect: "/login" }),
  async (req, res) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

    const location = geoIpLite.lookup(clientIp?.split(',')[0] as string);

    const client_infos = { clientIp, location } as { clientIp: string; location: any };

    return twitterOauth1aWeb(req, res, client_infos);
  },
);

const defaultProjection: { [key: string]: 1 } = {
  tw_id: 1, name: 1, username: 1, profile_image_url: 1, addresses: 1, two_factor_enabled: 1, wallet: 1, discordId: 1,
  referral_code: 1, boosts: 1, inventorys: 1, quests: 1, invite_code: 1, rewards: 1, ninjas: 1, user_refs: 1,
}

app.get("/me", middleWare, async (req: RequestWithUser, res) => {
  if (!req.payload) {
    res.sendStatus(403);
    return;
  }

  const dbInstance = Database.getInstance();
  const db = await dbInstance.getDb();
  const userCollection = db.collection("users");
  const ninjaCollection = db.collection("ninjas");

  let projectType = 'default';
  let projection: { [key: string]: 1 } = defaultProjection;

  if (typeof req.query.projection === 'string') {
    const project = req.query.projection.split(' ');
    const newProjection: { [key: string]: 1 } = {};

    for (let i = 0; i < project.length; ++i) {
      if (!projection[project[i]]) {
        res.status(404).json({ status: 'BAD_REQUEST' });
        return;
      };
      newProjection[project[i]] = 1;
    };

    projectType = 'custom';
    projection = newProjection;
  };

  const user = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { _id: 0, ...projection } });

  if (!user) {
    res.status(403).end();
    return;
  }

  const message = (req.query.message as string | undefined);

  const ninjas = (message?.includes('default') || projectType === 'default') && await ninjaCollection
    .find({ ownerId: req.payload.tw_id })
    .project({ ownerId: 0 })
    .toArray();

  const defaultUser = (message?.includes('default') || projectType === 'default') && { wallet: { ELEM: 0 }, user_ninjas: ninjas };

  const response = message?.includes('syncData') && await fetch(
    "https://api.chainbase.online/v1/token/price?chain_id=1&contract_address=0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30",
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": "2bsq57OFyKk5BgEDIXusDPzDtoB",
      },
    }
  );

  const resJson: { [key: string]: any } = { ...defaultUser, ...user };
  const syncData: { [key: string]: any } = {};

  if (!message?.includes('!appConfig')) {
    resJson.appConfig = await appConfig();
  };

  if (message?.includes('syncData') && response) {
    const result = (await response.json()) as {
      code: number;
      data: { price: number; symbol: string; decimals: 18; updated_at: string };
    };

    if (result.code !== 0) {
      res.status(500).end();
      return;
    };

    syncData.INJ_price = result.data.price;
    resJson.syncData = syncData;
  };

  res.json(resJson);
});

app.post("/signout", (req, res) => {
  if (req.headers['xninja-type'] === 'web') {
    res.clearCookie('xninja-auth_token').status(200).end();
  };
});

app.get("/health", (_, res) => {
  res.status(200).send("OK");
});

app.listen(SERVER_PORT, () => console.log(`Server listening on port ${SERVER_PORT}`));

(async () => {
  const dbInstance = Database.getInstance();
  const db = await dbInstance.getDb();
  const userCollection = db.collection("users");
  const ninjaCollection = db.collection("ninjas");
  const userActionCollection = db.collection("user_actions");
  const userBorrowCollection = db.collection("user_borrows");
  const userClaimCollection = db.collection("user_claims");
  const userConvertCollection = db.collection("user_converts");
  const userMarketCollection = db.collection("user_markets");
  const userRepayCollection = db.collection("user_repays");
  const userWithdrawCollection = db.collection("user_withdraws");
  const offChainLogCollection = db.collection('offchain_logs');
  const userOffchainActionCollection = db.collection('user_offchain_actions');
  const queueConvertCollection = db.collection("queue_converts");

  await userCollection.createIndex({ tw_id: 1 }, { unique: true });
  await userCollection.createIndex({ invite_code: 1 }, { unique: true });
  await userCollection.createIndex({ 'addresses.injectiveAddress': 1 }, { unique: true });
  await userCollection.createIndex({ 'addresses.ethereumAddress': 1 }, { unique: true });
  await userCollection.createIndex({ user_boosts: 1 });

  await ninjaCollection.createIndex({ ownerId: 1 });
  await ninjaCollection.createIndex({ class: 1 });

  await userActionCollection.createIndex({ type: 1 });
  await userActionCollection.createIndex({ status: 1 });
  await userActionCollection.createIndex({ 'data.ownerId': 1 });

  await userBorrowCollection.createIndex({ tw_id: 1 });
  await userBorrowCollection.createIndex({ status: 1 });

  await userClaimCollection.createIndex({ tw_id: 1 });
  await userClaimCollection.createIndex({ status: 1 });

  await userConvertCollection.createIndex({ tw_id: 1 });
  await userConvertCollection.createIndex({ status: 1 });
  await userConvertCollection.createIndex({ convertAction: 1 });

  await userMarketCollection.createIndex({ tw_id: 1 });
  await userMarketCollection.createIndex({ status: 1 });
  await userMarketCollection.createIndex({ type: 1 });

  await userRepayCollection.createIndex({ tw_id: 1 });
  await userRepayCollection.createIndex({ status: 1 });

  await userWithdrawCollection.createIndex({ tw_id: 1 });
  await userWithdrawCollection.createIndex({ status: 1 });

  await offChainLogCollection.createIndex({ tw_id: 1 });
  await offChainLogCollection.createIndex({ action: 1 });

  await userOffchainActionCollection.createIndex({ tw_id: 1 });
  await userOffchainActionCollection.createIndex({ action: 1 });

  await queueConvertCollection.createIndex({ tw_id: 1 });
  await queueConvertCollection.createIndex({ class: 1 });
})();
