Title: WebGLのデータテクスチャ
Description: テクスチャーを配列データから生成する
TOC: データテクスチャ


この記事はWebGLの連載シリーズのひとつである。
連載は「[WebGLの基本](webgl-fundamentals.html)」から始まり、
前回は[テクスチャー](webgl-3d-textures.html)について説明した。

前回の講義では、WebGLにおける「テクスチャーの仕組みと使い方」について説明した。
その際、テクスチャーはダウンロードした画像から生成した。
今回の講義では画像ではなく「JavaScriptから直接テクスチャーデータを生成する方法」を
説明しようと思う。

JavaScriptでテクスチャーのデータを生成する方法は、とても直接的である。
テクスチャで利用できるデータ型は以下の通りである。
このリストは、「WebGL1がデフォルトでサポートしているもの」に限定している。

<div class="webgl_center">
  <table class="tabular-data tabular-data1">
    <thead>
      <tr><td>フォーマット</td><td>データ型</td><td>チャンネル数</td><td>ピクセルあたりのバイト数</td></tr>
    </thead>
    <tbody>
      <tr><td>RGBA</td><td>UNSIGNED_BYTE</td><td>4</td><td>4</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_BYTE</td><td>3</td><td>3</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_4_4_4_4</td><td>4</td><td>2</td></tr>
      <tr><td>RGBA</td><td>UNSIGNED_SHORT_5_5_5_1</td><td>4</td><td>2</td></tr>
      <tr><td>RGB</td><td>UNSIGNED_SHORT_5_6_5</td><td>3</td><td>2</td></tr>
      <tr><td>LUMINANCE_ALPHA</td><td>UNSIGNED_BYTE</td><td>2</td><td>2</td></tr>
      <tr><td>LUMINANCE</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
      <tr><td>ALPHA</td><td>UNSIGNED_BYTE</td><td>1</td><td>1</td></tr>
    </tbody>
  </table>
</div>

早速だが、「3x2ピクセルの`LUMINANCE`型のテクスチャー」を生成してみよう。
`LUMINANCE`テクスチャーは、ピクセル1つにつき1つだけ値を持ち、
RGB全てのチャンネルでその値が使用される。"luminance"とは、英語で「明るさ」を表す。

[前回の講義](webgl-3d-textures.html)で使用したサンプルを流用しよう。
まず、立方体の各面で「テクスチャ全体を使う」ように、テクスチャ座標を変更する。

```
// 立方体の各面について「テクスチャ座標」をバッファにセットする。
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        // 前面
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
        ...
```
テクスチャーを生成するコードを変更する。

```
// テクスチャーを生成する。
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

-// テクスチャーを「1x1の青いピクセル」で塗りつぶす。
-gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
-              new Uint8Array([0, 0, 255, 255]));

// テクスチャーを「3x2ピクセルのデータ」で塗りつぶす。
const level = 0;
const internalFormat = gl.LUMINANCE;
const width = 3;
const height = 2;
const border = 0;
const format = gl.LUMINANCE;
const type = gl.UNSIGNED_BYTE;
const data = new Uint8Array([
  128,  64, 128,
    0, 192,   0,
]);
gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
              format, type, data);

// MipMapは不要なのでフィルタリングはしないように設定する。
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

-// 非同期での画像読み込みを行う
-...
```

実行結果はこのようになる。

{{{example url="../webgl-data-texture-3x2-bad.html" }}}

ええっ！？どうして動かないのだ？！？！？

JavaScriptコンソールを調べると、以下のようなエラーが出ていることがわかる。

```
WebGL: INVALID_OPERATION: texImage2D: ArrayBufferView not big enough for request
```

メッセージの細かい内容は実行環境によって異なるが「読み出そうとしたがデータが足りない」
といった意味のエラーが出ているはずだ。

WebGLには曖昧な設定があるのだが、この問題はそれに由来している。
この問題は、WebGLの先祖であるOpenGLが誕生した時からそのままになっているものだ。

一般にコンピュータは、データが特定のサイズの時に最速で処理を行える。
例えば「データを2バイト、4バイト、8バイトずつまとめてコピーする場合は、
1バイトずつコピーする場合よりも速い」といった状況がある。
WebGLの場合は、デフォルトでは「__1件あたり4バイト__」としてデータを扱うことになっている。
WebGLはデータ全体が「4バイトの整数倍のサイズ」であると期待して処理を行う(最後の1件を除く)。

一方、我々が用意したデータは3x2、つまり「1件当たり3バイト」で「全部で6バイト」のデータである。
このためWebGLはまず「1件目の3バイトのデータ」を
「4バイトのデータ」として読み込む。
そして「2件目の3バイトのデータ」は「3バイトのデータ」として読み込んで、
「トータルで読み込んだ7バイト」を読み込んだ結果、
これが「4バイトの整数倍のサイズ」でないためエラーを出しているのである。

「__1件あたり4バイト__」ではなく「__1件あたり1バイト__」として処理させるには、
WebGLに以下のような設定を行なえばよい。

    const alignment = 1;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, alignment);


`alignment`の値には、`1`、`2`、`4`、`8`のいずれかが指定できる。
アラインメント(`alignment`)とは、英語で「位置あわせ」のような意味である。

私が観察した限り、alignmentの違いによる実行速度の差は
測定できるようなレベルでは全くない。
WebGLのこの仕様のデフォルトが4バイトではなく1バイトになっていたら
ずいぶん初心者に優しいのではないかとも思うが、
OpenGLとの互換性を保つ必要があるためこのようになっている。
ともあれ、このおかげで、WebGLに移植されたアプリケーションが
パディングのデフォルト値に依存していたとしても変更なしに動作する。
これは「デフォルト値」だけの問題なので、新たに最初からWebGL用に
アプリケーションを作る際は、
単純に「必ず明示的に`1`をセット」してしまえばよいだろう。

以上を踏まえてサンプルを書き直すと、このようになる。

{{{example url="../webgl-data-texture-3x2.html" }}}

アラインメントの問題について確認できたので、
次回は「[テクスチャへの描画](webgl-render-to-texture.html)」の話をしよう。

<div class="webgl_bottombar">
<h3>ピクセルとテクセル</h3>
<p>テクスチャの文脈では、ピクセルのことを「テクセル」と呼ぶことがある。
pixelという単語は「picture element(画像要素)」に由来し、
texelという単語は「texture element(テクスチャ要素)」に由来する。
</p>
<p>CG業界のえらい人たちからご指摘を頂くこともあるが、控えめにいって
「テクセル」は「業界用語」の典型例である。個人的には、テクスチャ要素の文脈でも
特に意識せず「ピクセル」と表現することにしている。&#x1f607;
</p>
</div>
