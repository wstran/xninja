import Database from '@/libs/database';
import { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        const dbInstance = Database.getInstance();
        const db = await dbInstance.getDb();
        const userCollection = db.collection('users');
        const userBorrowCollection = db.collection('user_borrows');
        const userRepayCollection = db.collection('user_repays');
        const userClaimCollection = db.collection('user_claims');
        const offChainLogCollection = db.collection('offchain_logs');

        const users = await userCollection.find().project({ _id: 0, 'addresses.injectiveAddress': 1, 'boosts.count': 1, tw_id: 1, username: 1, name: 1, profile_image_url: 1, created_at: 1, last_login: 1, invite_code: 1, referral_code: 1, wallet: 1 }).toArray();

        // Borrow
        const borrows = await userBorrowCollection.find({ status: 'success' }).project({ _id: 0, tw_id: 1, amount: 1, loanAmount: 1, created_at: 1 }).sort({ created_at: -1 }).toArray();

        const dataBorrow = new Map();

        for (let i = 0; i < borrows.length; ++i) {
            const { tw_id, amount, loanAmount } = borrows[i];

            const data: { [key: string]: any } = { ...dataBorrow.get(tw_id) };

            data.total_borrowed_xnj = Number(ethers.formatEther(loanAmount));
            data.total_collateral_inj = Number(ethers.formatEther(amount));

            dataBorrow.set(tw_id, data);
        };

        // Repay
        const repays = await userRepayCollection.find({ status: 'success' }).project({ _id: 0, tw_id: 1, amount: 1, repayAmount: 1, created_at: 1 }).sort({ created_at: -1 }).toArray();

        const dataRepay = new Map();

        for (let i = 0; i < repays.length; ++i) {
            const { tw_id, amount, repayAmount } = repays[i];

            const data: { [key: string]: any } = { ...dataRepay.get(tw_id) };

            data.total_repay_xnj = Number(ethers.formatEther(amount));
            data.total_repay_inj = Number(ethers.formatEther(repayAmount));

            dataRepay.set(tw_id, data);
        };

        // Claim
        const claims = await userClaimCollection.find({ status: 'success' }).project({ _id: 0, tw_id: 1, amount: 1, type: 1, created_at: 1 }).sort({ created_at: -1 }).toArray();

        const dataClaims = new Map();

        for (let i = 0; i < claims.length; ++i) {
            const { tw_id, amount, type } = claims[i];

            const data: { [key: string]: any } = { ...dataClaims.get(tw_id) };

            if (type === 'earn') {
                data.total_earned = Number(ethers.formatEther(amount));
            };

            dataClaims.set(tw_id, data);
        };

        // Off Chain
        const offChainActions = await offChainLogCollection.find().project({ _id: 0, tw_id: 1, price: 1, created_at: 1 }).sort({ created_at: -1 }).limit(10).toArray();

        const dataOffChain = new Map();

        for (let i = 0; i < offChainActions.length; ++i) {
            const { tw_id, price, created_at } = offChainActions[i];

            const data: { [key: string]: any } = { ...dataOffChain.get(tw_id) };

            if (!data.firstDateSpent) {
                data.first_date_spent = created_at;
            };

            data.total_spent_elem_offchain = (data.total_spent || 0) + price;

            dataOffChain.set(tw_id, data);
        };

        for (let i = 0; i < users.length; ++i) {
            const { tw_id } = users[i];

            const borrow = dataBorrow.get(tw_id);
            const repay = dataRepay.get(tw_id);
            const claim = dataClaims.get(tw_id);
            const offChain = dataOffChain.get(tw_id);

            users[i].total_borrowed_xnj = borrow?.total_borrowed_xnj;
            users[i].total_collateral_inj = borrow?.total_collateral_inj;

            users[i].total_repay_xnj = repay?.total_repay_xnj;
            users[i].total_repay_inj = repay?.total_repay_inj;

            users[i].total_earned = claim?.total_earned;

            users[i].first_date_spent = offChain?.first_date_spent;
            users[i].total_spent_elem_offchain = offChain?.total_spent_elem_offchain;
        };

        const response = await fetch(
            "https://api.chainbase.online/v1/token/price?chain_id=1&contract_address=0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30",
            {
                method: "GET",
                headers: {
                    accept: "application/json",
                    "x-api-key": "2bsq57OFyKk5BgEDIXusDPzDtoB",
                },
            }
        );

        const result = (await response.json()) as {
            code: number;
            data: { price: number; symbol: string; decimals: 18; updated_at: string };
        };

        res.status(200).json({ users, INJ_price: result.data.price });
    } catch (error) {
        console.log(error);
        res.status(500).end();
    };
};

export const config = {
    api: {
      responseLimit: '1024mb',
    },
  }

export default handler;