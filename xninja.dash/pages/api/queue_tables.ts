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
    return;
  }

  if (req.method === "GET") {
    const gdbInstance = manager.getDatabase("gameDB");
    const gdb = await gdbInstance.connect();
    const queueConvertCollection = gdb.collection("queue_converts");
    const guserCollection = gdb.collection("users");

    let queue_converts = await queueConvertCollection.find().sort({ created_at: 1 }).toArray();

    queue_converts = await Promise.all(
      queue_converts.map(async (convert) => {
        const user = await guserCollection.findOne(
          { tw_id: convert.tw_id },
          {
            projection: { _id: 1 },
          }
        );

        if (user) {
          return { ...convert, user_id: user._id };
        }

        return convert;
      })
    );

    res.status(200).json({ queue_converts });
  } else if (req.method === "POST") {
    try {
      const { _id } = req.body as { _id: string };

      if (!_id) {
        res.status(400).json({ message: "Missing or invalid '_id' in request body" });
        return;
      }

      const id = new ObjectId(_id);

      const gdbInstance = manager.getDatabase("gameDB");
      const gdb = await gdbInstance.connect();
      const queueConvertCollection = gdb.collection("queue_converts");

      const updateResult = await queueConvertCollection.updateOne(
        { _id: id },
        { $set: { akatsuki: false } }
      );

      if (updateResult.modifiedCount === 0) {
        res.status(404).json({ message: "No record found with the specified 'id'" });
        return;
      }

      res.status(200).json({ message: "Successfully updated 'akatsuki' to false" });
    } catch (error) {
      console.error("Error updating 'akatsuki' field:", error);
      res.status(500).json({ message: "Internal server error" });
    }
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
