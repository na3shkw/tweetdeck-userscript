export class Clock {
    private clockSize = 200;
    private color = '#355070';
    private bigHandRatio = 0.8;
    private shortHandRatio = 0.6;

    private container: HTMLElement | null = null;
    private bigHand: HTMLElement | null = null;
    private shortHand: HTMLElement | null = null;
    private evtOnMoveStart: MouseEvent | null = null;
    private dragMoveTiemoutId: NodeJS.Timeout | null = null;
    private translate = { x: 0, y: 0 };
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
                border-radius: ${this.clockSize / 2}px;
                position: fixed;
                top: 30px;
                right: 30px;
                z-index: 200;
                opacity: 0.8;
                transition: opacity 0.2s ease 0s;
            }
            .clock:hover {
                opacity: 0.1;
                cursor: move;
            }
            .clock.drag {
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
            case 'mouseleave':
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

    startMove(evt: MouseEvent) {
        if (!this.evtOnMoveStart && this.container) {
            this.evtOnMoveStart = evt;
            this.container.classList.add('drag');
            this.container.addEventListener('mousemove', this, false);
            this.container.addEventListener('mouseup', this, false);
            this.container.addEventListener('mouseleave', this, false);
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
            const translateX = this.translate.x + this.moveDelta.x;
            const translateY = this.translate.y + this.moveDelta.y;
            this.container.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
        }, 10);
    }

    endMove() {
        if (!this.container) {
            return;
        }
        this.container.classList.remove('drag');
        this.container.removeEventListener('mousemove', this, false);
        this.translate.x += this.moveDelta.x;
        this.translate.y += this.moveDelta.y;
        this.moveDelta.x = 0;
        this.moveDelta.y = 0;
        this.evtOnMoveStart = null;
    }
}
