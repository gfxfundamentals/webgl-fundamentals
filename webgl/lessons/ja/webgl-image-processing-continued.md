Title: WebGLにおける画像処理。続き
Description: WebGLで複数の画像加工処理をするには

この記事は、「[WebGLにおける画像処理](webgl-image-processing.html)」の続きです。
「[WebGLにおける画像処理](webgl-image-processing.html)」から読み始めることをお勧めします。

画像処理の次の問題は「複数の画像処理を行うにはどうしたら良いか？」です。

さて、画像処理をするシェーダーを毎回生成することはできます。
専用のUI画面を用意して、
使いたい画像処理エフェクトをユーザーが選択すると、必要な処理を行う
カスタムメードのシェーダーがそのたびに生成される、といった仕組みです。
すべてが解決、というわけではありませんが、この方法は
[リアルタイムグラフィクスのためのエフェクト作成で実際に使われていた例](http://www.youtube.com/watch?v=cQUn0Zeh-0Q)
もあります。

より柔軟なのやり方は、２枚のテクスチャを交互に使って、次々に別のエフェクトを
かけていく方法です。

<blockquote><pre>
元画像         -&gt; [ぼかし(Blur)]          -&gt; Texture 1
Texture 1      -&gt; [シャープ(Sharpen)]     -&gt; Texture 2
Texture 2      -&gt; [輪郭検出(Edge Detect)] -&gt; Texture 1
Texture 1      -&gt; [ぼかし(Blur)]          -&gt; Texture 2
Texture 2      -&gt; [Normal]                -&gt; Canvas</pre></blockquote>

これを実現するためには「フレームバッファ」を使う必要があります。
WebGLやOpenGLのフレームバッファは、フレームバッファという呼び名が
付けられていますが、実際にはバッファではなくステータスの集合(＝添付データのリスト)
に過ぎません。呼び名の良し悪しはともかく、フレームバッファにテクスチャを
添付することで、そのテクスチャに対して描画することが可能になります。

では最初に、[以前書いたテクスチャ生成コード](webgl-image-processing.html)を
関数として再定義しましょう。

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // どんなサイズの画像でもレンダリングできるように設定して、
    // ピクセル単位で操作できるようにする。
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // テクスチャを生成し、画像を入れる。
  var originalImageTexture = createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
```

この関数を使って２つのテクスチャを作成、２つのフレームバッファにアタッチ(添付)します。

```
  // テクスチャを２つ生成して、フレームバッファにアタッチする。
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // 画像と同じサイズでテクスチャを生成する
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);

    // フレームバッファを生成する
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // そこにテクスチャをアタッチする。
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  }
```

様々なエフェクトを「畳み込み行列」として定義して、適用するエフェクトのリストを用意します。

```
  // 「畳み込み行列(convolution kernels)」を定義する
  var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    unsharpen: [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ],
    emboss: [
       -2, -1,  0,
       -1,  1,  1,
        0,  1,  2
    ]
  };

  // 適用するエフェクトのリスト。
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

最後に、２つのテクスチャを交互に使って各エフェクトを次々にかけていきます。

```
  // 元画像から開始
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // テクスチャに書き込む時点では画像の上下をひっくり返さない
  gl.uniform1f(flipYLocation, 1);

  // このループでエフェクトをかけて行く。
  for (var ii = 0; ii < effectsToApply.length; ++ii) {
    // フレームバッファのひとつを書き込み先として設定する。
    setFramebuffer(framebuffers[ii % 2], image.width, image.height);

    drawWithKernel(effectsToApply[ii]);

    // 次の書き込みの際は、いま書き込んだテクスチャを使う。
    gl.bindTexture(gl.TEXTURE_2D, textures[ii % 2]);
  }

  // 最終的結果をcanvasへ書き込む。
  gl.uniform1f(flipYLocation, -1);  // 座標系の上下はここでひっくり返す
  setFramebuffer(null, canvas.width, canvas.height);
  drawWithKernel("normal");

  function setFramebuffer(fbo, width, height) {
    // このfboを書き込み先フレームバッファとして設定する。
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // シェーダーにフレームバッファの解像度の情報を伝える。
    gl.uniform2f(resolutionLocation, width, height);

    // フレームバッファで必要となるため、WebGLにビューポートの設定を伝える。
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // 今回適用するエフェクトの畳み込み行列をセット
    gl.uniform1fv(kernelLocation, kernels[name]);

    // 長方形を描画する
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
```
下の画面は、少々改造して柔軟なUIを付け足したバージョンです。
適用したいエフェクトにはチェックを入れます。
エフェクトの適用順はドラッグで変更できます。

{{{example url="../webgl-2d-image-processing.html" }}}

まだ説明していないことがいくつかあります。

<code>gl.bindFramebuffer</code>メソッドを引数<code>null</code>で呼びだして
いるのは、フレームバッファではなくcanvasに書き込む、という意味です。

この時、WebGLは[クリッピング空間](webgl-fundamentals.html)からピクセルに変換
しなくてはなりません。この時WebGLが基準とするのが<code>gl.viewport</code>です。
レンダリングに使っているフレームバッファはcanvasとは異なるサイズなので、
フレームバッファのテクスチャにレンダリングする時点で適切なビューポートを
セットしておいて、canvasにレンダリングするタイミングで改めて設定する必要があります。

最後に、[元のサンプル](webgl-fundamentals.html)では、Y座標を
ひっくり返していました。これは、WebGLでは座標0,0がcanvasの左下隅となっていて、
左上隅を基準とする従来の座標系とは違うためでした。
この操作は、フレームバッファに書き込む時点では不要です。フレームバッファは
表示されることがないため、どちらが上か下かといった話とは無関係だからです。
フレームバッファの中でピクセル0,0が、エフェクトの計算上の0,0と一致している
ことだけ意識していればよいのです。このため、上下をひっくり返すかどうかは、
シェーダーの入力の一つ(u_flipY)を使って決められるようにしています。

```
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
...
uniform float u_flipY;
...

void main() {
   ...

   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);

   ...
}
&lt;/script&gt;
```

そして、これをレンダリングの時点でセットしています。

```
  ...

  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  ...

  // don't flip
  gl.uniform1f(flipYLocation, 1);

  ...

  // flip
  gl.uniform1f(flipYLocation, -1);

```

I kept this example simple by using a single GLSL program that can achieve
multiple effects.  If you wanted to do full on image processing you'd
probably need many GLSL programs.  A program for hue, saturation and
luminance adjustment.  Another for brightness and contrast.  One for
inverting, another for adjusting levels, etc.  You'd need to change the
code to switch GLSL programs and update the parameters for that particular
program.  I'd considered writing that example but it's an exercise best
left to the reader because multiple GLSL programs each with their own
parameter needs probably means some major refactoring to keep it all from
becoming a big mess of spaghetti.

I hope this and the preceding examples have made WebGL seem a little more
approachable and I hope starting with 2D helps make WebGL a little easier
to understand.  If I find the time I'll try to write [a few more
articles](webgl-2d-translation.html) about how to do 3D as well as more
details on what WebGL is really doing under the hood.  For a next step
consider learning [how to use 2 or more textures](webgl-2-textures.html).


