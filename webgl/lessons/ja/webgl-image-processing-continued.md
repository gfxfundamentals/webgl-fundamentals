Title: WebGLにおける画像処理。続き
Description: WebGLで複数の画像加工処理をする方法
TOC: WebGLにおける画像処理。続き


この記事は、「[WebGLにおける画像処理](webgl-image-processing.html)」の続きである。
そちらをまだ学んでいない場合は、「[WebGLにおける画像処理](webgl-image-processing.html)」
から読み始めることをお勧めする。

画像処理の次の問題は「画像処理を複数行なうにはどうしたら良いか？」である。

もちろん、さまざまな処理のための専用シェーダーを毎度毎度生成することもできる。
専用のUI画面を用意して、使いたい画像処理エフェクトをユーザーが選択すると
カスタムメードのシェーダーがそのたびに生成される、といった仕組みは可能だろう。
この方法は万能ではないが、リアルタイムグラフィクスのためのエフェクト作成では
[実際に使われている](https://www.youtube.com/watch?v=cQUn0Zeh-0Q)方法である。

## フレームバッファの利用

より柔軟なやり方として、
「２枚のテクスチャを交互に使って、次々に別のエフェクトをかけていく」方法がある。

<div class="webgl_center"><pre>
元画像         -&gt; [ぼかし(Blur)]          -&gt; Texture 1
Texture 1      -&gt; [シャープ(Sharpen)]     -&gt; Texture 2
Texture 2      -&gt; [輪郭検出(Edge Detect)] -&gt; Texture 1
Texture 1      -&gt; [ぼかし(Blur)]          -&gt; Texture 2
Texture 2      -&gt; [Normal]                -&gt; Canvas</pre></div>

これを実現するためには「フレームバッファ」を使う必要がある。
WebGLやOpenGLの「フレームバッファ」は、フレームバッファという呼び名に反して
その実態はステータスの集合(＝添付データのリスト)に過ぎず、そもそもバッファではない。
呼び名の良し悪しはともかく、フレームバッファにテクスチャーを
添付するとそのテクスチャーに対して描画できるようになる。

では最初に、[前回の講義](webgl-image-processing.html)で書いた
テクスチャー生成コードを、関数として再定義しよう。

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

  // テクスチャーを生成し、画像を入れる。
  var originalImageTexture = createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
```

この関数を使って新たに２つのテクスチャーを作成、２つのフレームバッファにアタッチ(添付)する。

```
  // テクスチャを２つ生成して、フレームバッファにアタッチする。
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // 画像と同じサイズでテクスチャーを生成する
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);

    // フレームバッファを生成する
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // そこにテクスチャーをアタッチする。
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  }
```

様々なエフェクトを「畳み込み行列」として定義して、そのリストを用意する。

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

最後に、２つのテクスチャを交互に使って各エフェクトを次々にかけて行く。

```
  // 元画像から開始
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // テクスチャに書き込む時点では画像の上下をひっくり返さない
  gl.uniform1f(flipYLocation, 1);

  // このループでエフェクトをかけて行く。
  for (var ii = 0; ii < effectsToApply.length; ++ii) {
    // フレームバッファの一方を書き込み先として設定する。
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

    // フレームバッファで必要となるビューポートの設定をWebGLに伝える。
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // 今回適用するエフェクトの畳み込み行列をセット
    gl.uniform1fv(kernelLocation, kernels[name]);

    // 長方形を描画する
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
```
下の画面は、少々手を加えて柔軟なUIを付け足したバージョンである。
チェックを入れればそのエフェクトが適用される。
エフェクトの適用順はドラッグで変更できる。

{{{example url="../webgl-2d-image-processing.html" }}}

まだ説明していないことがいくつかある。

`gl.bindFramebuffer`を引数`null`で呼びだしているのは、
「フレームバッファではなくcanvasに書き込む」、という意味である。

WebGLは[クリッピング空間](webgl-fundamentals.html)からピクセルに変換
しなくてはならないが、この時WebGLが基準とするのが`gl.viewport`である。
レンダリングに使っているフレームバッファとcanvasはサイズが異なるため、
フレームバッファのテクスチャにレンダリングする時点、canvasにレンダリングする時点で、
それぞれビューポートを適切に設定する必要がある。

最後に、[元のサンプル](webgl-fundamentals.html)では、レンダリングの際にY座標を
ひっくり返していた。これは、WebGLでは座標(0,0)がcanvasの左下隅となっていて、
左上隅を基準とする従来の座標系とは違うためである。
この操作は、フレームバッファにレンダリングする際には不要となる。
フレームバッファは表示されることがないため、どちらが上か下かといった話とは無関係だからである。
フレームバッファのピクセル(0,0)が、エフェクトの計算上の(0,0)と一致していればよい。
これに対応するため、上下をひっくり返すかどうかはシェーダーの入力の一つ(u_flipY)
を使って決められるようにした。

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
...
uniform float u_flipY;
...

void main() {
   ...

   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);

   ...
}
</script>
```

そして、これをレンダリングのタイミングでセットする。

```
  ...

  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  ...

  // ひっくり返さない
  gl.uniform1f(flipYLocation, 1);

  ...

  // ひっくり返す
  gl.uniform1f(flipYLocation, -1);

```
## まとめ
今回はプログラムを単純にするため、GLSLプログラムを１つだけ使って、
複数のエフェクトを実現してみた。
本格的に画像処理をやろうとする場合は、GLSLプログラムを多数用意することになるだろう。
色相、彩度、輝度を調整するエフェクト用プログラム、明度、コントラストのエフェクト用プログラム、
反転させたり、量を調整したりするエフェクト用プログラム、といったものが必要となるだろう。
GLSLプログラムを切り替えたりパラメータを更新したりするため、コードを書き換える必要もあるだろう。
講義で実際にそういうサンプルプログラムを書くことも考えたが、
そういったことは読者の練習のために残しておくことにした。
複数のGLSLプログラムやそのパラメータを扱うのは、なかなか大変で、
プログラムが混沌とするのを抑えるためのリファクタリング作業は大掛かりなもの
になるだろう。

## 次回の講義に向けて
今回のサンプルプログラムやこれまで登場したサンプルによって、
WebGLが読者にとって近寄りやすいものとなれば幸いである。
二次元処理の話から始めたことで、
多少なりとも楽にWebGLを理解できるようになったのではないだろうか。

時間ができたら[三次元の扱い方](webgl-2d-translation.html)や、
[WebGLが裏でやっていることの詳細](webgl-how-it-works.html)について、
記事を書いてみるつもりだ。

次回は、「[２つ以上のテクスチャを使う方法](webgl-2-textures.html)」の講義に
なる予定である。
