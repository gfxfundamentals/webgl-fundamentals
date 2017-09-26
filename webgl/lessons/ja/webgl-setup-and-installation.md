Title: WebGLの開発環境
Description: WebGLで開発するには

技術的には、WebGLでの開発に必要なものは「Webブラウザだけ」です。
Web上でコーディングを行うためのサイト([jsfiddle.net](https://jsfiddle.net/greggman/8djzyjL3/)、[jsbin.com](http://jsbin.com)
、[codepen.io](http://codepen.io/greggman/pen/YGQjVV)など)
を利用すれば、このサイトのサンプルプログラムを試してみることができます。

上で紹介したサイトであればどれであっても、
`<script src="..."></script>`といったコードを書けば
外部スクリプトを参照することができます。

ただ、この方法には制限があります。
WebGLは、Canvas2Dと比較して画像のロードに関してセキュリティ上の強い制限があるため、
「Web上の画像を読み込むようなプログラム」は簡単に動かすことはできません。
また、単純に「全ての作業をローカルでやる方が手っ取り早い」です。

ということで、あなたがこのサイトのサンプルを描いたり実行したりといった作業を、
上記の方法ではなく、「ローカルでやることにした」、と仮定して話を続けましょう。

最初にやるべきことはこのサイトをまるごとダウンロードすることです。
[ここからダウンロードできます](https://github.com/greggman/webgl-fundamentals/)。

{{{image url="resources/download-webglfundamentals.gif" }}}

適当なローカルのフォルダに、Unzipしてください。

## 簡単軽量単純なWebサーバを使う

次はWebサーバをインストールしましょう。
「Webサーバ」というと「何やら恐ろしいもの」、と感じる人がいるのは知っていますが、
実際のところWebサーバとはとても単純なプログラムであり、
[たった５行で書けるようなもの](http://games.greggman.com/game/saving-and-loading-files-in-a-web-page/)
です。

あなたがChromeブラウザのユーザーなら、特に簡単な方法が利用できます。
[Chromeの拡張機能として動くWebサーバー](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=en)
があるので、それを使えばよいです。

{{{image url="resources/chrome-webserver.png" }}}

この方法であれば、あとやるべきことは、
さきほどダウンロードしたZipファイルを展開したディレクトリを指定して、
WebサーバのURLをクリックするだけです。

あなたがChromeユーザーでなかったり、拡張機能を使いたくない場合は、
[node.js](https://nodejs.org)を利用する方法があります。
node.jsをダウンロード、インストールして、コマンドプロンプト
(OSによってコンソール、ターミナルなどと呼ばれるものです)を開きます。
Windowsの場合は"Node Command Prompt"という専用のプログラムが
追加されているはずなので、それを利用します。

そこからnode.jsのnpmコマンドを使って、
「[`http-server`](https://github.com/indexzero/http-server)モジュール」を
ダウンロード、インストールします。

    npm -g install http-server

OSXの場合は、

    sudo npm -g install http-server

となります。http-serverのインストールが完了したら、

    http-server path/to/folder/where/you/unzipped/files

といったコマンドで起動できます(path/to/folder/where/you/unzipped/filesは
「ファイルをUnzipしたディレクトリへのパス」です)。
起動に成功すると、

{{{image url="resources/http-server-response.png" }}}

このようなログが表示されます。
これで、ブラウザからは[`http://localhost:8080`](http://localhost:8080)
でアクセスできます。

パスを指定しなかった場合は、http-serverはカンレントフォルダを参照します。

## Webブラウザ付属の開発ツール

ほとんどのWebブラウザにはビルトインの開発ツールが付属しています。

{{{image url="resources/chrome-devtools.png" }}}

開発ツールのドキュメントはオンラインで読むことができるので、使ってみるとよいでしょう。

([Chromeの開発ツール](https://developers.google.com/web/tools/chrome-devtools/)、
[Firefoxの開発ツール](https://developer.mozilla.org/en-US/docs/Tools)）

何をおいても「JavaScriptコンソール」は必ずチェックしてください。
WebGLプログラムに問題がある時は、多くの場合
JavaScriptコンソールにエラーメッセージが出力されます。
エラーメッセージを注意深く読めば、問題箇所を探すヒントが
見つかるはずです。

{{{image url="resources/javascript-console.gif" }}}

## WebGLヘルパー機能

WebGL Inspector、WebGL Helperといった名前で呼ばれる
ツールがいくつかあります。たとえば[Chrome用としてはこんなものがあります](https://benvanik.github.io/WebGL-Inspector/)。

{{{image url="https://benvanik.github.io/WebGL-Inspector/images/screenshots/1-Trace.gif" }}}

[Firefoxにも類似のツールがあります](https://hacks.mozilla.org/2014/03/introducing-the-canvas-debugger-in-firefox-developer-tools/)。
これを利用するには`about:flags`で有効化をする必要があります。また、
おそらくは[開発者向けFirefox](https://www.mozilla.org/en-US/firefox/developer/)が必要です。

これらのツールは万能ではなく、有効な場面もあるしあまり役に立たない場面もあります。
多くのツールは「アニメーションするサンプル」向けにデザインされており、
アニメーションフレームをキャプチャして、そのフレームの全WebGLコール
を視覚化したりします。
こういう機能は、「現在動いているプログラム」や、「動いていたけどいじって
いるうちに動かなくなってしまったプログラム」の分析にはとても有効ですが、
「アニメーションを始める以前の初期化部分の問題」や、「そもそも
アニメーションしないようなプログラム」に使ってもあまり役に立ちません。
一方で、「ドローコールでクリックしてuniformの設定値を確認する」、
といった場面ではしばしば役に立つはずです。
「uniformの設定値で大量の`NaN` (NaN = Not a Number)が出ていたら、
そのuniform変数をセットする部分のコードに問題があるはずだ」、
といったことがわかります。

## コードを確認する機能

実行中のコードをブラウザ上でいつでも確認できることは覚えておいてください。
通常はページを右クリックすればソースを確認するコマンドが使えます。

{{{image url="resources/view-source.gif" }}}

「右クリックできない」、「ソースが別ファイルになっている」
といった場合でも、開発ツールの中であればソースを見ることができます。

{{{image url="resources/devtools-source.gif" }}}

## さあ、はじめよう

準備はできたでしょうか。[講義に戻りましょう](/)
