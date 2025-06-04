import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { symmetricEncrypt } from '@/libs/crypto';
import { ErrorCode } from '@/libs/ErrorCode';
import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';

const handler = async ({ req, res, user }: Handler) => {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method not allowed' });
        return;
    };

    const dbInstance = Database.getInstance();
    const db = await dbInstance.getDb();
    const userCollection = db.collection('users');
    const dbUser = await userCollection.findOne({ tw_id: user.tw_id }, { projection: { two_factor_enabled: 1 } });

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
        { tw_id: user.tw_id },
        {
            $set: {
                two_factor_enabled: false,
                two_factor_secret: symmetricEncrypt(secret, process.env.ENCRYPTION_KEY),
            },
        },
    );

    const name = user.name as string;
    const keyUri = authenticator.keyuri(name, 'xNinja.Tech', secret);

    const dataUri = await qrcode.toDataURL(keyUri);

    return res.json({ secret, keyUri, dataUri });
};

export default middleWare(handler);
