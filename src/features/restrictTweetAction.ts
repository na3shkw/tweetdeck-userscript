import { elem } from '../utils/dom';
import { getValue, saveValue } from '../utils/tampermonkey';
import {
    addColumnOptionItem,
    getColumn,
    getColumnSetting,
    monitorStreamItemAddition,
} from '../utils/tweetdeck';

export class RestrictTweetAction {
    private optionAccordionHtml: string = `
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
    private style = `
        .restrict-state,
        .restrict-state:checked + * > .icon-toggle-off,
        .restrict-state:not(:checked) + * > .icon-toggle-on {
            display: none;
        }`;
    private valuePrefix = 'action_restrict';
    private restrictionSetting: {
        [name: string]: string;
    };

    constructor() {
        this.restrictionSetting = getColumnSetting(this.valuePrefix);
        GM_addStyle(this.style);
    }
    initObserver(mutations: MutationRecord[]) {
        addColumnOptionItem(
            mutations,
            this.optionAccordionHtml,
            null,
            (column) => {
                if (!column) {
                    return;
                }
                const inputElem = elem(
                    '.restrict-state',
                    column.elem
                ) as HTMLInputElement;
                // 保存済みの値を復帰
                const checkstate = getValue(
                    `${this.valuePrefix}_${column.pid}`
                );
                if (inputElem && checkstate) {
                    inputElem.checked = checkstate;
                }
                inputElem.addEventListener('change', (evt) => {
                    const target = evt.target as HTMLInputElement;
                    const column = getColumn(target);
                    const checked = target.checked;
                    if (column) {
                        saveValue(`${this.valuePrefix}_${column.pid}`, checked);
                        alert('変更を適用するには再読み込みが必要です');
                    }
                });
            }
        );
        monitorStreamItemAddition(mutations, '', (node) => {
            const column = getColumn(node);
            if (column && this.restrictionSetting[column.pid]) {
                for (const relType of ['reply', 'retweet', 'favorite']) {
                    const actionButton = elem(`a[rel="${relType}"]`, node);
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
