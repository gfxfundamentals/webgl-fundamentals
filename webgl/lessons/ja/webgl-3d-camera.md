Title: WebGL三次元でカメラ
Description: WebGLでカメラの計算し方
TOC: 三次元のカメラ


この記事はWebGLシリーズのーつである。最初の記事は[WebGLの基本で始まった](webgl-fundamentals.html)。 
そして、前回の記事は[透視投影](webgl-3d-perspective.html)についてだった。まだ読んでいなかったら先に読んで下さい。

前回の記事で、`m4.perspective`の関数が原点(0,0,0)から`-zNear`〜`-zFar`の空間を描画するので、
「F」をその錘台の中に移動しなければいけなかった。

現実の世界でカメラを移動して、撮影したい物（ビル、山、森）に向ける。

{{{diagram url="resources/camera-move-camera.html?mode=0" caption="カメラを物に移動する。" }}}

現実の世界で何かを撮影したい場合、その物をカメラの前に移動することはほとんどない。

{{{diagram url="resources/camera-move-camera.html?mode=1" caption="物をカメラに移動する。" }}}

でも前回の記事で出来た透視投影が原点から-Zの方に向いていた。
今回の目的を達成する為にカメラを原点に移動して、他のものを全てカメラの移動と連動して相対的に移動しなければいけない。

{{{diagram url="resources/camera-move-camera.html?mode=2" caption="物をビューに移動する。" }}}

その結果を出すためにワールドをカメラの前に移動するようにしなければいけない。
それに逆行列を使えばいい。逆行列を計算する方法は複雑だが、コンセプトは簡単である。
逆行列はある行列を否定する行列である。例えば123の逆は-123である。5倍拡大行列の逆行列は
0.2縮小行列である。X軸で30度に回転行列の逆行列はX軸で-30度の行列である。

今まで「F」の位置と向きを調整するために移動、回転、拡大縮小行列を使った。
全部掛け合わせたら、その移動、回転、スケールが一つの行列で表している。
カメラでも同じように出来る。カメラを原点から好きな位置に移動して、
好きな向きに回転する行列が出来たら、その行列の逆行列を計算して、
その逆行列でカメラが原点から-Zの方に向いて、表示したいものを全てカメラの前に移動出来る。

上の「F」の円のような三次元シーンを作成しよう。

まず、5つの物を描画して、全部同じ投影行列を使うので、ループの前に透視投影行列を計算する。

```

// 透視投影行列を計算する。
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var zNear = 1;
var zFar = 2000;
var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

```

次にカメラの行列を計算する。この行列はカメラの位置と向きを表している。
下記のコードは向きが常に原点で、原点から`radius`を1.5掛けの距離で回転している行列を作成する。

{{{diagram url="resources/camera-move-camera.html?mode=3" caption="カメラの動き" }}}

```
var numFs = 5;
var radius = 200;

// カメラ行列を計算する。
var cameraMatrix = m4.yRotation(cameraAngleRadians);
cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);
```

そして、カメラ行列からビュー行列を計算する。
ビュー行列はある物を全てカメラの前に移動する行列である。カメラは原点にあるとして、
他のものがカメラと相対しているように移動出来るような行列である。
`inverse`という関数を使ってカメラ行列の逆行列計算が出来る。

この場合、カメラ行列は原点を基点とした位置と向きでカメラが移動する行列である。
その行列を`inverse`関数に与えて、
出た逆行列はカメラを原点にして、他の物がカメラと相対的に移動する。

```
// カメラ行列からビュー行列を作成する。
var viewMatrix = m4.inverse(cameraMatrix);
```

そして、ビュー行列と投影行列を組み合わせてビュー投影行列を作成する。

```
// ビュー投影行列を計算する。
var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
```

最後に、「F」の円を描画する。「F」ごとにビュー投影行列から始まって、そして回転して、`radius`単位で外側へ移動する。

```
for (var ii = 0; ii < numFs; ++ii) {
  var angle = ii * Math.PI * 2 / numFs;
  var x = Math.cos(angle) * radius;
  var y = Math.sin(angle) * radius

  // ビュー投影行列から「F」の行列を計算する。
  var matrix = m4.translate(viewProjectionMatrix, x, 0, y);

  // 行列を設定する。
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // 図形を描画する。
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 16 * 6;
  gl.drawArrays(primitiveType, offset, count);
}
```

「F」の円の周りを回転しているカメラの出来上がり！`カメラ角度`のスライダでカメラを移動してみて下さい。

{{{example url="../webgl-3d-camera.html?ui-cameraAngle=カメラ角度" }}}

それで良しとすることも出来るけど、移動と回転でカメラを目標に向かせることはあまり簡単ではないような気がする。
例えば一つの特定の「F」を目指したければ、「F」の円の回りに回っているカメラが特定の「F」に向ける計算はウンザリするものかもしれない。

幸いにも、もっと簡単な方法がある。カメラの位置を好きにして、目標も好きにして、そのデータで行列の計算が出来る。
行列の動き方で驚くほど簡単である。

まず、カメラの位置を決める。それは「`cameraPosition`」と呼ぶ。そして、目標を位置も決める。
それは「 `target`」と呼ぶ。`cameraPosition`から`target`を引くとカメラから目標を目指しているベクトルが出る。それは`zAxis`と呼ぼう。
カメラは-Zの方向に向かうので逆に計算しよう「`cameraPosition - target`」。その結果をノーマライズする。それを行列のZの部分に直接入れる。

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
| Zx | Zy | Zz |    |
+----+----+----+----+
|    |    |    |    |
+----+----+----+----+
</pre></div>

この行列部分はZ軸を表している。この場合はカメラのZ軸になっている。
ベクトルをノーマライズするというのは1.0を表しているベクトルにするという意味である。
以前の[二次元回転についての記事](webgl-2d-rotation.html)へ戻ったら,
単位円で二次元回転が出来た。三次元なら単位球体が必要で、
ノーマライズをされたベクトルは単位球体の表面の位置を表している。

{{{diagram url="resources/cross-product-diagram.html?mode=0" caption="<span class='zaxis'>z軸</span>" }}}

それだけでは情報が足りない。一つのベクトルだけで単位球体表面の一つにポイントが分かってくるが、
そのポイントからどの傾きにしたらいいかまだ分からない。他の行列の部分に何かを入れなきゃ。
特にX軸とY軸の部分に何か入れる必要がある。三次元行列の軸はほとんどお互いに垂直の関係であることもう知っている。
その上、カメラは普段真上を目指さないことも知っている。なので、上の方向が分かれば、今の場合（0,1,0）、
「外積」という計算でX軸とY軸を計算出来る。

数学としての外積の意味は全然分からないが、
分かっているところは2つの単位ベクトルを外積すると、その2つのベクトルに垂直なベクトルが出るということだ。
例えば、南東を目指しているベクトルと上を目指しているベクトルを外積すると、南西か北東を目指しているベクトルが出る。
その2つは南東と上に垂直になっているからだ。外積する順番によって逆の結果が出る。

<style>
.xaxis { color: red; }
.yaxis { color: green; }
.zaxis { color: blue; }
.up { color: gray; font-weight: bold; }
</style>
いずれにせよ、<span class="zaxis">z軸</span>と<span class="up">上</span>を外積するとカメラの<span class="xaxis">x軸</span>が出る。

{{{diagram url="resources/cross-product-diagram.html?mode=1" caption="<span class='up'>上</span>と<span class='zaxis'>z軸</span>の外積 = <span class='xaxis'>x軸</span>" }}}

<span class="xaxis">x軸</span>が出来たら<span class="zaxis">z軸</span>と<span class="xaxis">x軸</span>を外積したら<span class="yaxis">y軸</span>を計算出来る。

{{{diagram url="resources/cross-product-diagram.html?mode=2" caption="<span class='zaxis'>z軸</span>と<span class='xaxis'>x軸</span>の外積 = <span class='yaxis'>y軸</span>"}}}

最後に三つの軸を行列に入れなきゃ。その行列は`cameraPosition`から`target`を目指すと同じような向きになる。
 ただ`position`も追加して、`cameraPosition`から`target`を目指す行列になる。

<div class="webgl_math_center"><pre class="webgl_math">
+----+----+----+----+
| <span class="xaxis">Xx</span> | <span class="xaxis">Xy</span> | <span class="xaxis">Xz</span> |  0 |  <- <span class="xaxis">x軸</span>
+----+----+----+----+
| <span class="yaxis">Yx</span> | <span class="yaxis">Yy</span> | <span class="yaxis">Yz</span> |  0 |  <- <span class="yaxis">y軸</span>
+----+----+----+----+
| <span class="zaxis">Zx</span> | <span class="zaxis">Zy</span> | <span class="zaxis">Zz</span> |  0 |  <- <span class="zaxis">z軸</span>
+----+----+----+----+
| Tx | Ty | Tz |  1 |  <- カメラ位置
+----+----+----+----+
</pre></div>

これは２つのベクトルの外積計算法である。

```
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
          a[2] * b[0] - a[0] * b[2],
          a[0] * b[1] - a[1] * b[0]];
}
```

これは２つのベクトルの引き算のコードである。

```
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
```

これはベクトルをノーマライズするコードである。（単位ベクトルにする）

```
function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // ０で割らないようにする。
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}
```

これは”lookAt”（目指す）行列を計算するコードである。

```
var m4 = {
  lookAt: function(cameraPosition, target, up) {
    var zAxis = normalize(subtractVectors(cameraPosition, target));
    var xAxis = normalize(cross(up, zAxis));
    var yAxis = normalize(cross(zAxis, xAxis));

    return [
       xAxis[0], xAxis[1], xAxis[2], 0,
       yAxis[0], yAxis[1], yAxis[2], 0,
       zAxis[0], zAxis[1], zAxis[2], 0,
       cameraPosition[0],
       cameraPosition[1],
       cameraPosition[2],
       1,
    ];
  }
```

そして、これはカメラを移動しながら、特定の「F」を目指す方法の一つである。

```
  ...

  // 最初の「F」の位置を計算する。
  var fPosition = [radius, 0, 0];

  // 行列数学でカメラを円の回りの位置を計算する。
  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);

  // 行列からカメラの位置を取る。
  var cameraPosition = [
    cameraMatrix[12],
    cameraMatrix[13],
    cameraMatrix[14],
  ];

  var up = [0, 1, 0];

  // ”lookAt"でカメラ行列を計算する。
  var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

  // カメラの行列でヴュー行列を作成する。
  var viewMatrix = m4.inverse(cameraMatrix);

  ...
```

これはその結果である。

{{{example url="../webgl-3d-camera-look-at.html?ui-cameraAngle=カメラ角度" }}}

スライダを操作して、カメラは特定の「F」を狙っていることに注目しよう。

`lookAt`の関数はカメラ以上に色々なことで使える。
通常使う場合はあるキャラクターの顔が別のキャラクターを追いかけることとか。
旋回砲塔を目標に向けることとか。オブジェクトが通路通りにすすで行くこととか。
そのオブジェクトが通路の何処にあるかを計算して、
その直後通路に何処に存在するかを計算して、その2つの位置を`lookAt`の関数に入れたら、
そのオブジェクトが通路を進んでいく行列が出る。そうするとオブジェクトがただしい方向で通路の先に向かう。

次に[アニメーションを習おう](webgl-animation.html).

<div class="webgl_bottombar">
<h3>lookAtの規格</h3>
<p>
通常三次元数学ライブラリには<code>lookAt</code>関数がある。
それは大抵カメラ行列ではなく、ビュー行列を作成するの為に作られた。
つまり、カメラを移動して向きを決める行列じゃなくて、他の物を全てカメラの前に移動する行列を作る。
</p>
<p>
それはあまり便利じゃないような気がする。
以前に指摘したように<code>lookAt</code>のような関数は多くの事に利用出来る。
ビュー行列が必要な場合、簡単に<code>inverse</code>を呼び出せる。
でも、キャラクタの頭を他のキャラクタに追いかけさせる時とか、旋回砲塔を目標に狙わせる時とか、オブジェクトを移動させて、
向きを設定させる行列を作成する<code>lookAt</code>関数の方が便利だと個人的に思う。
</p>
{{{example url="../webgl-3d-camera-look-at-heads.html" }}}
</div>



