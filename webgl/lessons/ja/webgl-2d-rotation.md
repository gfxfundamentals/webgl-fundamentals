Title: WebGL二次元で回転すること
Description: 二次元で回転し方

本記事もWebGLシリーズの一つである。最初の記事は[WebGLの基本](webgl-fundamentals.html)で、そして前回の記事は[二次元で移動すること](webgl-2d-translation.html)についての記事である.

まず、上手く説明出来るかどうか分からないが、べすとを尽くしてみよう。

最初に「単位円」ということを紹介したいと思う。中学校で学んだ数学を思い出せば、
円形には半径がある。
（寝てしまわないで！）。円形の半径は円の真ん中点から円周までの距離である。
「単位円」は半径が1.0を１とした円である。

これは単位円である。

{{{diagram url="../unit-circle.html" width="300" height="300" }}}

青いハンドルを操作したらXとYの値が変わることに注目して下さい。
それは円周の位置を表している。
真上はYが１でXが0である。真右ならXが１でYが0になる。

小学校の数学を思い出せば、何かに1を掛けるとその数字と同じになる。例えば123ｘ１＝123である。
それは結構常識であるだろう？さて、単位円は、半径が１の円で特別な「１」の種類である。
それは回転している１である。だから１に掛けるように何かに単位円を掛けると魔法のように回転してくる。

[前回のサンプル](webgl-2d-translation.html)の図形頂点を単位円のXとYに掛けよう！

これは更新された頂点シェーダーである。

    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    +uniform vec2 u_rotation;  // 単位円の円周位置

    void main() {
    +  // 位置を回転する
    +  vec2 rotatedPosition = vec2(
    +     a_position.x * u_rotation.y + a_position.y * u_rotation.x,
    +     a_position.y * u_rotation.y - a_position.x * u_rotation.x);

      // 移動距離を足す
    *  vec2 position = rotatedPosition + u_translation;

そしてJavaScriptをその２つの値を設定出来るように更新する。

      ...

    +  var rotationLocation = gl.getUniformLocation(program, "u_rotation");

      ...

    +  var rotation = [0, 1];

      ...

      // シーンを描画する。
      function drawScene() {

        ...

        // 移動距離を設定する。
        gl.uniform2fv(translationLocation, translation);

    +    // 回転差を設定する。
    +    gl.uniform2fv(rotationLocation, rotation);

        // 図形を描画する。
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;  // ６三角形、三角形ごとに３頂点
        gl.drawArrays(primitiveType, offset, count);
      }

そしてここがその結果である。回転するために単位円のハンドルを操作して、
移動するためにスライダを使ってみよう。

{{{example url="../webgl-2d-geometry-rotation.html" }}}

何でこういう結果が出るか？計算式を見て下さい。

    rotatedX = a_position.x * u_rotation.y + a_position.y * u_rotation.x;
    rotatedY = a_position.y * u_rotation.y - a_position.x * u_rotation.x;

回転したい四角形があることを想像しよう。回転する前に右上の頂点は3.0,9.0である。
単位円の真上から右回り３０度の位置を選ぼう。

<img src="../../resources/rotate-30.png" class="webgl_center" />

この単位円の円周の位置は0.50と0.87である。

<pre class="webgl_center">
   3.0 * 0.87 + 9.0 * 0.50 = 7.1
   9.0 * 0.87 - 3.0 * 0.50 = 6.3
</pre>

これが回転する為に必要な値になってくる！

<img src="../../resources/rotation-drawing.svg" width="500" class="webgl_center"/>

６０度も同じようにしてみよう。

<img src="../../resources/rotate-60.png" class="webgl_center" />

この単位円の円周の位置は0.87と0.50

<pre class="webgl_center">
   3.0 * 0.50 + 9.0 * 0.87 = 9.3
   9.0 * 0.50 - 3.0 * 0.87 = 1.9
</pre>

その単位円の円周の位置を右回りに移動するとXが大きくなって、Yが小さくなる。９０度を過ぎたら
Xが小さくなって、Yが大きくなって行く。そのパターンで回転出来る。

単位円の円周の位置は別の名前がある。
それは正弦(sine)と余弦(cosine)と呼ばれていることである。
どんな角度でもその角度の正弦と余弦はこのように調べられる。

    function printSineAndCosineForAnAngle(angleInDegrees) {
      var angleInRadians = angleInDegrees * Math.PI / 180;
      var s = Math.sin(angleInRadians);
      var c = Math.cos(angleInRadians);
      console.log("s = " + s + " c = " + c);
    }

そのコードをJavaScriptコンソルにコピーとペーストして、そして
`printSineAndCosineForAngle(30)`を入力したら`s = 0.49 c = 0.87`を
表示して来る。(note:値を四捨五入した。)

それを組み合わせたら、どんな角度でも図形を回転出来るようになる。
`rotation`を希望の角度の正弦と余弦に設定するだけである.

      ...
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[0] = Math.sin(angleInRadians);
      rotation[1] = Math.cos(angleInRadians);

これは角度しかない版である。移動と回転するためにスライダを操作してみよう。

{{{example url="../webgl-2d-geometry-rotation-angle.html?ui-angle=角度" }}}

ここまで良い説明だったかな〜。。。
これは一般的な回転する方法じゃないのでまだ読み続けて下さい。
２つ後の記事でそれにたどり着く。[次はもっと簡単なこと、拡大と縮小のし方である](webgl-2d-scale.html).

<div class="webgl_bottombar"><h3>ラジアンは何？</h3>
<p>
ラジアンは円と回転とアングル計る単位である。距離がインチとか、センチとか、メートルなどで
計れるのと同じように、アングルは角度とラジアンの単位で計れる。
</p>
<p>
You're probably aware that math with metric measurements is easier than math with imperial measurements. To go from inches to feet we divide by 12. To go from inches to yards we divide by 36. I don't know about you but I can't divide by 36 in my head. With metric it's much easier. To go from millimeters to centimeters we divide by 10. To go from millimeters to meters we divide by 1000. I **can** divide by 1000 in my head.
</p>
<p>
ラジアンと角度は同じようなものである。角度の方が難しくなる。
円を角度で計ると３６０度あるが、
ラジアンで計ると2πラジアンになる。
一周は2πラジアンである。半周転は1πラジアンである。１/４の一周は1/2πラジアンである。９０度を回転したければ<code>Math.PI * 0.5</code>を使えばいいとか、 4５度なら<code>Math.PI * 0.25</code>を使うなど。
</p>
<p>
アングル数学はほとんどラジアンを使えば簡単になるので、ラジアンで考えてみよう！
UI以外ラジアンを使うべきである。
</p>
</div>


