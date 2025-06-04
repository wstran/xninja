import Decimal from 'decimal.js';

export function formatPriceNumber(value: number, decimals?: number): string {
    if (isNaN(value)) return 'N/A';

    if (Math.abs(value) < 1e-10) {
        return '0.00';
    }

    let stringValue = roundDown(value, 10);

    stringValue = stringValue.replace(/\.?0+$/, '');

    const parts = stringValue.split('.');
    const integerPart = Number(parts[0]).toLocaleString();
    const decimalPart = parts[1] || '';
    return decimalPart ? `${integerPart}.${decimalPart.slice(0, decimals || decimalPart.length)}` : integerPart;
};

export function roundDown(value: number | string, decimals: number, DOWN?: boolean) {
    let result = new Decimal(value).toFixed(decimals, Decimal.ROUND_DOWN);
    if (DOWN) {
        let adjustment = new Decimal(1).dividedBy(new Decimal(10).pow(decimals));
        result = new Decimal(result).minus(adjustment).toFixed(decimals, Decimal.ROUND_DOWN);
    };
    return result;
};

export function formatAddress(address: string) {
    return `${address.slice(0, 6)}…${address.slice(36, 42)}`;
};