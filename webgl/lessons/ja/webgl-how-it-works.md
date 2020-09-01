Title: WebGLの仕組み
Description: WebGLが実際にはどのように動いているのかを説明する
TOC: WebGLの仕組み


この記事は「[WebGLの基本](webgl-fundamentals.html)」の続きである。
WebGLの話を進めるに当たって、WebGLやGPUが、実際には
どのように動作しているのかを取り上げようと思う。

始めに押さえておきたいのは「GPUは２つのことをやる」という点である。
１点目は、「頂点データ(頂点座標に限らず、与えられたバッファ上のデータストリーム)」を
「クリップ空間の座標データに変換処理する」こと、
２点目は、「１つ目の処理の結果」を元に「ピクセルを描画する」ことである。

## 頂点シェーダーの位置づけと役割
WebGLのコードで、

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 9;
    gl.drawArrays(primitiveType, offset, count);

と書いた場合、それは「９つの頂点データを処理せよ」という意味の、
GPUに対する命令である。

<img src="resources/vertex-shader-anim.gif" class="webgl_center" />

図中、左の"Original Vertices"(元となる頂点情報)は、あなた(プログラマ)が用意したデータである。

図中、中央の"Vertex Shader"(頂点シェーダー)とあるのは、
あなたが[GLSL言語](webgl-shaders-and-glsl.html)で書いた関数である。
頂点シェーダーは、元となる頂点１つにつき１回呼び出される。
頂点シェーダーでは、呼び出しに使われた「元となる頂点情報」に対応する「クリップ空間上の値」を、
何らかの計算をして求め、その値を特別な変数である「`gl_Position`」に書き込む。
GPUはその結果を取り出して、GPUが内部的に管理している専用の領域に保存する。

## ラスタライズ
保存されたデータは、今回のコードでは`drawArrays`呼び出しの際に「`TRIANGLES`」を指定したので、
GPUは上記の処理を頂点３つ分繰り返すたびに、そこで得られた「クリップ空間上の値」
３つを使って三角形(triangle)を構成する。
これによって、「三角形の頂点」を画面上のどのピクセルに対応付ければ良いかが割り出され、
三角形が「ラスタライズ」、つまり、ファンシーな表現で言えば「ドット絵として、描かれる」
ことになる。

## フラグメントシェーダーの位置づけと役割
GPUは、そうして描かれることになったピクセル一つ一つに対して、
あなたが提供したフラグメントシェーダーを呼び出して、
「そのピクセルはどんな色であるか」質問する。
フラグメントシェーダーは、特別な変数`gl_FragColor`に値をセットしてこの質問に回答
しなければならない。

ラスタライズとフラグメントシェーダーの仕組みは興味深いものであるが、ご存知のように
前回の講義で用意したサンプルプログラムでは
「フラグメントシェーダーが各ピクセルの色について答える」という部分は非常に単純なコードであり、
ほとんど何もしていなかった。
もっと多くの情報をフラグメントシェーダーに渡すことができるので、今回はそれをやってみよう。

## varying変数
頂点シェーダーからフラグメントシェーダーに情報を渡すために「varying」変数を使用する。
付け加えたい情報1件につき、1つの「varying」変数を定義する必要がある。

varyingの使い方の単純な例として、まずは「クリップ空間の座標データ」を
頂点シェーダーからフラグメントシェーダーに、そのまま、渡してみることにしよう。

今回は簡単な三角形を1つだけ描くことする。[前回のプログラム](webgl-2d-matrices.html)
で長方形を描いていたところを、三角形を描くように書き換える。

    // 三角形を定義する頂点のデータをバッファにセットする
    function setGeometry(gl) {
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
                 0, -100,
               150,  125,
              -175,  100]),
          gl.STATIC_DRAW);
    }

頂点数が3つになったので、シェーダーの呼び出し部分のcountも3に合わせる。

    // シーン(scene)を描画する
    function drawScene() {
      ...
      // 形状(geometry)を描画する
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 3;
      gl.drawArrays(primitiveType, offset, count);
    }

頂点シェーダーで、フラグメントシェーダーに渡すべきデータを
*varying*変数として宣言する。

    *varying vec4 v_color;
    ...
    void main() {
      // 座標データを行列で乗算する
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

      // 「クリップ空間」から「色空間」へ変換する。
      // クリップ空間は -1.0 ～ +1.0
      // 色空間は 0.0 ～ 1.0
    *  v_color = gl_Position * 0.5 + 0.5;
    }

同じ*varying*変数を、フラグメントシェーダーでも宣言する。

    precision mediump float;

    *varying vec4 v_color;

    void main() {
    *  gl_FragColor = v_color;
    }

これでWebGLは、「頂点シェーダで宣言されたvarying変数」を、
「同じ名前同じ型で宣言されたフラグメントシェーダー上のvarying変数」に接続する。

以上のコードを動かすと下のようになる。

{{{example url="../webgl-2d-triangle-with-position-for-color.html?ui-angle=角度&ui-scaleX=X方向の拡大率&ui-scaleY=Y方向の拡大率" }}}

上の画面でスライダを動かして、平行移動、回転、拡大縮小してみよう。
クリップ空間で計算された色が、三角形と共に動いていないことに気づいただろうか。
色は、背景に張り付いたような動きをしている。

ちょっと考えてみよう。今回頂点シェーダーで扱ったのは頂点３つだけである。
頂点シェーダーは３回だけ呼び出され、色についても３つの色を計算しただけである。
実際に表示されている三角形はたくさんの色で描かれているのに、である。
これは、*varying*の名前の由来、「vary＝変化する」に秘密がある。

WebGLは３頂点分の値を得て、２つのシェーダーを使ってそれを計算し、
頂点の間を「補間(つまり、あいだを補う)」することで三角形としてラスタライズしている。
フラグメントシェーダーは、この「補間によって三角形を構成することになったピクセル」
ひとつひとつについて１回ずつ呼び出されるのである。

上のサンプルでは、以下の３つの頂点情報を使っていた。

<style>
table.vertex_table {
  border: 1px solid black;
  border-collapse: collapse;
  font-family: monospace;
  font-size: small;
}

table.vertex_table th {
  background-color: #88ccff;
  padding-right: 1em;
  padding-left: 1em;
}

table.vertex_table td {
  border: 1px solid black;
  text-align: right;
  padding-right: 1em;
  padding-left: 1em;
}
</style>

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="2">頂点</th></tr>
<tr><td>0</td><td>-100</td></tr>
<tr><td>150</td><td>125</td></tr>
<tr><td>-175</td><td>100</td></tr>
</table>
</div>

我々の頂点シェーダーは、この頂点データに行列を適用することで、「平行移動、
回転、拡大縮小、クリップ空間への変換」という４つの操作を行っている。
「平行移動」、「回転」、「拡大縮小」については、変換行列のデフォルト値は
「translation = (200, 150)」、「rotation = 0」、「scale = (1, 1)」だったので、
実際には平行移動しているだけである。
バックバッファは400x300としているので、「クリップ空間への変換」
によって上で示した３つの頂点座標は、以下の「クリップ空間座標上の値」に変換される。

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="2">gl_Positionに書き込まれる値</th></tr>
<tr><td>0.000</td><td>0.660</td></tr>
<tr><td>0.750</td><td>-0.830</td></tr>
<tr><td>-0.875</td><td>-0.660</td></tr>
</table>
</div>

さらに、この「クリップ空間上の値」を、「色空間上の値」に変換して、
今回宣言した*varying*変数のv_colorに書き込んでいる。

<div class="hcenter">
<table class="vertex_table">
<tr><th colspan="3">v_colorに書き込まれる値</th></tr>
<tr><td>0.5000</td><td>0.830</td><td>0.5</td></tr>
<tr><td>0.8750</td><td>0.086</td><td>0.5</td></tr>
<tr><td>0.0625</td><td>0.170</td><td>0.5</td></tr>
</table>
</div>

v_colorに書き込まれたこれら３つの値は、補間され、
描かれるピクセルごとにフラグメントシェーダーに渡される。

{{{diagram url="resources/fragment-shader-anim.html" width="600" height="400" caption="v_colorは頂点v0, v1, v2の間で補間される" }}}

以上で「頂点シェーダー経由でフラグメントシェーダーにデータを渡す」ことができた。


## 別の例
次は、２つの、色違いの三角形で構成された長方形を描いてみよう。
フラグメントシェーダーに別のデータを送る。

まず頂点シェーダーがデータを受け取れるように、新たなattributeを追加する。
そしてその内容を、そのままフラグメントシェーダーに渡すようする。

    attribute vec2 a_position;
    +attribute vec4 a_color;
    ...
    varying vec4 v_color;

    void main() {
       ...
      // attributeで受け取った色のデータをvarying変数にコピーする。
    *  v_color = a_color;
    }

使いたい色のデータをWebGLに与える。

      // 頂点データの書き込み先となる、シェーダーのattributeのロケーションを得る。
      var positionLocation = gl.getAttribLocation(program, "a_position");
    +  var colorLocation = gl.getAttribLocation(program, "a_color");
      ...
    +  // 色データを渡すためのバッファーを生成する。
    +  var colorBuffer = gl.createBuffer();
    +  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    +  // 色をセットするために用意した関数を呼び出す。
    +  setColors(gl);
      ...

    +// 長方形を構成する２つの三角形の色のデータを
    +// バッファに書き込む。
    +function setColors(gl) {
    +  // 各三角形の色はランダム。
    +  var r1 = Math.random();
    +  var b1 = Math.random();
    +  var g1 = Math.random();
    +
    +  var r2 = Math.random();
    +  var b2 = Math.random();
    +  var g2 = Math.random();
    +
    +  gl.bufferData(
    +      gl.ARRAY_BUFFER,
    +      new Float32Array(
    +        [ r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r1, b1, g1, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1,
    +          r2, b2, g2, 1]),
    +      gl.STATIC_DRAW);
    +}

レンダリングのタイミングで、色データのattributeをセットする。

    +gl.enableVertexAttribArray(colorLocation);
    +
    +// colorBufferをバインドする。
    +gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    +
    +// colorBuffer(ARRAY_BUFFER)に書き込んだデータを、
    +// 頂点シェーダーがcolor attributeとしてどのように読み出すかを設定する。
    +var size = 4;          // １回あたり４コンポーネント
    +var type = gl.FLOAT;   // データは32bit浮動小数点数(float)
    +var normalize = false; // データの正規化は行わない
    +var stride = 0;        // 0 = 「次のデータはsize * sizeof(type)bytes先にある」という意味
    +var offset = 0;        // バッファの先頭から
    +gl.vertexAttribPointer(
    +    colorLocation, size, type, normalize, stride, offset)

シェーダーを呼び出す部分では、三角形２つ＝６頂点なのでcountを6に変更する。

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

実行結果はこのようになる。

{{{example url="../webgl-2d-rectangle-with-2-colors.html?ui-angle=角度&ui-scaleX=X方向の拡大率&ui-scaleY=Y方向の拡大率" }}}

それぞれ別の色の、単色の三角形が２つできた。WebGLで各頂点に対して
色のデータを指定して、GPUは各頂点の色のデータを頂点間で補間している。
今回は各三角形の３つの頂点に同じ色を指定したため、各三角形は単色になっている。
３頂点に別の色を指定して、頂点間で補間される様子を見たいなら
こんな風に変更すればよい。

    // 長方形を構成する２つの三角形の色のデータを
    // バッファに書き込む。
    function setColors(gl) {
    * // 各頂点の色はランダム。
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(
    *        [ Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1,
    *          Math.random(), Math.random(), Math.random(), 1]),
          gl.STATIC_DRAW);
    }

これで、*varying*が補間されて「vary=変化」の様子がグラデーションとして見えるようなった。

{{{example url="../webgl-2d-rectangle-with-random-colors.html?ui-angle=角度&ui-scaleX=X方向の拡大率&ui-scaleY=Y方向の拡大率" }}}

## まとめ
以上、別におもしろい結果ではなかったかも知れないが、これで「複数のattributeのデータを
頂点シェーダー経由でフラグメントシェーダーに渡す」ことができるようになった。
「[画像処理のサンプル](webgl-image-processing.html)」では、この方法を応用して
シェーダーに対して「texture coordinate(テクスチャ内の座標)」を渡しているので、
興味があれば確認してみるとよいだろう。

##「バッファ」や「各attribute関係の関数」は何をしているのか？

「バッファ」とは、GPUが「頂点データや各頂点と１対１で結びついたデータ」を
取り込むための仕組みである。
`gl.createBuffer`はバッファを生成する。
`gl.bindBuffer`は、操作対象のバッファを指定する。
`gl.bufferData`は、バッファにデータをコピーする。
これは通常、初期化のタイミングで行なわれる。

「バッファにデータを入れる」ことができたら、
次は、「バッファからデータを取り出す手順」、
つまり「頂点シェーダーのattributeへと取り込む手順」をWebGLに教える必要がある。

シェーダーのコード中でattribute変数が宣言されていると、WebGLは、
各attributeに対して自動的にロケーション(location)を割り当てる。
まず、それがどこなのかをWebGLに対して尋ねる。上の例では

    // 頂点データの書き込み先となる、シェーダーのattributeのロケーションを得る。
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var colorLocation = gl.getAttribLocation(program, "a_color");

の部分がこれに当たる。通常、この処理も初期化のタイミングで行なう。

attributeのロケーションが得られたら、描画する直前のタイミングで３つのコマンドを実行する。

    gl.enableVertexAttribArray(location);

１つめのコマンドは、WebGLに「データはバッファから渡す」と伝えるためのものである。

    gl.bindBuffer(gl.ARRAY_BUFFER, someBuffer);

２つめのコマンドは、「バッファ」を「`ARRAY_BUFFER`バインドポイント」に
バインドする(バインド(bind)は「結びつける」といった意味である)。
`ARRAY_BUFFER`は、WebGLが内部で定義しているグローバル変数である。

    gl.vertexAttribPointer(
        location,
        numComponents,
        typeOfData,
        normalizeFlag,
        strideToNextPieceOfData,
        offsetIntoBuffer);

３つめのコマンドは、「現在ARRAY_BUFFERバインドポイントに結びつけられているバッファ
からデータを取得する」ように、WebGLに対して命令するもので、「numComponents：１つの
頂点に対していくつコンポーネントがあるか(1個～4個)」、「typeOfData：データの型
(`BYTE`, `FLOAT`, `INT`, `UNSIGNED_SHORT`など)はどれか」、
「strideToNextPieceOfData：次のデータまで何バイトあるか」、
「offsetIntoBuffer：オフセット」といった、データ取得に必要な情報が添えられる。

numComponentsは常に１個から４個である。

一種類のデータに対してバッファを一つ割り当てる場合、
「ストライド(strideToNextPieceOfData)」と「オフセット(offsetIntoBuffer)」は常に0となるだろう。
「ストライド」の値が0というのは、「ストライドの量が、データ型とサイズに相応」という意味である。
「オフセット」の値が0というのは、「バッファの先頭のデータから読み出す」という意味である。
これらを0以外の値とする場合、処理は複雑になってくる。
それによってWebGLのパフォーマンスを限界まで引き出すことができる場合もあるが、
複雑になることとのトレードオフに見合う状況は多くあるまい。

以上が「バッファ」と「属性(attribute)」についての説明となる。

次回は「[シェーダーとGLSL](webgl-shaders-and-glsl.html)」について説明する。

<div class="webgl_bottombar"><h3>vertexAttribPointer関数にある「normalizeFlag引数」は何をするもの？</h3>
<p>
normalizeFlag(日本語で書くなら「正規化フラグ」)は、float(不動小数点数)以外のデータ
を扱うためにある。このフラグにfalseをセットすると、各データ型のデータがそのまま解釈される。
具体的には、BYTE型データなら-128～127、UNSIGNED_BYTE型なら0～255、SHORT型なら-32768～32767……となる。
</p>
<p>
このフラグにtrueをセットすると、「BYTE型の-128～127の範囲のデータ」は-1.0～+1.0へ、
「UNSIGHNED_BYTE型の0～255の範囲のデータ」は0.0～+1.0へと「正規化」される。
SHORT型データも同様に-1.0～+1.0へと「正規化」されるが、BYTE型データよりもデータの解像度は高くなる。
</p>
<p>
normalizeFlagを使う典型的な例は色情報のデータである。ほとんどの場合、色情報は0.0～1.0の数値で指定される。
RGBA(赤、緑、青、透明度)それぞれにfloat型を使った場合、１頂点あたりの色情報は16バイトとなる。
ここで、色情報をUNSIGNED_BYTE型で表現して、0は0.0、255は1.0、となるようにすれば、１頂点あたりの色情報は４バイト、即ち、floatを使った場合と比較して75%節約できる。
こういった節約は、複雑なジオメトリデータを使う場合、つまり、頂点数が多くデータの大きさが問題となるような状況で有効である。
</p>
<p>実際にコーディングしてみよう。データの取り出し方を指定する部分はこのようなコードになる。</p>
<pre class="prettyprint showlinemods">
  // colorBuffer(ARRAY_BUFFER)に書き込んだデータを、
  // 頂点シェーダーがcolor attributeとしてどのように読み出すかを設定する。
  var size = 4;                 // １回あたり４コンポーネント
*  var type = gl.UNSIGNED_BYTE;  // データは8bitのUNSIGNED_BYTE型
*  var normalize = true;         // データを正規化する
  var stride = 0;               // 0 =「次のデータはsize * sizeof(type)bytes先にある」という意味
  var offset = 0;               // バッファの先頭から
  gl.vertexAttribPointer(
      colorLocation, size, type, normalize, stride, offset)
</pre>
<p>そしてバッファに色情報をセットするコードは次のようになる。</p>
<pre class="prettyprint showlinemods">
// 長方形を構成する２つの三角形の色のデータを
// バッファに書き込む。
function setColors(gl) {
  // 各三角形の色はランダム。
  var r1 = Math.random() * 256; // これは、0～255.99999の値を取る。
  var b1 = Math.random() * 256; // これらの値は、
  var g1 = Math.random() * 256; // この下のコードで、
  var r2 = Math.random() * 256; // Uint8Arrayにセットされる段階で
  var b2 = Math.random() * 256; // 小数部が切り捨てられる。
  var g2 = Math.random() * 256;

  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(   // Uint8Array
        [ r1, b1, g1, 255,
          r1, b1, g1, 255,
          r1, b1, g1, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255,
          r2, b2, g2, 255]),
      gl.STATIC_DRAW);
}
</pre>
<p>
実行結果はこのようになる。
</p>

{{{example url="../webgl-2d-rectangle-with-2-byte-colors.html?ui-angle=角度&ui-scaleX=X方向の拡大率&ui-scaleY=Y方向の拡大率" }}}
</div>
