Title: WebGLのテクスチャ
Description: WebGLのテクスチャの扱い方
TOC: テクスチャ


この記事はWebGLの連載シリーズのひとつである。
連載は「[WebGLの基本](webgl-fundamentals.html)」から始まり、
前回は[アニメーション](webgl-animation.html)について説明した。

WebGLでテクスチャを使用するにはどうすればよいだろう。
[WebGLにおける画像処理](webgl-image-processing.html)を読めばその方法がわかるかもしれないが、
このページではもう少し詳しく解説をしよう。

まず最初に、シェーダーを調整する必要がある。
以下のコードは、頂点シェーダーの変更だ。
頂点シェーダーではフラグメントシェーダーへテクスチャ座標を渡す必要があるが、
特に何もせずストレートに受け渡しをすればよい。

    attribute vec4 a_position;
    *attribute vec2 a_texcoord;

    uniform mat4 u_matrix;

    *varying vec2 v_texcoord;

    void main() {
      // 座標データを行列で乗算する。
      gl_Position = u_matrix * a_position;

    *  // テクスチャ座標をフラグメントシェーダーへ渡す。
    *  v_texcoord = a_texcoord;
    }

フラグメントシェーダーでは、`sampler2D`というuniform変数を定義する。
これはテクスチャを参照する変数だ。
そして、頂点シェーダーから渡されたテクスチャ座標をもとに、
`texture2D`を実行してテクスチャから色を抽出する。

    precision mediump float;

    // 頂点シェーダーから渡されたテクスチャ座標
    *varying vec2 v_texcoord;

    *// テクスチャー
    *uniform sampler2D u_texture;

    void main() {
    *   gl_FragColor = texture2D(u_texture, v_texcoord);
    }

次に、JavaScript側でテクスチャ座標を設定しよう。

    // テクスチャ座標の書き込み先となる、シェーダーのattributeのロケーションを得る。
    var positionLocation = gl.getAttribLocation(program, "a_position");
    *var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

    ...

    *// テクスチャ座標を格納するためのバッファーを作成する。
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    *gl.enableVertexAttribArray(texcoordLocation);
    *
    *// 32bit浮動小数点数(float)でシェーダーへ渡す。
    *gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    *
    *// テクスチャ座標を設定する関数を実行する。
    *setTexcoords(gl);

立体「F」を構成する各四角形それぞれにテクスチャすべてをマッピングしている関数が以下である。
※「F」は、16枚の四角形（四角形一つにつき二つの三角形ポリゴンで構成）で成り立っている。

    *// 「F」に適用するテクスチャ座標をバッファーに格納する。
    *function setTexcoords(gl) {
    *  gl.bufferData(
    *      gl.ARRAY_BUFFER,
    *      new Float32Array([
    *        // 左縦列
    *        0, 0,
    *        0, 1,
    *        1, 0,
    *        0, 1,
    *        1, 1,
    *        1, 0,
    *
    *        // 上の横棒
    *        0, 0,
    *        0, 1,
    *        1, 0,
    *        0, 1,
    *        1, 1,
    *        1, 0,
    * ...
    *       ]),
    *       gl.STATIC_DRAW);

座標を設定できたら、次はテクスチャが必要だ。
一から作成することもできるが、今回は最も一般的な方法である
画像を読み込む方法で進めてみよう。

以下の画像が今回使用するテクスチャである。

<img class="webgl_center" src="../resources/f-texture.png" />

おいおい、めちゃくちゃイケてる画像じゃないか...！
実際「F」の画像というのは、方向がはっきりしている画像である。
そのため、
回転しているのか・反転しているのかなどを判別しやすく
テクスチャとして使用するのに適している。

ところで、ブラウザでは画像の読み込みは非同期で行われる。
画像の読み込みをリクエストして、
ブラウザがダウンロードを完了するまで多少時間がかかる。
この問題を解決する方法は二つある。
一つ目は、テクスチャがダウンロードを完了するまで待ち、その後描画を開始する方法。
二つ目は、仮のテクスチャを事前に作成しておく方法。
この方法であれば、画像のダウンロードを待たずすぐに描画を始めることができる。
画像がダウンロードされたら、仮で作成しておいたテクスチャにダウンロードした画像をコピーすればよい。
以下、後者の方法で進めよう。


    *// テクスチャを作成する。
    *var texture = gl.createTexture();
    *gl.bindTexture(gl.TEXTURE_2D, texture);
    *
    *// 1x1の青色ピクセルで構成される仮のテクスチャを作成する。
    *gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    *              new Uint8Array([0, 0, 255, 255]));
    *
    *// 非同期で画像を読み込む。
    *var image = new Image();
    *image.src = "resources/f-texture.png";
    *image.addEventListener('load', function() {
    *  // 画像が読み込めたら、仮のテクスチャに画像をコピーする。
    *  gl.bindTexture(gl.TEXTURE_2D, texture);
    *  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    *  gl.generateMipmap(gl.TEXTURE_2D);
    *});

以上を踏まえると、下記のようになる。

{{{example url="../webgl-3d-textures.html" }}}

さて、上記の例は「F」を構成するそれぞれの四角形別々にテクスチャを貼っているが、
立体「F」の前面にちょうどテクスチャの「F」の部分を貼りたい時はどうすればよいか考えてみよう。
結論、`setTexcoords`関数を変更すればよい。

まず最初に、テクスチャ座標の基本について理解しよう。
テクスチャは「テクスチャ座標」で参照され、
その座標の範囲は左から右へ0.0〜1.0、
最初の行の最初のピクセルから最後の行の最後のピクセルへ0.0から1.0である。
後者について、なぜ「上下」という表現を使わないのか？
それはテクスチャの座標系においては、「上下」は意味を持たないからである。
なぜなら、あなたが何かを描画してその方向づけを行うまでは、上下の概念が確定しないからだ。
とにかく、重要なのはWebGLにテクスチャのデータを渡すこと。
そのデータの開始点はテクスチャ座標の(0,0)、終了点は(1,1)である。

<img class="webgl_center noinvertdark" width="405" src="resources/texture-coordinates-diagram.svg" />

次に、photoshopにテクスチャを読み込ませて、座標をピクセル単位で調べてみよう。

<img class="webgl_center" width="256" height="256" src="../resources/f-texture-pixel-coords.png" />

ピクセル座標からテクスチャ座標へ変換するには、下記のようにすればよい。

    texcoordX = pixelCoordX / (width  - 1)
    texcoordY = pixelCoordY / (height - 1)

「F」の前面全体に適用するテクスチャ座標は、以下のようになる。

    // 左縦列
     38 / 255,  44 / 255,
     38 / 255, 223 / 255,
    113 / 255,  44 / 255,
     38 / 255, 223 / 255,
    113 / 255, 223 / 255,
    113 / 255,  44 / 255,

    // 上の横棒
    113 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 85 / 255,
    218 / 255, 44 / 255,

    // 真ん中の横棒
    113 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 151 / 255,
    203 / 255, 112 / 255,

上記に加えて「F」の裏側も同じようにテクスチャ座標を調整した結果、以下のようになる。

{{{example url="../webgl-3d-textures-texture-coords-mapped.html" }}}

あまり面白い見た目ではないかもしれないけど。。
これでテクスチャ座標の使い方がわかってもらえると嬉しい。
もし立方体や球体など簡単なジオメトリを作成する場合なら、
テクスチャ座標は簡単に計算することができる。
しかし、Blender・Maya・3D Studio Maxなどの3Dモデリングソフトでモデリングされた場合は、
テクスチャ座標はコード上ではなくそのソフト内で調整することになるだろう。

ところで、0.0から1.0の範囲を越えたテクスチャ座標を設定したらどうなるか考えてみよう。
WebGLのデフォルトは、繰り返し表示である。
0.0から1.0で、「1単位のテクスチャのコピー」と考えてみよう。
例えば、1.0から2.0の範囲でも1単位のコピーだ。
-4.0から-3.0の範囲でも1単位のコピーである。
これらの範囲を設定した板ポリゴン（平面）を描画してみよう。
0.0〜1.0の範囲外の座標を設定するため、
`setTexcoords`を下記のように編集する。

     -3, -1,
      2, -1,
     -3,  4,
     -3,  4,
      2, -1,
      2,  4,

その結果が下記だ。

{{{example url="../webgl-3d-textures-repeat-clamp.html" }}}

WebGLのデフォルトは繰り返しだが、
`CLAMP_TO_EDGE`を使用することで特定の方向へ繰り返しをさせないようにすることができる。

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

上記のサンプルの中のボタンをクリックして、表示の違いを確認してほしい。

さて、ここで気づいた人もいるかもしれないが、
テクスチャを読み込む時に`gl.generateMipmap`という関数を実行していることに注目してほしい。
これはどういう意味があるのだろうか？

下図のような16x16（ピクセル）のテクスチャがあったとする。

<img class="webgl_center" src="resources/mip-low-res-enlarged.png" style="border: 2px solid black;" />

例えば、2x2の大きさの板ポリゴン（平面）にこの16x16のテクスチャを描画したいとしよう。
このとき、この2x2=4pxをそれぞれ何色で塗ればよいだろうか？
当然、16x16=256通りから選ぶことになる。
例えばPhotoshopであれば、16x16の四隅の8x8の部分をそれぞれ平均化し、
2x2の画像にする。
しかし、この8x8=64pxをすべて読み取って平均化する上記の方法は、
GPUにとってはあまりに負荷が多い処理方法だ。
極端な例で考えてみよう。
2048x2048のサイズのテクスチャを持っていたとして、それを2x2サイズで描画する場合で考える。
Photoshopの例なら、2048x2048の四隅である1024x1024=100万px以上。。を平均化することになる。
これでは、高速に処理するには無理な方法である。

なので、GPUが採用する方法は「ミップマップ」というものである。
ミップマップとは、一番大きい元のサイズを基準にして、徐々に小さくなっていく画像の集まりである。
それぞれの画像は、前のイメージの大きさの1/4のサイズである。
例えば、上図の例であげた16x16のテクスチャのミップマップは以下のようになる。

<img class="webgl_center noinvertdark nobg" src="resources/mipmap-low-res-enlarged.png" />

`gl.generateMipmap`は行うことは、元となる大きな画像を参照し、
それをバイリニア補間をしてそれぞれの大きさのミップマップを作成することだ。
この関数を使わず、自ら小さい画像を用意しミップマップを揃えることも可能である。

16x16のテクスチャを2x2のサイズで描画するとき、
WebGLは前のミップから平均化された2x2のミップを選択することができる。

テクスチャのフィルタリングを設定して、WebGLが行う処理を選択することができる。
以下の6つのモードだ。

*   `NEAREST` = 最大サイズのミップから、1ピクセルを選択する
*   `LINEAR` = 最大サイズのミップから4ピクセルを選択し、それらをブレンドする
*   `NEAREST_MIPMAP_NEAREST` = 最適なサイズのミップを選択し、その中の1ピクセルを選択する
*   `LINEAR_MIPMAP_NEAREST` = 最適なサイズのミップを選択し、その中の4ピクセルを選択しブレンドする
*   `NEAREST_MIPMAP_LINEAR` = 最適なサイズのミップを二つ選択し、それぞれから1ピクセルずつ選択しブレンドする
*   `LINEAR_MIPMAP_LINEAR` = 最適なサイズのミップを二つ選択し、それぞれから4ピクセルずつ選択しブレンドする

これから二つの実装例を通して、ミップマップの重要性を学ぼう。
まず最初の例を見てみよう。
ここでは、最大サイズのミップしか使用しない`NEAREST`または`LINEAR`を採用する場合に多くの「ちらつき」が発生することがわかる。
サイズと位置がアニメーションで変更されるとき、
あるフレームではとある1pxを抽出し、また別のフレームではまた別の1pxを抽出するので、
大きなちらつきが発生する訳である。
下記の例で具体例を示す。

{{{example url="../webgl-3d-textures-mips.html" }}}

それぞれの行について、
左と真ん中はちらつきが大きく、逆に右はちらつきが小さいことに注目しよう。
また、右側はミップ(最大サイズではない、バイリニア補間されたミップ)を使用しているため色が混ざっていることが確認できる。
一般的に、WebGLは描画するテクスチャが小さければ小さいほど、大元の大きなテクスチャから抽出するピクセル幅は大雑把になる。
例えば、一番下の真ん中のテクスチャは`LINEAR`で4つのピクセルをブレンドしているにもかかわらず、ちらつきが大きくなっている。
この4つのピクセルは、16x16画像の四隅それぞれから1pxずつ抽出されているので、
それぞれの四隅のうちのどのピクセルを採用するかで色は大きく変化するはずである。
右下のテクスチャは`LINEAR_MIPMAP_NEAREST`であり、一番小さいサイズ(1x1)から数えて二番目のミップ(2x2)を使用している。
そのため、ちらつきが少なくほぼ色の変化がない。

二つ目の例は、画面の奥にポリゴンが続いているような描画だ。

{{{example url="../webgl-3d-textures-mips-tri-linear.html" }}}

画面の奥へ向かう6本の線は、それぞれ別々の6つのフィルタリングモードを適用している。
左上の線は`NEAREST`を使用しているのだが、明らかにブロック状になっていることがわかるだろう。
中央（上）の線は `LINEAR`を使用しているが、そこまで良い表示ではない。
右上は`NEAREST_MIPMAP_NEAREST`を使用している。
ここで、ミップをどう使用しているかわかりやすく表示させるため、画面をクリックしてみてほしい。
奥行きに応じてミップが異なる色に変わり、どのサイズのミップが採用されているかわかりやすくなっただろう。この表示をもとに次の解説を読み進めてほしい。
左下は`LINEAR_MIPMAP_NEAREST`であり、最適なミップを一つ選択し4ピクセルを抽出しブレンドする。
このとき、ミップとミップの間の境界線がはっきり見えてしまっていることがわかるだろう。
中央（下）の線は`NEAREST_MIPMAP_LINEAR`であり、最適な2つのミップを選択し、それぞれから1ピクセルずつ選んでブレンドしている。
これでもまだ一部ブロック状になっていることが確認できる。
最後に右下は`LINEAR_MIPMAP_LINEAR`で、最適な4つのミップを選択し、それぞれから4ピクセルずつ選んで8ピクセルすべてをブレンドしている。


<img class="webgl_center noinvertdark nobg" src="resources/different-colored-mips.png" />
<div class="webgl_center">異なる大きさのミップそれぞれに異なる配色を施したミップマップ</div>

上記の例の通り`LINEAR_MIPMAP_LINEAR`が一番綺麗に描画されるのだが、
ではこのフィルタリング方法だけを使えば良いのではないか、という疑問が生まれるだろう。
ところがそうはいかない。三つ留意するべきポイントがある。

一つ目は、`LINEAR_MIPMAP_LINEAR`は最も負荷が高い方法ということだ。
単純に、8ピクセルを読み込むことは1ピクセルを読み込むことより時間がかかる。
今時のGPUを前提としたときに、例えば一つのテクスチャを使用する場合だとさほど問題にはならないだろう。
しかし、今時のゲームは一度に2〜4枚ほどのテクスチャを使用することもある。
この場合、1ピクセルを描画するために、4テクスチャx8ピクセル=32ピクセルを読み込まなければならない。
当然処理は遅くなってしまうだろう。

二つ目のポイントは、特定の効果を生み出したい場合だ。
例えば、ゲームボーイのようなレトロなゲームの雰囲気を作りたいのであれば`NEAREST`を使用してピクセルアートっぽく描画するとよいだろう。

三つ目のポイントとして、そもそもミップマップは多くのメモリーを消費する。
実際、未使用時と比べて33%も多くメモリーを消費するのである。
特に、ゲームのタイトル画面で使用されるような大きなサイズのテクスチャは、ミップマップを作成すると多くのメモリを必要とする。
もし、一番大きなミップより小さいものを描画する必要がないのであれば、そもそもミップマップを作成する必要はないだろう。
`NEAREST`または`LINEAR`を使用すればよいだけだ。

どのフィルタリングを採用するかは、`gl.texParameter`を使用して下記のように記述すればよい。

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

`TEXTURE_MIN_FILTER`は、描画するサイズが最大のミップよりも小さい場合に記述する。
`TEXTURE_MAG_FILTER`は、描画するサイズが最大のミップよりも大きい場合に記述する。
`TEXTURE_MAG_FILTER`は、`NEAREST`と`LINEAR`のみ設定できる。

ここで、もうひとつ違うテクスチャ画像の例を見てみよう。

<img class="webgl_center" src="../resources/keyboard.jpg" />

これを適用すると、こうなる。

{{{example url="../webgl-3d-textures-bad-npot.html" }}}

なぜキーボード画像のテクスチャが表示されないのだろう？
それは、テクスチャの縦・横のサイズそれぞれが2の累乗でない場合にWebGLが厳しい制約を設けているからである。
2の累乗とは、1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048などの数値のことだ。
今まで使用していた「F」のテクスチャは、256x256のサイズだった。256は2の累乗だ。
ところが、キーボードのテクスチャは320x240であり、縦も横も2の累乗ではないのでテクスチャ表示に失敗したという訳だ。
シェーダーで`texture2D`が実行されるとき、参照するテクスチャが正しく設定されていないと、WebGLは黒色を表す(0,0,0,1)を表示する。
またブラウザによっては、JavaScriptのコンソールやWebのコンソールで下記のようなエラーが吐かれているかもしれない。


    WebGL: INVALID_OPERATION: generateMipmap: level 0 not power of 2
       or not all the same size
    WebGL: drawArrays: texture bound to texture unit 0 is not renderable.
       It maybe non-power-of-2 and have incompatible texture filtering or
       is not 'texture complete'.

この問題を解決するには、繰り返しの設定を`CLAMP_TO_EDGE`に設定し、フィルタリングを`LINEAR`または`NEAREST`にしてミップマップを作成しない設定へ変更する必要がある。

2の累乗問題を修正するために、画像読み込みの記述を変更しよう。
まず、ある数値が2の累乗かどうかを判定する関数が必要だ。

    function isPowerOf2(value) {
      return (value & (value - 1)) == 0;
    }

なぜこれで2の累乗か判定できるのかは、一旦置いておこう。
そして、以下のように使用する。

    // 非同期で画像を読み込む。
    var image = new Image();
    image.src = "resources/keyboard.jpg";
    image.addEventListener('load', function() {
      // 画像が読み込めたら、仮のテクスチャに画像をコピーする。
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

    *  // 縦・横それぞれについて、2の累乗の数値かどうか判定する。
    *  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    *     // 2の累乗であれば、ミップマップを作成する。
         gl.generateMipmap(gl.TEXTURE_2D);
    *  } else {
    *     // 2の累乗であれば、ミップマップを作成しない。繰り返しをCLAMP_TO_EDGEに設定する
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    *  }
    }

上記を設定すると、次のようになる。

{{{example url="../webgl-3d-textures-good-npot.html" }}}

ところで、レンダリングできないのは「2の累乗ではないテクスチャ」だけではない。
WebGLは「テクスチャ・コンプリート」であることを求めている。
「テクスチャ・コンプリート」とは、下記のいずれかの条件を満たしていることである。

1. `TEXTURE_MIN_FILTER`を`LINEAR`または`NEAREST`に設定することで、一番大きいミップのみを使用するようにフィルタリングを設定すること。

2. ミップマップを使用する場合は正しいサイズで、1x1まで用意すること。

   上記を達成する一番簡単な方法は、`gl.generateMipmap`を実行すること。または自分ですべてのミップマップを用意すること。

3. テクスチャの縦・横のサイズが2の累乗でない場合は、`TEXTURE_MIN_FILTER`を`LINEAR`または`NEAREST`に設定し、
   **かつ**`CLAMP_TO_EDGE`を`TEXTURE_WRAP_S`または`TEXTURE_WRAP_T`に設定すること。

上記の三つの条件をいずれも満たさない場合は、シェーダーでテクスチャの値を取得しようとすると(0,0,0,1)が返されてしまう。

最後に、よくある質問である「立方体の各面に異なるテクスチャを適用するにはどうしたらいいだろう？」という疑問について考えてみよう。

<div class="webgl_table_div_center">
<table class="webgl_table_center">
<tr><td><img src="resources/noodles-01.jpg" /></td><td><img src="resources/noodles-02.jpg" /></td></tr>
<tr><td><img src="resources/noodles-03.jpg" /></td><td><img src="resources/noodles-04.jpg" /></td></tr>
<tr><td><img src="resources/noodles-05.jpg" /></td><td><img src="resources/noodles-06.jpg" /></td></tr>
</table>
</div>

方法として、三つの回答が思い浮かぶ。それぞれ見てみよう。

1) 6つのテクスチャを参照する複雑なシェーダーを作成し、頂点ごとの追加情報を頂点シェーダーに渡し、さらにそれがフラグメントシェーダーに渡されて、使用されるテクスチャが決定されるようにする。これはマジでダメな方法だ。少し考えればわかることだが、この方法だと複雑な形状の図形で、面の数が増えれば増えるほどシェーダーは複雑になってしまう。

2) 立方体ではなく、6つの平面を描画する。これは一般的な解決策だろう。これは悪い方法ではないが、立方体など単純な図形にしか使えない方法だ。もし、1000の板ポリゴンで描画される球体があったとして、それぞれに異なるテクスチャを適用したいとしよう。この場合1000個の板ポリゴンを描画する必要があり、これは処理が重いだろう。

3) すべてのテクスチャを一枚の画像に収める。テクスチャ座標を使って、立方体の各面それぞれにテクスチャの一部分をマッピングする。おそらくこれが一番の解決策だろう。これは、すべての高性能アプリ（ゲームも含む）が利用している解決法だ。

三つ目の方法を採用する場合、画像は下記のようになる。

<img class="webgl_center" src="../resources/noodles.jpg" />

そして、立方体の各面について異なるテクスチャ座標を設定しよう。

        // 左上の画像
        0   , 0  ,
        0   , 0.5,
        0.25, 0  ,
        0   , 0.5,
        0.25, 0.5,
        0.25, 0  ,
        // 上の真ん中の画像
        0.25, 0  ,
        0.5 , 0  ,
        0.25, 0.5,
        0.25, 0.5,
        0.5 , 0  ,
        0.5 , 0.5,
        // 右上の画像
        0.5 , 0  ,
        0.5 , 0.5,
        0.75, 0  ,
        0.5 , 0.5,
        0.75, 0.5,
        0.75, 0  ,
        // 左下の画像
        0   , 0.5,
        0.25, 0.5,
        0   , 1  ,
        0   , 1  ,
        0.25, 0.5,
        0.25, 1  ,
        // 下の真ん中の画像
        0.25, 0.5,
        0.25, 1  ,
        0.5 , 0.5,
        0.25, 1  ,
        0.5 , 1  ,
        0.5 , 0.5,
        // 右下の画像
        0.5 , 0.5,
        0.75, 0.5,
        0.5 , 1  ,
        0.5 , 1  ,
        0.75, 0.5,
        0.75, 1  ,

下が結果である。

{{{example url="../webgl-3d-textures-texture-atlas.html" }}}

このように、一枚のテクスチャで複数の画像を適用する方法を、「テクスチャアトラス」と呼ぶ。
ロードするテクスチャが一枚なので、シェーダーはひとつのテクスチャを参照するだけでよくなる。
また、先述の二つ目の方法で言及した板ポリゴン（平面）でそれぞれ描画する方法と比べて、
描画回数が1回で良いことから、これは最適な方法といえるだろう。

他にも、テクスチャについて学ぶべきことはいくつかある。
ひとつは、[テクスチャユニットが、どのように機能するか](webgl-texture-units.html)というテーマだ。
もうひとつは、[一度に二つ以上のテクスチャを適用する方法](webgl-2-textures.html)だ。
[他ドメインの画像を使用する方法](webgl-cors-permission.html)についても目を通しておきたい。
そこまで学習できたら、[透視投影での正しいテクスチャマッピング](webgl-3d-perspective-correct-texturemapping.html)を見ると良い。
トリビア級の知識だが、知っておいて損はないだろう。

次は、[WebGLのデータテクスチャ](webgl-data-textures.html)の話をしよう。
[少ないコードでより楽しくWebGLを簡素化する](webgl-less-code-more-fun.html)もチェックしてほしい。

<div class="webgl_bottombar">
<h3>UVとテクスチャ座標</h3>
<p>Texture coordinates（テクスチャ座標）は、よく"texture coords"とか"texcoords"、または単純に"UVs"と省略されたりする。
("Ew-Vees"と発音する)。 UVsという用語の由来ははっきりとはわからない。
ただ、頂点座標は<code>x, y, z, w</code>が使われるから、代わりにテクスチャ座標は<code>s, t, u, v</code>
を使うことになったのだと思う。ところで、(s,t)と(u,v)のうちどっちの組み合わせを使うべきなのだろう。
実際、テクスチャの折り返し設定では<code>TEXTURE_WRAP_S</code>と<code>TEXTURE_WRAP_T</code>という名前になっているから、
"Es-Tees"と呼んで良さそうだけど、私の仕事の経験上、なぜかみんな"Ew-Vees"と呼んでいた。
</p>
<p>ともかく、誰かが"UVs"と言ったらそれはテクスチャ座標のことを表している。</p>
</div>



