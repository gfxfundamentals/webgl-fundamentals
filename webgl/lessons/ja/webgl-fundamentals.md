Title: WebGLの基本
Description: 基本から最初のWebGLのレッソン

WebGLの基本

WebGLは三次元APIとして思われことも多い。
「WebGLを使えば簡単に三次元の映像を表示出来るでだろう」っと思ってしまう人も多い。
実はWebGLはただのピクセルを書くエンジンである。WebGLで自分の作成したコートで点、線、
三角形を使って色々なタスクを熟すことが出来る。
それ以上描きたければ点と線と三角形を使って自分のコードでWebGLを使うことが人用がある。

WebGLはコンピュータのGPUで動く。だからGPUで起動出来るコードを提供しなければいけない。
そのために２つの関数を提供必要がある。その関数は「頂点シェーダー」と「ピクセルシェーダー」と呼ばれ、
両方厳密なC/C++のような「GLSL」という言語で作成するものだ。その２つの組み合わせを「プログラム」という。

頂点シェーダーの役割は頂点の位置を計算すること。
その関数の導き出した頂点位置でWebGLは点と線と三角形を描く。
描いている最中ピクセルシェーダーを呼び出す。
ピクセルシェーダーの役割は描くピクセルごとに色の計算をすることである。

その２つの関数を起動する前にWebGL API経由でその関数の状況を指定する
ことが必要である。書きたい形ごとにWebGLの色々な状況を設定して、
そしてgl.drawArraysかgl.drawElementsの関数を呼び出したらGPUでシェーダーが起動する。

そのシェーダーの関数に提供したいデータはGPUにアップロードしなければいけない。
それは４つの方法がある。

1.  属性とバッファー

    バッファーはGPUにあるバイナリデータの配列。中身は頂点の位置や、法線や、色や、
    テクスチャーの座標などだが、好きなデータを入れること出来る。

    属性はバッファーからデータを取ってシェーダーに提供する設定である。
    例えばバッファーに位置ごとに三つの３２ビット数字が入ている。
    ある属性の設定でどのバッファーから位置を取るかと、どのようなデータを取るか
    （三つの３２ビット数字）とか、バッファーにそのデータは何処から始まるかとか、
    一つの位置から次の位置になんバイト飛ぶかとかである。

    バッファーは自由にデータを取ることが出来ない。
    代わりに頂点シェーダーを呼び出す回数が設定して、
    呼び出すごとに次のデータをバッファーから読んで属性にそのデータが入る。

2.  ユニフォーム(uniform)

    ユニフォームはシェーダーを起動する前に定義するシェーダーのグローバルの変数です。

3.  テクスチャー

    テクスチャーは自由にデータを読める配列です。
    よくテくスチャーにイメージとか写真とかか絵のデータを入れるが、
    テクスチャーはただのデータ配列なので色以外のデータを入れることも可能である。

4.  ヴァリイング（varying)

    ヴァリイングは頂点シェーダーからピクセルシェーダーへデータを伝える方法です。
    描画する形による（点、線、三角形）頂点シェーダーに定義します。
    定義されたヴァリイングはピクセルシェーダーが呼び出されている間補間される。

WebGLの"Hello World"

WebGLは２つのことしか求めていない。それはクリップ空間と色である。
プログラマーの役目はその２つのことをWebGLに与えることである。
そのため２つのシェーダーを与える。頂点シェーダーでクリップ空間の頂点座標を与えて、
そしてピクセルシェーダーで色を与える。

クリップ空間座標はキャンヴァスの要素（canvas)のサイズに関係がなく、いつも−１から＋１になる。
以下は一番単純なWebGLの例である。

まず頂点シェーダーで始まる。

    // バッファーからデータを取る属性
    attribute vec4 a_position;

    // 全てのシェーダーは「main」の関数がある
    void main() {

      // 特別の変数「gl_Position」を割り当てることは頂点シェーダーの役割である
      gl_Position = a_position;
    }

GLSLの代わりにJavaScriptで書かれて起動したらことように動く

    // *** 擬似コード!! ***

    var positionBuffer = [
      0, 0, 0, 0,
      0, 0.5, 0, 0,
      0.7, 0, 0, 0,
    ];
    var attributes = {};
    var gl_Position;

    drawArrays(..., offset, count) {
      var stride = 4;
      var size = 4;
      for (var i = 0; i < count; ++i) {
         // positionBufferから次の４つの数値をa_positionの属性に読み込み
         attributes.a_position = positionBuffer.slice((offset + i) * stide, size);

         runVertexShader();　// ⇐　頂点シェーダーを呼び出す！
         ...
         doSomethingWith_gl_Position();
    }

実際GLSLのシェーダーでのデータは本物positionBufferがバイナリに更新しなければならないので、
バッファーがらデータを取り込む際の計算方法は異なる。
でも、頂点シェーダーはこのような動くことと想像出来ると思う。

次はピクセルシェーダーが必要

    // ピクセルシェーダーは既定の精度がないので選択することが必要である。
    // 「mediump」は一般的な既定の設定である。それは「中間の精度」の意味である。
    precision mediump float;

    void main() {
      // 特別の変数「gl_FragColor」を割り当てることは
      // ピクセルシェーダーの役割である
      gl_FragColor = vec4(1, 0, 0.5, 1); // 赤紫
    }

上記で「gl_FragColor」に「1,0,0,5,1」に割り当てる。それは赤＝１，緑＝０、青＝０．５、透明さ（アルファ）＝１。
WebGLの色は０〜１である。

２つのシェーダーを書いたのでWebGLを始めよう！

まずHTMLのCanvas要素が必要である

    <canvas id="c"></canvas>

それをJavaScriptで調べられる

    var canvas = document.getElementById("c");

それでWebGLRenderingContextを作成出来る

     var gl = canvas.getContext("webgl");
     if (!gl) {
        // no webgl for you!
        ...

そして先のシェーダーをコンパイルしてGPUにアップロードすることが必要なのでstringに入れることが必要である。
GLSLのstringをする方法はいくつかある。文字列の連結とか、AJAXでダウンロードすることとか、複数行テンプレートstringとか。
今回JavaScriptではない型付けされたscript要素に入れる方法をとる。

    <script id="2d-vertex-shader" type="notjs">

      // バッファーからデータを取る属性
      attribute vec4 a_position;

      // 全てのシェーダーは「main」の関数がある
      void main() {

        // 特別の変数「gl_Position」を割り当てることは頂点シェーダーの役割である
        gl_Position = a_position;
      }

    </script>

    <script id="2d-fragment-shader" type="notjs">

      // ピクセルシェーダーは既定の精度がないので選択することが必要である。
      // 「mediump」は一般的な既定の設定である。それは「中間の精度」の意味である。
      precision mediump float;

      void main() {
        // 特別の変数「gl_FragColor」を割り当てることは
        // ピクセルシェーダーの役割である
        gl_FragColor = vec4(1, 0, 0.5, 1); // 赤紫
      }

    </script>

本格的な三次元のエンジンは色々な方法で動きながらコードを組み合わせてGLSLシェーダーを作成する。
しかし、このサイトであまり複雑なシェーダーを使わないので、動きながらシェーダー・コードを組み合わせて作成するのが必要ではない。

次にシェーダーを作成し、GLSLのコードをアップロードし、シェーダーをコンパイルする関数が必要である。

    function createShader(gl, type, source) {
      // シェーダーを作成
      var shader = gl.createShader(type);
      // GLSLのコードをGPUにアップロード
      gl.shaderSource(shader, source);
      // シェーダーをコンパイル
      gl.compileShader(shader);
      // 成功かどうかチェック
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader; // 成功。シェーダーを返す
      }

      // エラーを表示
      console.log(gl.getShaderInfoLog(shader));
      // シェーダーを削除
      gl.deleteShader(shader);
    }

出来ただ、その関数でシェーダー２つを作成出来る

    var vertexShaderSource = document.getElementById("2d-vertex-shader").text;
    var fragmentShaderSource = document.getElementById("2d-fragment-shader").text;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

それでその２つのシェーダーをプログラムにリンクする

    function createProgram(gl, vertexShader, fragmentShader) {
      // プログラムを作成
      var program = gl.createProgram();
      // プログラムに頂点シェーダーを付ける
      gl.attachShader(program, vertexShader);
      // プログラムにピクセルシェーダーを付ける
      gl.attachShader(program, fragmentShader);
      // プログラムをリンクする
      gl.linkProgram(program);
      // 成功かどうかチェック
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;  // 成功。プログラムを返す
      }

      // エラーを表示
      console.log(gl.getProgramInfoLog(program));
      // プログラムを削除
      gl.deleteProgram(program);
    }

それを呼び出す

    var program = createProgram(gl, vertexShader, fragmentShader);

GLSLのプログラムを作成して、GPUにアップロードが出来たら、それにデータを与えることが必要である。
WebGL APIの役割のほとんどはGLSLプログラムにデータを与えることと動きの状況を設定することである。
今回のGLSLプログラムのインプットは「a_position」の属性しかない。
作成したプログラムに最初するべきことは属性のローケーションを調べることである

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

属性のローケーションを調べるのは描画する時ではなく、プログラムを最初に起動する時に行った方がいい。

Attributes get their data from buffers so we need to create a buffer

    var positionBuffer = gl.createBuffer();

WebGL lets us manipulate many WebGL resources on global bind points.
You can think of bind points as internal global variables inside WebGL.
First you bind a resource to a bind point. Then, all other functions
refer to the resource through the bind point. So, let's bind the position buffer.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

Now we can put data in that buffer by referencing it through the bind point

    // three 2d points
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

There's a lot going on here. The first thing is we have `positions` which is a
JavaScript array. WebGL on other hand needs strongly typed data so the part
`new Float32Array(positions)` creates a new array of 32bit floating point numbers
and copies the values from `positions`. `gl.bufferData` then copies that data to
the `positionBuffer` on the GPU. It's using the position buffer because we bound
it to the `ARRAY_BUFFER` bind point above.

The last argument, `gl.STATIC_DRAW` is a hint to WebGL about how we'll use the data.
WebGL can try to use that hint to optimize certain things. `gl.STATIC_DRAW` tells WebGL
we are not likely to change this data much.

The code up to this point is *initialization code*. Code that gets run once when we
load the page. The code below this point is *renderering code* or code that should
get executed each time we want to render/draw.

## Rendering

Before we draw we should resize the canvas to match its display size. Canvases just like Images have 2 sizes.
The number of pixels actually in them and separately the size they are displayed. CSS determines the size
the canvas is displayed. **You should always set the size you want a canvas with CSS** since it is far far
more flexible than any other method.

To make the number of pixels in the canvas match the size it's displayed
[I'm using a helper function you can read about here](webgl-resizing-the-canvas.html).

In nearly all of these samples the canvas size is 400x300 pixels if the sample is run in its own window
but stretches to fill the available space if it's inside an iframe like it is on this page.
By letting CSS determine the size and then adjusting to match we easily handle both of these cases.

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

We need to tell WebGL how to convert from the clip space
values we'll be setting `gl_Position` to back into pixels, often called screen space.
To do this we call `gl.viewport` and pass it the current size of the canvas.

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

This tells WebGL the -1 +1 clip space maps to 0 -> `gl.canvas.width` for x and 0 -> `gl.canvas.height`
for y.

We clear the canvas. `0, 0, 0, 0` are r, g, b, alpha so in this case we're making the canvas transparent.

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

We tell WebGL which shader program to execute.

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

Next we need to tell WebGL how to take data from the buffer we setup above and supply it to the attribute
in the shader. First off we need to turn the attribute on

    gl.enableVertexAttribArray(positionAttributeLocation);

Then we need to specify how to pull the data out

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

A hidden part of `gl.vertexAttribPointer` is that it binds the current `ARRAY_BUFFER`
to the attribute. In other words now this attribute is bound to
`positionBuffer`. That means we're free to bind something else to the `ARRAY_BUFFER` bind point.
The attribute will continue to use `positionBuffer`.

note that from the point of view of our GLSL vertex shader the `a_position` attribute was a `vec4`

    attribute vec4 a_position;

`vec4` is a 4 float value. In JavaScript you could think of it something like
`a_position = {x: 0, y: 0, z: 0, w: 0}`. Above we set `size = 2`. Attributes
default to `0, 0, 0, 1` so this attribute will get its first 2 values (x and y)
from our buffer. The z, and w will be the default 0 and 1 respectively.

After all that we can finally ask WebGL to execute our GLSL program.

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

Because the count is 3 this will execute our vertex shader 3 times. The first time `a_position.x` and `a_position.y`
in our vertex shader attribute will be set to the first 2 values from the positionBuffer.
The 2nd time `a_position.xy` will be set to the 2nd two values. The last time it will be
set to the last 2 values.

Because we set `primitiveType` to `gl.TRIANGLES`, each time our vertex shader is run 3 times
WebGL will draw a triangle based on the 3 values we set `gl_Position` to. No matter what size
our canvas is those values are in clip space coordinates that go from -1 to 1 in each direction.

Because our vertex shader is simply copying our positionBuffer values to `gl_Position` the
triangle will be drawn at clip space coordinates

      0, 0,
      0, 0.5,
      0.7, 0,

Converting from clip space to screen space WebGL is going to draw a triangle at. If the canvas size
happned to be 400x300 we'd get something like this

     clip space      screen space
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

WebGL will now render that triangle. For every pixel it is about to draw WebGL will call our fragment shader.
Our fragment shader just sets `gl_FragColor` to `1, 0, 0.5, 1`. Since the Canvas is an 8bit
per channel canvas that means WebGL is going to write the values `[255, 0, 127, 255]` into the canvas.

Here's a live version

{{{example url="../webgl-fundamentals.html" }}}

In the case above you can see our vertex shader is doing nothing
but passing on our position data directly. Since the position data is
already in clipspace there is no work to do. *If you want 3D it's up to you
to supply shaders that convert from 3D to clipspace because WebGL is only
a rasterization API*.

You might be wondering why does the triangle start in the middle and go to toward the top right.
Clip space in `x` goes from -1 to +1. That means 0 is in the center and positive values will
be to the right of that.

As for why it's on the top, in clip space -1 is at the bottom and +1 is at the top. That means
0 is in the center and so positive numbers will be above the center.

For 2D stuff you would probably rather work in pixels than clipspace so
let's change the shader so we can supply the position in pixels and have
it convert to clipspace for us. Here's the new vertex shader

    <script id="2d-vertex-shader" type="notjs">

    -  attribute vec4 a_position;
    *  attribute vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // convert the position from pixels to 0.0 to 1.0
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // convert from 0->1 to 0->2
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // convert from 0->2 to -1->+1 (clipspace)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

    </script>

Some things to notice about the changes. We changed `a_position` to a `vec2` since we're
only using `x` and `y` anyway. A `vec2` is similar to a `vec4` but only has `x` and `y`.

Next we added a `uniform` called `u_resolution`. To set that we need to look up its location.

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

The rest should be clear from the comments. By setting `u_resolution` to the resolution
of our canvas the shader will now take the positions we put in `positionBuffer` supplied
in pixels coordinates and convert them to clip space.

Now we can change our position values from clip space to pixels. This time we're going to draw a rectangle
made from 2 triangles, 3 points each.

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

And after we set which program to use we can set the value for the uniform we created.
Use program is like `gl.bindBuffer` above in that it sets the current program. After
that all the `gl.uniformXXX` functions set uniforms on the current program.

    gl.useProgram(program);

    ...

    // set the resolution
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

And of course to draw 2 triangles we need to have WebGL call our vertex shader 6 times
so we need to change the `count` to `6`.

    // draw
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

And here it is

Note: This example and all following examples use [`webgl-utils.js`](/webgl/resources/webgl-utils.js)
which contains functions to compile and link the shaders. No reason to clutter the examples
with that [boilerplate](webgl-boilerplate.html) code.

{{{example url="../webgl-2d-rectangle.html" }}}

Again you might notice the rectangle is near the bottom of that area. WebGL considers the bottom left
corner to be 0,0. To get it to be the more traditional top left corner used for 2d graphics APIs
we can just flip the clip space y coordinate.

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

And now our rectangle is where we expect it.

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

Let's make the code that defines a rectangle into a function so
we can call it for different sized rectangles. While we're at it
we'll make the color settable.

First we make the fragment shader take a color uniform input.

    <script id="2d-fragment-shader" type="notjs">
      precision mediump float;

    +  uniform vec4 u_color;

      void main() {
    *    gl_FragColor = u_color;
      }
    </script>

And here's the new code that draws 50 rectangles in random places and random colors.

      var colorUniformLocation = gl.getUniformLocation(program, "u_color");
      ...

      // draw 50 random rectangles in random colors
      for (var ii = 0; ii < 50; ++ii) {
        // Setup a random rectangle
        // This will write to positionBuffer because
        // its the last thing we bound on the ARRAY_BUFFER
        // bind point
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // Set a random color.
        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    // Returns a random integer from 0 to range - 1.
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // Fills the buffer with the values that define a rectangle.

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
      // whatever buffer is bound to the `ARRAY_BUFFER` bind point
      // but so far we only have one buffer. If we had more than one
      // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

And here's the rectangles.

{{{example url="../webgl-2d-rectangles.html" }}}

I hope you can see that WebGL is actually a pretty simple API.
Okay, simple might be the wrong word. What it does is simple. It just
executes 2 user supplied functions, a vertex shader and fragment shader and
draws triangles, lines, or points.
While it can get more complicated to do 3D that complication is
added by you, the programmer, in the form of more complex shaders.
The WebGL API itself is just a rasterizer and conceptually fairly simple.

We covered a small example that showed how to supply data in an attribute and 2 uniforms.
It's common to have multiple attributes and many uniforms. Near the top of this article
we also mentioned *varyings* and *textures*. Those will show up in subsequent lessons.

Before we move on I want to mention that for *most* applications updating
the data in a buffer like we did in `setRectangle` is not common. I used that
example because I thought it was easiest to explain since it shows pixel coordinates
as input and demonstrates doing a small amount of math in GLSL. It's not wrong, there
are plenty of cases where it's the right thing to do, but you should [keep reading to find out
the more common way to position, orient and scale things in WebGL](webgl-2d-translation.html).

If you're new to web development or even if you're not please check out [Setup and Installation](webgl-setup-and-installation)
for some tips on how to do WebGL development.

If you're 100% new to WebGL and have no idea what GLSL is or shaders or what the GPU does
then checkout [the basics of how WebGL really works](webgl-how-it-works.html).

You should also, at least briefly read about [the boilerplate code used here](webgl-boilerplate.html)
that is used in most of the examples. You should also at least skim
[how to draw mulitple things](webgl-drawing-multiple-things.html) to give you some idea
of how more typical WebGL apps are structured because unfortunately nearly all the examples
only draw one thing and so do not show that structure.

Otherwise from here you can go in 2 directions. If you are interested in image procesing
I'll show you [how to do some 2D image processing](webgl-image-processing.html).
If you are interested in learning about translation,
rotation and scale and eventually 3D then [start here](webgl-2d-translation.html).

<div class="webgl_bottombar">
<h3>What does type="notjs" mean?</h3>
<p>
<code>&lt;script&gt;</code> tags default to having JavaScript in them.
You can put no type or you can put <code>type="javascript"</code> or
<code>type="text/javascript"</code> and the browser will interpret the
contents as JavaScript. If you put anything for else for <code>type</code> the browser ignores the
contents of the script tag. In other words <code>type="notjs"</code>
or <code>type="foobar"</code> have no meaning as far as the browser
is concerned.</p>
<p>This makes the shaders easy to edit.
Other alterntives include string concatenations like</p>
<pre class="prettyprint">
  var shaderSource =
    "void main() {\n" +
    "  gl_FragColor = vec4(1,0,0,1);\n" +
    "}";
</pre>
<p>or we'd could load shaders with ajax requests but that is slow and asynchronous.</p>
<p>A more modern alternative would be to use multiline template literals.</p>
<pre class="prettyprint">
  var shaderSource = `
    void main() {
      gl_FragColor = vec4(1,0,0,1);
    }
  `;
</pre>
<p>Multiline template literals work in all browsers that support WebGL.
Unfortunately they don't work in really old browsers so if you care
about supporting a fallback for those browsers you might not want to
use mutliline template literals or you might want to use <a href="https://babeljs.io/">a transpiler</a>.
</p>
</div>
