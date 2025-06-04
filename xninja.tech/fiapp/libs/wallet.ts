import { PRIVATE_KEY } from './config';
import { Web3Account } from 'web3-eth-accounts';
import Web3Utils from 'web3-utils';
import { web3 } from './web3';
import { bech32 } from 'bech32';
import { getInjectiveAddress, getEthereumAddress } from '@injectivelabs/sdk-ts';
import { PrivateKey } from '@injectivelabs/sdk-ts';

export const generateWallet = (): Web3Account => {
    try {
        const account = web3.eth.accounts.create();
        console.log(account);
        console.log('Injective address from Ethereum address => ', getInjectiveAddress(account.address));
        console.log('Ethereum address from Injective address => ', getEthereumAddress(getInjectiveAddress(account.address)));
        const privateKeyFromHex = PrivateKey.fromHex(account.privateKey);
        const _address = privateKeyFromHex.toAddress();
        console.log({ injectiveAddress: _address.toBech32(), ethereumAddress: _address.toHex() });
        return account;
    } catch (e: any) {
        throw new Error(e.message);
    }
};

export const generateWalletFromPrivateKey = (privateKey: string | undefined = PRIVATE_KEY): Web3Account => {
    if (!privateKey) {
        throw new Error('You need to set PRIVATE_KEY in your .env');
    }

    try {
        return web3.eth.accounts.privateKeyToAccount(privateKey);
    } catch (e: any) {
        throw new Error(e.message);
    }
};

export const deriveAddressFromPublicKey = (publicKey: string): string => {
    try {
        return `0x${Web3Utils.keccak256(publicKey).slice(24 + 2)}`;
    } catch (e: any) {
        throw new Error(e.message);
    }
};

export const getAddressFromInjectiveAddress = (address: string): string => {
    if (address.startsWith('0x')) {
        return address;
    }

    return `0x${Buffer.from(bech32.fromWords(bech32.decode(address).words)).toString('hex')}`;
};

export const validateAddress = (address: string): boolean => {
    try {
        return !!Web3Utils.isAddress(address);
    } catch (e: any) {
        throw new Error(`Your address ${address} is not valid`);
    }
};
