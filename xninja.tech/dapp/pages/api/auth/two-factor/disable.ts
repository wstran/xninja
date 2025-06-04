import { ErrorCode } from '@/libs/ErrorCode';
import { symmetricDecrypt } from '@/libs/crypto';
import Database from '@/libs/database';
import { authenticator } from 'otplib';
import middleWare, { Handler } from '@/libs/middleWare';

const handler = async ({ req, res, user }: Handler) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    };

    const { totpCode } = req.body;

    if (!totpCode) {
        res.status(400).json({ error: ErrorCode.SecondFactorRequired });
        return;
    };

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');
    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { two_factor_enabled: 1, two_factor_secret: 1 } });

    if (!dbUser) {
        res.status(403).end();
        return;
    };

    if (dbUser.two_factor_enabled === true) {
        if (!dbUser.two_factor_secret) {
            console.error(`Two factor is enabled for user ${user.name} but they have no secret`);
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

    await userCollection.updateOne({ tw_id: user.tw_id }, { $unset: { two_factor_enabled: true, two_factor_secret: true } });

    res.status(200).end();
};

export default middleWare(handler);
