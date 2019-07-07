Title: WebGL三次元指向性光源
Description: WebGLで指向性光源計算し方
TOC: 三次元指向性光源


この記事はWebGLのシリーズの一つである。最初の記事は[WebGLの基本](webgl-fundamentals.html)についてだった。
前回の記事は[三次元カメラ](webgl-3d-camera.html)についてだった。まだ読んでいなかったら先に読んで下さい。

照明の計算のし方が色々ある。多分一番簡単な方法は指向性光源である。

指向性光源なら光がひとつの方向均一に進んでいく流れていく。
晴れている日の太陽は指向性光源だと考えられている。
太陽は相当遠いから光線が全て平行進んで、あるオブジェクトに当っているようである。

指向性光源の計算は結構簡単である。光線の方向が分かって、オブジェクトの表面の向きも分かっていれば、
その２つの方向の内積(dot product)を計算すると、その２つの方向の間の角度の余弦が出る。

これは例である。

{{{diagram url="resources/dot-product.html" caption="頂点を移動してみて"}}}

頂点を移動して、お互いに真逆の方向にすると内積は-1になる。同じ方向に近づけると内積は1になる。

それがどういうふうに便利なのか？さあ、オブジェクトの表面の方向と光線の方向の両方が分かれば、
その2つの方向の内積を計算すると、照明が表面に向いている場合１になる。反対を向いている場合-１になる。

{{{diagram url="resources/directional-lighting.html?lightDir=光線方向&surface1=オブジェクト&surface2=表面方向&dot=dot(光線反対方向,表面方向)%20%3D%20&ui-rotation=角度" caption="方向を回転してみて" width="500" height="400"}}}

表面の色を内積に掛けると照明になる！

まだ一つの問題がある。三次元のオブジェクトの表面方向がどういうふうに分かるか。

## 法線ベクトルの登場

法線ベクトルは方向を表している。今回三次元のオブジェクトの表面の向きのために使う。

これは四角柱と球体の法線ベクトルである。

{{{diagram url="resources/normals.html"}}}

オブジェクトから出ている線は頂点ごとの法線ベクトルを表している。

四角柱の場合、角ごとに法線ベクトルが三本あることに注目して下さい。
それはその三つの表面が接しているので、三の法線ベクトルが必要である。

Notice the cube has 3 normals at each corner.  That's because you need 3
different normals to represent the way each face of the cube is um, ..
facing.

上の図形で法線ベクトルの色は方向を表している。
＋Xは<span style="color: red;">赤</span>, 上は
<span style="color: green;">緑</span>、そして＋Zは
<span style="color: blue;">青</span>。

照明する為に[前回の記事の`F`](webgl-3d-camera.html)に法線ベクトルを追加しよう！
`F`は四角柱と同じように表面がXとYとZ軸と同調しているので結構簡単である。
前を向いている面の法線ベクトルは`0, 0, 1`である。裏を向いている面の法線ベクトル`0, 0, -1`である。
左を向いている法線ベクトルは`-1, 0, 0`である。右は`1, 0, 0`、上は`0, 1, 0`、下は`0, -1, 0`である。

```
function setNormals(gl) {
  var normals = new Float32Array([
          // 前面の左縦列
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 前面の上の横棒
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 前面の中の横棒
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,

          // 裏面の左縦列
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 裏面の上の横棒
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 裏面の中の横棒
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,
          0, 0, -1,

          // 上面
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // 上横棒の上面
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 上横棒の下面
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 上横棒と中横棒の間面
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 中横棒の上面
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,
          0, 1, 0,

          // 中横棒の右面
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 中横棒の下面
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 下の部分の右面
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,
          1, 0, 0,

          // 下面
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,
          0, -1, 0,

          // 左面
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
          -1, 0, 0,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}
```

そしてそれをセットアップする。その間照明を分かり易くする為に頂点の色を抜く。

    // データはどれの属性に与えなければいけないかを調べる。
    var positionLocation = gl.getAttribLocation(program, "a_position");
    -var colorLocation = gl.getAttribLocation(program, "a_color");
    +var normalLocation = gl.getAttribLocation(program, "a_normal");

    ...

    -// 色のバッファーの作成。
    -var colorBuffer = gl.createBuffer();
    -gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    -// バッファーに色を入れる。
    -setColors(gl);

    +// 法線ベクトルのバッファーを作成する。
    +var normalBuffer = gl.createBuffer();
    +gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    +// バッファーに法線ベクトルを入れる。
    +setNormals(gl);

そして描画する時

```
-// 色の属性オンにする。
-gl.enableVertexAttribArray(colorLocation);
-
-// colorBufferをARRAY_BUFFERに結び付ける。
-gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
-
-// 属性にどうやってcolorBuffer（ARRAY_BUFFER)からデータを取り出すか。
-var size = 3;                  // 呼び出すごとに3つの数値
-var type = gl.UNSIGNED_BYTE;   // データは8ビット符号なし整数
-var normalize = true;          // データをnormalizeする（０〜２５５から０−１に）
-var stride = 0;                // シェーダーを呼び出すごとに進む距離
-                               // 0 = size * sizeof(type)
-var offset = 0;                // バッファーの頭から取り始める
-gl.vertexAttribPointer(
-    colorLocation, size, type, normalize, stride, offset)

+// 法線ベクトルの属性オンにする。
+gl.enableVertexAttribArray(normalLocation);
+
+// normalBufferをARRAY_BUFFERに結び付ける。
+gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
+
+// 属性にどうやってnormalBuffer（ARRAY_BUFFER)からデータを取り出すか。
+var size = 3;                  // 呼び出すごとに3つの数値
+var type = gl.FLOAT;           // データは32ビットの数値
+var normalize = false;         // データをnormalizeしない
+var stride = 0;                // シェーダーを呼び出すごとに進む距離
+                               // 0 = size * sizeof(type)
+var offset = 0;                // バッファーの頭から取り始める
+gl.vertexAttribPointer(
+    normalLocation, size, type, normalize, stride, offset)
```

シェーダーに法線ベクトルを使わせよう

まず、頂点シェーダーで法線ベクトルをピクセルシェーダーに伝えるように更新する。

    attribute vec4 a_position;
    -attribute vec4 a_color;
    +attribute vec3 a_normal;

    uniform mat4 u_matrix;

    -varying vec4 v_color;
    +varying vec3 v_normal;

    void main() {
      // positionを行列に掛ける。
      gl_Position = u_matrix * a_position;

    -  // 色をピクセルシェーダーに渡す。
    -  v_color = a_color;

    +  // 線ベクトルをピクセルシェーダーに渡す。
    +  v_normal = a_normal;
    }

そして、ピクセルシェーダーで光線の方向と法線ベクトルの内積を計算する。

```
precision mediump float;

// 頂点シェーダーに渡された。
-varying vec4 v_color;
+varying vec3 v_normal;

+uniform vec3 u_reverseLightDirection;
+uniform vec4 u_color;

void main() {
+   // v_normalはバリイングなので頂点の間に補間される。
+   // なので単位ベクトルになっていない。ノーマライズすると
+   // 単位ベクトルに戻す。
+   vec3 normal = normalize(v_normal);
+
+   float light = dot(normal, u_reverseLightDirection);

*   gl_FragColor = u_color;

+   // 色部分だけ照明に掛けよう（アルファ/透明の部分を無視）
+   gl_FragColor.rgb *= light;
}
```

`u_color`と`u_reverseLightDirection`のユニフォム・ロケーションを調べなきゃ。

```
  // ユニフォムを調べる。
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
+  var colorLocation = gl.getUniformLocation(program, "u_color");
+  var reverseLightDirectionLocation =
+      gl.getUniformLocation(program, "u_reverseLightDirection");

```

そして、それを設定しなきゃ。

```
  // 行列を設定する。
  gl.uniformMatrix4fv(matrixLocation, false, worldViewProjectionMatrix);

+  // 色を設定する。
+  gl.uniform4fv(colorLocation, [0.2, 1, 0.2, 1]); // green
+
+  // 光線の方向を設定する。
+  gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([0.5, 0.7, 1]));
```

以前に説明した`m4.normalize`であるベクトルを単位ベクトルに出来る。この場合、
`x = 0.5`が`+x`の意味は指向性光源が右から左に向いてることである。
`y = 0.7`が`+y`の意味は指向性光源が上から下に向いてることである。
`z = 1`が`+z`の意味は指向性光源が前から中を目指していることである。
お互いの相対値の意味は光線がほとんど中を目指していて、さらに左より下への方向性が強いことである。

さあ、これである。

{{{example url="../webgl-3d-lighting-directional.html?ui-fRotation=Fの回転" }}}

`F`を回転してみるとちょっと可怪しいに気付くだろう。「F」が回転しているが、照明が変わらないことである。
「F」を回転しながら照明に向いている部分は一番明るくなって欲しいだろう？

それを直す為にオブジェクト座標を回転させるのと同じように、法線ベクトルも回転させなければいけない。
`position`と同じように法線をある行列に掛ける必要がある。それはそう考えるとワールド行列を思い起こすだろう。
今は`u_matrix`という一つの行列しか使われていない。行列を２つにしよう。一つは`u_world`として、
それがワールド行列になる。もう一つと`u_worldViewProjection`として、
それが今までの`u_matrix`と同じような行列になる。

```
attribute vec4 a_position;
attribute vec3 a_normal;

*uniform mat4 u_worldViewProjection;
+uniform mat4 u_world;

varying vec3 v_normal;

void main() {
  // positionを行列に掛ける。
*  gl_Position = u_worldViewProjection * a_position;

*  // 法線ベクトルの向きを計算して、ピクセルシェーダーに渡す。
*  v_normal = mat3(u_world) * a_normal;
}
```

`a_normal`を`mat3(u_world)`に掛けていることに注目して。
法線ベクトルは方向だけなので行列の移動する部分が要らない。行列の向き部分は上の3x3の部分である。

ユニフォームを調べなきゃ。

```
  // ユニフォームを調べる。
*  var worldViewProjectionLocation =
*      gl.getUniformLocation(program, "u_worldViewProjection");
+  var worldLocation = gl.getUniformLocation(program, "u_world");
```

そして、行列を設定しているところの更新が必要である。

```
*// 行列を設定する。
*gl.uniformMatrix4fv(
*    worldViewProjectionLocation, false,
*    worldViewProjectionMatrix);
*gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
```

そして、これ。

{{{example url="../webgl-3d-lighting-directional-world.html?ui-fRotation=Fの回転" }}}

「F」を回転してみて、指向性光源に向いている部分が明るくなることに注目して下さい。

まだ問題があるが説明しにくいので図形で見よう。
`normal`の向きを変更するために`u_world`の行列に掛けている。
ワールド行列にスケールを掛けるとどうなるか？法線ベクトルはダメになる。

{{{diagram url="resources/normals-scaled.html" caption="クリックして表示したかが変わる" width="600" }}}

私も解決方法の理論はまだ学んでないけど、ワールド行列の逆行列を計算して、その行列の転置行列を
使えば、法線ベクトルの方向が正しくなる。転置行列はある行列の横列と縦列を交換した行列である。

上の図形で<span style="color: #F0F;">紫</span>の球体はスケールに掛けられてない。 
左にある<span style="color: #F00;">赤い</span>球体がスケールに掛けられて、法線ベクトルは
ワールド行列に掛けられている。なんとなく何かが間違えていることに気付くだろう？
右にある<span style="color: #00F;">青い</span>球体は転置されたワールドの逆行列に掛けられている。

図形をクリックしたら表示方法が変わる。スケールが大きくなるほど掛けられている時左の方の法線ベクトル(world)は
球体の表面に垂直になっていないことがよく見えるだろう。右の方(worldInverseTranspose)はいつも
球体表面に垂直になっている。最後の表示のしかたで全部赤で描画して、外側の２つの球体は結構違って表示されていることが
見えるはず。どっちが正しいか分かりやすくないかもしれないけど、他の表示のし方でworldInverseTranspose
の方が正しいと分かるはず。

この解決方法を実装するためにこういうふうに変更しよう。まず、シェーダーを更新する。
技術的に`u_world`の値だけ変更出来るが、正しい意味がある変数の名前を付けた方がいい。
そうしないとコードが分かりにくくなる。

```
attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 u_worldViewProjection;
*uniform mat4 u_worldInverseTranspose;

varying vec3 v_normal;

void main() {
  // positionを行列に掛ける。
  gl_Position = u_worldViewProjection * a_position;

  // 法線ベクトルの向きを計算して、ピクセルシェーダーに渡す。
*  v_normal = mat3(u_worldInverseTranspose) * a_normal;
}
```

そして、それを調べなきゃ

```
-  var worldLocation = gl.getUniformLocation(program, "u_world");
+  var worldInverseTransposeLocation =
+      gl.getUniformLocation(program, "u_worldInverseTranspose");
```

そして、計算して設定しなきゃ。

```
var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
var worldInverseMatrix = m4.inverse(worldMatrix);
var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

// 行列を設定する。
gl.uniformMatrix4fv(
    worldViewProjectionLocation, false,
    worldViewProjectionMatrix);
-gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
+gl.uniformMatrix4fv(
+    worldInverseTransposeLocation, false,
+    worldInverseTransposeMatrix);
```

行列を転置するコードはこれである。

```
var m4 = {
  transpose: function(m) {
    return [
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15],
    ];
  },

  ...
```

スケールに掛けてないので前のサンプルと同じように表示されているが、
スケールがに掛ける場合に準備が出来た。

{{{example url="../webgl-3d-lighting-directional-worldinversetranspose.html?ui-fRotation=Fの回転" }}}

この照明の計算の第一歩は分かりやすかったかな〜。次回は[点光源である](webgl-3d-lighting-point.html)。

<div class="webgl_bottombar">
<h3><code>mat3(u_worldInverseTranspose) * a_normal</code>の代わり</h3>
<p>上のシェーダーにこのような行がある。</p>
<pre class="prettyprint">
v_normal = mat3(u_worldInverseTranspose) * a_normal;
</pre>
<p>このようにしても構わない。</p>
<pre class="prettyprint">
v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
</pre>
<p><code>w</code>を0にすると行列の移動する部分は0に掛けられる。なので移動の部分消されることになる。
どっちの方が一般的か分からない。今回は<code>mat3</code>の方法の方が綺麗なような気がした。下のようにしたこともある。
</p>
<p>もう一つの方法として<code>u_worldInverseTranspose</code>を<code>mat3</code>にすることもあるが、
そのようにしない方がいい理由が2つある。一つ目は<code>mat4</code>で<code>u_worldInverseTranspose</code>を
使う場合もあるので<code>mat4</code>として渡せばmat4で必要な場合にも使える。
二つ目は今まで使っている行列数学ライブラリは
<code>mat4</code>しか作れない。<code>mat3</code>のライブラリを作るのは面倒で、
mat4からmat3に変更することもコンピューターにさせたくないので、
特別の理由がなければ<code>mat4</code>でいいと思う。</p>
</div>
