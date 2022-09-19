/**
 * 10進数の整数を2進数の文字列に変換
 * @param num
 * @returns
 */
export const decToBin = (num: number): string => {
    if (num >= 1) {
        return decToBin(Math.floor(num / 2)) + (num % 2);
    }
    return '';
};
