import { elem } from '../utils/dom';
import { clamp } from '../utils/math';

export class Clock {
    private clockSize = 200;
    private color = '#355070';
    private bigHandRatio = 0.8;
    private shortHandRatio = 0.6;
    private draggingOverlayId = 'clock-dragging-overlay';
    private positionStoreKeyPrefix = 'clockPosition';

    private container: HTMLElement | null = null;
    private bigHand: HTMLElement | null = null;
    private shortHand: HTMLElement | null = null;
    private evtOnMoveStart: MouseEvent | null = null;
    private dragMoveTiemoutId: NodeJS.Timeout | null = null;
    private translate = { x: 0, y: 0 };
    private translateTmp = { x: 0, y: 0 }; // ドラッグ中の時計の位置
    private moveDelta = { x: 0, y: 0 };

    constructor() {
        const clockSizeHalf = this.clockSize / 2;
        const bigHandLength = clockSizeHalf * this.bigHandRatio;
        const shortHandLength = clockSizeHalf * this.shortHandRatio;
        GM_addStyle(`
            .clock {
                width: ${this.clockSize}px;
                height: ${this.clockSize}px;
                background-color: white;
                border: solid 3px ${this.color};
                border-radius: ${clockSizeHalf}px;
                position: fixed;
                top: 0;
                left: 0;
                z-index: 200;
                opacity: 0.8;
                transition: opacity 0.2s ease 0s;
            }
            .clock:hover {
                opacity: 0.1;
                cursor: move;
            }
            .clock-dragging-overlay {
                position: fixed;
                width: 100vw;
                height: 100vh;
                top: 0;
                left: 0;
                z-index: 150;
                cursor: move;
            }
            .clock-dial {
                display: block;
                width: 100%;
                height: 100%;
                list-style: none;
                margin: 0;
                padding: 0;
            }
            .hand {
                position: absolute;
                left: 50%;
                width: 2px;
                background: ${this.color};
                transform-origin: center bottom;
                -webkit-backface-visibility: hidden;
            }
            .big-hand {
                height: ${bigHandLength}px;
                top: ${clockSizeHalf - bigHandLength}px;
            }
            .short-hand {
                height: ${shortHandLength}px;
                top: ${clockSizeHalf - shortHandLength}px;
            }
        `);
        document.body.insertAdjacentHTML(
            'beforeend',
            `
            <div id="clock" class="clock">
                <ol id="clock-dial" class="clock-dial"></ol>
                <div id="big-hand" class="big-hand hand"></div>
                <div id="short-hand" class="short-hand hand"></div>
            </div>
        `
        );
        this.initDial();
        this.container = document.querySelector('#clock');
        this.bigHand = document.querySelector('#big-hand');
        this.shortHand = document.querySelector('#short-hand');
        // 針の更新
        this.updateHands();
        setInterval(() => this.updateHands(), 10000);
        // ドラッグで移動できるようにする
        if (this.container) {
            this.container.addEventListener('mousedown', this, false);
        }
        // 初期位置設定
        this.translate.x = GM_getValue(`${this.positionStoreKeyPrefix}X`) || 0;
        this.translate.y = GM_getValue(`${this.positionStoreKeyPrefix}Y`) || 0;
        this.setClockPosition(this.translate.x, this.translate.y);
    }

    handleEvent(evt: MouseEvent) {
        switch (evt.type) {
            case 'mousedown':
                this.startMove(evt);
                break;
            case 'mousemove':
                this.dragMove(evt);
                break;
            case 'mouseup':
                this.endMove();
                break;
        }
    }

    initDial() {
        const dial = document.querySelector('#clock-dial');
        if (!dial) {
            return;
        }
        const dialItemWidth = 1;
        const dialItemHeight = 6;
        const dialItemMargin = 5;
        for (let i = 0; i < 12; i++) {
            const dialItem = document.createElement('li');
            dialItem.style.position = 'absolute';
            dialItem.style.top = `${dialItemMargin}px`;
            dialItem.style.width = `${dialItemWidth}px`;
            dialItem.style.height = `${dialItemHeight}px`;
            dialItem.style.background = this.color;
            dialItem.style.left = `${this.clockSize / 2}px`;
            dialItem.style.transformOrigin = `${dialItemWidth / 2}px ${
                this.clockSize / 2 - dialItemMargin
            }px`;
            dialItem.style.transform = `rotate(${(i / 12) * 360}deg)`;
            dial.appendChild(dialItem);
        }
    }

    updateHands() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        const bigHandRotate = ((minutes * 60 + seconds) / 3600) * 360;
        const shortHandRotate = ((hours * 60 + minutes) / 720) * 360;

        if (this.bigHand && this.shortHand) {
            this.bigHand.style.transform = `translateX(-50%) rotate(${bigHandRotate}deg)`;
            this.shortHand.style.transform = `translateX(-50%) rotate(${shortHandRotate}deg)`;
        }
    }

    setClockPosition(x: number, y: number) {
        if (!this.container) {
            return;
        }
        const translateX = clamp(x, 0, window.innerWidth - this.clockSize);
        const translateY = clamp(y, 0, window.innerHeight - this.clockSize);
        this.container.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
        this.translateTmp.x = translateX;
        this.translateTmp.y = translateY;
    }

    startMove(evt: MouseEvent) {
        if (!this.evtOnMoveStart && this.container) {
            this.evtOnMoveStart = evt;
            document.addEventListener('mousemove', this, false);
            document.addEventListener('mouseup', this, false);
            // オーバーレイを追加
            const overlay = document.createElement('div');
            overlay.id = this.draggingOverlayId;
            overlay.className = 'clock-dragging-overlay';
            document.body.appendChild(overlay);
        }
    }

    dragMove(evt: MouseEvent) {
        if (this.dragMoveTiemoutId || !this.evtOnMoveStart) {
            return;
        }
        this.dragMoveTiemoutId = setTimeout(() => {
            if (!this.container || !this.evtOnMoveStart) {
                return;
            }
            this.dragMoveTiemoutId = null;
            this.moveDelta.x = evt.clientX - this.evtOnMoveStart?.clientX;
            this.moveDelta.y = evt.clientY - this.evtOnMoveStart?.clientY;
            this.setClockPosition(
                this.translate.x + this.moveDelta.x,
                this.translate.y + this.moveDelta.y
            );
        }, 10);
    }

    endMove() {
        if (!this.container) {
            return;
        }
        this.container.removeEventListener('mousemove', this, false);
        this.translate.x = this.translateTmp.x;
        this.translate.y = this.translateTmp.y;
        this.moveDelta.x = 0;
        this.moveDelta.y = 0;
        this.dragMoveTiemoutId = null;
        this.evtOnMoveStart = null;
        // 位置を保存
        GM_setValue(`${this.positionStoreKeyPrefix}X`, this.translate.x);
        GM_setValue(`${this.positionStoreKeyPrefix}Y`, this.translate.y);
        // オーバーレイを削除
        elem(`#${this.draggingOverlayId}`)?.remove();
    }
}
