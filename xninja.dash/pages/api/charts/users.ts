import { manager } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";

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
    const guserCollection = gdb.collection("users");

    if (req.method === "GET") {
        const total_user_amount = await guserCollection.countDocuments();

        let [total_user, revisit_user, new_user, labels]: any = [[], [], [], []];

        for (let i = 13; i >= 0; --i) {
            const date = new Date();
            const firstDate = new Date(new Date(date.toISOString()).setDate((date.getDate() - (i * sort_type) - sort_type))).setHours(0, 0, 0, 0);
            const lastDate = new Date(new Date(date.toISOString()).setDate(date.getDate() - (i * sort_type))).setHours(23, 59, 0, 0);

            total_user.push(guserCollection.countDocuments({ created_at: { $lte: new Date(lastDate) } }));

            revisit_user.push(guserCollection.countDocuments({ created_at: { $lt: new Date(firstDate) }, last_login: { $gte: new Date(firstDate), $lte: new Date(lastDate) } }));

            new_user.push(guserCollection.countDocuments({ created_at: { $gte: new Date(firstDate), $lte: new Date(lastDate) } }));

            labels.push(lastDate);
        };

        [total_user, revisit_user, new_user] = await Promise.all([Promise.all(total_user), Promise.all(revisit_user), Promise.all(new_user)]);

        res.status(200).json({ total_user, revisit_user, new_user, labels, total_user_amount });
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
