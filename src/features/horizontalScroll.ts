import { elem, elems } from '../utils/dom';

export class HorizontalScroll {
    private enabled = false;

    constructor() {
        const columnsContainer = elem('#container');
        if (!columnsContainer) {
            return;
        }
        // forward + スクロール / カラムヘッダでのスクロール
        const eventHandler = ((evt: CustomEvent) => {
            const e = evt.detail;
            if (e.buttons.forward || (e.y < 50 && e.x > 60)) {
                this.switchScrollMode(true);
                const nextLeft = columnsContainer.scrollLeft + e.deltaY;
                columnsContainer.scrollLeft = nextLeft < 0 ? 0 : nextLeft;
            }
            if (this.enabled && !e.buttons.forward && !e.shiftKey) {
                this.switchScrollMode(false);
            }
        }) as EventListener;
        columnsContainer.addEventListener('mouseActions', eventHandler);
        // shift + スクロール
        window.addEventListener('keydown', (evt) => {
            if (evt.key == 'Shift') {
                this.switchScrollMode(true);
            }
        });
        window.addEventListener('keyup', (evt) => {
            if (evt.key == 'Shift') {
                this.switchScrollMode(false);
            }
        });
    }
    switchScrollMode(flag: boolean) {
        if (this.enabled === flag) {
            return false;
        }
        this.enabled = flag;
        // スクロール終端以降、カラムが上下スクロールされるのを防ぐ
        // shift + スクロールでの横スクロールを有効にする
        const elements = elems('section.js-column');
        if (!elements) {
            return;
        }
        for (let column of elements) {
            column.classList[flag ? 'add' : 'remove']('no-pointer-events');
        }
    }
}
