export function formatPriceNumber(value: number): string {
    if (isNaN(value)) return 'N/A';

    if (Math.abs(value) < 1e-10) {
        return '0.00';
    }

    let stringValue = value.toFixed(10);

    stringValue = stringValue.replace(/\.?0+$/, '');

    const parts = stringValue.split('.');
    const integerPart = Number(parts[0]).toLocaleString();
    const decimalPart = parts[1] || '';
    return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
};