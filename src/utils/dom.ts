/**
 * 要素を1つだけ取得する
 * @param selector 
 * @param target 
 * @returns 
 */
export const elem = (
    selector: string,
    target: Element | null = null
): HTMLElement | null => {
    return (target ?? document).querySelector(selector);
}

/**
 * 要素を複数取得する
 * @param selector 
 * @param target 
 * @returns 
 */
export const elems = (
    selector: string,
    target: Element | null = null
): HTMLElement[] | null => {
    const elements: NodeListOf<HTMLElement> | null = (target ?? document).querySelectorAll(selector);
    if (elements) {
        return Array.from(elements)
    }
    return null;
}
