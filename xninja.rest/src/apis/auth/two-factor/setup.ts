import { Router } from 'express';
import { middleWare } from "../../../config";
import type { RequestWithUser } from "../../../config";
import { symmetricEncrypt } from '../../../libs/crypto';
import { ErrorCode } from '../../..//libs/ErrorCode';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import Database from '../../../libs/database';

export default function (router: Router) {
    router.post("/auth/two-factor/setup", middleWare, async (req: RequestWithUser, res) => {
        if (!req.payload) {
            res.sendStatus(403);
            return;
        };

        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');
        const dbUser = await userCollection.findOne({ tw_id: req.payload.tw_id }, { projection: { name: 1, two_factor_enabled: 1 } });

        if (!dbUser) {
            res.status(403).end();
            return;
        };

        if (dbUser.two_factor_enabled === true) {
            res.status(400).json({ error: ErrorCode.TwoFactorAlreadyEnabled });
            return;
        };

        if (!process.env.ENCRYPTION_KEY) {
            console.error(`"Missing encryption key; cannot proceed with two factor login."`);
            throw new Error(ErrorCode.InternalServerError);
        };

        const secret = authenticator.generateSecret(20);

        await userCollection.updateOne(
            { tw_id: req.payload.tw_id },
            {
                $set: {
                    two_factor_enabled: false,
                    two_factor_secret: symmetricEncrypt(secret, process.env.ENCRYPTION_KEY),
                },
            },
        );

        const name = dbUser.name as string;
        const keyUri = authenticator.keyuri(name, 'xNinja.Tech', secret);

        const dataUri = await qrcode.toDataURL(keyUri);

        return res.json({ secret, keyUri, dataUri });
    });
};