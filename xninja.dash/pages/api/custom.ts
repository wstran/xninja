import { manager } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from "mongodb";

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

    if (req.method === "POST") {
        const gdbInstance = manager.getDatabase("gameDB");
        const gdb = await gdbInstance.connect();

        const { type, elem_amount, _id } = req.body;

        if (type === 'ADD_ELEM_OFFCHAIN') {
            if (elem_amount > 0) {
                await gdb.collection('users').updateOne({ _id: new ObjectId(_id) }, { $inc: { 'wallet.ELEM': elem_amount } });

                await db.collection('add-elem-logs').insertOne({ user_address: user.user_address, type, to_user: _id, elem_amount, created_at: new Date() });

                res.status(200).json({ message: "Successfuly!" });
            } else {
                res.status(404).json({ message: "Bad request: min 1" });
            };
        } else if (type === 'REMOVE_ELEM_OFFCHAIN') {
            if (elem_amount > 0) {
                await gdb.collection('users').updateOne({ _id: new ObjectId(_id) }, { $inc: { 'wallet.ELEM': -elem_amount } });

                await db.collection('add-elem-logs').insertOne({ user_address: user.user_address, type, to_user: _id, elem_amount, created_at: new Date() });

                res.status(200).json({ message: "Successfuly!" });
            } else {
                res.status(404).json({ message: "Bad request: min 1" });
            };
        };
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
