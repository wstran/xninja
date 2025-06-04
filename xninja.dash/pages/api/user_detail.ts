import { manager } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const address = (session as any).address;

    if (!address) {
        res.status(400).json({ message: "Invalid session data" });
        return;
    }

    const dbInstance = manager.getDatabase("dashDB");
    const db = await dbInstance.connect();
    const user = await db.collection("config-user").findOne({ user_address: address });

    if (!user || user.role === "subcriber") {
        res.status(403).json({ message: "Forbidden" });
        return
    };

    if (req.method === "GET") {
        const gdbInstance = manager.getDatabase("gameDB");
        const gdb = await gdbInstance.connect();
        const guserCollection = gdb.collection("users");
        const gninjaCollection = gdb.collection("ninjas");
        const userBorrowCollection = gdb.collection("user_borrows");
        const userRepayCollection = gdb.collection("user_repays");
        const userConvertCollection = gdb.collection("user_converts");
        const queueConvertCollection = gdb.collection("queue_converts");
        const userClaimCollection = gdb.collection("user_claims");

        const { detailId } = req.query as { detailId: string };

        const _id = new ObjectId(detailId);

        const user = await guserCollection.findOne({ _id }, { projection: { tw_id: 1, username: 1, name: 1, wallet: 1, boosts: 1, profile_image_url: 1, 'addresses.injectiveAddress': 1, created_at: 1 } });

        if (typeof user?.tw_id !== 'string') {
            res.status(404).json({ message: "Invalid user" });
            return;
        };

        const [
          user_ninjas,
          user_borrows,
          user_repays,
          user_xnj_converts,
          user_elem_converts,
          queue_converts,
          user_claim_converts,
        ] = await Promise.all([
          gninjaCollection
            .find({ ownerId: user.tw_id })
            .project({ _id: 0 })
            .sort({ level: -1 })
            .toArray(),
          userBorrowCollection
            .find({ tw_id: user.tw_id, status: "success" })
            .project({ _id: 0, amount: 1, loanAmount: 1, created_at: 1 })
            .sort({ created_at: -1 })
            .toArray(),
          userRepayCollection
            .find(
              { tw_id: user.tw_id, status: "success" },
              { projection: { amount: 1, repayAmount: 1, created_at: 1 } }
            )
            .sort({ created_at: -1 })
            .toArray(),
          userConvertCollection
            .find({ tw_id: user.tw_id, status: "success", convertAction: "convert_xnj_to_elem" })
            .project({ _id: 0, amount: 1, created_at: 1 })
            .toArray(),
          queueConvertCollection
            .find({ tw_id: user.tw_id, status: "success" })
            .sort({ created_at: 1 })
            .project({ _id: 1, created_at: 1, amount: 1, akatsuki: 1 })
            .toArray(),
          queueConvertCollection
            .find({ tw_id: user.tw_id, status: "pending" })
            .sort({ created_at: 1 })
            .project({ _id: 1, created_at: 1, amount: 1, akatsuki: 1 })
            .toArray(),
          userClaimCollection
            .find({ tw_id: user.tw_id, type: 'convert', status: "success" })
            .sort({ created_at: 1 })
            .project({ _id: 1, created_at: 1, amount: 1 })
            .toArray(),
        ]);

        res.status(200).json({ user, user_ninjas, user_borrows, user_repays, user_xnj_converts, user_elem_converts, queue_converts, user_claim_converts });
    } else {
        res.status(405).json({ message: "Method not allowed" });
    };
};

export const config = {
    api: {
        responseLimit: false,
    },
}

export default handler;
