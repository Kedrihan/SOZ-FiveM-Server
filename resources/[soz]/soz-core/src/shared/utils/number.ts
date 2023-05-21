export const groupDigits = (value: string | number) => {
    const numberString = String(value);
    let result = '';
    let count = 0;

    for (let i = numberString.length - 1; i >= 0; i--) {
        result = numberString[i] + result;
        count++;

        if (count === 3 && i !== 0) {
            result = ' ' + result;
            count = 0;
        }
    }

    return result;
};

export const randomIntFromInterval = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};
