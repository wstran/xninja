import { manager } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { LRUCache } from "lru-cache";

const cache = new LRUCache({ max: 500, ttl: 1000 * 60 * 60 });

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
    };

    const sort_type = Number(req.query.sort_type);

    if (isNaN(sort_type) || typeof sort_type !== 'number') {
        res.status(404).json({ message: "Bad request" });
        return;
    };

    const gdbInstance = manager.getDatabase("gameDB");
    const gdb = await gdbInstance.connect();
    const guserClaimCollection = gdb.collection("user_claims");

    if (req.method === "GET") {
        const clientCache = cache.get('main:' + sort_type);
        if (clientCache) {
            return res.status(200).json(clientCache);
        };

        let total_claim_amount: any[] = await guserClaimCollection.find({ status: 'success', type: 'referral' }).toArray();

        let [total_amount, amount, labels]: any = [[], [], [], []];

        for (let i = 13; i >= 0; --i) {
            const date = new Date();
            const firstDate = new Date(new Date(date.toISOString()).setDate((date.getDate() - (i * sort_type) - sort_type))).setHours(0, 0, 0, 0);
            const lastDate = new Date(new Date(date.toISOString()).setDate(date.getDate() - (i * sort_type))).setHours(23, 59, 0, 0);

            total_amount.push(guserClaimCollection.find({ status: 'success', type: 'referral', created_at: { $lte: new Date(lastDate) } }).project({ amount: 1 }).toArray());

            amount.push(guserClaimCollection.find({ status: 'success', type: 'referral', created_at: { $gte: new Date(firstDate), $lte: new Date(lastDate) } }).project({ amount: 1 }).toArray());

            labels.push(lastDate);
        };

        [total_amount, amount] = await Promise.all([Promise.all(total_amount), Promise.all(amount)]);

        for (let i = 0; i < total_amount.length; ++i) {
            total_amount[i] = (total_amount[i] as any[]).reduce((prev, current) => prev + Number(ethers.formatEther(current.amount)), 0);
        };

        for (let i = 0; i < amount.length; ++i) {
            amount[i] = (amount[i] as any[]).reduce((prev, current) => prev + Number(ethers.formatEther(current.amount)), 0);
        };

        total_claim_amount = total_claim_amount.reduce((prev, current) => prev + Number(ethers.formatEther(current.amount)), 0);

        const responseResult = { total_amount, amount, labels, total_claim_amount };

        cache.set('main:' + sort_type, responseResult);

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
