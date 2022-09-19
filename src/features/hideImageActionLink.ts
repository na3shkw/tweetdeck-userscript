export class HideImageActionLink {
    private style = `
        /* モーダルウィンドウ表示中の画像の下に表示されるリンクを非表示 */
        .med-origlink,
        .med-flaglink {
            display: none;
        }
    `;
    constructor() {
        GM_addStyle(this.style);
    }
}
