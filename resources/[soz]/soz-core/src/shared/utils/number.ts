export const groupDigits = (value: string | number) => {
    let left = '';
    let num = '';
    let right = '';
    if (typeof value == 'number') {
        value = value.toString();
    }
    [left, num, right] = value.match(/^([^0-9]*)([0-9]*)(.*)$/);
    num = num
        .split('')
        .reverse()
        .join('')
        .replace(/(\d{3})/g, '$1 ')
        .trim()
        .split('')
        .reverse()
        .join('');
    return left + num + right;
};

export const randomIntFromInterval = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};
