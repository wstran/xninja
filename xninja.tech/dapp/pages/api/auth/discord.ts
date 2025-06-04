import dotenv from 'dotenv';
import Database from '@/libs/database';
import middleWare, { Handler } from '@/libs/middleWare';
import axios from 'axios';

dotenv.config();

const handler = async ({ req, res, user }: Handler) => {
    const { code } = req.query;

    if (typeof code !== 'string') {
        res.status(500).end();
        return;
    };

    try {
        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const accessToken = tokenResponse.data.access_token;

        const guildResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const guilds = guildResponse.data;

        const isMember = guilds.some((guild: { id: string }) => guild.id === process.env.DISCORD_GUILD_ID);

        isMember && await userCollection.updateOne({ tw_id: user.tw_id }, { $set: { [`quests.starter_pack.join_discord`]: true } });

        res.redirect('/quest');
    } catch (error) {
        console.error('Discord:', error);
        res.status(500).send('Error');
    }
};

export default middleWare(handler);
