Title: WebGLの点、線、三角形
Description: 点、線、三角形の描画の詳細
TOC: 点、線、三角形

このサイトの大多数が三角形を用いて描画されている。
99%のWebGLプログラムが三角形を用いて描画されているぐらい、まず間違いなく標準的なことだ。
しかし、より完璧に突き詰めていくために、他の例をいくつか調べてみよう。

[最初の記事](webgl-fundamentals.html)ですでに述べたように、WebGLは点(points)、線(lines)、三角形(triangles)を描画する。そしてこの描画は `gl.drawArrays`か `gl.drawElements`を呼び出したときに実行される。
頂点シェーダによってクリップ空間座標が出力され、WebGLは`gl.drawArrays` or `gl.drawElements`の第一引数に基づいて点や線、三角形を描画する。

`gl.drawArrays`や`gl.drawElements`の第一引数として指定できる有効値は以下のとおり。

* `POINTS`

   頂点シェーダによって出力された各クリップ空間の頂点に対して、その頂点を中心とする正方形を描画する。
   正方形の大きさは、頂点シェーダ内にある特殊変数`gl_PointSize`にピクセル単位で必要な数値を設定することで指定できる。

   メモ: 正方形がとれる最大サイズ（最小サイズ）は実装に依存しており、次のコードで取得できる。

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

   その他の問題は [ここ](webgl-drawing-without-data.html#pointsissues)を確認しよう。

* `LINES`

   頂点シェーダによって出力された２つのクリップ空間の頂点に対して、その2点を繋いだ線を描画する。
   もしA,B,C,D,E,F という点があれば、3本の線が引けるだろう。

   <div class="webgl_center"><img src="resources/gl-lines.svg" style="width: 400px;"></div>

   仕様では`gl.lineWidth`を実行して幅をピクセルで指定すれば、線の太さを変えることができる。
   だが実際には最大幅は実装に依存し、大抵の場合1である。

        const [minSize, maxSize] = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);

   > これは大抵コアデスクトップOpenGLで値が１以上が非推奨となっているからである。

* `LINE_STRIP`

   頂点シェーダによって出力された各クリップ空間の頂点に対して、その１つ前に出力された頂点から線を描画する。

   つまり、A,B,C,D,E,Fという点があれば5本の線が引けるだろう。

   <div class="webgl_center"><img src="resources/gl-line-strip.svg" style="width: 400px;"></div>

* `LINE_LOOP`

   `LINE_STRIP`の例と同じで、最後の点から最初の点へ向かってさらにもう1本線を引く。

   <div class="webgl_center"><img src="resources/gl-line-loop.svg" style="width: 400px;"></div>

* `TRIANGLES`

   頂点シェーダによって出力された各クリップ空間の頂点３つに対して、その3点を使った三角形を描画する。大抵の場合このモードが使用される。

   <div class="webgl_center"><img src="resources/gl-triangles.svg" style="width: 400px;"></div>

* `TRIANGLE_STRIP`

   頂点シェーダによって出力された各クリップ空間の頂点に対して、最新の３点ずつを使用した三角形を描画する。
   言い換えると、もしA,B,C,D,E,Fという6点があればA,B,C、B,C,D、C,D,E、そしてD,E,Fというように4つの三角形が描画される。

   <div class="webgl_center"><img src="resources/gl-triangle-strip.svg" style="width: 400px;"></div>

* `TRIANGLE_FAN`

   頂点シェーダによって出力された各クリップ空間の頂点に対して、最初の頂点1と最新の2点を使用した三角形を描画する。
   言い換えると、もしA,B,C,D,E,Fという6点があればA,B,C、A,C,D、A,D,E、そしてA,E,Fというように4つの三角形が描画される。

   <div class="webgl_center"><img src="resources/gl-triangle-fan.svg" style="width: 400px;"></div>

他の人たちの意見もあるが、私の経験上`TRIANGLE_FAN`や`TRIANGLE_STRIP`は避けた方が良いと考えている。
これらは一部の例外的ケースにしか利用できず、これらのケースを処理するためにすべてを三角形で描画するのはそもそも割に合わない。
特に、おそらくあなたは法線を生成したりテクスチャ座標を生成したり頂点データを使っていろいろなことができる手法をもっていて、`TRIANGLES`を使えばそれらの機能が正しく動くだろう。

`TRIANGLE_FAN`や`TRIANGLE_STRIP`を使い始めるとすぐに、これらのハンドリングのために多くの関数が必要になってくる。
別にあなたがどのように考えて実行するかは自由だが、これが私の経験であり、AAAゲームの開発者数人からも聞いたことがある。


同様に `LINE_LOOP`や`LINE_STRIP`も似た問題を抱えていてあまり便利ではない。
`TRIANGLE_FAN`を`TRIANGLE_STRIP`と同じように、これらを使うような状況はとても珍しい。
例えば4つの点を繋いだ直線を4本描きたい場合を考えてみよう。

<div class="webgl_center"><img src="resources/4-lines-4-points.svg" style="width: 400px;"></div>

もし`LINE_STRIP`を使ったとしたら`gl.drawArrays`を4回実行し、さらにそれぞれの線の属性を設定するためにより多くの処理が必要になる。

一方`LINES`を使えば、`gl.drawArrays`の1回の実行で、全ての4本の線の描画に必要な点を挿入できる。
この方がずっと速いだろう。

さらに`LINES`はデバッグや単純なエフェクトとして使うなら良いが、大抵のプラットフォームにおいて1pxの幅が限界となるため、良くない手法となる場合がある。
もしグラフのグリッド線や三次元モデリングのポリゴンのアウトラインを引きたい場合は`LINES`で良いかもしれない。しかしSVGやAdobeのイラストレーターのような構造化された図を描画したい場合はうまくいかないため[違う方法で線をレンダリングしなければならない。普通は三角形を使用する](https://mattdesl.svbtle.com/drawing-lines-is-hard)。