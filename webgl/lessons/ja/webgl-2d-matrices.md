Title: WebGL二次元行列数学
Description: 分かりやすい行列数学の説明
TOC: 二次元での行列数学


本記事はWebGLシリーズの一つである。最初の記事は
[WebGLの基本で始まった](webgl-fundamentals.html)。そして、前回の記事は
[二次元図形の拡大と縮小についての記事である](webgl-2d-scale.html)。

前回の３つの記事で図形の[移動](webgl-2d-translation.html),
[回転](webgl-2d-rotation.html), と [拡大と縮小](webgl-2d-scale.html)について取り上げた。
移動、回転、拡大/縮小は全部変換である。
変換ごとにシェーダーの編集が必要であった。その上変換順番もお互いに依存していた。
[前回のサンプルで](webgl-2d-scale.html)拡大してから、回転して、最後移動した。
別の順番なら違う結果が出る。

例えばこれは「2,1」の拡大、30度の回転、そして「100,0」の移動である。

<img src="../resources/f-scale-rotation-translation.svg" class="webgl_center" width="400" />

そして、これは「100,0」の移動、30度の回転、「2,1」の拡大である。

<img src="../resources/f-translation-rotation-scale.svg" class="webgl_center" width="400" />

結果が全然違う。さらに悪い点は二番目の結果が欲しければ、その順番に変換を掛ける別のシェーダーを書かなければいけないことである。

私よりずいぶん頭がいい人のお陰で、それを全部行列数学で出来る方法を開発した。
二次元の場合3x3の行列を使う。3x3行列は9個のグリッドのようなことである。

<link href="resources/webgl-2d-matrices.css" rel="stylesheet">
<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>2.0</td><td>3.0</td></tr><tr><td>4.0</td><td>5.0</td><td>6.0</td></tr><tr><td>7.0</td><td>8.0</td><td>9.0</td></tr></table></div>

行列数学で計算するためにpositionを行列の桁に掛けて、結果を加える。
二次元で2つの値しかない（ｘとｙ）だがWebGLは2x3の行列がないので3番目の値に１を使う。

この場合の結果はこれである。

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col class="glocal-b"/>
<tr><td class="glocal-right">newX&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">2.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x&nbsp;*&nbsp;</td><td class="glocal-border">3.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">4.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">5.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y&nbsp;*&nbsp;</td><td class="glocal-border">6.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1&nbsp;*&nbsp;</td><td>7.0</td><td>&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>8.0</td><td>&nbsp;&nbsp;</td><td></td><td>1&nbsp;*&nbsp;</td><td>9.0</td><td>&nbsp;</td></tr></table></div>

これを見ると「なんの意味があるの？」と考えているだろう？ じゃあ,
移動の距離があるとしよう。移動距離は「tx」と「ty」と呼ぶことにする。
このような行列を作ろう。

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>1.0</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>1.0</td><td>0.0</td></tr><tr><td>tx</td><td>ty</td><td>1.0</td></tr></table></div>

チェックしてみよう

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr><tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

代数学を思い出せば０に掛ける所を削除出来る。１に掛けたら何も変わらないので単純化してみよう。

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk glocal-left">&nbsp;+</td><td></td><td>y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">1.0</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>tx</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td>ty</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

それとももっと簡潔に

<div class="webgl_center"><pre class="webgl_math">
newX = x + tx;
newY = y + ty;
</pre></div>

「extra」の部分を無視していい。これは[移動サンプル](webgl-2d-translation.html)の移動のし方に結構似てるだろう？

同じように回転もしよう。 回転の記事で書いたように回転角度の正弦(sine)
と余弦(cosine)しか要らない。。。

<div class="webgl_center"><pre class="webgl_math">
s = Math.sin(angleToRotateInRadians);
c = Math.cos(angleToRotateInRadians);
</pre></div>

そしてこのように行列を作る。

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>c</td><td>-s</td><td>0.0</td></tr><tr><td>s</td><td>c</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

positionに行列を適用して

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

０と１に掛けている所を消したらこれになる。

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">-s</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">s</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">c</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

そして単純化すると

<pre class="webgl_center">
newX = x *  c + y * s;
newY = x * -s + y * c;
</pre>

これは[回転サンプル](webgl-2d-rotation.html)と全く同じである。

最後は拡大もしよう。拡大の値は「sx」と「sy」と呼ぶことにする。

このように行列を作って

<div class="glocal-center"><table class="glocal-center-content glocal-mat"><tr><td>sx</td><td>0.0</td><td>0.0</td></tr><tr><td>0.0</td><td>sy</td><td>0.0</td></tr><tr><td>0.0</td><td>0.0</td><td>1.0</td></tr></table></div>

行列を適用したら

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td class="glocal-left">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left">&nbsp;+&nbsp;</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">0.0</td><td>&nbsp;+</td></tr>
<tr><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td>&nbsp;*&nbsp;</td><td>1.0</td><td>&nbsp;</td></tr></table></div>

それは実はこれである。

<div class="glocal-center"><table class="glocal-center-content">
<col/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/><col/><col class="glocal-sp"/><col/><col/><col class="glocal-b"/>
<tr><td>newX&nbsp;=&nbsp;</td><td>x</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sx</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">newY&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td class="glocal-right">extra&nbsp;=&nbsp;</td><td class="glocal-blk">x</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-left glocal-blk">&nbsp;+</td><td></td><td>y</td><td>&nbsp;*&nbsp;</td><td class="glocal-border">sy</td><td class="glocal-left glocal-blk">&nbsp;+&nbsp;</td><td></td><td class="glocal-blk">y</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk glocal-border">0.0</td><td class="glocal-blk">&nbsp;+</td></tr>
<tr><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;</td><td></td><td class="glocal-blk">1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">0.0</td><td>&nbsp;&nbsp;</td><td></td><td>1</td><td class="glocal-blk">&nbsp;*&nbsp;</td><td class="glocal-blk">1.0</td><td>&nbsp;</td></tr></table></div>

単純化されたらこう

<pre class="webgl_center">
newX = x * sx;
newY = y * sy;
</pre>

[拡大/縮小サンプル](webgl-2d-scale.html)と同じである。

まだ「前より大変じゃないが！複雑でどういう意味があるの？」と思っているだろう。

ここで魔法のようなことが起こる。複数行列を掛け合わせたら全部の変換に適用出来る。
`m3.multiply`という２つの行列を掛けて、結果の返り値を戻る関数があるとしよう。

分かり易くするために移動、回転、拡大の行列の制作関数を作ろう。

    var m3 = {
      // 移動行列
      translation: function(tx, ty) {
        return [
          1, 0, 0,
          0, 1, 0,
          tx, ty, 1,
        ];
      },

      // 回転行列
      rotation: function(angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [
          c,-s, 0,
          s, c, 0,
          0, 0, 1,
        ];
      },

      // 拡大行列
      scaling: function(sx, sy) {
        return [
          sx, 0, 0,
          0, sy, 0,
          0, 0, 1,
        ];
      },
    };

シェーダーを変更しよう。前回のシェーダーはこれである。

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform vec2 u_translation;
    uniform vec2 u_rotation;
    uniform vec2 u_scale;

    void main() {
      // Scale the position
      vec2 scaledPosition = a_position * u_scale;

      // Rotate the position
      vec2 rotatedPosition = vec2(
         scaledPosition.x * u_rotation.y + scaledPosition.y * u_rotation.x,
         scaledPosition.y * u_rotation.y - scaledPosition.x * u_rotation.x);

      // Add in the translation.
      vec2 position = rotatedPosition + u_translation;
      ...

新しいシェーダーはそれよりずいぶん簡単である。

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
    uniform mat3 u_matrix;

    void main() {
      // Multiply the position by the matrix.
      vec2 position = (u_matrix * vec3(a_position, 1)).xy;
      ...

そして、このように使う。

      // シーンを描画する。
      function drawScene() {

        ,,,

        // 行列を計算する。
        var translationMatrix = m3.translation(translation[0], translation[1]);
        var rotationMatrix = m3.rotation(angleInRadians);
        var scaleMatrix = m3.scaling(scale[0], scale[1]);

        // 行列を掛け合わせる。
        var matrix = m3.multiply(translationMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);

        // シェーダーの行列ユニフォームを設定する。
        gl.uniformMatrix3fv(matrixLocation, false, matrix);

        // 図形を描画する。
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 18;  // ６三角形、三角形ごとに３頂点
        gl.drawArrays(primitiveType, offset, count);
      }

これは最新コードを使っているサンプルである。
移動、回転、拡大のスライダは前回と同じである。
だが、シェーダーで使われている方法はもっと簡単になった。

{{{example url="../webgl-2d-geometry-matrix-transform.html?ui-angle=角度&ui-scaleX=xのスケール&ui-scaleY=yのスケール" }}}

まだ「で？それは便利か？」と思っているだろう？でも、順番を変更したければシェーダーを更新しなくていい。
だだ計算式だけ更新したらいい。

        ...
        // 行列を掛ける。
        var matrix = m3.multiply(scaleMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, translationMatrix);
        ...

これはそのバージョンである。

{{{example url="../webgl-2d-geometry-matrix-transform-trs.html?ui-angle=角度&ui-scaleX=xのスケール&ui-scaleY=yのスケール" }}}

人体の腕とか、太陽の周りを回っている惑星を回っている月とか、木の枝などの階層的なアニメーション
のためにこのように行列を適用することは特に重要である。例えば、階層的なアニメーションの例として、
「F」を５回描画して、「F」ごとに前の「F」の行列から始めよう。

      // シーンを描画する。
      function drawScene() {
        // キャンバスをクリアーする。
        gl.clear(gl.COLOR_BUFFER_BIT);

        // 行列を計算する。
        var translationMatrix = m3.translation(translation[0], translation[1]);
        var rotationMatrix = m3.rotation(angleInRadians);
        var scaleMatrix = m3.scaling(scale[0], scale[1]);

        // 最小の行列
        var matrix = m3.identity();

        for (var i = 0; i < 5; ++i) {
          // 行列を掛ける。
          matrix = m3.multiply(matrix, translationMatrix);
          matrix = m3.multiply(matrix, rotationMatrix);
          matrix = m3.multiply(matrix, scaleMatrix);

          // 行列を設定する。
          gl.uniformMatrix3fv(matrixLocation, false, matrix);

          // 図形を描画する。
          var primitiveType = gl.TRIANGLES;
          var offset = 0;
          var count = 18;  // ６三角形、三角形ごとに３頂点
          gl.drawArrays(primitiveType, offset, count);
        }
      }

そのために`m3.identity`という単位行列の作成する関数を追加した。単位行列は
「1.0」と同じように何かに掛けても何も変わらない。このようなことで

<div class="webgl_center">X * 1 = X</div>

行列でも同じようになる。

<div class="webgl_center">matrixX * identity = matrixX</div>

単位行列の作成コードはここにある。

    var m3 = {
      identity: function() {
        return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
      },

      ...

５つの「F」はこれである。

{{{example url="../webgl-2d-geometry-matrix-transform-hierarchical.html?ui-angle=角度&ui-scaleX=xのスケール&ui-scaleY=yのスケール" }}}

もう一つのサンプルを見よう。
今までのサンプルは全て、「F」の左上角を軸として回転している（上にある順番を変えたサンプル以外）。
それは、使っている計算式は原点軸を中心として周りを回転するものだから。「F」の左上の頂点は原点(0,0)にある。

だが今は、行列数学を使っているから行列掛ける順番を選べる。それで原点を移動出来る。

        // 「F」の原点に「F」の真ん中に移動する行列を作成する。
        var moveOriginMatrix = m3.translation(-50, -75);
        ...

        // 行列を掛ける。
        var matrix = m3.multiply(translationMatrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);
    +    matrix = m3.multiply(matrix, moveOriginMatrix);

これは「F」の中心で回転と拡大するサンプルである。

{{{example url="../webgl-2d-geometry-matrix-transform-center-f.html?ui-angle=角度&ui-scaleX=xのスケール&ui-scaleY=yのスケール" }}}

この方法を使うとどの位置からでも回転と拡大縮小が出来る。
フォトショップがどういうふうに好きな点で回転する機能を作ったか分かるようになって来た！

もっとクレージにしよう！最初の記事「WebGLの基本」を思い出したら、このピクセル空間からクリップ空間に
計算しているシェーダーコードがあった。

```
  ...
　// positionはピクセルから0〜1に
  vec2 zeroToOne = position / u_resolution;

  // 0〜1から0〜2に
  vec2 zeroToTwo = zeroToOne * 2.0;

  // 0〜2から-1〜+1に(クリップ空間）
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
```

そのコードのステップを順番に見よう。ステップ１「positionはピクセルから0〜1に」は
実は拡大縮小の変換である。ステップ２「0〜1から0〜2に」も拡大の変換である。
ステップ３は移動の変換で、最後のステップは−１にサイズ変換である。それは全てシェーダーに
渡す行列で出来る。ーつの1.0/resolutionの縮小変換行列を作成して、もう一つ2.0に拡大行列を作成して、
「-1,-1」で移動行列作成して、Yに-１をサイズ拡大縮小行列を作成して、全部掛け合わせることが出来るが、
その数学は簡単なのでその結果の行列を作る関数を作ろう。


    var m3 = {
      projection: function(width, height) {
        // Note: Y軸で０は上の方にするためYを弾く行列
        return [
          2 / width, 0, 0,
          0, -2 / height, 0,
          -1, 1, 1
        ];
      },

      ...

そうすれば、シェーダーコードをもっと単純化出来る。これは最新のシェーダーの全て

    <script id="vertex-shader-2d" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform mat3 u_matrix;

    void main() {
      // positionを行列に掛ける。
      gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    }
    </script>

そしてJavaScriptで行列をprojection行列に掛けることが必要である。

      // シーンを描画する。
      function drawScene() {
        ...

        // 行列を計算する。
        var projectionMatrix = m3.projection(
            gl.canvas.clientWidth, gl.canvas.clientHeight);

        ...

        // 行列を掛ける。
        var matrix = m3.multiply(projectionMatrix, translationMatrix);
        matrix = m3.multiply(matrix, rotationMatrix);
        matrix = m3.multiply(matrix, scaleMatrix);

        ...
      }

解像度「resolution」を指定するコードも消した。この最後の更新で、６〜７ステップもあるシェーダーから、
たった一つのステップのシェーダーに辿り着いた。行列数学のお陰で凄くシンプルになった。

{{{example url="../webgl-2d-geometry-matrix-transform-with-projection.html?ui-angle=角度&ui-scaleX=xのスケール&ui-scaleY=yのスケール" }}}

次の記事へ行く前にもちょっと単純化しよう。複数行列を作成して、その後お互いに掛けることは珍しくないけど、
作成しながら掛けることも通常の方法である。このような関数を作ろう。

```
var m3 = {

  ...

  translate: function(m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },

  rotate: function(m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },

  scale: function(m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },

  ...

};
```

その関数を使ったら前にある行列計算コード７行をこのような４行にできる。

```
// 行列を計算する。
var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
matrix = m3.translate(matrix, translation[0], translation[1]);
matrix = m3.rotate(matrix, angleInRadians);
matrix = m3.scale(matrix, scale[0], scale[1]);
```

これはそのバージョンである。

{{{example url="../webgl-2d-geometry-matrix-transform-simpler-functions.html?ui-angle=角度&ui-scaleX=xのスケール&ui-scaleY=yのスケール" }}}

もう一つのこと、。。。上記の頭で話したように順番が大事だ。最初のサンプルで

    移動 * 回転 * 拡大

その後これがあった。

    拡大 * 回転 * 移動

その２つの方法の違いを見た。

行列数学の考える方法はこのようである。クリップ空間から始まる。行列ごとに行列を適用するとその空間が変更される。

ステップ1:  行列無し(それとも単位行列)

> {{{diagram url="resources/matrix-space-change.html?stage=0" caption="クリップ空間" }}}
>
> 白い部分はキャンバスで、青い部分はキャンバス以外である。
> これはクリップ空間。シェーダーに与える座標はクリップ空間で与える。

ステップ2:  `matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight)`;

> {{{diagram url="resources/matrix-space-change.html?stage=1" caption="クリップ空間からピクセル空間へ" }}}
>
> ピクセル空間になった。 X=0〜400,Y=0〜300で、0,0は左上である。
> 座標はピクセル空間で与えなければいけない。フラッシュは+1＝上から＋1＝下Y軸を繰り返する時である。

ステップ3:  `matrix = m3.translate(matrix, tx, ty);`

> {{{diagram url="resources/matrix-space-change.html?stage=2" caption="原点をtx, tyに移動" }}}
>
> 原点は「tx, ty」になった。（空間は移動された。)

ステップ4:  `matrix = m3.rotate(matrix, rotationInRadians);`

> {{{diagram url="resources/matrix-space-change.html?stage=3" caption="33°を回転" }}}
>
> 空間は「tx, ty」を中心に回転された。

ステップ5:  `matrix = m3.scale(matrix, sx, sy);`

> {{{diagram url="resources/matrix-space-change.html?stage=4" caption="空間を拡大" }}}
>
> 「tx, ty」を中心に回転された空間は拡大された。

ステップ6:  シェーダーで`gl_Position = matrix * position;`にした。その`position`の座標はその最後の空間にある。

この行列説明は分かり易かったかな〜〜〜。まだ二次元のことに興味があれば[キャンバスAPIのdrawImage関数を再作成の記事](webgl-2d-drawimage.html)はお奨めである。そして[キャンバスの二次元行列スタックを再作成](webgl-2d-matrix-stack.html)という記事も。

それでは、次は[三次元へ進もう](webgl-3d-orthographic.html)。三次元の行列数学の原則は２次元と同じである。
二次元の方が分かり易いのでそこから始めた。

<div class="webgl_bottombar">
<h3><code>clientWidth</code>と<code>clientHeight</code>は何?</h3>
<p>今までキャンバスのサイズを参照した時<code>canvas.width</code>と<code>canvas.height</code>
を使ったが、上記で<code>m3.projection</code>を呼び出した時その変わりに<code>canvas.clientWidth</code>と <code>canvas.clientHeight</code>を使った。なぜだろう?</p>
<p>投影行列はクリップ空間（−１〜＋１）からピクセル空間の変換であるが、ブラウザでピクセル空間が２つある。
一つはキャンバスの解像度である。例えばこのように定義されたキャンバス</p>
<pre class="prettyprint">
  &lt;canvas width="400" height="300"&gt;&lt;/canvas&gt;
</pre>
<p>あるいはこのように定義されたキャンバス</p>
<pre class="prettyprint">
  var canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 300;
</pre>
<p>これら両方の横は400ピクセルで縦は300ピクセルである。でも、キャンバスの表示サイズは別に定義されている。
CSSで表示サイズを定義する。例えばこのようにキャンバスを作成したら</p>
<pre class="prettyprint"><!>
  &lt;style&gt;
  canvas {
    width: 100vw;
    height: 100vh;
  }
  &lt;/style&gt;
  ...
  &lt;canvas width="400" height="300">&lt;/canvas&gt;
</pre>
<p>キャンバスはウインドウサイズと同じサイズで表示される。それはほとんど400x300じゃないだろう。</p>
<p>ここにキャンバスの表示サイズをページと同じサイズにするサンプルが2つである。最初のサンプルは
<code>canvas.width</code>と<code>canvas.height</code>。別のウインドを開いて、ウインドのサイズを変更してみよう。「F」の縦横の比率がよくないことに注目して、</p>
{{{example url="../webgl-canvas-width-height.html" width="500" height="150" }}}
<p>この二番目のサンプルで<code>canvas.clientWidth</code>と<code>canvas.clientHeight</code>を使う。 <code>canvas.clientWidth</code>と<code>canvas.clientHeight</code>はブラウザに実際に表示されているサイズである。それを使うと「F」の縦横比率がよくなる。</p>
{{{example url="../webgl-canvas-clientwidth-clientheight.html" width="500" height="150" }}}
<p>ウインドのサイズに合わせるアプリは<code>canvas.width</code>と<code>canvas.height</code>を
<code>canvas.clientWidth</code>と<code>canvas.clientHeight</code>に設定する。表示しているピクセルごとに一つのキャンバスピクセルにして欲しいから。でも上記のサンプルを見て、それは一般的なケースではない。なので、投影行列の場合<code>canvas.clientHeight</code>と<code>canvas.clientWidth</code>を使う方がもっと正しいかも。
</p>
</div>

