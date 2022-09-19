import { elem } from '../utils/dom';
import { getValue, saveValue } from '../utils/tampermonkey';
import {
    addColumnOptionItem,
    getColumn,
    getColumnSetting,
    monitorStreamItemAddition,
} from '../utils/tweetdeck';

export class ExcludeActivity {
    private optionAccordionHtml = `
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
    private style = `
        .activity-userid {
            margin-left: 0.2em;
        }
        .activity-header:not(:hover) .activity-userid {
            display: none;
        }`;
    private valuePrefix = 'activity_exclude';
    private exclusionSettings: { [name: string]: string };

    constructor() {
        this.exclusionSettings = getColumnSetting(this.valuePrefix);
        GM_addStyle(this.style);
    }
    initObserver(mutations: MutationRecord[]) {
        addColumnOptionItem(
            mutations,
            this.optionAccordionHtml,
            'Activity',
            (column) => {
                if (!column) {
                    return;
                }
                const inputElem = elem(
                    '.js-activity-excluding',
                    column.elem
                ) as HTMLInputElement;
                // 保存済みの値を復帰
                const valueKey = `${this.valuePrefix}_${column.pid}`;
                const value = getValue(valueKey);
                if (value && inputElem) {
                    inputElem.value = value.join(' ');
                    this.updateUserCount(column, value);
                }
                // 値が変更された時
                inputElem.addEventListener('input', (evt) => {
                    const target = evt.target as HTMLInputElement;
                    const value = saveValue(valueKey, target.value, (value) => {
                        return value
                            .split(/\s/)
                            .filter((v: any) => Boolean(v))
                            .map((v: string) => v.toLowerCase());
                    });
                    const column = getColumn(evt.target as Element);
                    if (column) {
                        this.updateUserCount(column, value);
                    }
                });
            }
        );
        monitorStreamItemAddition(mutations, 'Activity', (node) => {
            const accountLink = elem('.activity-header .account-link', node);
            if (!accountLink) {
                return false;
            }
            const href = accountLink.getAttribute('href');
            if (!href) {
                return false;
            }
            const screenNameLower = href.split('/').pop()?.toLowerCase();
            // const userId = node.getAttribute('data-key').split('_')[1];
            // [data-key^=favorite_${userId}] のセレクタで該当ユーザーのアクティビティを選択することもできる
            // ユーザーIDを取得・保存しなければならないのでやや面倒だがスクリーンネームの変更に対応できる
            const column = getColumn(node);
            if (!column) {
                return false;
            }
            const exclusionList = this.exclusionSettings[column.pid];
            if (
                screenNameLower &&
                exclusionList &&
                exclusionList.includes(screenNameLower)
            ) {
                node.remove();
            } else {
                // ユーザー名hoverでスクリーンネームを表示する
                accountLink.insertAdjacentHTML(
                    'afterend',
                    `<span class="activity-userid">@${screenNameLower}</span>`
                );
            }
        });
    }
    updateUserCount(column: Column, values: any[]) {
        const count = values.length;
        const userCountElem = elem('.user-count', column.elem);
        if (userCountElem) {
            userCountElem.textContent = String(count);
        }
        if (column.elem) {
            const subtitleElem = elem(
                '.facet-subtitle-activity-exclude',
                column.elem
            );
            if (subtitleElem) {
                subtitleElem.style.display = count === 0 ? 'none' : 'initial';
            }
        }
        if (count > 0) {
            const countElem = elem('.user-count-plural', column.elem);
            if (countElem) {
                countElem.style.display = count === 1 ? 'none' : 'initial';
            }
        }
    }
}
