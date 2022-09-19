import { decToBin } from '../utils/math';

export class MouseActionsEvent {
    customEvent: CustomEvent;

    constructor() {
        this.customEvent = new CustomEvent('mouseActions', {
            detail: {
                buttons: {
                    left: false, // 1
                    right: false, // 2
                    center: false, // 4
                    backward: false, // 8
                    forward: false, // 16
                },
                x: 0,
                y: 0,
                deltaY: 0,
                shiftKey: false,
            },
            bubbles: true,
        });
        document.addEventListener('mousedown', (evt) => {
            this.updateMouseButtonsState(evt);
            this.dispatchEvent(evt);
        });
        document.addEventListener('mouseup', (evt) => {
            this.updateMouseButtonsState(evt);
            this.dispatchEvent(evt);
        });
        document.addEventListener('wheel', (evt) => {
            this.dispatchEvent(evt);
        });
    }
    updateMouseButtonsState(evt: MouseEvent) {
        const buttonOrder = ['left', 'right', 'center', 'backward', 'forward'];
        this.customEvent.detail.buttons = Object.fromEntries(
            decToBin(evt.buttons)
                .padStart(5, '0')
                .split('')
                .reverse()
                .map((state: string, i: number) => {
                    return [buttonOrder[i], state === '1'];
                })
        );
    }
    dispatchEvent(evt: MouseEvent) {
        this.customEvent.detail.x = evt.x;
        this.customEvent.detail.y = evt.y;
        this.customEvent.detail.deltaY = evt.deltaY ?? 0;
        this.customEvent.detail.shiftKey = evt.shiftKey ?? false;
        if (evt.target) {
            evt.target.dispatchEvent(this.customEvent);
        }
    }
}
