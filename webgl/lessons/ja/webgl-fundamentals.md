Title: WebGLの基本
Description: 基本から最初のWebGLのレッスン
TOC: 基本


WebGLは三次元APIとして思われることも多い。
「WebGLを使えば_魔法のように_簡単に三次元の映像を表示出来るだろう」と思ってしまう人も多い。
実はWebGLはただのピクセルを書くエンジンである。WebGLで自分の作成したコードで点、線、
三角形を使って色々なタスクを記述することが出来る。
それ以上描きたければ点と線と三角形を使って自分のコードでWebGLを使うことが必要である。

WebGLはコンピュータのGPUで動く。だからGPUで起動出来るコードを提供しなければいけない。
そのために２つの関数を提供する必要がある。その関数は「頂点シェーダー」と「フラグメントシェーダー」と呼ばれ、
両方厳密なC/C++のような「[GLSL](webgl-shaders-and-glsl.html)」という言語で作成するものだ。その２つの組み合わせを「*プログラム*」という。

頂点シェーダーの役割は頂点の位置を計算すること。
その関数の導き出した頂点位置でWebGLは点と線と三角形を描く。
描いている最中フラグメントシェーダーを呼び出す。
フラグメントシェーダーの役割は描くピクセルごとに色の計算をすることである。

その２つの関数を起動する前にWebGL API経由でその関数の状況を指定する
ことが必要である。書きたい形ごとにWebGLの色々な状況を設定して、
そして`gl.drawArrays`か`gl.drawElements`の関数を呼び出したらGPUでシェーダーが起動する。

そのシェーダーの関数に提供したいデータはGPUにアップロードしなければいけない。
それは４つの方法がある。

1.  属性(attribute)とバッファー(buffer)

    バッファーはGPUにあるバイナリデータの配列。中身は頂点の位置や、法線や、色や、
    テクスチャーの座標などだが、好きなデータを入れること出来る。

    属性はバッファーからデータを取ってシェーダーに提供する設定である。
    例えばバッファーに位置ごとに三つの３２ビット数字が入っている。
    ある属性の設定でどのバッファーから位置を取り出すかと、どのようなデータを取り出すか
    （三つの３２ビット数字）とか、バッファーにそのデータは何処から始まるかとか、
    一つの位置から次の位置に何バイト飛ぶかとかである。

    バッファーは自由にデータを取ることが出来ない。
    代わりに頂点シェーダーを呼び出す回数を設定して、
    呼び出すごとに次のデータをバッファーから読んで属性にそのデータが入る。

2.  ユニフォーム(uniform)

    ユニフォームはシェーダーを起動する前に定義するシェーダーのグローバルの変数です。

3.  テクスチャー(texture)

    テクスチャーは自由にデータを読める配列です。
    よくテクスチャーにイメージとか写真とかか絵のデータを入れるが、
    テクスチャーはただのデータ配列なので色以外のデータを入れることも可能である。

4.  ヴァリイング（varying)

    ヴァリイングは頂点シェーダーからフラグメントシェーダーへデータを伝える方法です。
    描画する形による（点、線、三角形）頂点シェーダーに定義します。
    定義されたヴァリイングはフラグメントシェーダーが呼び出されている間補間される。

WebGLの"Hello World"

WebGLは２つのことしか求めていない。それはクリップ空間と色である。
プログラマーの役目はその２つのことをWebGLに与えることである。
そのため２つのシェーダーを与える。頂点シェーダーでクリップ空間の頂点座標を与えて、
そしてフラグメントシェーダーで色を与える。

クリップ空間座標はキャンバスの要素（canvas）のサイズに関係がなく、いつも−１から＋１になる。
以下は一番単純なWebGLの例である。

まず頂点シェーダーから始めよう。

    // バッファーからデータを取る属性
    attribute vec4 a_position;

    // 全てのシェーダーは「main」の関数がある
    void main() {

      // 特別の変数「gl_Position」を割り当てることは頂点シェーダーの役割である
      gl_Position = a_position;
    }

このコードを起動したらどのように動くか、
GLSLの代わりにJavaScriptで書かれていたとしたら以下のように動く、と想像してみるとよいだろう。

    // *** 擬似コード!! ***

    var positionBuffer = [
      0, 0, 0, 0,
      0, 0.5, 0, 0,
      0.7, 0, 0, 0,
    ];
    var attributes = {};
    var gl_Position;

    drawArrays(..., offset, count) {
      var stride = 4;
      var size = 4;
      for (var i = 0; i < count; ++i) {
         // positionBufferから次の４つの数値をa_positionの属性に読み込み
         const start = offset + i * stride;
         attributes.a_position = positionBuffer.slice(start, start + size);

         runVertexShader();　// ⇐　頂点シェーダーを呼び出す！
         ...
         doSomethingWith_gl_Position();
    }

実際にはGLSLのシェーダーでのデータ`positionBuffer`はバイナリに変換しなければならないので、
バッファーからデータを取り込む際の計算方法は異なる。
でも、頂点シェーダーはこのように動くと考えてよい。

次はフラグメントシェーダーが必要だ。

    // フラグメントシェーダーは既定の精度がないので選択することが必要である。
    // 「mediump」は一般的な既定の設定である。それは「中間の精度」の意味である。
    precision mediump float;

    void main() {
      // 特別の変数「gl_FragColor」を割り当てることは
      // フラグメントシェーダーの役割である
      gl_FragColor = vec4(1, 0, 0.5, 1); // 赤紫
    }

上記では`gl_FragColor`に`1, 0, 0.5, 1`に割り当てている。それは赤＝１，緑＝０、青＝０．５、透明度（アルファ）＝１。
WebGLでは、色は０〜１で指定する。

２つのシェーダーを書いたのでWebGLを始めよう！

まずHTMLのCanvas要素が必要である

    <canvas id="c"></canvas>

それをJavaScriptで調べられる

    var canvas = document.querySelector("#c");

それで`WebGLRenderingContext`を作成出来る

     var gl = canvas.getContext("webgl");
     if (!gl) {
        // no webgl for you!
        ...

そして先のシェーダーをコンパイルしてGPUにアップロードすることが必要なのでstringに入れることが必要である。
GLSLのstringをする方法はいくつかある。文字列の連結とか、AJAXでダウンロードすることとか、複数行テンプレートstring(multiline template strings)とか。
今回は、typeがJavaScriptではないscript要素に入れる方法をとる。

    <script id="vertex-shader-2d" type="notjs">

      // バッファーからデータを取る属性
      attribute vec4 a_position;

      // 全てのシェーダーは「main」の関数がある
      void main() {

        // 特別の変数「gl_Position」を割り当てることは頂点シェーダーの役割である
        gl_Position = a_position;
      }

    </script>

    <script id="fragment-shader-2d" type="notjs">

      // フラグメントシェーダーは既定の精度がないので選択することが必要である。
      // 「mediump」は一般的な既定の設定である。それは「中間の精度」の意味である。
      precision mediump float;

      void main() {
        // 特別の変数「gl_FragColor」を割り当てることは
        // フラグメントシェーダーの役割である
        gl_FragColor = vec4(1, 0, 0.5, 1); // 赤紫
      }

    </script>

本格的な三次元のエンジンは色々な方法で動的にコードを組み合わせてGLSLシェーダーを生成する。
しかし、このサイトであまり複雑なシェーダーを使わないので、シェーダー・コードを動的に組み合わせて生成する必要はない。

次に、シェーダーを作成し、GLSLのコードをアップロードし、シェーダーをコンパイルする関数が必要である。

    function createShader(gl, type, source) {
      // シェーダーを作成
      var shader = gl.createShader(type);
      // GLSLのコードをGPUにアップロード
      gl.shaderSource(shader, source);
      // シェーダーをコンパイル
      gl.compileShader(shader);
      // 成功かどうかチェック
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader; // 成功。シェーダーを返す
      }

      // エラーを表示
      console.log(gl.getShaderInfoLog(shader));
      // シェーダーを削除
      gl.deleteShader(shader);
    }

出来たら、その関数でシェーダー２つを作成出来る

    var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
    var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

それでその２つのシェーダーをプログラム(*program*)にリンク(*link*)する

    function createProgram(gl, vertexShader, fragmentShader) {
      // プログラムを作成
      var program = gl.createProgram();
      // プログラムに頂点シェーダーを付ける
      gl.attachShader(program, vertexShader);
      // プログラムにフラグメントシェーダーを付ける
      gl.attachShader(program, fragmentShader);
      // プログラムをリンクする
      gl.linkProgram(program);
      // 成功かどうかチェック
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;  // 成功。プログラムを返す
      }

      // エラーを表示
      console.log(gl.getProgramInfoLog(program));
      // プログラムを削除
      gl.deleteProgram(program);
    }

それを呼び出す

    var program = createProgram(gl, vertexShader, fragmentShader);

GLSLのプログラムを作成して、GPUにアップロードが出来たら、それにデータを与えることが必要である。
WebGL APIの役割のほとんどはGLSLプログラムにデータを与えることと動きの状況を設定することである。
今回のGLSLプログラムのインプットは`a_position`の属性しかない。
作成したプログラムに最初するべきことは属性のロケーションを調べることである

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

属性のロケーションを調べるのは描画する時ではなく、プログラムの初期化の時に行った方がいい。

属性はバッファーからデータを取るので、バッファーを作成しなければならない。

    var positionBuffer = gl.createBuffer();

WebGLのリソース（資源）を操るためグローバル結び点（bind point)に結び付けることが必要である。
結び点はWebGLの中のグローバル変数のようなものである。リソースを結び点に結びつけたら、その後
結び点でリソースを操る。さて、`positionBuffer`を結びつけよう。

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

そして、`ARRAY_BUFFER`という結び点を参照して、データをバッファーに入れる。

    // 三点の二次元頂点
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

ここでは色々なことが行われている。まず`positions`というJavaScriptの配列がある。WebGLは強く
型付けされたデータが要るので、 `new Float32Array(positions)`の部分は32ビット数値配列を
作成して、それに`positions`の内容をコピーする。それで`gl.bufferData`はそのデータをGPUに
ある`positionBuffer`にアップロードする。`positionBuffer`が`ARRAY_BUFFER`に結び付いている
ので`positionBuffer`はコピーの目標になっている。

`gl.bufferData`の最後の引数、`gl.STATIC_DRAW`は、そのデータをどのように使うのかという、WebGLに対する
ヒントである。`gl.STATIC_DRAW`は、「このデータはあまり更新しない」という意味である。

今までのコードが*初期化のコード*である。ウェブページをロードした時、一回だけ実行される。
下記のコードは*描画するコード*である。描画してほしい時に都度呼び出すコードである。

## 描画

描画する前にキャンバスを表示されているサイズと同じサイズにした方がいい。キャンバスには
2つのサイズがある。一つは内容の解像度で、それがキャンバスサイズである。それに表示のサイズもあり、
これはCSSで決定されている。他の方法より柔軟なので**キャンバスのサイズをCSSで設定した方がいい**。

キャンバスの解像度を表示されているサイズと同じにするため
[ここで説明しているヘルパー関数](webgl-resizing-the-canvas.html)を利用している。

ここにあるサンプルでは自分のウインドウで起動する場合、キャンバスのサイズは400x300になるが、
iframeの中で起動する場合iframeのサイズに合わせられる。CSSで決定しているのでどちらにも対処出来る。

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

クリップ空間上の値である`gl_Position`を、画面空間上のピクセルにどうやって変換するのかWebGLに教える必要がある。
そのためキャンバスのサイズを`gl.viewport`に渡す。

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

これは−1〜+１のクリップ空間から、ｘ軸は「0〜`gl.canvas.width`」に、y軸は「0〜`gl.canvas.height`」に変換するように、WebGLに設定するものである。

キャンバスをクリアする。`0, 0, 0, 0`は赤、緑、青、アルファ（透明度）なので、今回はキャンバスを透明にクリアする。

    // キャンバスをクリアする
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

WebGLにどのシェーダー・プログラムを起動してほしいか教える。

    // 作成したプログラム（シェーダー2つ）を設定する
    gl.useProgram(program);

次にWebGLにどうやってデータを上記で作ったバッファーからシェーダーの属性に読み込むかを教えることが必要である。
まず属性オンにする。

    gl.enableVertexAttribArray(positionAttributeLocation);

そしてデータの取り方を設定する。

    // positionBufferをARRAY_BUFFERに結び付ける
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 属性にどうやってpositionBuffer（ARRAY_BUFFER)からデータを取り込むか。
    var size = 2;          // 呼び出すごとに2つの数値
    var type = gl.FLOAT;   // データは32ビットの数値
    var normalize = false; // データをnormalizeしない
    var stride = 0;        // シェーダーを呼び出すごとに進む距離
                           // 0 = size * sizeof(type)
    var offset = 0;        // バッファーの頭から取り始める
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

`gl.vertexAttribPointer`の隠れている点が`ARRAY_BUFFER`に結び付いているバッファーを属性にも
結び付ける。つまり`positionBuffer`はこの属性に結び付く。`ARRAY_BUFFER`に他のバッファーを
結び付けても、属性はまだ`positionBuffer`に結び付いている。

GLSLの頂点シェーダーの立場から`a_position`は`vec4`である。

    attribute vec4 a_position;

`vec4`は４つの値がある。JavaScriptで表現するなら`a_position = {x: 0, y: 0, z: 0, w: 0}`に近い形になる。
上記では`size = 2`とした。属性の規定値は`0, 0, 0, 1`なので、この属性の最初の2つの値（xとy）はバッファーから取る。
zとwは既定値の0、1になる。

上記の全ての後やっとWebGLにシェーダーを起動することを頼める。

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

`count`は３になっているので頂点シェーダーは三回呼び出される。初回頂点シェーダーの属性の
`a_position.x`と`a_position.y`は`positionBuffer`の最初の2つの値になる。二回目、`a_position.xy`は
二番目の2つの値になる。三回目は最後の2つの値になる。

`primitiveType`は`gl.TRIANGLES`にしたので、頂点シェーダーは三回呼び出されるごとに、
WebGLは`gl_Position`に割り当てられた３つの値で三角形を描画する。キャンバスがどんなサイズで
あってもその値は-1~+1クリップ空間座標である。

この頂点シェーダーは、ただ`positionBuffer`の値を`gl_Position`にコピーしているので、三角形はこのクリップ空間座標に描画される。

      0, 0,
      0, 0.5,
      0.7, 0,

キャンバスのサイズが400x300のピクセルならWebGLはこのように頂点のクリップ空間から画面空間に変化する。

     クリップ空間          画面空間
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

その座標でWebGLは三角形を描画する。ピクセルごとにフラグメントシェーダーを呼び出す。
フラグメントシェーダーはただ`gl_FragColor`を`1, 0, 0.5, 1`とする。キャンバスの色はRGBの各チャンネルにつき
8ビットなので、WebGLは`[255, 0, 127, 255]`をキャンバスに書き込む。

これはライブサンプルである。

{{{example url="../webgl-fundamentals.html" }}}

上の場合にはこの頂点シェーダーは頂点の位置データを直接渡すだけである。その位置はもう
クリップ空間になっているので、何もしていない。*三次元の絵を描画したければ自分自身で
三次元データからクリップ空間に変換するシェーダーを作成しなければならない。WebGLはただの描画するAPIだから*。

三角形がなぜ真ん中から右上に位置するのかな〜という人もいると思うので、説明しよう。クリップ空間
でX軸は-1〜+1である。だから０は真ん中で正の値はその右になる。
上の方に位置する理由はクリップ空間のY軸が-1＝下端で、+1＝上端なので、0＝真ん中で正の値は
その上になるからである。

2次元のものならクリップ空間よりよく使われているピクセル空間の方が楽なので、`position`の座標を
ピクセルで与えて、ピクセル座標からクリップ空間に自動で変換するように、シェーダーの計算の仕方を変更しよう。
これは変更されたシェーダー：

    <script id="vertex-shader-2d" type="notjs">

    -  attribute vec4 a_position;
    *  attribute vec2 a_position;

    +  uniform vec2 u_resolution;  // キャンバスの解像度

      void main() {
    +    // positionはピクセルから0〜1に変換
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // 0〜1から0〜2に変換
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // 0〜2から-1〜+1（クリップ空間）に変換
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

    </script>

この変更に関して留意したい点：

*   `x`と`y`しか使ってないので`a_position`を`vec2`にした。 `vec2`は`vec4`に似てるがxとyしかない。

*   `u_resolution`というユニフォームを追加した。ユニフォームを設定するためにそのロケーションを調べることが必要である。

        var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

それ以外は上記のコメントでご理解頂けるだろう。`u_resolution`をキャンバスの解像度に設定すれば、
この頂点シェーダーが計算して`positionBuffer`に入っているピクセル座標をクリップ空間に変換する。

これで頂点座標をクリップ空間からピクセルに変更出来る。今回3つの頂点で出来ている三角形2つで四角形を描画する。

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);


どのプログラムを利用するかを定義してから、ユニフォームの値を設定出来る。`gl.useProgram`は、上記の`gl.bindBuffer`
と同じように、どのシェーダー・プログラムを使うかを定義する。その後`gl.uniform〜`の関数の全ては現行のプログラムの
ユニフォームを設定出来る。

    gl.useProgram(program);

    ...

    // resolutionを設定する
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

そして勿論２つの三角形を描画するため、先ほど頂点シェーダーを6回呼び出すことが必要なので`count`は
`6`にする。

    // 描画する
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

そしてこのようになる。

{{{example url="../webgl-2d-rectangle.html" }}}

Note: このサンプルとその後の全てのサンプルは、シェーダーのコンパイルとリンクの為の関数を
含んでいる[`webgl-utils.js`](/webgl/resources/webgl-utils.js)というライブラリを使っている。
サンプルを煩雑にさせたくないので、[ボイラプレート・コード・ライブラリ](webgl-boilerplate.html)にした。

前回と同じく、目立つのはこの四角形は下の方に位置していることだろう。WebGLは0,0を左下とみなしている。
2次元APIで一般的なように左上を0,0にしたければクリップ空間のｙ座標をひっくり返す。

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

それで四角形は期待通りになる。

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

四角形を定義している部分を関数にして、呼び出すときにサイズが設定出来るようにしよう。更に、描く色も設定出来る
ようにする。

まずフラグメントシェーダーを、色ユニフォームが使えるようにする。

    <script id="fragment-shader-2d" type="notjs">
      precision mediump float;

    +  uniform vec4 u_color;

      void main() {
    *    gl_FragColor = u_color;
      }
    </script>

そして、次にあるのは50個の四角形をランダムなサイズとランダムな色で描画するコードである。

      var colorUniformLocation = gl.getUniformLocation(program, "u_color");
      ...

      // 50個のランダム四角形をランダム色で描画する
      for (var ii = 0; ii < 50; ++ii) {
        // ランダム四角形の設定する
        // 最後にARRAY_BUFFERの結び点に結び付いたバッファーはpositionBufferだから
        // positionBufferにアップロードすることになる。
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // ランダムな色を設定する
        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

        // 四角形を描画する
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 6;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

    // 0〜(range - 1)の整数を作成して返す
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // バッファーに四角形の頂点を入れる

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...)は`ARRAY_BUFFER`の結び点に
      // 結び付いているバッファーにアップロードする。今まで一つのバッファーしかないけど、
      // 2つ以上あればgl.bufferDataを呼び出す前に変更したいバッファーをARRAY_BUFFERに
      // 結び付けることが必要である。

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

それでこれは50個の四角形である。

{{{example url="../webgl-2d-rectangles.html" }}}

気が付いて欲しい点はWebGLが結構単純なAPIということである。
まあ、ここまでの流れは「単純」とは言えないが、WebGLがやっていること自体は単純なことである。
ただプログラマーが書いた２つの関数（頂点シェーダーとフラグメントシェーダー）で三角形、線、
点を描画する。三次元にする為にはもっと複雑になるかもしれないが、その複雑さは、あなた、つまりプログラマーの手で、「より複雑なシェーダー」として追加される。
WebGLはただ単純な描画をするAPIである。

今回のサンプルでは1つの属性と2つのユニフォームでデータを提供した。
一般的には複数の属性と多くのユニフォームを使う。この記事の上の方で*ヴァリイング*と*テクスチャー*を紹介した。
それらについていずれ説明しよう。

次に行く前に言っていおきたいのだが、*ほとんどの*アプリケーションでは、このサンプルの`setRectangle`のようにバッファーのデータを更新することは一般的ではない。
しかし、GLSLならちょっとだけ数学を使えば出来ることと、データはピクセル座標で提供することで、
簡単に説明出来ると思った。それは駄目な方法ではない。この方法が適切であるあるケースはいくつもあるのだが、
[WebGLで形状を移動、回転、拡大縮小する、より一般的な方法](webgl-2d-translation.html)についても一読しておくことをお勧めする。

ウェブページの制作経験があまりなければ（あっても）[インストールとセット・アップの記事](webgl-setup-and-installation.html)をチェックして、WebGLの開発の秘訣を参照して下さい。

WebGLの知識が全くなくて、GLSLとかシェーダーとか、GPUが何をするものなどか知らなければ[WebGLの基本的な動き方](webgl-how-it-works.html)をチェックしてください。

サンプルが使っている[ボイラプレート・コード・ライブラリについて](webgl-boilerplate.html)をざっと読んだ方がいい。
このサイトに載せてあるサンプルはほとんど一つの形状しか描画してないから、通常のWebGLアプリの構造を理解する為に[複数のものを描画する方法の記事](webgl-drawing-multiple-things.html)
もざっと目を通した方がいい。

いずれにしても、ここから2つの方向がある。画像処理に興味があれば[二次元画像処理の仕方](webgl-image-processing.html)を見て下さい。移動、回転、拡大／縮小、そして3次元のことに興味があれば[ここから始めよう](webgl-2d-translation.html)。

<div class="webgl_bottombar">
<h3>type=”notjs”はどいう意味？</h3>
<p>
<code>&lt;script&gt;</code>タグの内容は通常JavaScriptである。<code>type</code>は無しとか、<code>type=”javascript”</code>とか、<code>type=”text/javascript”</code>にしたら、ブラウザがタグ内容をJavaScriptとして解析する。それ以外にしたらブラウザがタグの内容を無視する。つまり<code>type=”notjs”</code>とか、<code>type=”foobar”</code>などはブラウザに意味がない。だからシェーダーのコードscriptタグに入れて簡単に編集が出来るようになる。
</p>
<p>
ストリングを連結する方法もある
</p>
<pre class="prettyprint">
  var shaderSource =
    "void main() {\n" +
    "  gl_FragColor = vec4(1,0,0,1);\n" +
    "}";
</pre>
<p>
AJAXでダウンロードする方法もあるが、これは遅くて非同期になる。
</p>
<p>
最近出た新たな方法は複数行のテンプレートを使うこと
</p>
<pre class="prettyprint">
  var shaderSource = `
    void main() {
      gl_FragColor = vec4(1,0,0,1);
    }
  `;
</pre>
<p>
複数行のテンプレートはWebGLに対応しているブラウザなら全てオッケーである。古いブラウザでは対応してないのでそれにサポートしたければ、
複数行テンプレートを利用しないことにするか、それとも<a href="https://babeljs.io/">トランスパイラー</a>を使うことにしたらいい。
</p>
</div>
