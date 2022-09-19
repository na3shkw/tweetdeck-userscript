import { elem } from '../utils/dom';

export class OpenInWeb {
    initObserver(mutations: MutationRecord[]) {
        // ツイートアクションにWeb版で開くボタンを追加
        const tweetActionRecords = mutations.filter((mutation) => {
            const target = mutation.target as Element;
            const appContent = target.closest('.app-content') !== null;
            const jsModal = target.closest('.js-modal') !== null;
            const dropdown = elem('.dropdown-menu', target) !== null;
            return (appContent || jsModal) && dropdown;
        });
        for (let record of tweetActionRecords) {
            const target = record.target as Element;
            const dropdownMenu = elem('.js-dropdown', target);
            if (!dropdownMenu) {
                return;
            }
            const mentionActionElem = elem(
                '[data-action=mention]',
                dropdownMenu
            ) as Element;
            if (!mentionActionElem) {
                return;
            }
            const screenName = mentionActionElem.textContent?.split('@')[1];
            const tweetid = dropdownMenu
                .closest('.stream-item')
                ?.getAttribute('data-tweet-id');
            // elem('[rel=actionsMenu]', dropdownMenu.parentElement).getAttribute('data-tweet-id');
            elem(
                '.js-dropdown-content li:nth-child(2)',
                dropdownMenu
            )?.insertAdjacentHTML(
                'afterend',
                `
                    <li class="open-in-web is-selectable"><a href="#" data-action>Open in Web</a></li>
                `
            );
            const listItemOpenInWeb = elem('.open-in-web');
            if (listItemOpenInWeb) {
                listItemOpenInWeb.addEventListener('mouseenter', function () {
                    this.classList.add('is-selected');
                });
                listItemOpenInWeb.addEventListener('mouseleave', function () {
                    this.classList.remove('is-selected');
                });
                listItemOpenInWeb.addEventListener('click', () => {
                    window.open(
                        `https://twitter.com/${screenName}/status/${tweetid}`
                    );
                });
            }
        }
    }
}
