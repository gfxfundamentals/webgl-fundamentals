Title: WebGL - 二次元での回転
Description: 二次元で回転する方法
TOC: 二次元での回転


本記事もWebGLシリーズの一つである。最初の記事は[WebGLの基本](webgl-fundamentals.html)で、そして前回の記事は[二次元で移動すること](webgl-2d-translation.html)についての記事である.

まず、上手く説明出来るかどうか分からないが、ベストを尽くしてみよう。

最初に「単位円」というものを紹介したいと思う。中学校で学んだ数学を思い出せば、
円形には半径がある(そこ！簡単すぎるからといって寝てしまわないで！)。
円形の半径は円の中心点から円周までの距離である。
「単位円」は半径を1.0とした円である。

これは単位円である。

{{{diagram url="../unit-circle.html" width="300" height="300" }}}

上の図で、青いハンドルを操作したらXとYの値が変わることに注目して下さい。
それは円周上の位置を表している。
真上はYが1.0でXが0.0である。真右ならXが1.0でYが0.0になる。

小学校の数学を思い出せば、何かに1を掛けるとその数字と同じになる。例えば123ｘ1＝123である。
それは結構常識であるだろう？単位円はこの「１」と似たものだ。半径が１の円であり、言うなればある種の「１」だ。
それは「回転する１」である。「何かに１を掛ける」と「同じ数字になる」ように、「何かに単位円を掛ける」と「魔法のように回転する」。

[前回のサンプル](webgl-2d-translation.html)の図形頂点を単位円のXとYに掛けよう！

これは更新された頂点シェーダーである。

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    +uniform vec2 u_rotation;  // 単位円の円周上の位置座標

    void main() {
    +  // 座標を回転する
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

    +    // 回転角を設定する。
    +    gl.uniform2fv(rotationLocation, rotation);

        // 図形を描画する。
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;  // ６つの三角形、三角形ごとに３頂点
        gl.drawArrays(primitiveType, offset, count);
      }

そしてこれがその結果である。単位円のハンドルを操作して回転、
スライダを使って移動してみよう。

{{{example url="../webgl-2d-geometry-rotation.html" }}}

何でこういう結果が出るか？よろしい、計算式を見て下さい。

    rotatedX = a_position.x * u_rotation.y + a_position.y * u_rotation.x;
    rotatedY = a_position.y * u_rotation.y - a_position.x * u_rotation.x;

回転したい四角形があることを想像しよう。回転する前は右上の頂点は(3.0, 9.0)である。
単位円の円周上、真上から右回り30度の位置を選ぼう。

<img src="../resources/rotate-30.png" class="webgl_center" />

この、単位円の円周上の位置は(0.50, 0.87)である。

<pre class="webgl_center">
   3.0 * 0.87 + 9.0 * 0.50 = 7.1
   9.0 * 0.87 - 3.0 * 0.50 = 6.3
</pre>

これが回転する為に必要な値になってくる！

<img src="../resources/rotation-drawing.svg" width="500" class="webgl_center"/>

60度も同じようにしてみよう。

<img src="../resources/rotate-60.png" class="webgl_center" />

この、単位円の円周上の位置は(0.87, 0.50)

<pre class="webgl_center">
   3.0 * 0.50 + 9.0 * 0.87 = 9.3
   9.0 * 0.50 - 3.0 * 0.87 = 1.9
</pre>

この、単位円の円周上の位置を右回りに移動するとXが大きくなって、Yが小さくなって行く。90度を過ぎたら
Xが小さくなって、Yが大きくなって行く。そのパターンで回転出来る。

「単位円の円周上の位置」には別の名前がある。
それは正弦(sine)と余弦(cosine)と呼ばれている。
どんな角度でもその角度の正弦と余弦はこのように調べられる。

    function printSineAndCosineForAnAngle(angleInDegrees) {
      var angleInRadians = angleInDegrees * Math.PI / 180;
      var s = Math.sin(angleInRadians);
      var c = Math.cos(angleInRadians);
      console.log("s = " + s + " c = " + c);
    }

このコードをJavaScriptコンーソルにコピー＆ペーストして、そして
`printSineAndCosineForAngle(30)`を入力したら`s = 0.49 c = 0.87`が
表示される(note:値は四捨五入した)。

これらを組み合わせたら、どんな図形をどんな角度にでも回転出来るようになる。
`rotation`を希望の角度の正弦と余弦に設定するだけである.

      ...
      var angleInRadians = angleInDegrees * Math.PI / 180;
      rotation[0] = Math.sin(angleInRadians);
      rotation[1] = Math.cos(angleInRadians);

これは角度しか使わない版である。移動と回転するためにスライダを操作してみよう。

{{{example url="../webgl-2d-geometry-rotation-angle.html?ui-angle=角度" }}}

ここまで良い説明だったかな〜。。。
これは一般的な回転する方法じゃないのでまだ読み続けて下さい。
２つ後の記事でそれにたどり着く。[次はもっと簡単なこと、拡大と縮小のやり方](webgl-2d-scale.html)である。

<div class="webgl_bottombar"><h3>ソースコードに出てくるRadian(ラジアン)って何？</h3>
<p>
ラジアンは円や回転で利用される、「角度を計る単位」である。
距離が「インチ」とか、「センチ」とか、「メートル」などで
計れるのと同じように、角度は「度」とか、「ラジアン」の単位で計れる。
</p>
<p>
あなたが普段の生活で帝国単位系(いわゆるヤード・ポンド法。日本の尺貫法に近いが、
アメリカなどでは現役で、例えば身長の話題はセンチでなくフィートで表現される)を
使っている人であっても、「計算にはメートル法を使った方が楽」であることには同意するのではないかと思う。
帝国単位系で「1フィートは12インチ、1インチは1/36ヤード」であることを知っていたとして、
「36で割る」などということが暗算でできるものだろうか？私には無理だ。一方、メートル法なら話は簡単だ。
「1センチメートルは10ミリメートル、1ミリメートルは1メートルの1/1000」である。
「1000で割る」計算なら私でも<strong>暗算できる</strong>。
</p>
<p>
ラジアンの話に戻ろう。
「ラジアン」と「度」は同じようなものであるが、「回転の計算では『度』を使う方が難しい」。
円を「度」で計ると360度になるが、
ラジアンで計ると2πラジアンになる。
一周は2πラジアンである。半周は1πラジアンである。1/4周は1/2πラジアンである。
90度回転したければ<code>Math.PI * 0.5</code>を使えばいいし、45度なら<code>Math.PI * 0.25</code>を使えばいい。
</p>
<p>
角度の計算では、ほとんどの場合ラジアンを使えば簡単になる。これからは、ラジアンで考えてみよう！
「UIデザイン」の文脈では「度」を使う方がよいこともあるが、それ以外の状況ではラジアンを使うべきである。
</p>
</div>


