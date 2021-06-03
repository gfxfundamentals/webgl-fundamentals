Title: WebGLにおける画像処理
Description: WebGLで画像の加工処理をする方法
TOC: WebGLにおける画像処理


WebGLでは、画像の加工処理は簡単である。どれくらい簡単か？まずは続きを読んで頂きたい。
<!--more-->
この記事は、「[WebGLの基本](webgl-fundamentals.html)」の続きである。
あらかじめ「[WebGLの基本](webgl-fundamentals.html)」を読むことをお勧めする。

WebGLで画像を描くには「テクスチャー」を使う必要がある。
WebGLでは、レンダリングする際に「ピクセル」ではなく「クリッピング空間座標」を使用したが、
これと同じように、テクスチャを描く際には「テクスチャ座標」を使用する。
テクスチャ座標は、テクスチャの大きさに関わらず0.0から1.0の数値で指定する。

## テクスチャーとテクスチャ座標

長方形を１つだけ描く(WebGLが描くのは、正確には「２つの三角形」であるが)状況を想定すると、
WebGLが描画に必要とするのは「テクスチャーのどの部分が、長方形のどの部分に対応するのか」
という情報である。
頂点シェーダーからフラグメントシェーダーへこの情報を渡す際には、
「varying」と呼ばれる特殊な変数を使用する。varyとは英語で「可変」といった意味だ。
頂点シェーダで提供されるvaryingの値は、各ピクセルをフラグメントシェーダーで描く段階で
WebGLによって「補間」される。

では、テクスチャーを利用する機能を、[以前の記事](webgl-fundamentals.html)で使った
コードの最終版を元にして実装してみよう。

まず「テクスチャ座標」を受け取るためのアトリビュートと、
それを「頂点シェーダーからフラグメントシェーダーに渡す」仕組みを追加する必要がある。

    attribute vec2 a_texCoord;
    ...
    varying vec2 v_texCoord;

    void main() {
       ...
       // texCoord(テクスチャ座標)をフラグメントシェーダーに渡す。
       // GPUが各頂点間の補間を行う際、同時にこのtexCoordの値も補間される。
       v_texCoord = a_texCoord;
    }

次は、フラグメントシェーダーを変更する。
「描くべき色を、テクスチャを参照して判断する」ように変更する。

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // これが今回使うテクスチャ
    uniform sampler2D u_image;

    // 頂点シェーダーから渡された「テクスチャ座標」の値。
    varying vec2 v_texCoord;

    void main() {
       // テクスチャの色を参照する。
       gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>

## 画像からテクスチャーを生成する

２つのシェーダーが用意できたら、次は「画像をロード」して
「テクスチャーを生成」して「テクスチャーへ画像をコピー」する必要がある。
ブラウザーでは画像のロードは非同期に行われるので、画像のロード完了を待つための
ちょっとした仕組みが必要となる。
画像のロードが完了したタイミングで、描画を行うようにする。

    function main() {
      var image = new Image();
      image.src = "http://someimage/on/our/server";  // 同じドメインじゃないとダメ！
      image.onload = function() {
        render(image);
      }
    }

    function render(image) {
      ...
      // 前に書いたコード全部をここに書く……
      ...
      // 「テクスチャ座標」データの送り先(アトリビュート)のロケーションを取得する。
      var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

      // 長方形の各頂点とテクスチャ座標の対応付けを定義する
      var texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0.0,  0.0,
          1.0,  0.0,
          0.0,  1.0,
          0.0,  1.0,
          1.0,  0.0,
          1.0,  1.0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      // 「テクスチャー」を生成する
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // どんなサイズの画像でもレンダリングできるようにパラメータを設定する
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // テクスチャーに画像のデータをアップロードする
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ...
    }

以上で、WebGLで画像がレンダリングできた。
__注意__：WebGLの画像ロードにはセキュリティ上の制約があるため、
ローカルでこのサンプルを試す場合は何らかのWebサーバーを動かす必要がある。
この設定は[数分の作業](webgl-setup-and-installation.html)で終わる。

{{{example url="../webgl-2d-image.html" }}}

おもしろみがない？では、画像処理をやってみよう。例えば赤と青を入れ替えてみるのはどうだろうか。

    ...
    gl_FragColor = texture2D(u_image, v_texCoord).bgra;
    ...

これで赤と青を入れ替えることができた。

{{{example url="../webgl-2d-image-red2blue.html" }}}

## 他のピクセルの参照

やりたい画像処理が、いま描いているピクセルだけで完結せず「ほかのピクセル」の情報も
必要とする場合はどうすればよいだろうか？
WebGLはテクスチャを参照する際、0.0から1.0の値を取る「テクスチャ座標」を使用しているので、
元画像で「１ピクセル」移動するためにテクスチャ座標の数値をどれだけ移動すれば良いかは、
`onePixel = 1.0 / textureSize`といった計算で求めることができる。

これは「左右１ピクセルを参照してその平均の色で描く」というフラグメントシェーダーである。

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // 今回使うテクスチャ
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;

    // 頂点シェーダーから渡された「テクスチャ座標」の値。
    varying vec2 v_texCoord;

    void main() {
       // 「１ピクセル」に相当する、テクスチャ座標での大きさを求める
       vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

       // 左のピクセル、現在のピクセル、右のピクセルの色の平均値を求める
       gl_FragColor = (
           texture2D(u_image, v_texCoord) +
           texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) +
           texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
    }
    </script>

そしてJavaScriptからは、テクスチャサイズの情報を渡す。

    ...

    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    ...

    // 画像のサイズをセットする
    gl.uniform2f(textureSizeLocation, image.width, image.height);

    ...

これで「ぼかし」が表現できた。上の画像と比べてみよう。

{{{example url="../webgl-2d-image-blend.html" }}}

## 畳み込み行列

さて、「ほかのピクセル」を参照する方法がわかったので、今度は
「畳み込み行列(convolution kernel)」を使って、もっと汎用的に画像処理をやってみよう。
ここでは、3x3の行列(カーネル)を使うことにする。

「畳み込み行列」とは、ピクセルを描画する際に「縦横斜めに隣り合った周辺8ピクセルを参照」して、
「それぞれの値をそれぞれ何倍するか」を「3x3の行列で指定する」仕組みである。
そして得られた値をすべて足した結果を、「ウェイト(カーネルの全要素の値の合計)」と
「1.0」を比較して「より大きい方」で割る。
「ぼかし」の際に行なった「平均値を求める」仕組みの拡張と考えればよいだろう。

「畳み込み行列」について、ここではこれ以上の説明はしないが、興味があれば
[わかりやすい記事がある](https://docs.gimp.org/2.10/en/gimp-filter-convolution-matrix.html)
([日本語版](https://docs.gimp.org/2.10/ja/gimp-filter-convolution-matrix.html))ので、参考にするとよいだろう。
また、[この記事](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx)では
「畳み込み行列」をC++で実装したコードを見ることができる。

フラグメントシェーダーで「畳み込み行列」を実装すると、このようになる。

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // 今回使うテクスチャ
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;
    uniform float u_kernel[9];
    uniform float u_kernelWeight;

    // 頂点シェーダーから渡された「テクスチャ座標」の値。
    varying vec2 v_texCoord;

    void main() {
       vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
       vec4 colorSum =
         texture2D(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
         texture2D(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
         texture2D(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;

       // 計算の合計値のRGB値(赤緑青の色情報)の部分を「ウェイト」で割る。
       // 透明度の部分は1.0とする
       gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
    }
    </script>

JavaScript側からは「畳み込み行列」とその「ウェイト」の情報をシェーダーに送る。

     function computeKernelWeight(kernel) {
       var weight = kernel.reduce(function(prev, curr) {
           return prev + curr;
       });
       return weight <= 0 ? 1 : weight;
     }

     ...
     var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
     var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
     ...
     var edgeDetectKernel = [
         -1, -1, -1,
         -1,  8, -1,
         -1, -1, -1
     ];
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

これで、完成……。下の例では、ドロップリストで別のカーネルも試せるようにした。

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

以上、WebGLでの画像処理がどれほど簡単か、おわかりいただけたと思う。

次回の講義では「[画像に２つ以上のエフェクトをかける方法](webgl-image-processing-continued.html)」
について説明しよう。

<div class="webgl_bottombar">
<h3>サンプルコードでは<code>u_image</code>に値をセットしていないよ。どうして動くの？</h3>
<p>
シェーダーにおいては「uniformのデフォルト値は0」という決まりがあるため、
今回のサンプルではu_imageは「テクスチャユニット0を使う」という意味になる。
また「アクティブテクスチャのデフォルトはテクスチャユニット0」という決まりがあるため、
JavaScript側でbindTextureが呼ばれたタイミングでテクスチャーは
「テクスチャユニット0に自動的にバインド」される。
このため、明示的にu_imageに値をセットしなくても問題なく動作する。
</p>
<p>
WebGLには「テクスチャユニットの配列」がある。
シェーダー中の各「uniformのsampler変数」がそれぞれ「何番のテクスチャユニットを参照するか」
を指定するためには、まず「uniformのsampler変数」のロケーションを得て、それに対して
「目的のテクスチャユニットのインデックス」を指定する、という手順を使う。
</p>
<p>
例えば、実際のコードは次のようになる。
</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // テクスチャユニット6を使う。
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>
<p>
別のユニットのテクスチャを使いたい場合は、<code>gl.activeTexture</code>を呼び、
そのユニットのテクスチャをバインドする。例は以下のとおり。
</p>
<pre class="prettyprint showlinemods">
// テクスチャ「someTexture」を、テクスチャユニット6にバインドする。
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
こんな書き方もできる。
</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // テクスチャユニット6を使う。
// テクスチャ「someTexture」を、テクスチャユニット6にバインドする。
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
すべてのWebGL実装は最低8個のテクスチャユニットをサポートすることになっている。
仕様上サポートされるのは、フラグメントシェーダーでは最低8個、頂点シェーダーでは最低0個である。
8つより多くのテクスチャユニットを使いたい場合は、あらかじめ
<code>gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)</code>を呼んで利用可能な数を確認するべきである。
頂点シェーダーでテクスチャを扱いたい場合は
<code>gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)</code>を呼んで利用可能な数を確認する。
実際のWebGLの実装では、その99%が、頂点シェーダにおいて最低4つのテクスチャユニットをサポートしている。
</p>
</div>

<div class="webgl_bottombar">
<h3>GLSLコードでa_, u_, v_とかで始まる変数があるけどこれは何？</h3>
<p>
これは私が採用している命名規則の話で、文法上必要な規則ではない。
そういった名前にしておくとその変数がどこから来たのか見やすいので、慣習上、私はそうしている。
こうしておけば、「a_で始まる変数はアトリビュートでバッファーから持ってきたデータ」、
「u_はシェーダー共通のユニフォーム変数」、
「v_はvarying変数で頂点シェーダーからフラグメントシェーダーに送られたもので、
描画時に頂点間で補間されている」、といったことが一目でわかる。
各変数の意味や仕組みについては「<a href="webgl-how-it-works.html">WebGLの仕組み</a>」
の講義で説明しているので参考にするとよいだろう。
</p>
</div>

