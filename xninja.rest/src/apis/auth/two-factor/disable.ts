import { Router } from 'express';
import { middleWare} from "../../../config";
import type { RequestWithUser } from "../../../config";
import Database from '../../../libs/database';
import { symmetricDecrypt } from '../../../libs/crypto';
import { ErrorCode } from '../../..//libs/ErrorCode';
import { authenticator } from 'otplib';

export default function (router: Router) {
    router.post("/auth/two-factor/disable", middleWare, async (req: RequestWithUser, res) => {
        if (!req.payload) {
            res.sendStatus(403);
            return;
        };

        const { totpCode } = req.body;

        if (!totpCode) {
            res.status(400).json({ error: ErrorCode.SecondFactorRequired });
            return;
        };

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');
        const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { name: 1, two_factor_enabled: 1, two_factor_secret: 1 } });

        if (!dbUser) {
            res.status(403).end();
            return;
        };

        if (dbUser.two_factor_enabled === true) {
            if (!dbUser.two_factor_secret) {
                console.error(`Two factor is enabled for user ${dbUser.name} but they have no secret`);
                throw new Error(ErrorCode.InternalServerError);
            };

            if (!process.env.ENCRYPTION_KEY) {
                console.error(`"Missing encryption key; cannot proceed with two factor login."`);
                throw new Error(ErrorCode.InternalServerError);
            };

            const secret = symmetricDecrypt(dbUser.two_factor_secret, process.env.ENCRYPTION_KEY);

            if (secret.length !== 32) {
                console.error(`Two factor secret decryption failed. Expected key with length 32 but got ${secret.length}`);
                throw new Error(ErrorCode.InternalServerError);
            };

            const isValidToken = authenticator.check(totpCode, secret);

            if (!isValidToken) {
                res.status(400).json({ error: ErrorCode.IncorrectTwoFactorCode });
                return;
            };
        } else {
            res.status(200).end();
            return;
        };

        await userCollection.updateOne({ tw_id: req.payload.tw_id }, { $unset: { two_factor_enabled: true, two_factor_secret: true } });

        res.status(200).end();
    });
};