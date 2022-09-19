/**
 * GM_getValueのラッパー関数
 * @param key
 * @param deformatter
 * @returns
 */
export const getValue = (
    key: string,
    deformatter: ((value: string) => void) | null = null
) => {
    const value: any = GM_getValue(key);
    return deformatter ? deformatter(value) : value;
};

/**
 * GM_setValueのラッパー関数
 * @param {string} key
 * @param {any} value
 * @param {formatCallback} formatter
 * @returns
 */
export const saveValue = (
    key: string,
    value: any,
    formatter?: (value: any) => any
) => {
    value = formatter ? formatter(value) : value;
    GM_setValue(key, value);
    return value;
};
