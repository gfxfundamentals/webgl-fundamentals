Title: WebGLのひな型コード
Description: 全てのWebGLで共通して必要となるコード
TOC: WebGLのひな型コード


この記事は「[WebGLの基本](webgl-fundamentals.html)」の続きです。

WebGLの説明は複雑になり勝ちです。ひとつの話の中に
さまざまな要素が一度に含まれることが多いためです。
私はこれを可能な限り避け、話題を細かく分けています。

## 「シェーダーのコンパイル、リンク処理」のひな形コード

WebGLを難しく感じさせている要素のひとつは、
「頂点シェーダー」、「フラグメントシェーダー｣と呼ばれる二つの小さな関数です。
これらの関数は「CPU」ではなく「GPU」という場所で実行されます。
GPUは、WebGLのスピードのかなめとなるものです。
GPUの特性を活かすため、これらの関数はGPU専用の言語で記述する必要があります。

これらの関数をコンパイル、リンクするという手順は必ず行います。
また、そのためのコードはほとんどのWebGLアプリケーションで共通です。

これは、「シェーダーをコンパイルする」ためのコードのひな型(Boilerplate code)です。

    /**
     * シェーダーを生成、コンパイルする。
     *
     * @param {!WebGLRenderingContext} gl WebGLコンテキスト。
     * @param {string} shaderSource シェーダーのGLSLソースコード。
     * @param {number} shaderType シェーダーの種類。VERTEX_SHADERまたは
     *     FRAGMENT_SHADER。
     * @return {!WebGLShader} シェーダー。
     */
    function compileShader(gl, shaderSource, shaderType) {
      // シェーダーのオブジェクトを生成する。
      var shader = gl.createShader(shaderType);

      // シェーダーのソースコードをセットする。
      gl.shaderSource(shader, shaderSource);

      // シェーダーをコンパイルする。
      gl.compileShader(shader);

      // コンパイルが成功したか確認する。
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        // コンパイル中に問題があった場合、エラーを取得する。
        throw "could not compile shader:" + gl.getShaderInfoLog(shader);
      }

      return shader;
    }

そしてこれは「2つのシェーダーをプログラムにリンクする」コードのひな型です。

    /**
     * 2つのシェーダーからプログラムを生成する。
     *
     * @param {!WebGLRenderingContext) gl WebGLコンテキスト。
     * @param {!WebGLShader} vertexShader 頂点シェーダー。
     * @param {!WebGLShader} fragmentShader フラグメントシェーダー。
     * @return {!WebGLProgram} WebGLプログラム。
     */
    function createProgram(gl, vertexShader, fragmentShader) {
      // プログラムを生成する。
      var program = gl.createProgram();

      // シェーダーをアタッチする。
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);

      // プログラムをリンクする。
      gl.linkProgram(program);

      // リンクが成功したか確認する。
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
          // リンク中に問題があった場合、エラーを取得する。
          throw ("program failed to link:" + gl.getProgramInfoLog (program));
      }

      return program;
    };

「共通のコード」とはいえ、
もちろん「エラー発生時にどう処理するか」といった部分は、あなた次第です。
「例外をスローする」のが最適なエラーハンドリングでないこともあります。
しかし、ここに挙げた短いコードは、「ほとんど全てのWebGLプログラムで共通」です。


私は、シェーダーのコードを&lt;script&gt;タグを使って書く方法を好んで使っています。
この方法を使う場合、以下のようなコードで処理することになります。

    /**
     * script要素に書かれた内容からシェーダーを生成する。
     *
     * @param {!WebGLRenderingContext} gl WebGLコンテキスト。
     * @param {string} scriptId scriptタグのid。
     * @param {string} opt_shaderType 生成するシェーダーの種類。
     *     省略した場合はscriptタグのtypeプロパティを使う。
     * @return {!WebGLShader} シェーダー。
     */
    function createShaderFromScript(gl, scriptId, opt_shaderType) {
      // scriptタグをidを使って参照する。
      var shaderScript = document.getElementById(scriptId);
      if (!shaderScript) {
        throw("*** Error: unknown script element" + scriptId);
      }

      // script要素内のテキストを取り出す。
      var shaderSource = shaderScript.text;

      // 引数でシェーダーの種類を指定しなかった場合は、
      // scriptタグのtypeプロパティを使う。
      if (!opt_shaderType) {
        if (shaderScript.type == "x-shader/x-vertex") {
          opt_shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type == "x-shader/x-fragment") {
          opt_shaderType = gl.FRAGMENT_SHADER;
        } else if (!opt_shaderType) {
          throw("*** Error: shader type not set");
        }
      }

      return compileShader(gl, shaderSource, opt_shaderType);
    };

以下のコードでシェーダーをコンパイルできます。

    var shader = createShaderFromScript(gl, "someScriptTagId");

私がよく使うのは、さらに一歩踏み込んで「二つのシェーダーをそれぞれの書かれた
script要素から読み込んでコンパイルし、プログラムにアタッチ、リンクまで行う関数」です。

    /**
     * 二つのscript要素を使ってWebGLProgramを生成する。
     *
     * @param {!WebGLRenderingContext} gl WebGLコンテキスト。
     * @param {string[]} shaderScriptIds script要素のidプロパティの配列。
     *        一つ目を頂点シェーダー、二つ目をフラグメントシェーダーとみなす。
     * @return {!WebGLProgram} WebGLプログラム。
     */
    function createProgramFromScripts(
        gl, shaderScriptIds) {
      var vertexShader = createShaderFromScript(gl, shaderScriptIds[0], gl.VERTEX_SHADER);
      var fragmentShader = createShaderFromScript(gl, shaderScriptIds[1], gl.FRAGMENT_SHADER);
      return createProgram(gl, vertexShader, fragmentShader);
    }


## 「canvasのリサイズ処理」のひな形コード

もうひとつ、私がほとんどのWebGLプログラムで使っているのは、
「canvasのリサイズ処理」をするコードです。
このコードの実装内容については[このドキュメント](webgl-resizing-the-canvas.html)
で紹介しています。

## ひな形コードの利用
以上、２つのひな形コードは`webgl-utils.js`として一つにまとめてあります。
これを利用するには、

    <script src="resources/webgl-utils.js"></script>

といったコードで取り込んだ上で、以下のようなコードで呼び出します。

    var program = webglUtils.createProgramFromScripts(
      gl, [idOfVertexShaderScript, idOfFragmentShaderScript]);

    ...

    webglUtils.resizeCanvasToMatchDisplaySize(canvas);

## まとめ

まったく同じ大量のコードが全てのサンプルに含まれているために
「そのサンプルが何のために書かれたサンプルなのか判りにくく
なってしまう」のは本末転倒で、避けるべきであるとと思います。

以上で、私の「最小のWebGLひな型コード(boilerplate code)」のおおまかな紹介を終わります。
[`webgl-utils.js`のコードはここにあります](../resources/webgl-utils.js)。

さらにしっかり構成されたライブラリに興味があるようでしたら[TWGL.js](https://twgljs.org)
をチェックしてください。

WebGLを複雑に見せているもう一つの要素は「シェーダーにデータを渡す手順」です。
そのあたりの話題については「[WebGLの仕組み](webgl-how-it-works.html)」
で紹介しています。
これについては、「[少ないコード、大きな喜び](webgl-less-code-more-fun.html)」や、
[TWGL](https://twgljs.org)も参考になるはずです。

以上のほかにも、同様の理由で作られたスクリプトがあるので紹介しておきます。

*   [`webgl-lessons-ui.js`](../resources/webgl-lessons-ui.js)

    このスクリプトは、スライダを使って数値をセットしたり視覚化したりするためのものです。
    講義の中でよく使う機能なのでこのファイルにまとめました。

*   [`lessons-helper.js`](../resources/lessons-helper.js)

    このスクリプトは、webglfundmentals.org以外では必要ないでしょう。
    ほかのものに埋め込まれたlive editor上で使うと、エラーメッセージを
    画面に表示することができます。

*   [`m3.js`](../resources/m3.js)

    このスクリプトには、二次元を扱う計算関連の関数が多数定義されています。
    これらの関数は、このサイトの行列計算の最初の講義で作り始め、いくつかの章の中で
    追加していったものです。
    より応用的な話題を扱う章では、同じものを一から書くのは話が複雑になるだけなので
    このスクリプトにまとめて使っています。

*   [`m4.js`](../resources/m4.js)

    このスクリプトには、三次元を扱う計算関連の関数が多数定義されています。
    これらの関数は、このサイトの３Ｄ関連の講義の中で作ったものです。
    ３Ｄ関連の２番目の記事からは、このスクリプトを利用しています。
