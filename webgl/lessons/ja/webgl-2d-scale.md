Title: WebGL二次元拡大と縮小
Description: WebGLの二次元拡大と縮小し方
TOC: 二次元での拡大縮小


本記事もWebGLのシリーズの一つである。
最初の記事は[WebGLの基本](webgl-fundamentals.html)で、そして前回の記事は[二次元で図形を回転すること](webgl-2d-translation.html)についての記事である.

拡大と縮小することは[移動することと同じように](webgl-2d-translation.html)簡単である。
`position`を倍率に掛けることだけである.

[前回のサンプル](webgl-2d-rotation.html)の更新はこれである。

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
+uniform vec2 u_scale;

void main() {
+  // 位置を拡大する
+  vec2 scaledPosition = a_position * u_scale;

  // 位置を回転する
  vec2 rotatedPosition = vec2(
*     scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
*     scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

  // 移動距離を足す
  vec2 position = rotatedPosition + u_translation;
```

そしてJavaScriptで倍率を設定する。

```
  ...

+  var scaleLocation = gl.getUniformLocation(program, "u_scale");

  ...

+  var scale = [1, 1];

  ...

  // シーンを描画する。
  function drawScene() {

    ...

    // 移動距離を設定する。
    gl.uniform2fv(translationLocation, translation);

    // 回転差を設定する。
    gl.uniform2fv(rotationLocation, rotation);

+    // 倍率を設定する。
+    gl.uniform2fv(scaleLocation, scale);

    // 図形を描画する。
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;  // ６三角形、三角形ごとに３頂点
    gl.drawArrays(primitiveType, offset, count);
  }
```

これで拡大機能が出来た！スライダを操作してみよう。

{{{example url="../webgl-2d-geometry-scale.html?ui-angle=角度&ui-scaleX==xのスケール&ui-scaleY==yのスケール" }}}

マイナス倍率にすると図形が逆に描画されることを気づいただろう。

この三つの記事で図形を[移動](webgl-2d-translation.html)、
[回転](webgl-2d-rotation.html)、拡大、縮小することを分かるために便利になったら嬉しいである。次は[魔法のような行列数学](webgl-2d-matrices.html)についての記事である。それは
この３つのことを組み合わせて、もっと簡単で便利な方法である。

<div class="webgl_bottombar">
<h3>どうして「F」の図形?</h3>
<p>
私は最初に「F」の図形が使われたことを見たことはテクスチャーである。
「F」の図形は大事じゃない。大事なのは向きを簡単に分かられることである。
例えば心マーク❤とか三角形△を使うと水平に繰り返しているから向きが分かれない。円形○なら
もっと分かり辛くなる。色が付いている四角形なら区別出来るかも知れないが,
どんな角はどの色を忘れたら困る。「F」なら識別し安くなる。
</p>
<img src="../resources/f-orientation.svg" class="webgl_center"/>
<p>
どの識別安い図形でもいいけど「F」に紹介してからずっと使った。
</p>
</div>




