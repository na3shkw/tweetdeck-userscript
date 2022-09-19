import { elem, elems } from '../utils/dom';

export class BackByMousebutton {
    constructor() {
        // 戻るボタンで戻らないようにする
        history.pushState(null, '', null);
        const eventHandler = ((evt: CustomEvent) => {
            if (evt.detail.buttons.backward) {
                history.pushState(null, '', null);
                const elementMouseIsOver = document.elementFromPoint(
                    evt.detail.x,
                    evt.detail.y
                );
                // 画像の詳細を開いているか
                const modalElems = elems('.js-modal');
                let modalOpen = false;
                if (modalElems) {
                    modalOpen =
                        modalElems.filter(
                            (node) => node.style.display === 'block'
                        ).length > 0;
                }
                // ユーザーの詳細を開いているか
                const modalContainer = elem('.js-modals-container');
                let userDetailDisplay = false;
                if (modalContainer) {
                    userDetailDisplay = modalContainer.innerText.length > 0;
                }
                if (modalOpen || userDetailDisplay) {
                    // モーダルウィンドウを閉じる
                    elem('.mdl-dismiss')?.click();
                } else if (elementMouseIsOver) {
                    const backElem = elem(
                        '.column-header > a',
                        elementMouseIsOver.closest('.column-panel')
                    );
                    if (backElem) {
                        backElem.click();
                    }
                }
            }
        }) as EventListener;
        // ツイートやアクティビティの詳細から戻る
        document.addEventListener('mouseActions', eventHandler);
    }
    initObserver(mutations: MutationRecord[]) {
        // マウスカーソルがカードのiframe上でも戻れるようにする
        const cardRecords = mutations.filter((mutation) => {
            const target = mutation.target as Element;
            const containsIframe =
                elem('.js-stream-item-content iframe', target) !== null;
            const isTweetDetailContainer =
                target.classList.contains('js-tweet-detail');
            return containsIframe && isTweetDetailContainer;
        });
        if (cardRecords.length > 0) {
            const tweetDetailContainer = cardRecords[0].target as Element;
            // ハッシュタグ以外のリンクを取得
            const linkElements = elems(
                '.js-tweet-text a',
                tweetDetailContainer
            );
            let links: HTMLElement[] | null = null;
            if (linkElements) {
                links = linkElements.filter(
                    (elem) => elem.getAttribute('rel') !== 'hashtag'
                );
            }
            const iframe = elem(
                '.js-card-container iframe',
                tweetDetailContainer
            );
            // 投票もcardsとして提供されるため、リンクがなければオーバーレイは作成しない
            if (
                links &&
                iframe?.parentElement &&
                !elem('.iframeOverlay', iframe.parentElement)
            ) {
                // iframeのオーバーレイを追加
                iframe.parentElement.style.position = 'relative';
                const iframeOverlay = document.createElement('div');
                const iframeOverlayStyle: Partial<CSSStyleDeclaration> = {
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
                // オーバーレイクリック時の動作
                iframeOverlay.addEventListener('click', function (evt) {
                    if (evt.button == 0 && links) {
                        if (links.length === 1) {
                            const href = links[0].getAttribute('href');
                            if (href) {
                                window.open(href);
                            }
                        } else {
                            // カードが有効で最も遅く出現するリンクがカードになる
                            // CSPに引っかかるためiframe内のコンテンツを取得するのは困難
                            alert(
                                'リンクが2つ以上ある場合のカードクリック時の動作は未実装です'
                            );
                        }
                    }
                });
            }
        }
    }
}
