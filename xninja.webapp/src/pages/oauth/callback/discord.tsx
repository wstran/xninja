import { useEffect } from 'react';
import axiosApi from '../../libs/axios';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { useMeQuery } from '../../../hooks/useMeQuery';

const Index = () => {
    const { data: user } = useMeQuery('tw_id');

    useEffect(() => {
        if (user) {

            document.body.style.display = 'none';
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const access_token = params.get('access_token');

            if (!access_token) {
                console.error('Authorization access_token not found');
                return;
            };

            const auth_type = localStorage.getItem('xninja-auth_type');

            let QUEST_AND_ACTION = 'starter_pack.join_discord';
            let DISCORD_GUILD_ID = user.appConfig.data.quests.starter_pack.tasks.join_discord.DISCORD_GUILD_ID;

            if (auth_type === 'join_injective_discord') {
                QUEST_AND_ACTION = 'injective_quest_social_task.join_injective_discord';
                DISCORD_GUILD_ID = user.appConfig.data.quests.injective_quest_social_task.tasks.join_injective_discord.DISCORD_GUILD_ID;
            };

            axiosApi.post(`${import.meta.env.VITE_API_URL}/api/auth/discord`, { DISCORD_GUILD_ID }).finally(() => {
                window.location.href = '/';
            });

            /*  axios.get(`https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`, {
                 headers: {
                     Authorization: `Bearer ${access_token}`
                 }
             }).then(() => {
                 axiosApi.post(`${import.meta.env.VITE_API_URL}/api/auth/discord`, { DISCORD_GUILD_ID }).finally(() => {
                     window.location.href = '/';
                 });
             }).catch(() => {
                 axiosApi.post(`${import.meta.env.VITE_API_URL}/api/auth/discord`, { DISCORD_GUILD_ID }).finally(() => {
                     window.location.href = '/';
                 });
             }); */
        };
    }, [user]);

    return <></>;
};

export default Index;
