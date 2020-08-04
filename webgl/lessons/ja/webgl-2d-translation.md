Title: WebGL二次元で移動すること
Description: 二次元で移動し方
TOC: 二次元での移動


三次元へ行く前にもうちょっと二次元で話を続けよう！この記事は当たり前と思われるかも知れないが
記事を読み進めるとポイントが現れる。

この記事は[WebGLの基本](webgl-fundamentals.html)シリーズの一つである。
シリーズの最初の記事は「WebGLの基本」である。それをまだ読んでいなかったら、
先に読んで、その後ここに戻るのがおすすめ。

最初の記事で出来たサンプルで、`setRectangle`に与えている値を変更したら、
四角形を移動出来るように更新出来るだろう。これは[先ほどのサンプル](webgl-fundamentals.html)の元のサンプルである。

最初に四角形の移動距離と横と縦と色の変数を作成

```
  var translation = [0, 0];  // 移動距離
  var width = 100;           // 横
  var height = 30;           // 縦
  var color = [Math.random(), Math.random(), Math.random(), 1]; // 色
```

そして、シーンの全てを描画する関数を作成。移動距離を変更したらこれを呼び出せる。

```
  // シーンを描画する
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // クリップ空間からピクセル空間にWebGLの設定
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // キャンバスをクリアする
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 作成したプログラム（シェーダー2つ）を設定する
    gl.useProgram(program);

    // 属性をオンにする。
    gl.enableVertexAttribArray(positionLocation);

    // positionBufferをARRAY_BUFFERに結び付ける
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 四角形の頂点をGPUにアップロードする。
    setRectangle(gl, translation[0], translation[1], width, height);

    // 属性にどうやってpositionBuffer（ARRAY_BUFFER)からデータを取り出すか。
    var size = 2;          // 呼び出すごとに2つの数値
    var type = gl.FLOAT;   // データは32ビットの数値
    var normalize = false; // データをnormalizeしない
    var stride = 0;        // シェーダーを呼び出すごとに進む距離
                           // 0 = size * sizeof(type)
    var offset = 0;        // バッファーの頭から取り始める
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

    // resolutionを設定する
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // colorを設定する
    gl.uniform4fv(colorLocation, color);

    // 四角形を描画する
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
```

下にあるサンプルには`translation[0]`と`translation[1]`を調整して`drawScene`を呼び出すスライダーを追加した。スライダーを操作して、四角形を移動してみよう。

{{{example url="../webgl-2d-rectangle-translate.html" }}}

ここまで上手くいくが、もっと頂点が複雑な図形を移動したければ想像してみて下さい。

6つの三角形で出来ている’F'のような図形を描画しようとしたら。。。

<img src="../resources/polygon-f.svg" width="200" height="270" class="webgl_center">

今のコードのようにするなら`setRectangle`をこういうふうにしなければいけない。

```
// バッファーに’F’の形の頂点を入れる。
function setGeometry(gl, x, y) {
  var width = 100;
  var height = 150;
  var thickness = 30;
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column
          x, y,
          x + thickness, y,
          x, y + height,
          x, y + height,
          x + thickness, y,
          x + thickness, y + height,

          // top rung
          x + thickness, y,
          x + width, y,
          x + thickness, y + thickness,
          x + thickness, y + thickness,
          x + width, y,
          x + width, y + thickness,

          // middle rung
          x + thickness, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 2,
          x + thickness, y + thickness * 3,
          x + thickness, y + thickness * 3,
          x + width * 2 / 3, y + thickness * 2,
          x + width * 2 / 3, y + thickness * 3,
      ]),
      gl.STATIC_DRAW);
}
```

これを見ると頂点数を増やせば増やすほどダメになる。何百頂点それとも何千頂点で何か
描画したければ結構複雑なコードを書かなければいけない。その上、描画する際にJavaScriptは
頂点全てを更新しなければいけない。

もっと簡単の方法がある。頂点をアップロードして、シェーダーで移動することである。

これは新しい頂点シェーダー

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
+uniform vec2 u_translation;

void main() {
*   // a_positionに移動距離を足す
*   vec2 position = a_position + u_translation;

    // positionはピクセルから0〜1に
*   vec2 zeroToOne = position / u_resolution;
   ...
```

ちょっとコードの構造を変更する。 まず頂点は一回だけアップロードする。

```
// バッファーに’F’の形の頂点を入れる。
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // 左縦列
          0, 0,
          30, 0,
          0, 150,
          0, 150,
          30, 0,
          30, 150,

          // 上の横棒
          30, 0,
          100, 0,
          30, 30,
          30, 30,
          100, 0,
          100, 30,

          // 下の横棒
          30, 60,
          67, 60,
          30, 90,
          30, 90,
          67, 60,
          67, 90,
      ]),
      gl.STATIC_DRAW);
}
```

そして描画する前に`u_translation`を希望している距離に設定する

```
  ...

+  var translationLocation = gl.getUniformLocation(
+             program, "u_translation");
  ...

  // 頂点位置のバッファーを作成する
  var positionBuffer = gl.createBuffer();
  // ARRAY_BUFFERに結び付ける
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
+  // バッファーに頂点座標をアップロードする
+  setGeometry(gl);

  ...

  // シーンを描画する
  function drawScene() {

    ...

+    // 移動差を設定する
+    gl.uniform2fv(translationLocation, translation);

    // 図形を描画する
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
*    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
```

`setGeometry`は一回しか呼び出してないことに気付いただろうか。
もう、`drawScene`の中に呼び出してない。

これは変更したサンプルである。またスライダーを操作して、移動距離を調整してみよう。 

{{{example url="../webgl-2d-geometry-translate-better.html" }}}

今回描画する時、WebGLがほとんど全てやっている。JavaScriptはただ移動距離を設定して、
WebGLに描画させているだけである。図形が何万頂点があっても同じである。

比べたければ[これはJavaScriptで頂点を移動している版である](../webgl-2d-geometry-translate.html)。

今回のサンプルは簡単過ぎないだろう。まだ読み続けて下さい。
いずれ、もっとフレキシブルな方法を説明しよう。
次の記事は[図形の回転し方についてである](webgl-2d-rotation.html)。


