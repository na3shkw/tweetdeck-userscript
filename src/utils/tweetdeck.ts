import { elem } from './dom';
import { getValue } from './tampermonkey';

/**
 * 要素の属するカラムを取得する
 * @param element
 * @returns
 */
export const getColumn = (element: Element) => {
    const closestElem = element.closest('.js-column') as HTMLElement;
    if (closestElem) {
        return returnColumn(closestElem);
    }
    return null;
};

/**
 * pidによって要素の属するカラムを取得する
 * @param pid
 * @returns
 */
export const getColumnByPid = (pid: string | number) => {
    const element = elem(`.js-column[data-column\$="${pid}"]`);
    if (element) {
        return returnColumn(element);
    }
    return null;
};

/**
 * カラムの要素を元にカラムに関するデータを返す
 * @param columnElement
 * @returns
 */
export const returnColumn = (columnElement: HTMLElement): Column | null => {
    if (columnElement === null) {
        return null;
    }
    const id = columnElement.getAttribute('data-column') ?? '';
    const pid = id.split('s')[1];
    const heading = elem('.column-heading', columnElement);
    const headingText = heading === null ? '' : heading.textContent;
    return {
        elem: columnElement,
        id,
        pid,
        headingText,
    };
};

/**
 * カラムに対して設定されている値を取得
 * @param prefix 設定値のプレフィックス、prefix_${カラムのpid}で設定値を読み出す
 * @returns
 */
export const getColumnSetting = (prefix: string) => {
    const settings: {
        [name: string]: string;
    } = {};
    GM_listValues()
        .filter((v) => v.indexOf(prefix) !== -1)
        .forEach((v) => {
            const pid = v.replace(`${prefix}_`, '');
            const column = elem(`[data-column\$="${pid}"]`);
            if (column) {
                settings[pid] = getValue(v);
            } else {
                GM_deleteValue(v);
            }
        });
    return settings;
};

/**
 * カラムの設定項目を追加
 * @param mutations
 * @param html
 * @param headingText
 * @param columnAddCallback
 * @returns
 */
export const addColumnOptionItem = (
    mutations: MutationRecord[],
    html: string,
    headingText: string | null = null,
    columnAddCallback: ((column: Column | null) => void) | null = null
) => {
    const columnOptionRecords = mutations.filter((mutation) => {
        if (headingText) {
            const column = getColumn(mutation.target as Element);
            if (column && column.headingText !== headingText) {
                return false;
            }
        }
        const target = mutation.target as Element;
        const isColumnOptions = target.classList.contains('js-column-options');
        const isOpen = mutation.addedNodes.length > 0;
        return isColumnOptions && isOpen;
    });
    if (columnOptionRecords.length === 0) {
        return false;
    }
    for (const record of columnOptionRecords) {
        const accordion = elem('.accordion', record.target as Element);
        const column = getColumn(record.target as Element);
        if (accordion === null) {
            return false;
        }
        accordion.insertAdjacentHTML('beforeend', html);
        if (columnAddCallback) {
            columnAddCallback(column);
        }
    }
};

/**
 * カラムへの新しいツイートの表示を監視する
 * @param mutations
 * @param headingText
 * @param callback
 */
export const monitorStreamItemAddition = (
    mutations: MutationRecord[],
    headingText: string,
    callback: (node: Element) => void
) => {
    mutations
        .filter((mutation) => {
            if (mutation.addedNodes.length === 0) {
                return false;
            }
            if (headingText) {
                const column = getColumn(mutation.target as Element);
                if (column?.headingText !== headingText) {
                    return false;
                }
            }
            return true;
        })
        .forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                const element = node as Element;
                if (
                    element.nodeType === 1 &&
                    element.classList.contains('stream-item')
                ) {
                    callback(element);
                }
            });
        });
};
