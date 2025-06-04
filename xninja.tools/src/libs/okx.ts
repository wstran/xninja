import axios from "axios";
import CryptoJS from "crypto-js";

export async function getBalance(ccy: string) {
    const timestamp = new Date().toISOString();

    return await axios.get('https://www.okx.com/api/v5/account/balance', {
        headers: {
            'OK-ACCESS-KEY': process.env.OKX_API,
            'OK-ACCESS-SIGN': CryptoJS.HmacSHA256(timestamp + 'GET' + '/api/v5/account/balance?ccy=' + ccy, process.env.OKX_SECRET as string).toString(CryptoJS.enc.Base64),
            'OK-ACCESS-TIMESTAMP': timestamp,
            'OK-ACCESS-PASSPHRASE': process.env.OKX_PASSPHRASE,
        },
        params: { ccy },
    });
};

export async function placeOlder(instId: string, side: 'buy' | 'sell', ordType: 'limit' | 'market', sz: string) {
    const timestamp = new Date().toISOString();

    const body = {
        instId: instId,
        tdMode: "cash",
        clOrdId: "b15",
        side: side,
        ordType: ordType,
        sz: sz,
    };

    return await axios.post('https://www.okx.com/api/v5/trade/order', body, {
        headers: {
            'OK-ACCESS-KEY': process.env.OKX_API,
            'OK-ACCESS-SIGN': CryptoJS.HmacSHA256(timestamp + 'POST' + '/api/v5/trade/order' + JSON.stringify(body), process.env.OKX_SECRET as string).toString(CryptoJS.enc.Base64),
            'OK-ACCESS-TIMESTAMP': timestamp,
            'OK-ACCESS-PASSPHRASE': process.env.OKX_PASSPHRASE,
        }
    });
};