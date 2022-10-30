// ==UserScript==
// @name         TweetDeck Custom
// @version      1.1.1
// @description  TweetDeckをカスタマイズするユーザースクリプト
// @author       na3shkw
// @match        https://tweetdeck.twitter.com/
// @icon         https://www.google.com/s2/favicons?domain=tweetdeck.twitter.com
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @updateURL    https://github.com/na3shkw/tweetdeck-userscript/raw/main/dist/index.user.js
// @downloadURL  https://github.com/na3shkw/tweetdeck-userscript/raw/main/dist/index.user.js
// ==/UserScript==
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackByMousebutton = void 0;
const dom_1 = require("../utils/dom");
class BackByMousebutton {
    constructor() {
        history.pushState(null, '', null);
        const eventHandler = ((evt) => {
            if (evt.detail.buttons.backward) {
                history.pushState(null, '', null);
                const elementMouseIsOver = document.elementFromPoint(evt.detail.x, evt.detail.y);
                const modalElems = (0, dom_1.elems)('.js-modal');
                let modalOpen = false;
                if (modalElems) {
                    modalOpen =
                        modalElems.filter((node) => node.style.display === 'block').length > 0;
                }
                const modalContainer = (0, dom_1.elem)('.js-modals-container');
                let userDetailDisplay = false;
                if (modalContainer) {
                    userDetailDisplay = modalContainer.innerText.length > 0;
                }
                if (modalOpen || userDetailDisplay) {
                    (0, dom_1.elem)('.mdl-dismiss')?.click();
                }
                else if (elementMouseIsOver) {
                    const backElem = (0, dom_1.elem)('.column-header > a', elementMouseIsOver.closest('.column-panel'));
                    if (backElem) {
                        backElem.click();
                    }
                }
            }
        });
        document.addEventListener('mouseActions', eventHandler);
    }
    initObserver(mutations) {
        const cardRecords = mutations.filter((mutation) => {
            const target = mutation.target;
            const containsIframe = (0, dom_1.elem)('.js-stream-item-content iframe', target) !== null;
            const isTweetDetailContainer = target.classList.contains('js-tweet-detail');
            return containsIframe && isTweetDetailContainer;
        });
        if (cardRecords.length > 0) {
            const tweetDetailContainer = cardRecords[0].target;
            const linkElements = (0, dom_1.elems)('.js-tweet-text a', tweetDetailContainer);
            let links = null;
            if (linkElements) {
                links = linkElements.filter((elem) => elem.getAttribute('rel') !== 'hashtag');
            }
            const iframe = (0, dom_1.elem)('.js-card-container iframe', tweetDetailContainer);
            if (links &&
                iframe?.parentElement &&
                !(0, dom_1.elem)('.iframeOverlay', iframe.parentElement)) {
                iframe.parentElement.style.position = 'relative';
                const iframeOverlay = document.createElement('div');
                const iframeOverlayStyle = {
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    cursor: 'pointer',
                };
                iframeOverlay.style.width = '100%';
                Object.entries(iframeOverlayStyle).forEach(([key, value]) => {
                    iframeOverlay.style.setProperty(key, String(value));
                });
                iframe.parentElement.insertBefore(iframeOverlay, iframe);
                iframeOverlay.addEventListener('click', function (evt) {
                    if (evt.button == 0 && links) {
                        if (links.length === 1) {
                            const href = links[0].getAttribute('href');
                            if (href) {
                                window.open(href);
                            }
                        }
                        else {
                            alert('リンクが2つ以上ある場合のカードクリック時の動作は未実装です');
                        }
                    }
                });
            }
        }
    }
}
exports.BackByMousebutton = BackByMousebutton;

},{"../utils/dom":10}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clock = void 0;
const dom_1 = require("../utils/dom");
const math_1 = require("../utils/math");
class Clock {
    constructor() {
        this.clockSize = 200;
        this.color = '#355070';
        this.bigHandRatio = 0.8;
        this.shortHandRatio = 0.6;
        this.draggingOverlayId = 'clock-dragging-overlay';
        this.positionStoreKeyPrefix = 'clockPosition';
        this.container = null;
        this.bigHand = null;
        this.shortHand = null;
        this.evtOnMoveStart = null;
        this.dragMoveTiemoutId = null;
        this.translate = { x: 0, y: 0 };
        this.translateTmp = { x: 0, y: 0 };
        this.moveDelta = { x: 0, y: 0 };
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
        document.body.insertAdjacentHTML('beforeend', `
            <div id="clock" class="clock">
                <ol id="clock-dial" class="clock-dial"></ol>
                <div id="big-hand" class="big-hand hand"></div>
                <div id="short-hand" class="short-hand hand"></div>
            </div>
        `);
        this.initDial();
        this.container = document.querySelector('#clock');
        this.bigHand = document.querySelector('#big-hand');
        this.shortHand = document.querySelector('#short-hand');
        this.updateHands();
        setInterval(() => this.updateHands(), 10000);
        if (this.container) {
            this.container.addEventListener('mousedown', this, false);
        }
        this.translate.x = GM_getValue(`${this.positionStoreKeyPrefix}X`) || 0;
        this.translate.y = GM_getValue(`${this.positionStoreKeyPrefix}Y`) || 0;
        this.setClockPosition(this.translate.x, this.translate.y);
    }
    handleEvent(evt) {
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
            dialItem.style.transformOrigin = `${dialItemWidth / 2}px ${this.clockSize / 2 - dialItemMargin}px`;
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
    setClockPosition(x, y) {
        if (!this.container) {
            return;
        }
        const translateX = (0, math_1.clamp)(x, 0, window.innerWidth - this.clockSize);
        const translateY = (0, math_1.clamp)(y, 0, window.innerHeight - this.clockSize);
        this.container.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
        this.translateTmp.x = translateX;
        this.translateTmp.y = translateY;
    }
    startMove(evt) {
        if (!this.evtOnMoveStart && this.container) {
            this.evtOnMoveStart = evt;
            document.addEventListener('mousemove', this, false);
            document.addEventListener('mouseup', this, false);
            const overlay = document.createElement('div');
            overlay.id = this.draggingOverlayId;
            overlay.className = 'clock-dragging-overlay';
            document.body.appendChild(overlay);
        }
    }
    dragMove(evt) {
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
            this.setClockPosition(this.translate.x + this.moveDelta.x, this.translate.y + this.moveDelta.y);
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
        GM_setValue(`${this.positionStoreKeyPrefix}X`, this.translate.x);
        GM_setValue(`${this.positionStoreKeyPrefix}Y`, this.translate.y);
        (0, dom_1.elem)(`#${this.draggingOverlayId}`)?.remove();
    }
}
exports.Clock = Clock;

},{"../utils/dom":10,"../utils/math":11}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcludeActivity = void 0;
const dom_1 = require("../utils/dom");
const tampermonkey_1 = require("../utils/tampermonkey");
const tweetdeck_1 = require("../utils/tweetdeck");
class ExcludeActivity {
    constructor() {
        this.optionAccordionHtml = `
        <div class="js-accordion-item facet-type facet-type-content">
            <div class="js-accordion-toggle-view accordion-header is-actionable link-clean block cf txt-size--14">
                <div class="facet-title padding-l--36">
                    <i class="icon icon-blocked facet-type-icon"></i>
                    <span class="txt-size--13">Exclude users</span>
                </div>
                <i class="icon icon-arrow-d pull-right txt-size--10"></i>
                <i class="icon icon-arrow-u pull-right txt-size--10"></i>
                <div class="facet-subtitle facet-subtitle-activity-exclude padding-t--3 padding-r--12 padding-l--36 nbfc">
                    Excluding <span class="user-count">0</span> user<span class="user-count-plural">s</span>
                </div>
            </div>
            <div class="js-content-filter js-accordion-panel accordion-panel" style="">
                <div class="padding-hl control-s">
                    <div class="control-group">
                        <label class="control-label txt-mute">Excluding</label>
                        <div class="js-search-input-control search-input-control controls has-value">
                            <input type="text" class="js-activity-excluding search-input" data-title="excluding" placeholder="Enter screen names to exclude">
                            <a href="#" class="js-perform-search txt-size--14 search-input-perform-search" tabindex="-1">
                                <i class="icon icon-search txt-size--16"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        this.style = `
        .activity-userid {
            margin-left: 0.2em;
        }
        .activity-header:not(:hover) .activity-userid {
            display: none;
        }`;
        this.valuePrefix = 'activity_exclude';
        this.exclusionSettings = (0, tweetdeck_1.getColumnSetting)(this.valuePrefix);
        GM_addStyle(this.style);
    }
    initObserver(mutations) {
        (0, tweetdeck_1.addColumnOptionItem)(mutations, this.optionAccordionHtml, 'Activity', (column) => {
            if (!column) {
                return;
            }
            const inputElem = (0, dom_1.elem)('.js-activity-excluding', column.elem);
            const valueKey = `${this.valuePrefix}_${column.pid}`;
            const value = (0, tampermonkey_1.getValue)(valueKey);
            if (value && inputElem) {
                inputElem.value = value.join(' ');
                this.updateUserCount(column, value);
            }
            inputElem.addEventListener('input', (evt) => {
                const target = evt.target;
                const value = (0, tampermonkey_1.saveValue)(valueKey, target.value, (value) => {
                    return value
                        .split(/\s/)
                        .filter((v) => Boolean(v))
                        .map((v) => v.toLowerCase());
                });
                const column = (0, tweetdeck_1.getColumn)(evt.target);
                if (column) {
                    this.updateUserCount(column, value);
                }
            });
        });
        (0, tweetdeck_1.monitorStreamItemAddition)(mutations, 'Activity', (node) => {
            const accountLink = (0, dom_1.elem)('.activity-header .account-link', node);
            if (!accountLink) {
                return false;
            }
            const href = accountLink.getAttribute('href');
            if (!href) {
                return false;
            }
            const screenNameLower = href.split('/').pop()?.toLowerCase();
            const column = (0, tweetdeck_1.getColumn)(node);
            if (!column) {
                return false;
            }
            const exclusionList = this.exclusionSettings[column.pid];
            if (screenNameLower &&
                exclusionList &&
                exclusionList.includes(screenNameLower)) {
                node.remove();
            }
            else {
                accountLink.insertAdjacentHTML('afterend', `<span class="activity-userid">@${screenNameLower}</span>`);
            }
        });
    }
    updateUserCount(column, values) {
        const count = values.length;
        const userCountElem = (0, dom_1.elem)('.user-count', column.elem);
        if (userCountElem) {
            userCountElem.textContent = String(count);
        }
        if (column.elem) {
            const subtitleElem = (0, dom_1.elem)('.facet-subtitle-activity-exclude', column.elem);
            if (subtitleElem) {
                subtitleElem.style.display = count === 0 ? 'none' : 'initial';
            }
        }
        if (count > 0) {
            const countElem = (0, dom_1.elem)('.user-count-plural', column.elem);
            if (countElem) {
                countElem.style.display = count === 1 ? 'none' : 'initial';
            }
        }
    }
}
exports.ExcludeActivity = ExcludeActivity;

},{"../utils/dom":10,"../utils/tampermonkey":12,"../utils/tweetdeck":13}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HideImageActionLink = void 0;
class HideImageActionLink {
    constructor() {
        this.style = `
        /* モーダルウィンドウ表示中の画像の下に表示されるリンクを非表示 */
        .med-origlink,
        .med-flaglink {
            display: none;
        }
    `;
        GM_addStyle(this.style);
    }
}
exports.HideImageActionLink = HideImageActionLink;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorizontalScroll = void 0;
const dom_1 = require("../utils/dom");
class HorizontalScroll {
    constructor() {
        this.enabled = false;
        const columnsContainer = (0, dom_1.elem)('#container');
        if (!columnsContainer) {
            return;
        }
        const eventHandler = ((evt) => {
            const e = evt.detail;
            if (e.buttons.forward || (e.y < 50 && e.x > 60)) {
                this.switchScrollMode(true);
                const nextLeft = columnsContainer.scrollLeft + e.deltaY;
                columnsContainer.scrollLeft = nextLeft < 0 ? 0 : nextLeft;
            }
            if (this.enabled && !e.buttons.forward && !e.shiftKey) {
                this.switchScrollMode(false);
            }
        });
        columnsContainer.addEventListener('mouseActions', eventHandler);
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
    switchScrollMode(flag) {
        if (this.enabled === flag) {
            return false;
        }
        this.enabled = flag;
        const elements = (0, dom_1.elems)('section.js-column');
        if (!elements) {
            return;
        }
        for (let column of elements) {
            column.classList[flag ? 'add' : 'remove']('no-pointer-events');
        }
    }
}
exports.HorizontalScroll = HorizontalScroll;

},{"../utils/dom":10}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MouseActionsEvent = void 0;
const math_1 = require("../utils/math");
class MouseActionsEvent {
    constructor() {
        this.customEvent = new CustomEvent('mouseActions', {
            detail: {
                buttons: {
                    left: false,
                    right: false,
                    center: false,
                    backward: false,
                    forward: false,
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
    updateMouseButtonsState(evt) {
        const buttonOrder = ['left', 'right', 'center', 'backward', 'forward'];
        this.customEvent.detail.buttons = Object.fromEntries((0, math_1.decToBin)(evt.buttons)
            .padStart(5, '0')
            .split('')
            .reverse()
            .map((state, i) => {
            return [buttonOrder[i], state === '1'];
        }));
    }
    dispatchEvent(evt) {
        this.customEvent.detail.x = evt.x;
        this.customEvent.detail.y = evt.y;
        this.customEvent.detail.deltaY = evt.deltaY ?? 0;
        this.customEvent.detail.shiftKey = evt.shiftKey ?? false;
        if (evt.target) {
            evt.target.dispatchEvent(this.customEvent);
        }
    }
}
exports.MouseActionsEvent = MouseActionsEvent;

},{"../utils/math":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenInWeb = void 0;
const dom_1 = require("../utils/dom");
class OpenInWeb {
    initObserver(mutations) {
        const tweetActionRecords = mutations.filter((mutation) => {
            const target = mutation.target;
            const appContent = target.closest('.app-content') !== null;
            const jsModal = target.closest('.js-modal') !== null;
            const dropdown = (0, dom_1.elem)('.dropdown-menu', target) !== null;
            return (appContent || jsModal) && dropdown;
        });
        for (let record of tweetActionRecords) {
            const target = record.target;
            const dropdownMenu = (0, dom_1.elem)('.js-dropdown', target);
            if (!dropdownMenu) {
                return;
            }
            const mentionActionElem = (0, dom_1.elem)('[data-action=mention]', dropdownMenu);
            if (!mentionActionElem) {
                return;
            }
            const screenName = mentionActionElem.textContent?.split('@')[1];
            const tweetid = dropdownMenu
                .closest('.stream-item')
                ?.getAttribute('data-tweet-id');
            (0, dom_1.elem)('.js-dropdown-content li:nth-child(2)', dropdownMenu)?.insertAdjacentHTML('afterend', `
                    <li class="open-in-web is-selectable"><a href="#" data-action>Open in Web</a></li>
                `);
            const listItemOpenInWeb = (0, dom_1.elem)('.open-in-web');
            if (listItemOpenInWeb) {
                listItemOpenInWeb.addEventListener('mouseenter', function () {
                    this.classList.add('is-selected');
                });
                listItemOpenInWeb.addEventListener('mouseleave', function () {
                    this.classList.remove('is-selected');
                });
                listItemOpenInWeb.addEventListener('click', () => {
                    window.open(`https://twitter.com/${screenName}/status/${tweetid}`);
                });
            }
        }
    }
}
exports.OpenInWeb = OpenInWeb;

},{"../utils/dom":10}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestrictTweetAction = void 0;
const dom_1 = require("../utils/dom");
const tampermonkey_1 = require("../utils/tampermonkey");
const tweetdeck_1 = require("../utils/tweetdeck");
class RestrictTweetAction {
    constructor() {
        this.optionAccordionHtml = `
        <label class="js-accordion-item facet-type facet-type-content restrict-tweet-action">
            <div class="accordion-header is-actionable link-clean block cf txt-size--14">
                <div class="padding-l--36">
                    <input type="checkbox" class="restrict-state">
                    <span>
                        <i class="icon icon-toggle-on color-twitter-blue facet-type-icon"></i>
                        <i class="icon icon-toggle-off facet-type-icon"></i>
                    </span>
                    <span class="txt-size--13">Restrict tweet action</span>
                </div>
            </div>
        </label>`;
        this.style = `
        .restrict-state,
        .restrict-state:checked + * > .icon-toggle-off,
        .restrict-state:not(:checked) + * > .icon-toggle-on {
            display: none;
        }`;
        this.valuePrefix = 'action_restrict';
        this.restrictionSetting = (0, tweetdeck_1.getColumnSetting)(this.valuePrefix);
        GM_addStyle(this.style);
    }
    initObserver(mutations) {
        (0, tweetdeck_1.addColumnOptionItem)(mutations, this.optionAccordionHtml, null, (column) => {
            if (!column) {
                return;
            }
            const inputElem = (0, dom_1.elem)('.restrict-state', column.elem);
            const checkstate = (0, tampermonkey_1.getValue)(`${this.valuePrefix}_${column.pid}`);
            if (inputElem && checkstate) {
                inputElem.checked = checkstate;
            }
            inputElem.addEventListener('change', (evt) => {
                const target = evt.target;
                const column = (0, tweetdeck_1.getColumn)(target);
                const checked = target.checked;
                if (column) {
                    (0, tampermonkey_1.saveValue)(`${this.valuePrefix}_${column.pid}`, checked);
                    alert('変更を適用するには再読み込みが必要です');
                }
            });
        });
        (0, tweetdeck_1.monitorStreamItemAddition)(mutations, '', (node) => {
            const column = (0, tweetdeck_1.getColumn)(node);
            if (column && this.restrictionSetting[column.pid]) {
                for (const relType of ['reply', 'retweet', 'favorite']) {
                    const actionButton = (0, dom_1.elem)(`a[rel="${relType}"]`, node);
                    if (actionButton) {
                        actionButton.classList.add('no-pointer-events');
                        actionButton
                            .closest('li')
                            ?.classList.add('is-protected-action');
                    }
                }
            }
        });
    }
}
exports.RestrictTweetAction = RestrictTweetAction;

},{"../utils/dom":10,"../utils/tampermonkey":12,"../utils/tweetdeck":13}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backByMousebutton_1 = require("./features/backByMousebutton");
const clock_1 = require("./features/clock");
const excludeActivity_1 = require("./features/excludeActivity");
const hideImageActionLink_1 = require("./features/hideImageActionLink");
const horizontalScroll_1 = require("./features/horizontalScroll");
const mouseActionsEvent_1 = require("./features/mouseActionsEvent");
const openInWeb_1 = require("./features/openInWeb");
const restrictTweetAction_1 = require("./features/restrictTweetAction");
const dom_1 = require("./utils/dom");
const features = [
    mouseActionsEvent_1.MouseActionsEvent,
    backByMousebutton_1.BackByMousebutton,
    clock_1.Clock,
    excludeActivity_1.ExcludeActivity,
    hideImageActionLink_1.HideImageActionLink,
    horizontalScroll_1.HorizontalScroll,
    openInWeb_1.OpenInWeb,
    restrictTweetAction_1.RestrictTweetAction,
];
function main() {
    const instances = [];
    features.forEach((featureClass) => {
        instances.push(new featureClass());
    });
    const mutationObserver = new MutationObserver((mutations) => {
        instances.forEach((instance) => {
            if (instance.initObserver) {
                try {
                    instance.initObserver(mutations);
                }
                catch (error) {
                    console.error(error);
                }
            }
        });
    });
    const appElem = (0, dom_1.elem)('.application');
    if (appElem) {
        mutationObserver.observe(appElem, {
            childList: true,
            subtree: true,
        });
    }
}
(function () {
    'use strict';
    const mutationObserver = new MutationObserver((mutations) => {
        const filteredMutations = mutations.filter((mutation) => {
            const target = mutation.target;
            if (target) {
                return target.classList.contains('application');
            }
            return false;
        });
        if (filteredMutations.length > 0) {
            main();
            mutationObserver.disconnect();
        }
    });
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
})();

},{"./features/backByMousebutton":1,"./features/clock":2,"./features/excludeActivity":3,"./features/hideImageActionLink":4,"./features/horizontalScroll":5,"./features/mouseActionsEvent":6,"./features/openInWeb":7,"./features/restrictTweetAction":8,"./utils/dom":10}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elems = exports.elem = void 0;
const elem = (selector, target = null) => {
    return (target ?? document).querySelector(selector);
};
exports.elem = elem;
const elems = (selector, target = null) => {
    const elements = (target ?? document).querySelectorAll(selector);
    if (elements) {
        return Array.from(elements);
    }
    return null;
};
exports.elems = elems;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = exports.decToBin = void 0;
const decToBin = (num) => {
    if (num >= 1) {
        return (0, exports.decToBin)(Math.floor(num / 2)) + (num % 2);
    }
    return '';
};
exports.decToBin = decToBin;
const clamp = (num, min, max) => {
    return Math.max(min, Math.min(num, max));
};
exports.clamp = clamp;

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveValue = exports.getValue = void 0;
const getValue = (key, deformatter = null) => {
    const value = GM_getValue(key);
    return deformatter ? deformatter(value) : value;
};
exports.getValue = getValue;
const saveValue = (key, value, formatter) => {
    value = formatter ? formatter(value) : value;
    GM_setValue(key, value);
    return value;
};
exports.saveValue = saveValue;

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorStreamItemAddition = exports.addColumnOptionItem = exports.getColumnSetting = exports.returnColumn = exports.getColumnByPid = exports.getColumn = void 0;
const dom_1 = require("./dom");
const tampermonkey_1 = require("./tampermonkey");
const getColumn = (element) => {
    const closestElem = element.closest('.js-column');
    if (closestElem) {
        return (0, exports.returnColumn)(closestElem);
    }
    return null;
};
exports.getColumn = getColumn;
const getColumnByPid = (pid) => {
    const element = (0, dom_1.elem)(`.js-column[data-column\$="${pid}"]`);
    if (element) {
        return (0, exports.returnColumn)(element);
    }
    return null;
};
exports.getColumnByPid = getColumnByPid;
const returnColumn = (columnElement) => {
    if (columnElement === null) {
        return null;
    }
    const id = columnElement.getAttribute('data-column') ?? '';
    const pid = id.split('s')[1];
    const heading = (0, dom_1.elem)('.column-heading', columnElement);
    const headingText = heading === null ? '' : heading.textContent;
    return {
        elem: columnElement,
        id,
        pid,
        headingText,
    };
};
exports.returnColumn = returnColumn;
const getColumnSetting = (prefix) => {
    const settings = {};
    GM_listValues()
        .filter((v) => v.indexOf(prefix) !== -1)
        .forEach((v) => {
        const pid = v.replace(`${prefix}_`, '');
        const column = (0, dom_1.elem)(`[data-column\$="${pid}"]`);
        if (column) {
            settings[pid] = (0, tampermonkey_1.getValue)(v);
        }
        else {
            GM_deleteValue(v);
        }
    });
    return settings;
};
exports.getColumnSetting = getColumnSetting;
const addColumnOptionItem = (mutations, html, headingText = null, columnAddCallback = null) => {
    const columnOptionRecords = mutations.filter((mutation) => {
        if (headingText) {
            const column = (0, exports.getColumn)(mutation.target);
            if (column && column.headingText !== headingText) {
                return false;
            }
        }
        const target = mutation.target;
        const isColumnOptions = target.classList.contains('js-column-options');
        const isOpen = mutation.addedNodes.length > 0;
        return isColumnOptions && isOpen;
    });
    if (columnOptionRecords.length === 0) {
        return false;
    }
    for (const record of columnOptionRecords) {
        const accordion = (0, dom_1.elem)('.accordion', record.target);
        const column = (0, exports.getColumn)(record.target);
        if (accordion === null) {
            return false;
        }
        accordion.insertAdjacentHTML('beforeend', html);
        if (columnAddCallback) {
            columnAddCallback(column);
        }
    }
};
exports.addColumnOptionItem = addColumnOptionItem;
const monitorStreamItemAddition = (mutations, headingText, callback) => {
    mutations
        .filter((mutation) => {
        if (mutation.addedNodes.length === 0) {
            return false;
        }
        if (headingText) {
            const column = (0, exports.getColumn)(mutation.target);
            if (column?.headingText !== headingText) {
                return false;
            }
        }
        return true;
    })
        .forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            const element = node;
            if (element.nodeType === 1 &&
                element.classList.contains('stream-item')) {
                callback(element);
            }
        });
    });
};
exports.monitorStreamItemAddition = monitorStreamItemAddition;

},{"./dom":10,"./tampermonkey":12}]},{},[9]);
