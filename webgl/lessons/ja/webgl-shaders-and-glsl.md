Title: WebGLのシェーダーとGLSL
Description: シェーダーとGLSLとは何か説明する。
TOC: WebGLのシェーダーとGLSL


この記事は「[WebGLの基本](webgl-fundamentals.html)」に関する講義の続きである。
「[WebGLの仕組み](webgl-how-it-works.html)」についてまだ学んでいないなら、
そちらを先に読むことをお勧めする。

我々はこれまでシェーダーとGLSLについて話をしてきたわけであるが、
その仕様の詳細については踏み込んでこなかった。
これまでサンプルプログラムを示してきたことによって大まかな雰囲気は
掴めたものと期待しているが、ここで今一度、シェーダーとGLSLについて
整理して説明したい。

「[WebGLの仕組み](webgl-how-it-works.html)」の講義で説明した通り、
WebGLで何かを描くためには２つのシェーダーが必要である。
これら２つのシェーダー、即ち「*頂点シェーダー*」と
「*フラグメントシェーダー*」は、いずれも「*関数*」である。
頂点シェーダーとフラグメントシェーダーは互いにリンクされ、
１つの「シェーダープログラム(単に「プログラム」とも呼ばれる)」となる。
典型的なWebGLアプリケーションは、複数のシェーダープログラムを持つ。

## 頂点シェーダー

頂点シェーダーの役割は、「クリップ空間座標」の生成である。
頂点シェーダーは、必ず次のような形になる。

    void main() {
        // 何らかの計算をして「クリップ空間座標」の値を生成する。
        // 生成した計算結果をgl_Positionに代入する。
        gl_Position = doMathToMakeClipspaceCoordinates
    }

頂点シェーダーは、１つの「頂点」に対して１回呼び出される。
呼び出されたら必ず、頂点シェーダーは特殊なグローバル変数「`gl_Position`」に
「クリップ空間座標」の値をセットする。

頂点シェーダーは、入力データを必要とする。
頂点シェーダーがデータを受け取る方法は３種類ある。

1.  [アトリビュート(属性/attribute)](#attributes) (「バッファ」から取り出されるデータ)
2.  [ユニフォーム(uniform)](#uniforms) (一回のドローコールの間、全頂点で共通の値を持つデータ)
3.  [テクスチャー(texture)](#textures-in-vertex-shaders) (「ピクセル/テクセル」から読み込まれるデータ)

### <span id="attributes"></span>アトリビュート(属性/attributes)

もっとも一般的なのは、「バッファー」と*アトリビュート*を使う方法である。
この方法は「[WebGLの仕組み](webgl-how-it-works.html)」の講義でも説明した。

この方法では、まずバッファーを生成、

    var buf = gl.createBuffer();

バッファーにデータをセットする。

    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);

そして、データを受け取る側となるシェーダープログラムが持っている
アトリビュートのロケーションを取得しておく。

    var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");

以上は初期化時に行なう。

描画時に必要なのは、シェーダーが「バッファー」から「アトリビュート」
へとデータを読み出す際に必要なルールを示すことである。

    // 指定したアトリビュートについて、バッファーからデータを読み出せるようにする。
    gl.enableVertexAttribArray(positionLoc);

    var numComponents = 3;  // (x, y, z)に相当する３つのデータ
    var type = gl.FLOAT;    // 32ビット浮動小数点数
    var normalize = false;  // 自動正規化処理を行なわない
    var offset = 0;         // バッファーの先頭から
    var stride = 0;         // 頂点あたりのデータのバイト数を指定
                            // 0 = 「データ型とデータ数相応」のストライド
                            
    gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);

頂点シェーダーの役割は「クリップ空間座標」の算出であるが、
「[WebGLの基本](webgl-fundamentals.html)」の講義で使用した例を改めて振り返ると、
こうして「バッファー」から「アトリビュート」へ読み出してきたデータを、
頂点シェーダーでは特に計算を行なわずそのまま利用していた。

    attribute vec4 a_position;

    void main() {
       gl_Position = a_position;
    }

この例では、バッファーに入れる時点でデータが「クリップ空間座標」の値であったので、
シェーダーでは「計算」をする必要がなかったわけだ。

アトリビュートで利用できるデータ型には、`float`、`vec2`、`vec3`、`vec4`、`mat2`、`mat3`、`mat4` がある。

### <span id="uniforms"></span>ユニフォーム(uniform)

ユニフォームは、全頂点で共通の値を持つデータ、つまり、
１回のドローコール(drawArrays/drawElementsの呼び出し)で
呼び出される多数の頂点シェーダーのどれでも同じ値を持つデータ、である。

もっとも単純な使用例としては「頂点シェーダーでオフセット値を足す」と
いったものが挙げられるだろう。

    attribute vec4 a_position;
    +uniform vec4 u_offset;

    void main() {
       gl_Position = a_position + u_offset;
    }

この例では、すべての頂点で同じオフセットが加算されるので、
結果として図形全体が平行移動することになる。
ユニフォームを利用するには、まずシェーダープログラムで定義されている
uniformのロケーションを取得する。これは初期化時に行なう。

    var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");

描画直前のタイミングで、uniformに値をセットする。

    gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // 半画面分「右(Xの正方向)」へ動かす。

利用する上で、「ユニフォームは個々のシェーダープログラムに属する」
という点には注意が必要である。つまり、シェーダープログラムが複数ある場合、
それぞれのシェーダープログラムに同じ名前のuniformが定義されていたとしても、
それらは別物である。uniformのロケーションはそれぞれ異なり、それぞれが別の値を持つ。

`gl.uniform???`を呼び出したときに値がセットされるのは
「*カレントプログラム*のuniform」である。
カレントプログラムは「最後に呼び出した`gl.useProgram`」によって
決定される。

uniformで利用できるデータ型は多数ある。データをセットする際には、
シェーダープログラム側のuniformの定義に合った、適切な関数を呼び出す必要がある。

    gl.uniform1f (floatUniformLoc, v);                 // float
    gl.uniform1fv(floatUniformLoc, [v]);               // float、または、floatの配列
    gl.uniform2f (vec2UniformLoc,  v0, v1);            // vec2
    gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // vec2、または、vec2の配列
    gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // vec3
    gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // vec3、または、vec3の配列
    gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // vec4
    gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // vec4、または、vec4の配列

    gl.uniformMatrix2fv(mat2UniformLoc, false, [ 4の倍数個の要素を持つ配列 ])  // mat2、または、mat2の配列
    gl.uniformMatrix3fv(mat3UniformLoc, false, [ 9の倍数個の要素を持つ配列 ])  // mat3、または、mat3の配列
    gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16の倍数個の要素を持つ配列 ])  // mat4、または、mat4の配列
    
    gl.uniform1i (intUniformLoc,   v);                 // int
    gl.uniform1iv(intUniformLoc, [v]);                 // int、または、intの配列
    gl.uniform2i (ivec2UniformLoc, v0, v1);            // ivec2
    gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // ivec2、または、ivec2の配列
    gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // ivec3
    gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // ivec3、または、ivec3の配列
    gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // ivec4
    gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // ivec4、または、ivec4の配列

    gl.uniform1i (sampler2DUniformLoc,   v);           // sampler2D (テクスチャ)
    gl.uniform1iv(sampler2DUniformLoc, [v]);           // sampler2D、または、sampler2Dの配列
    
    gl.uniform1i (samplerCubeUniformLoc,   v);         // samplerCube (テクスチャ)
    gl.uniform1iv(samplerCubeUniformLoc, [v]);         // samplerCube、または、samplerCubeの配列

このほかに真理値を扱う`bool`、`bvec2`、`bvec3`、`bvec4`がある。
これには`gl.uniform?f?`や`gl.uniform?i?`を使うこともできる。

uniformが配列として定義されている場合は、その値を一度にセットすることができる。
例えば、このように書けばよい。

    // シェーダー側のコード
    uniform vec2 u_someVec2[3];

    // JavaScript側のコード(初期化時)
    var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

    // JavaScript側のコード(描画時)
    gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // u_someVec2の配列全体の値をまとめてセット

一つ一つセットすることもできるが、その場合は配列要素一つ一つのロケーションを取得する必要がある。

    // JavaScript側のコード(初期化時)
    var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
    var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
    var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

    // JavaScript側のコード(描画時)
    gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // u_someVec2[0]の値をセット
    gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // u_someVec2[1]の値をセット
    gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // u_someVec2[2]の値をセット

「構造体」の文法を利用することもできる。

    struct SomeStruct {
      bool active;
      vec2 someVec2;
    };
    uniform SomeStruct u_someThing;

構造体を使う場合、ロケーションの取得は構造体のフィールド一つ一つについて行なうことになる。

    var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
    var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");

### <span id="textures-in-vertex-shaders"></span>頂点シェーダーでのテクスチャーの利用

テクスチャーの利用については、[フラグメントシェーダーでのテクスチャーの利用](#textures-in-fragment-shaders)の項で後述する。

## フラグメントシェーダー

フラグメントシェーダーの役割は、描画対象となったピクセルの「色」を決定することである。
フラグメントシェーダーは、必ず次のような形になる。

    precision mediump float;

    void main() {
       // 何らかの計算をして「ピクセルの色」を決定する。
       // 計算結果を、gl_FragColorに代入する。
       gl_FragColor = doMathToMakeAColor;
    }

フラグメントシェーダーは、1つの「ピクセル」に対して1回呼び出される。
呼び出されたら必ず、フラグメントシェーダーは特殊なグローバル変数「`gl_FragColor`」に
そのピクセルの「色情報」の値をセットする。

フラグメントシェーダーはデータを必要とする。
フラグメントシェーダーがデータを受け取る方法は３種類ある。

1.  [ユニフォーム(uniform)](#uniforms-in-fragment-shaders) (一回のドローコールの間、全ピクセルで共通の値を持つデータ)
2.  [テクスチャー(texture)](#textures-in-fragment-shaders) (「ピクセル/テクセル」から読み込まれるデータ)
3.  [varying](#varyings) (頂点シェーダーから渡されるデータ。必要に応じて補間される)

### <span id="uniforms-in-fragment-shaders"></span>フラグメントシェーダーにおけるユニフォーム

仕組みは共通なので、[頂点シェーダーのユニフォーム](#uniforms)を参照。

### <span id="textures-in-fragment-shaders"></span>フラグメントシェーダーにおけるテクスチャー

シェーダーにおいて、「テクスチャー」のデータにアクセスするには、
「`sampler2D`型」のuniformを使用する。
データを取り出す際にはGLSLの関数「`texture2D`」を使う。

    precision mediump float;

    uniform sampler2D u_texture;

    void main() {
       vec2 texcoord = vec2(0.5, 0.5)  // テクスチャの中央部の値を取得する。
       gl_FragColor = texture2D(u_texture, texcoord);
    }

テクスチャーから得られるデータがどのようなものになるかは、様々な設定に依存する。
その詳細については[別の講義](webgl-3d-textures.html)で説明するが、
ここではテクスチャの利用に最低限必要なサンプルコードで説明しておく。

まず、テクスチャーの生成とデータのセットを行なう。

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var level = 0;
    var width = 2;
    var height = 1;
    var data = new Uint8Array([
       255, 0, 0, 255,   // 赤いピクセル
       0, 255, 0, 255,   // 緑のピクセル
    ]);
    gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

初期化時、シェーダープログラムで定義したuniformのロケーションを取得しておく。

    var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

描画時には、テクスチャーを「テクスチャーユニット」のひとつにバインドし、

    var unit = 5;  // 「テクスチャーユニット」のひとつを指定する
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

シェーダーに対しては、「どのテクスチャーユニットを指定したか」の情報を渡す。

    gl.uniform1i(someSamplerLoc, unit);

### <span id="varyings"></span>varying

varyingは、頂点シェーダーからフラグメントシェーダーへとデータを渡す手段である。
これについては「[WebGLの仕組み](webgl-how-it-works.html)」の講義でも説明した。

varyingを利用するには、対(つい)になるvaryingを
頂点シェーダー、フラグメントシェーダーそれぞれで宣言する必要がある。
頂点ひとつについて頂点シェーダーひとつが呼び出され、「その頂点のvaryingの値」はそこでセットされる。
そして、WebGLがピクセルを描画する際には、補間、つまり「頂点と頂点の間の穴埋め」が
行なわれるが、同時に、補間された部分について「varyingの値の補間」も行なわれる。
フラグメントシェーダーが呼び出される際には、この補間されたvaryingの値が渡される。

頂点シェーダー：

    attribute vec4 a_position;

    uniform vec4 u_offset;

    +varying vec4 v_positionWithOffset;

    void main() {
      gl_Position = a_position + u_offset;
    +  v_positionWithOffset = a_position + u_offset;
    }

フラグメントシェーダー：

    precision mediump float;

    +varying vec4 v_positionWithOffset;

    void main() {
    +  // 「クリップ空間座標の値」(-1 ～ +1) から「色空間座標の値」(0 ～ 1)へ変換する。
    +  vec4 color = v_positionWithOffset * 0.5 + 0.5
    +  gl_FragColor = color;
    }

上の例は、実用上の意味はない。
一般に、「クリップ空間上の座標値をそのままフラグメントシェーダーに渡して、
色空間に変換する」、などという操作自体が意味を持つことはそうそうないが、
このサンプルの動きを見れば「varyingで補間が行なわれるとはどういうことなのか」を、
「中間色が生み出される様子」から観察することができる。

## GLSL

GLSLという名前は「Graphics Library Shader Language(グラフィクス・ライブラリ・シェーダー言語)」
に由来する。正にシェーダーを書くために作られた言語である。
GLSLには、JavaScriptには見られないような少々独特な特殊機能がある。
グラフィクスのラスタライズで必要となる計算に特化したデザインとなっている。

### 行列を扱うデータ型

例えばGLSLは標準で`vec2`、`vec3`、`vec4`といったデータ型を持っている。
これはそれぞれ２、３、４個のデータをまとめて扱うためのものである。
同様に`mat2`、`mat3`、`mat4`は2x2、3x3、4x4の行列を扱うためのデータ型である。
これらのデータ型があることで、例えば「行列にスカラー値(行列でない、いわゆる数値)
を乗算する」といった計算を簡単に書くことができる。

    vec4 a = vec4(1, 2, 3, 4);
    vec4 b = a * 2.0;
    // bの値はvec4(2, 4, 6, 8)となる。

「行列同士の乗算」や「ベクトルと行列の掛け算」も同様に記述できる。

    mat4 a = ???
    mat4 b = ???
    mat4 c = a * b;

    vec4 v = ???
    vec4 y = c * v;

また、各種のvec型の変数には多様な「セレクタ」がある。例えばvec4の場合、

    vec4 v;

*   `v.x` と書けば、 `v.s` や `v.r` や `v[0]`と同じ意味になる。
*   `v.y` と書けば、 `v.t` や `v.g` や `v[1]`と同じ意味になる。
*   `v.z` と書けば、 `v.p` や `v.b` や `v[2]`と同じ意味になる。
*   `v.w` と書けば、 `v.q` や `v.a` や `v[3]`と同じ意味になる。

これによって、vecのコンポーネントの入れ替え(*swizzle*などと表現される)は
容易である。入れ替えだけでなく、同じ要素を繰り返すこともできる。例えば、

    v.yyyy

と、

    vec4(v.y, v.y, v.y, v.y)

は同じ値である。同様に、

    v.bgra

は

    vec4(v.b, v.g, v.r, v.a)

と同じ値となる。
vecやmatの値を定義する際には複数の要素を一度に記述することもできる。例えば

    vec4(v.rgb, 1)

と書けば

    vec4(v.r, v.g, v.b, 1)

という意味になる。また、

    vec4(1)

は、

    vec4(1, 1, 1, 1)

と解釈される。

### データ型に厳しい

GLSLは「強い型付け言語」、即ち、データ型に非常に厳しい言語である。
これに苦労させられることもあるだろう。

    float f = 1;  // エラー。'1'はint型である。int型の値はfloat型変数に代入できない。

上のコードは、正しくはこう書かなければならない。

    float f = 1.0;      // floatの値を使えば問題ない。
    float f = float(1)  // 整数値はfloat型にキャスト(型変換)すればよい。
    
上の方で挙げた`vec4(v.rgb, 1)`では`1`についてエラーは出ないが、
これは`vec4`が`float(1)`に相当するキャストを行なっているからである。

### 多くのビルトイン関数

GLSLには多くのビルトイン関数がある。
その多くは多数のコンポーネントを同時に扱う。
例えば、角度(angle)から正弦(sine)を計算する関数、

    T sin(T angle)

では、Tは`float`、`vec2`、`vec3`、`vec4`のどのデータ型を使ってもよい。
引数に`vec4`型の値を渡せば、`vec4`の値、即ち、vec4の各コンポーネントの正弦が得られる。
具体的に言えば、例えば`vec4`型の値`v`を引数とした場合、

    vec4 s = sin(v);

は、以下のように解釈される。

    vec4 s = vec4(sin(v.x), sin(v.y), sin(v.z), sin(v.w));

一つの引数がfloatで残りが`T`という場合もある。この場合、floatが全体に適用される。
例えば、`v1`と`v2`が`vec4`型、`f`がfloat型だとして、

    vec4 m = mix(v1, v2, f);

は、以下のように解釈される。

    vec4 m = vec4(
      mix(v1.x, v2.x, f),
      mix(v1.y, v2.y, f),
      mix(v1.z, v2.z, f),
      mix(v1.w, v2.w, f));

GLSLの全関数のリストは、「[the WebGL
Reference Card](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf)」
の最終ページで見ることができる。
無味乾燥で冗長な技術文書が好みであるなら「[the GLSL spec](https://www.khronos.org/files/opengles_shading_language.pdf)」を読んでみると良いだろう。

## まとめ。すべてをひとつに

これが、この一連のWebGL講義シリーズのポイントである。

WebGLアプリケーションとは、

* 様々なシェーダーを生成する
* シェーダーにデータを与える
* `gl.drawArrays`か`gl.drawElements`を呼ぶ。

というものであり、それによって、あとはWebGLが自動的に

* 頂点１個あたり１つ、頂点シェーダーを呼び出し、全頂点が処理される
* ピクセル１個あたり１つ、フラングメントシェーダーを呼び出し、全ピクセルが処理される
* すると、ピクセルが描画される。

以上が、WebGLの全てである。

## 次の講義に向けて

「シェーダーを生成する」ためにはいくらかコードを書く必要があるが、
そのコードはほとんどのWebGLプログラムで共通であり再利用できるので、
一度書いてしまえばその部分については以後気にする必要はなくなる。
この「GLSLシェーダーをコンパイル、リンクしてシェーダープログラムを生成する」という
トピックは、「[WebGLのひな型コード](webgl-boilerplate.html)」の講義で取り上げている。

次回の講義は、２種類のトピックから選択できる。

一つ目は「画像処理」についてである。画像の加工処理に興味があるなら、次回は「[WebGLにおける画像処理](webgl-image-processing.html)」の講義を選ぶとよい。

二つ目は「平行移動、回転、拡大縮小」に関するトピックである。
こちらはやがて「３Ｄ処理」の話題へと続いて行くが、まずは
「[二次元での移動](webgl-2d-translation.html)」の講義から始めよう。



