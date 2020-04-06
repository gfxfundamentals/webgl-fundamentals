Title: WebGLとcanvasのリサイズ
Description: WebGL使用時にcanvasをリサイズする方法と問題について
TOC: WebGLとcanvasのリサイズ


canvas要素のサイズを変更する際に知っておくべき点について説明します。

canvasには２種類のサイズがあります。
ひとつめは、canvasの「描画バッファーのサイズ」です。これは、canvas内のピクセル数です。
ふたつめは、canvasの「表示サイズ」です。canvasの表示上のサイズは、CSS(style)で決定します。

canvasの「**描画バッファーのサイズ**」を設定する方法は２種類あります。
ひとつめは、HTMLを使う方法です。

    <canvas id="c" width="400" height="300"></canvas>

ふたつめは、JavaScriptを使う方法です。こちらの方法では、HTML側は

    <canvas id="c" ></canvas>

JavaScript側は、

    var canvas = document.querySelector("#c");
    canvas.width = 400;
    canvas.height = 300;

といったコードになります。

canvasの「**表示サイズ**」については、
「canvasの表示サイズに影響を与えるCSSが定義されてない場合」は、
「描画バッファーと同じサイズ」になります。上の例で言えば、
「描画バッファのサイズ」は400x300で、
「表示サイズ」も同じく、400x300となります。

別の例として「描画バッファが10x15ピクセル、表示サイズが400x300のcanvas」
を定義する場合はこんなコードになります。

    <canvas id="c" width="10" height="15" style="width: 400px; height: 300px;"></canvas>

同じ意味で、こんな風に書くこともできます。

    <style>
    #c {
      width: 400px;
      height: 300px;
    }
    </style>
    <canvas id="c" width="10" height="15"></canvas>

描画バッファと表示上のサイズが違う場合どうなるか、実際に見てみましょう。
下の例では、「描画バッファが10x15ピクセル、表示サイズが400x300のcanvas」
で、「1ピクセル幅の直線」が回転しています。

{{{example url="../webgl-10x15-canvas-400x300-css.html" }}}

なぜぼやけているのでしょうか？この例でブラウザは、
「10x15ピクセルで描かれたcanvasを400x300ピクセルに引き伸ばす」
ということをやっているのですが、
一般にブラウザは、引き伸ばしを行う際にフィルタをかけるためです。

では、canvasをウィンドウいっぱいにリサイズしたい時にはどうすればよいでしょうか？
まず、CSSを使ってウィンドウいっぱいに引き伸ばしてみましょう。
コードはこんな感じになります。

    <html>
      <head>
        <style>
          /* border幅は0にしておく */
          body {
            border: 0;
            background-color: white;
          }
          /* canvasを「ビューポート」のサイズにする */
          canvas {
            width: 100vw;
            height: 100vh;
            display: block;
          }
        <style>
      </head>
      <body>
        <canvas id="c"></canvas>
      </body>
    </html>

リサイズに際してやるべきことは、「ブラウザーがcanvasの表示サイズを
引き伸ばしたら、とにかくそのサイズに描画バッファーのサイズを合わせる」ことだけです。
これを実現するには、`clientWidth`と`clientHeight`を使います。
これはHTMLのすべての要素が持っているプロパティです。
これを使えばその要素が実際に表示されているサイズをJavaScriptから取得できます。

    function resize(canvas) {
      // ブラウザがcanvasを表示しているサイズを調べる。
      var displayWidth  = canvas.clientWidth;
      var displayHeight = canvas.clientHeight;

      // canvasの「描画バッファーのサイズ」と「表示サイズ」が異なるかどうか確認する。
      if (canvas.width  != displayWidth ||
          canvas.height != displayHeight) {

        // サイズが違っていたら、描画バッファーのサイズを
        // 表示サイズと同じサイズに合わせる。
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
      }
    }

WebGLアプリケーションの多くは<a href="webgl-animation.html">アニメーションする</a>
ので、この関数はレンダリングの直前に呼び出すのがよいでしょう。
このタイミングであれば描画の直前にcanvasを適切なサイズに合わせることができます。

    function drawScene() {
       resize(gl.canvas);

       ...

以上の修正を加えて実行するとこのようになります。

{{{example url="../webgl-resize-canvas.html" }}}

何かおかしいですね。表示領域いっぱいに直線が表示されないのはなぜでしょうか？

結論から言えば、canvasをリサイズしたら同時に`gl.viewport`を呼んでビューポートを
設定する必要があったためです。
`gl.viewport`の役目は、「WebGLがクリップ空間座標(-1～+1)をピクセルに変換する」際に
「どう変換するか」と「canvas内のどの範囲で変換するか」を指定することです。
最初にWebGLコンテキストを取得する時には、ビューポートのサイズがcanvasのサイズと同じに
なるようにWebGLが自動的にセットするのですが、それ以降の管理はあなたに任されています。
つまり、canvasのサイズ変更があった時には、あなたが明示的にビューポートの設定を更新しなければなりません。

ではそのようにコードを変更してみます。WebGLコンテキストはcanvasへの参照を
持っているので、そのサイズをリサイズ処理に反映させましょう。

    function drawScene() {
       resize(gl.canvas);

    +   gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       ...

これでうまく動きました。

{{{example url="../webgl-resize-canvas-viewport.html" }}}

「別のウィンドウ」で開いてウィンドウサイズを変更しても、
回転する直線はいつも画面いっぱいに描画されるのを確認してみてください。

ここで「なぜWebGLはcanvasサイズを変更したときビューポートを自動的に更新してくれないの？」
という疑問があるかと思います。
それに対する答えは「あなたがビューポートをなぜ、どう使いたいのか、
WebGLにはわからないから」となります。
「フレームバッファーへの描画」など、通常と異なるビューポートサイズを使う状況は
いくつかあります。
WebGLには「あなたが何を意図しているか」を判断する手段がないので、
ビューポートの設定を「あなたが望むように」自動で更新することはできないのです。

WebGLプログラムをたくさん見ていくとわかりますが、
canvasのサイズ設定やリサイズのやり方、考え方はいろいろなものがあります。
もし興味があれば、<a href="webgl-anti-patterns.html">上で紹介したやり方を私が好んでいる理由を説明した記事</a>があるので確認してみてください。

<div class="webgl_bottombar">
<h3>HD-DPI(Retina)ディスプレイではどうすればいい？</h3>
<p>
CSSやcanvasタグでサイズ指定する際には、単位としてピクセルが使えますが、
これは厳密には「CSSピクセル」と呼ぶべきもので、
実際のピクセル数とは一致する場合も、一致しない場合もあります。
最新のスマートフォンでは、high-definition DPI(HD-DPI)ディスプレイが採用されています。
Apple社が「Retinaディスプレイ」と呼んでいるものです。
これらのスマートフォンのブラウザは、テキストやCSSで指定したスタイルの大半を
自動的にHD-DPIグラフィクスとしてレンダリングするのですが、WebGLは例外となっています。
"HD-DPI"品質のグラフィックを使いたい場合は、
明示的に高解像度で描画するようにコードを書く必要があります。
</p>
<p>
これを行うには<code>window.devicePixelRatio</code>の値を利用します。
この値は「１CSSピクセルが実際の何ピクセルに相当するか」を表しています。
これを使ってリサイズするコードは以下のようになります。</p>
<pre class="prettyprint">
function resize(gl) {
  var realToCSSPixels = window.devicePixelRatio;

  // ブラウザがcanvasでCSSピクセルを表示しているサイズを参照し、
  // デバイスピクセルに合った描画バッファサイズを計算する。
  var displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  // canvasの描画バッファサイズと表示サイズが異なるかどうか確認する。
  if (gl.canvas.width  !== displayWidth ||
      gl.canvas.height !== displayHeight) {

    // サイズが違っていたら、同じサイズにする。
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;
  }
}
</pre>
<p>あなたがこのページをHD-DPIディスプレイ、たとえばスマートフォンで見ているなら、
下の実行例の線は、上の、HD-DPI対応していない例の線よりも細くなっていることが
確認できるはずです。</p>
{{{example url="../webgl-resize-canvas-hd-dpi.html" }}}

<p>HD-DPIに対応するかどうかはあなた次第です。
iPhone4やiPhone5の場合、<code>window.devicePixelRatio</code>の値は
<code>2</code>、つまりピクセル数で言えば4倍の描画が行われます。
iPhone6Plusであればこの値は<code>3</code>となっていたかと思います。
これは9倍のピクセルが描画されるという意味です。
描画すべきピクセル数が増えると、実行速度は低下します。
実際、ゲーム製作では「描画は少ないピクセル数で行なって
GPUに拡大表示させる」という最適化手法が一般的です。

どちらを選ぶかはあなたの目的次第です。
グラフ表示や印刷用途であればHD-DPIをサポートするのがよいでしょう。
ゲーム用途の場合はHD-DPIを非サポートとすべきでしょう。
高速に描画できる高性能機ではHD-DPIをオンにできるような
オプション機能をユーザーに提供するのもよいかも知れません。
</p>
</div>
