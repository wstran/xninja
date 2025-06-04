import { NextApiRequest, NextApiResponse } from 'next';
import Database from '@/libs/database';
import { JWT, getToken } from 'next-auth/jwt';

export interface Handler {
    req: NextApiRequest;
    res: NextApiResponse;
    user: JWT;
    clientIp: string;
}

const getClientIp = (req: NextApiRequest) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',').shift() : req.socket.remoteAddress;
    return ip as string;
};

export default function middleWare(handler: ({ req, res, user, clientIp }: Handler) => void | Promise<any>) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const clientIp = getClientIp(req);

        const user = await getToken({ req }) as JWT;

        if (!user || !user.tw_id) {
            res.status(403).end();
            return;
        }

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');

        const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { referral_code: 1 } });

        if (!dbUser) {
            res.status(403).end();
            return;
        }

        await handler({ req, res, user, clientIp });
    };
}
