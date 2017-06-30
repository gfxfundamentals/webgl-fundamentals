Title: WebGLにおける画像処理
Description: WebGLで画像の加工処理をするには

WebGLでは、画像の加工処理は簡単です。どれくらい簡単かって？続きを読んでください。
<!--more-->
この記事は、「[WebGLの基礎](webgl-fundamentals.html)」の続きです。
あらかじめ「[WebGLの基礎](webgl-fundamentals.html)」を読むことをお勧めします。

WebGLで画像を描く場合、テクスチャを使う必要があります。
WebGLでレンダリングする際には、ピクセル単位ではなく「クリッピング空間」での座標を指定しますが、
これと同じように、テクスチャを描く際には「テクスチャ座標」を使用します。
テクスチャ座標は、テクスチャのサイズに関わらず0.0から1.0の数値で指定します。

長方形を描く場合(はい。WebGLだから正確には「２つの三角形を描く場合」ですね)、
「テクスチャのどの部分が、長方形のどの部分に対応するのか」という情報を、WebGLに教える必要があります。
頂点シェーダーからフラグメントシェーダーへこの情報を渡す際には、
「varying」と呼ばれる特殊な変数を使用します。varyとは英語で「可変」といった意味です。
フラグメントシェーダーで各ピクセルを描く際には、頂点シェーダに与えた情報をWebGLが「補間(interpolate)」します。


[以前の記事の使った頂点シェーダーの最終版](webgl-fundamentals.html)を元にして、新たにテクスチャを使いたい場合、
「テクスチャ座標を頂点シェーダーにアトリビュートとして与える仕組み」と、
さらに「それを頂点シェーダーからフラグメントシェーダーに渡す仕組み」を追加する必要があります。

    attribute vec2 a_texCoord;
    ...
    varying vec2 v_texCoord;

    void main() {
       ...
       // texCoordをフラグメントシェーダーに渡す。
       // この時、GPUは長方形の各頂点の間の部分を補間して塗りつぶす。
       v_texCoord = a_texCoord;
    }

頂点シェーダーを変更したら、今度はフラグメントシェーダー側を、
「描くべき色を、テクスチャを参照して判断する」ように変更しましょう。

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // これが今回使うテクスチャ
    uniform sampler2D u_image;

    // 頂点シェーダーから渡された、頂点座標が入った「texCoords」
    varying vec2 v_texCoord;

    void main() {
       // テクスチャを参照して、今描くべきピクセルの色を取り出す
       gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>

２つのシェーダーが用意できたら、今度は「画像をロード」して「テクスチャを作成」して
「テクスチャへ画像をコピー」する仕組みが必要です。
ブラウザーでは、画像のロードは非同期に行われるので、画像のロード完了を待つための
ちょっとした仕組みが必要になります。描画するのは、画像のロードが完了した後でなければなりません。

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
      // 「テクスチャ座標」情報を送る先を指定する
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

      // テクスチャオブジェクトを生成する
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // どんなサイズの画像でもレンダリングできるようにパラメータを設定する
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // テクスチャオブジェクトに画像のデータをアップロードする
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ...
    }

以上で、WebGLで画像がレンダリングできるようになりました。
注意：ローカルで動かす場合は、WebGLが画像をロードできるようにするために何らかのWebサーバーを動かす必要があります。
この設定は[数分の作業でできます](webgl-setup-and-installation.html)。

{{{example url="../webgl-2d-image.html" }}}

おもしろみがない？ちょっと軽く赤と青を入れ替えてみます？

    ...
    gl_FragColor = texture2D(u_image, v_texCoord).bgra;
    ...

赤と青を入れ替えてみました。

{{{example url="../webgl-2d-image-red2blue.html" }}}

いま描いているピクセルだけでなく、「ほかのピクセル」の情報も使うような加工の場合はどうでしょうか？
WebGLはテクスチャを参照する際、0.0から1.0の値を取る「テクスチャ座標」を使用しているので、
元画像で１ピクセル移動するためにテクスチャ座標の数値をどれだけ移動すれば良いかは、
<code>onePixel = 1.0 / textureSize</code>といったコードで知ることができます。

このコードは、「左右１ピクセルを見てその平均の色で描く」というフラグメントシェーダーです。

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // 今回使うテクスチャ
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;

    // 頂点シェーダーから渡された、頂点座標が入った「texCoords」
    varying vec2 v_texCoord;

    void main() {
       // １ピクセル分の、テクスチャ座標での大きさを求める
       vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

       // 左のピクセル、今のピクセル、右のピクセルの色の平均値を求める
       gl_FragColor = (
           texture2D(u_image, v_texCoord) +
           texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) +
           texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
    }
    </script>

そしてJavaScriptからは、テクスチャサイズの情報を渡します。

    ...

    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    ...

    // 画像のサイズをセット
    gl.uniform2f(textureSizeLocation, image.width, image.height);

    ...

これで、隣のピクセルの色の情報を使って「ぼかし」が表現できました。上の画像と比べてみてください。

{{{example url="../webgl-2d-image-blend.html" }}}

さて、「ほかのピクセル」を参照する方法がわかったので、今度は「畳み込み行列(convolution kernel)」を
使ってもっと応用的汎用的に画像処理をやってみましょう。ここでは、3x3の行列(カーネル)を使ってみます。
「畳み込み行列」は、ピクセルを描画する際に「縦横斜めに隣り合った周辺８ピクセルの値をそれぞれ何倍するか」、
「3x3の行列で指定する」という仕組みです。ウェイト(カーネルの全要素の値の合計)が1.0の場合と、
それより大きい場合では分けて考えます。
We then divide the result by the weight of the kernel (the sum of all values in the kernel) or 1.0,
whichever is greater.
畳み込み行列については、[この記事がお勧めです](http://docs.gimp.org/en/plug-in-convmatrix.html)
([日本語版](https://docs.gimp.org/ja/plug-in-convmatrix.html))。
また、[この記事ではC++で実装したコードが見られます](http://www.codeproject.com/KB/graphics/ImageConvolution.aspx)。

以上の仕組みを実装したフラグメントシェーダーを書いてみます。

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // 今回使うテクスチャ
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;
    uniform float u_kernel[9];
    uniform float u_kernelWeight;

    // 頂点シェーダーから渡された、頂点座標が入った「texCoords」
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

       // Divide the sum by the weight but just use rgb
       // 透明度は1.0とする
       gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
    }
    </script>

JavaScript側からは、畳み込み行列とそのウェイトの情報をシェーダーに送ります。

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

これで、完成……。下の例では、ドロップリストでほかのカーネルを選択できます。

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

WebGLでの画像処理がどれほど簡単か、おわかりいただけたのではないでしょうか。
次は、[２つ以上のエフェクトをかける](webgl-image-processing-continued.html)ことに挑戦しましょう。

<div class="webgl_bottombar">
<h3><code>u_image</code>に値をセットしていないよ。どうなるの？</h3>
<p>
Uniform変数のデフォルト値は0、という決まりがあるので、テクスチャユニット0が選択されます。
テクスチャユニット0はデフォルトのアクティブテクスチャでもあるため、
bindTextureメソッドが呼ばれた際にはテクスチャユニット0がバインドされます。
</p>
<p>
WebGLにはテクスチャユニットの配列があります。
uniform型の各サンプラー変数がどのテクスチャユニットを参照するかを指定するには、
まず「サンプラー変数のロケーションを得て」、それに対して「目的のテクスチャユニットのインデックスを指定」します。
</p>
<p>
例：
</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // テクスチャユニット６を使う。
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>
<p>
別のユニットのテクスチャを使いたい場合は、<code>gl.activeTexture</code>を呼び、
そのユニットのテクスチャをバインドします。例は以下のとおり。
</p>
<pre class="prettyprint showlinemods">
// テクスチャ「someTexture」を、テクスチャユニット６のテクスチャにバインドする。
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
こんな書き方もできます。
</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // テクスチャユニット６を使う。
// テクスチャ「someTexture」を、テクスチャユニット６のテクスチャにバインドする。
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
WebGLの仕様では、すべてのWebGL実装は最低８個のテクスチャユニットを
サポートする必要があります(フラグメントシェーダーの場合８個。頂点シェーダーで必須とされているテクスチャユニットは０個です)。
８つより多くのテクスチャユニットを使いたい場合は、あらかじめ
<code>gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)</code>メソッドを呼んで利用可能な数を確認するべきです。
頂点シェーダーでテクスチャを扱いたい場合は、
<code>gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)</code>を呼んで利用可能な数を確認します。
実際のWebGLの実装では99%が、頂点シェーダにおいて最低４つのテクスチャユニットをサポートしています。
</p>
</div>

<div class="webgl_bottombar">
<h3>GLSLコードでa_, u_, v_とかで始まる変数があるけどこれは何？</h3>
<p>
ただの命名規則の話です。文法上必要な規則ではないのですが、私は、
そういった名前にしておくとその変数がどこから来たのか見やすいのでそうしています。
こうしておけば、a_で始まる変数はアトリビュートでバッファーから持ってきたデータ、
u_はシェーダー共通のユニフォーム変数、
v_はvarying変数で頂点シェーダーからフラグメントシェーダーに送られたもので描画時に頂点間が補間されている、といったことが一目でわかります。
各変数の意味や仕組みについては「<a href="webgl-how-it-works.html">WebGLの仕組み</a>」で説明しているので、参考にしてください。
</p>
</div>


