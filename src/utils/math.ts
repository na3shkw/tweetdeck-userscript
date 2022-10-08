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

/**
 * 数値を範囲内に丸める
 * @param num
 * @param min 最小値
 * @param max 最大値
 * @returns
 */
export const clamp = (num: number, min: number, max: number) => {
    return Math.max(min, Math.min(num, max));
};
