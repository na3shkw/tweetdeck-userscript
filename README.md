# TweetDeck Userscript

TweetDeck をカスタマイズするユーザースクリプト。

## 機能

-   マウスの戻るボタンで詳細表示から戻る
    -   カラムでコンテンツを詳細表示している状態から、マウスの戻るボタンで直前の表示に戻ります
-   横方向のスクロール
    -   カラムのヘッダ部でマウスホイールまたは、マウスの進むボタンを推しながらマウスホイールで横方向にスクロールします
-   時計
    -   ドラッグで移動可能な時計を表示します
-   アクティビティから特定のユーザーを除外
    -   Activity カラムで、特定のユーザーのアクティビティを表示しないようにします
-   画像下部のアクションリンクを非表示にする
    -   画像下部の"View Original"と"Flag media"リンクを非表示にします
-   Web 版で開くオプション（Open in Web）を追加
    -   ツイートの ・・・ アイコン押下で開くメニューに、twitter.com でツイートを開く機能を追加します
-   ツイートへのアクションをカラムごとに制限するオプション
    -   カラムごとに、いいねやリツイートなどのアクションを制限することができます

## インストール方法

1. ブラウザ拡張機能[Tampermonkey](https://www.tampermonkey.net/)をインストール
2. [dist/index.user.js](https://github.com/na3shkw/tweetdeck-userscript/raw/main/dist/index.user.js)を Raw で開き、ユーザースクリプトをインストール

## 開発

VSCode の Dev Container と Docker を利用します。

### 環境構築

1. `git clone https://github.com/na3shkw/tweetdeck-userscript.git`
2. `.env.example`を`.env`にコピーし、`LOCAL_DIR_NAME`にクローン先のディレクトリ名を設定
3. VSCode の Dev Container で開く

### Tampermonkey の設定

1. Chrome の拡張機能の設定から、ローカルファイルを参照できるように設定
2. `dist/local.user.js`の内容をユーザースクリプトとして登録

### 各種タスク

-   `npm run build`: ビルド
-   `npm run watch`: 変更を監視して自動的にビルド
-   `npm run loader`: 開発環境用のユーザースクリプトを生成
