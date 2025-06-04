import { manager } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { LRUCache } from 'lru-cache';
import { CONFIG_BOOSTS, LEVEL_NINJAS } from "@/lib/game-config";

/* const cache = new LRUCache({ max: 500, ttl: 1000 * 60 * 5 }); */

function getBoostData(boosts: { count: number; date: string } | undefined) {
  if (!boosts) return null;

  const currentDate = new Date();

  const sortedKeys = Object.keys(CONFIG_BOOSTS)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 0; i < sortedKeys.length; i++) {
    if (boosts.count < sortedKeys[i]) {
      const data = CONFIG_BOOSTS[sortedKeys[i - 1]];

      return data && (currentDate.getTime() - Date.parse(boosts.date)) / (24 * 60 * 60 * 1000) < data.day ? data.boost : null;
    }
  }

  return CONFIG_BOOSTS[sortedKeys[sortedKeys.length - 1]].boost;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const address = (session as any).address;
  if (!address) {
    return res.status(400).json({ message: "Invalid session data" });
  }
  const dbInstance = manager.getDatabase("dashDB");
  const db = await dbInstance.connect();
  const user = await db.collection("config-user").findOne({ user_address: address });

  if (!user || user.role === "subcriber") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const gdbInstance = manager.getDatabase("gameDB");
  const gdb = await gdbInstance.connect();
  const guserCollection = gdb.collection("users");
  const ninjaCollection = gdb.collection("ninjas");
  const userBorrowCollection = gdb.collection("user_borrows");
  const userConvertCollection = gdb.collection("user_converts");
  const queueConvertCollection = gdb.collection("queue_converts");
  const userRepayCollection = gdb.collection("user_repays");
  const userClaimCollection = gdb.collection("user_claims");
  const userMarketCollection = gdb.collection("user_markets");
  const offChainLogCollection = gdb.collection("offchain_logs");
  const userActionCollection = gdb.collection("user_actions");

  if (req.method === "GET") {
   /*  const clientCache = cache.get('main');
    if (clientCache) {
      return res.status(200).json(clientCache);
    }; */

    const [users, borrows, converts, queue_converts, repays, claims, markets, offChainActions, actions, ninjas] = await Promise.all([
      guserCollection.find({ ignore: { $ne: true } }).project({ onchain_balances: 1, 'addresses.injectiveAddress': 1, user_refs_length: { $size: { $ifNull: ["$user_refs", []] } }, boosts: 1, tw_id: 1, username: 1, name: 1, profile_image_url: 1, created_at: 1, last_login: 1, invite_code: 1, referral_code: 1, wallet: 1 }).toArray(),
      userBorrowCollection.find({ status: "success" }).project({ _id: 0, tw_id: 1, amount: 1, loanAmount: 1, created_at: 1 }).sort({ created_at: -1 }).toArray(),
      userConvertCollection.find({ status: "success" }).project({ _id: 0, tw_id: 1, amount: 1, convertAction: 1, created_at: 1 }).sort({ created_at: -1 }).toArray(),
      queueConvertCollection.find({ status: "pending" }).project({ _id: 0, tw_id: 1, akatsuki: 1 }).toArray(),
      userRepayCollection.find({ status: "success" }).project({ _id: 0, tw_id: 1, amount: 1, repayAmount: 1, created_at: 1 }).sort({ created_at: -1 }).toArray(),
      userClaimCollection.find({ status: "success" }).project({ _id: 0, tw_id: 1, amount: 1, type: 1, created_at: 1 }).sort({ created_at: -1 }).toArray(),
      userMarketCollection.find({ status: "success" }).project({ _id: 0, tw_id: 1, price_onchain: 1, type: 1, created_at: 1 }).sort({ created_at: 1 }).toArray(),
      offChainLogCollection.find().project({ _id: 0, tw_id: 1, price: 1, created_at: 1 }).sort({ created_at: -1 }).toArray(),
      userActionCollection.find({ status: "success" }).project({ _id: 0, tw_id: 1, price_onchain: 1, type: 1, data: 1, created_at: 1 }).sort({ created_at: -1 }).toArray(),
      ninjaCollection.find({ level: { $gte: 5 } }).project({ _id: 0 }).toArray(),
    ]);

    const dataBorrow = new Map();

    for (let i = 0; i < borrows.length; ++i) {
      const { tw_id, amount, loanAmount } = borrows[i];

      const data: { [key: string]: any } = { ...dataBorrow.get(tw_id) };

      data.total_borrowed_xnj = (data.total_borrowed_xnj || 0) + Number(ethers.formatEther(loanAmount));
      data.total_collateral_inj = (data.total_collateral_inj || 0) + Number(ethers.formatEther(amount));

      dataBorrow.set(tw_id, data);
    }

    const dataConvert = new Map();

    for (let i = 0; i < converts.length; ++i) {
      const { tw_id, amount, convertAction } = converts[i];

      const data: { [key: string]: any } = { ...dataConvert.get(tw_id) };

      if (convertAction === 'convert_xnj_to_elem') {
        data.total_convert_to_elem = (data.total_convert_to_elem || 0) + amount;
      } else {
        data.total_convert_to_xnj = (data.total_convert_to_xnj || 0) + amount;
      };

      dataConvert.set(tw_id, data);
    }

    const dataQueueConvert = new Map();

    for (let i = 0; i < queue_converts.length; ++i) {
      const { tw_id, akatsuki } = queue_converts[i];

      const data: { [key: string]: any } = { ...dataQueueConvert.get(tw_id) };

      data.akatsuki = akatsuki;

      dataQueueConvert.set(tw_id, data);
    }

    const dataRepay = new Map();

    for (let i = 0; i < repays.length; ++i) {
      const { tw_id, amount, repayAmount } = repays[i];

      const data: { [key: string]: any } = { ...dataRepay.get(tw_id) };

      data.total_repay_xnj = (data.total_repay_xnj || 0) + Number(ethers.formatEther(amount));
      data.total_repay_inj = (data.total_repay_inj || 0) + Number(ethers.formatEther(repayAmount));

      dataRepay.set(tw_id, data);
    }

    const dataClaims = new Map();

    for (let i = 0; i < claims.length; ++i) {
      const { tw_id, amount, type } = claims[i];

      const data: { [key: string]: any } = { ...dataClaims.get(tw_id) };

      if (type === "earn") {
        data.total_earned_and_claimed = (data.total_earned_and_claimed || 0) + Number(ethers.formatEther(amount));
      }

      dataClaims.set(tw_id, data);
    }

    const dataMarkets = new Map();

    for (let i = 0; i < markets.length; ++i) {
      const { tw_id, price_onchain, type, created_at } = markets[i];

      const data: { [key: string]: any } = { ...dataMarkets.get(tw_id) };

      if (type === "buy_chest") {
        if (!data.first_date_spent_chest) {
          data.first_date_spent_chest = created_at;
        };
      };
      data.total_elem_spent_onchain = (data.total_elem_spent_onchain || 0) + price_onchain;
      dataMarkets.set(tw_id, data);
    }

    const dataOffChain = new Map();

    for (let i = 0; i < offChainActions.length; ++i) {
      const { tw_id, price } = offChainActions[i];

      const data: { [key: string]: any } = { ...dataOffChain.get(tw_id) };

      data.total_elem_spent_free = (data.total_elem_spent_free || 0) + price;

      dataOffChain.set(tw_id, data);
    }

    const dataActions = new Map();

    for (let i = 0; i < actions.length; ++i) {
      const { tw_id, price_onchain, type, data: dataNinja } = actions[i];

      const data: { [key: string]: any } = { ...dataActions.get(tw_id) };

      if (type === "upgrade") {
        data.total_elem_spent_onchain = (data.total_elem_spent_onchain || 0) + price_onchain;

        const offchaindata: { [key: string]: any } = { ...dataOffChain.get(tw_id) };

        offchaindata.total_elem_spent_free = (offchaindata.total_elem_spent_free || 0) + (LEVEL_NINJAS[dataNinja.class][dataNinja.level + 1].cost - price_onchain);
      };

      dataActions.set(tw_id, data);
    }

    const dataNinjas = new Map();

    for (let i = 0; i < ninjas.length; ++i) {
      const { ownerId, level } = ninjas[i];

      const data: { [key: string]: any } = { ...dataNinjas.get(ownerId) };

      data.total_ninja = (data.total_ninja || 0) + 1;

      data.total_ninja_level = (data.total_ninja_level || 0) + level;

      data.user_ninjas = [...(data.user_ninjas || []), { ...ninjas[i] }];

      dataNinjas.set(ownerId, data);
    };

    for (let i = 0; i < users.length; ++i) {
      const { tw_id, boosts } = users[i];

      const borrow = dataBorrow.get(tw_id);
      const convert = dataConvert.get(tw_id);
      const repay = dataRepay.get(tw_id);
      const claim = dataClaims.get(tw_id);
      const market = dataMarkets.get(tw_id);
      const offChain = dataOffChain.get(tw_id);
      const action = dataActions.get(tw_id);
      const ninja = dataNinjas.get(tw_id);
      const queue_convert = dataQueueConvert.get(tw_id);

      users[i].total_borrowed_xnj = borrow?.total_borrowed_xnj;
      users[i].total_collateral_inj = borrow?.total_collateral_inj;

      users[i].total_convert_to_xnj = convert?.total_convert_to_xnj;
      users[i].total_convert_to_elem = convert?.total_convert_to_elem;

      users[i].total_repay_xnj = repay?.total_repay_xnj;
      users[i].total_repay_inj = repay?.total_repay_inj;

      users[i].total_earned_and_claimed = claim?.total_earned_and_claimed;

      users[i].total_earned = claim?.total_earned;

      users[i].first_date_spent_chest = market?.first_date_spent_chest;
      users[i].total_elem_spent_onchain = (market?.total_elem_spent_onchain || 0) + (action?.total_elem_spent_onchain || 0);

      users[i].total_elem_spent_free = offChain?.total_elem_spent_free;

      users[i].total_elem_spent = users[i].total_elem_spent_onchain + offChain?.total_elem_spent_free;

      users[i].total_ninja = ninja?.total_ninja;

      users[i].total_ninja_level = ninja?.total_ninja_level;

      const now = Date.now();

      const { earned, total_earn_speed_hour } = (ninja?.user_ninjas as { farm_at: string, mana: string, balance: number; class: string; level: number }[])?.reduce(
        (previousValue, currentValue) => {

          let earned = 0;
          let total_earn_speed_hour = 0;

          const farm_at = Date.parse(currentValue.farm_at);
          const mana = Date.parse(currentValue.mana);
          const balance = currentValue.balance;
          const _class = currentValue.class;
          const level = currentValue.level;
          const boost = getBoostData(boosts) || 0;

          if (farm_at) {
            if (now >= mana) {
              if ((LEVEL_NINJAS as { [key: string]: any })[_class][level]) {
                const balance = ((mana - farm_at) / (60 * 60 * 1000)) * LEVEL_NINJAS[_class][level].farm_speed_hour;
                earned += balance + (balance * boost) / 100;
              }
            } else {
              if (LEVEL_NINJAS[_class][level]) {
                const balance = ((now - farm_at) / (60 * 60 * 1000)) * LEVEL_NINJAS[_class][level].farm_speed_hour;
                earned += balance + (balance * boost) / 100;
              }
              total_earn_speed_hour += LEVEL_NINJAS[_class][level].farm_speed_hour + (LEVEL_NINJAS[_class][level].farm_speed_hour * boost) / 100;
            }
          }

          earned += balance || 0;

          return { earned: (previousValue.earned += earned), total_earn_speed_hour: (previousValue.total_earn_speed_hour += total_earn_speed_hour) };
        },
        { earned: 0, total_earn_speed_hour: 0 }
      ) || { earned: 0, total_earn_speed_hour: 0 };

      users[i].earned = earned;

      users[i].total_earn_speed_hour = total_earn_speed_hour;

      users[i].akatsuki = queue_convert?.akatsuki;
    }

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

    const responseResult = { users, INJ_price: result.data.price };
 /*    cache.set('main', responseResult); */

    res.status(200).json(responseResult);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
};

export const config = {
  api: {
    responseLimit: false,
  },
}

export default handler;
