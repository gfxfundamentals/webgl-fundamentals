Title: WebGLで複数のテクスチャを使う
Description: WebGLアプリケーションで２つ以上のテクスチャeを利用する方法
TOC: 複数のテクスチャを使う


この記事は「[WebGLにおける画像処理](webgl-image-processing.html)」の続きである。
画像処理の基本をまだ学んでいないなら「[WebGLにおける画像処理](webgl-image-processing.html)」
を先に読んでおくことをお勧めする。

今回の講義では、「複数のテクスチャーを利用するにはどうしたらよいか？」という
疑問に答えようと思う。

簡単な答えではある。
「[WebGLにおける画像処理](webgl-image-processing.html)」の連載を振り返って、
そのサンプルを元に、２枚の画像を利用するように改造すればよい。

改造するにあたって、まずは画像を２枚ロードするように書き換える必要がある。
実のところこれはWebGLの話題ではなくHTML5やJavaScriptプログラミングの話題であるが、
これに挑戦してみよう。

先の講義で述べた通り、HTMLでは画像のロードは非同期で行われる。
非同期であるため、ロード完了のタイミングに注意しないと問題が起こる可能性がある。
これに対処するには、２つの方法がある。
ひとつめは、「画像がない状態で描画コードを開始してしまって、
画像がロードされた時点で表示を更新する」という方法である。
この方法は別の機会に説明しようと思う。

ふたつめは、「描画を開始するのを保留しておいて、全ての画像がロードされてから描画を開始する」
という方法である。今回はこの方法で実装することにする。

まず、以前の講義で作ったサンプルの「１枚の画像をロードする部分」を切り出して、
関数として再定義しておこう。
「`Image`オブジェクトを生成」、「画像のURLをセット」、
「ロード完了時に実行されるコールバック関数を設定」、という手順になる。
特別なことはしていない。

```
function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}
```
ではこの`loadImage`を利用して、複数の画像に対応した関数`loadImages`を定義しよう。
`loadImages`は、「URLの配列を受け取って」、「画像の配列を生成」する。

ロードすべき画像の数は、URLの配列から得られる。
これを、`imagesToLoad`としている。
`loadImage`に渡すコールバック関数`onImageLoad`を定義する。
`onImageLoad`では、`imagesToLoad`をデクリメント(値を1減らす)し、
`imagesToLoad`の値が0になった時点、つまり画像が全てロードされた時点で
`loadImages`のコールバック関数に画像の配列を渡して呼び出す。

```
function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;

  // 各画像のロードが完了するたびに呼び出される関数
  var onImageLoad = function() {
    --imagesToLoad;
    // 全画像のロードが完了したら、引数で指定されたコールバック関数を呼ぶ。
    if (imagesToLoad == 0) {
      callback(images);
    }
  };

  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
}
```
`loadImages`は次のようなコードで呼び出される。

```
function main() {
  loadImages([
    "resources/leaves.jpg",
    "resources/star.jpg",
  ], render);
}
```

次はシェーダー側を複数テクスチャに対応する。
今回は２枚の画像をそれぞれ表示するのではなく、画素ひとつひとつを乗算するような処理にしておこう。

```
<script id="fragment-shader-2d" type="x-shader/x-fragment">
precision mediump float;

// ロードされたテクスチャ
uniform sampler2D u_image0;
uniform sampler2D u_image1;

// 頂点シェーダーから渡されたtexCoords(テクスチャ座標)
varying vec2 v_texCoord;

void main() {
   vec4 color0 = texture2D(u_image0, v_texCoord);
   vec4 color1 = texture2D(u_image1, v_texCoord);
   gl_FragColor = color0 * color1;
}
</script>
```

WebGL textureオブジェクトを２つ、生成する。

```
  // 「テクスチャー」を２つ生成する
  var textures = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // どんなサイズの画像でもレンダリングできるようにパラメータを設定する
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // テクスチャーに画像のデータをアップロードする
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);

    // テクスチャをテクスチャの配列に追加する。
    textures.push(texture);
  }
```

WebGLには「テクスチャへの参照の配列」のようなものがある。これは「テクスチャユニット」と呼ばれる。
シェーダーの各sampler変数が、それぞれ何番のテクスチャユニットを使用するか指定する。

```
  // シェーダーで定義されているsampler変数のロケーションを取得する。
  var u_image0Location = gl.getUniformLocation(program, "u_image0");
  var u_image1Location = gl.getUniformLocation(program, "u_image1");

  ...

  // 各sampler変数が、どのテクスチャユニットに対応付けられるかセットする。
  gl.uniform1i(u_image0Location, 0);  // texture unit 0
  gl.uniform1i(u_image1Location, 1);  // texture unit 1
```

各テクスチャを、それぞれのテクスチャユニットにバインドする。

```
  // 各テクスチャユニットが、どのテクスチャを使用するかセットする。
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

今回利用する画像は以下の２つである。

<style>.glocal-center { text-align: center; }
.glocal-center-content { margin-left: auto; margin-right: auto; }</style>
<div class="glocal-center"><table class="glocal-center-content"><tr>
<td><img src="../resources/leaves.jpg" />
<img src="../resources/star.jpg" /></td>
</tr></table></div>

今回のプログラムの実行結果、つまり「２枚の画像をロード」して「乗算」した結果はこのようになる。

{{{example url="../webgl-2-textures.html" }}}

「テクスチャユニット」の扱いについて、２点ほど補足しておこう。

１点目は、「アクティブテクスチャユニット」についてである。
テクスチャ関連のWebGL APIは全て「アクティブテクスチャユニット」に対して機能する。
「アクティブテクスチャユニット」とはグローバル変数であり、
操作対象がどのテクスチャユニットであるかを示すインデックスである。
各テクスチャユニットにはそれぞれ、「TEXTURE_2D」と「TEXTURE_CUBE_MAP」という
２つのターゲットがある。
テクスチャ関連の関数は、現在のアクティブテクスチャユニットの指定されたターゲット
に対して操作を行う。

喩えとして、「WebGLの仕組みをJavaScriptで表現する」としたら
こんな感じのコードになる。

```
var getContext = function() {
  var textureUnits = [
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    { TEXTURE_2D: ??, TEXTURE_CUBE_MAP: ?? },
    ...
  ];
  var activeTextureUnit = 0;

  var activeTexture = function(unit) {
    // テクスチャユニット番号のenum値を、0～の整数indexに変換する。
    var index = unit - gl.TEXTURE0;
    // WebGL内部のグローバル変数である「アクティブテクスチャユニット」をセット
    activeTextureUnit = index;
  };

  var bindTexture = function(target, texture) {
    // 現在のアクティブテクスチャユニットの現在のターゲットに、textureをセットする。
    textureUnits[activeTextureUnit][target] = texture;
  };

  var texImage2D = function(target, ... args ...) {
    // texImage2Dは、現在のアクティブテクスチャユニットのtextureに対して、操作を行う。
    var texture = textureUnits[activeTextureUnit][target];
    texture.image2D(...args...);
  };

  // getContextの返り値として、WebGL APIを返す
  return {
    activeTexture: activeTexture,
    bindTexture: bindTexture,
    texImage2D: texImage2D,
  }
};
```
２点目は、テクスチャユニットの指定方法が二種類あるという点である。
シェーダーではテクスチャユニットの指定の際、「テクスチャユニットの番号」を使う。
これを意識していれば、以下の２行の意味は明らかだろう。

```
  gl.uniform1i(u_image0Location, 0);  // texture unit 0
  gl.uniform1i(u_image1Location, 1);  // texture unit 1
```

uniformのセットを行なう際は、このように「0から始まる整数値」で指定するのに対し、
gl.activeTextureではgl.TEXTURE0やgl.TEXTURE1といった「定義済みの定数」
で指定する。この点には注意が必要である。

```
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

幸いこれらの定数は連番の整数値として定義されているので、下のような書き方ができる。

```
  gl.activeTexture(gl.TEXTURE0 + 0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
```

こんな書き方もできる。

```
  for (var ii = 0; ii < 2; ++ii) {
    gl.activeTexture(gl.TEXTURE0 + ii);
    gl.bindTexture(gl.TEXTURE_2D, textures[ii]);
  }
```

以上、この小さなヒントが「WebGLにおいて１回のドローコールで
複数テクスチャを使う方法」について、理解の助けとなることを願う。