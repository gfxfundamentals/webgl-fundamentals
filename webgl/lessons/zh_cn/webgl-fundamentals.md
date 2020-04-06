Title: WebGL 基础概念
Description: 第一节WebGL教程就从基础概念开始吧！
TOC: WebGL 基础概念


WebGL经常被当成3D API，人们总想“我可以使用WebGL和**一些神奇的东西**做出炫酷的3D作品”。
事实上WebGL仅仅是一个光栅化引擎，它可以根据你的代码绘制出点，线和三角形。
想要利用WebGL完成更复杂任务，取决于你能否提供合适的代码，组合使用点，线和三角形代替实现。

WebGL在电脑的GPU中运行。因此你需要使用能够在GPU上运行的代码。
这样的代码需要提供成对的方法。每对方法中一个叫顶点着色器，
另一个叫片断着色器，并且使用一种和C或C++类似的强类型的语言
[GLSL](webgl-shaders-and-glsl.html)。 (GL着色语言)。
每一对组合起来称作一个 *program*（着色程序）。

顶点着色器的作用是计算顶点的位置。根据计算出的一系列顶点位置，WebGL可以对点，
线和三角形在内的一些图元进行光栅化处理。当对这些图元进行光栅化处理时需要使用片断着色器方法。
片断着色器的作用是计算出当前绘制图元中每个像素的颜色值。

几乎整个WebGL API都是关于如何设置这些成对方法的状态值以及运行它们。
对于想要绘制的每一个对象，都需要先设置一系列状态值，然后通过调用
`gl.drawArrays` 或 `gl.drawElements` 运行一个着色方法对，使得你的着色器对能够在GPU上运行。

这些方法对所需的任何数据都需要发送到GPU，这里有着色器获取数据的4种方法。

1. 属性（Attributes）和缓冲

   缓冲是发送到GPU的一些二进制数据序列，通常情况下缓冲数据包括位置，法向量，纹理坐标，顶点颜色值等。
   你可以存储任何数据。

   属性用来指明怎么从缓冲中获取所需数据并将它提供给顶点着色器。
   例如你可能在缓冲中用三个32位的浮点型数据存储一个位置值。
   对于一个确切的属性你需要告诉它从哪个缓冲中获取数据，获取什么类型的数据（三个32位的浮点数据），
   起始偏移值是多少，到下一个位置的字节数是多少。

   缓冲不是随意读取的。事实上顶点着色器运行的次数是一个指定的确切数字，
   每一次运行属性会从指定的缓冲中按照指定规则依次获取下一个值。

2. 全局变量（Uniforms）

   全局变量在着色程序运行前赋值，在运行过程中全局有效。

3. 纹理（Textures）

   纹理是一个数据序列，可以在着色程序运行中随意读取其中的数据。
   大多数情况存放的是图像数据，但是纹理仅仅是数据序列，
   你也可以随意存放除了颜色数据以外的其它数据。

4. 可变量（Varyings）

   可变量是一种顶点着色器给片断着色器传值的方式，依照渲染的图元是点，
   线还是三角形，顶点着色器中设置的可变量会在片断着色器运行中获取不同的插值。

## WebGL Hello World

WebGL只关心两件事：裁剪空间中的坐标值和颜色值。使用WebGL只需要给它提供这两个东西。
你需要提供两个着色器来做这两件事，一个顶点着色器提供裁剪空间坐标值，一个片断着色器提供颜色值。

无论你的画布有多大，裁剪空间的坐标范围永远是 -1 到 1 。
这里有一个简单的WebGL例子展示WebGL的简单用法。

让我们从顶点着色器开始

    // 一个属性值，将会从缓冲中获取数据
    attribute vec4 a_position;

    // 所有着色器都有一个main方法
    void main() {

      // gl_Position 是一个顶点着色器主要设置的变量
      gl_Position = a_position;
    }

如果用JavaScript代替GLSL，当它运行的时候，你可以想象它做了类似以下的事情

    // *** 伪代码!! ***

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
         // 从positionBuffer复制接下来4个值给a_position属性
         const start = offset + i * stride;
         attributes.a_position = positionBuffer.slice(start, start + size);
         runVertexShader();// 运行顶点着色器
         ...
         doSomethingWith_gl_Position();
    }

实际情况没有那么简单，因为 `positionBuffer` 将会被转换成二进制数据（见下文），
所以真实情况下从缓冲中读取数据有些麻烦，但是希望这个例子能够让你想象出顶点着色器是怎么执行的。

接下来我们需要一个片断着色器

    // 片断着色器没有默认精度，所以我们需要设置一个精度
    // mediump是一个不错的默认值，代表“medium precision”（中等精度）
    precision mediump float;

    void main() {
      // gl_FragColor是一个片断着色器主要设置的变量
      gl_FragColor = vec4(1, 0, 0.5, 1); // 返回“红紫色”
    }

上方我们设置 `gl_FragColor` 为 `1, 0, 0.5, 1`，其中1代表红色值，0代表绿色值，
0.5代表蓝色值，最后一个1表示阿尔法通道值。WebGL中的颜色值范围从 0 到 1 。

现在我们有了两个着色器方法，让我们开始使用WebGL吧

首先我们需要一个HTML中的canvas（画布）对象

     <canvas id="c"></canvas>

然后可以用JavaScript获取它

     var canvas = document.querySelector("#c");

现在我们创建一个WebGL渲染上下文（WebGLRenderingContext）

     var gl = canvas.getContext("webgl");
     if (!gl) {
        // 你不能使用WebGL！
        ...

现在我们需要编译着色器对然后提交到GPU，先让我们通过字符串获取它们。
你可以利用JavaScript中创建字符串的方式创建GLSL字符串：用串联的方式（concatenating），
用AJAX下载，用多行模板数据。或者在这个例子里，将它们放在非JavaScript类型的标签中。

    <script id="vertex-shader-2d" type="notjs">

      // 一个属性变量，将会从缓冲中获取数据
      attribute vec4 a_position;

      // 所有着色器都有一个main方法
      void main() {

        // gl_Position 是一个顶点着色器主要设置的变量
        gl_Position = a_position;
      }

    </script>

    <script id="fragment-shader-2d" type="notjs">

      // 片断着色器没有默认精度，所以我们需要设置一个精度
      // mediump是一个不错的默认值，代表“medium precision”（中等精度）
      precision mediump float;

      void main() {
        // gl_FragColor是一个片断着色器主要设置的变量
        gl_FragColor = vec4(1, 0, 0.5, 1); // 返回“瑞迪施紫色”
      }

    </script>

事实上，大多数三维引擎在运行时利用模板，串联等方式创建GLSL。
对于这个网站上的例子来说，没有复杂到要在运行时创建GLSL的程度。

接下来我们使用的方法将会创建一个着色器，只需要上传GLSL数据，然后编译成着色器。
你可能注意到这段代码没有任何注释，因为可以从方法名很清楚的了解方法的作用
（这里作为翻译版本我还是稍微注释一下）。

    // 创建着色器方法，输入参数：渲染上下文，着色器类型，数据源
    function createShader(gl, type, source) {
      var shader = gl.createShader(type); // 创建着色器对象
      gl.shaderSource(shader, source); // 提供数据源
      gl.compileShader(shader); // 编译 -> 生成着色器
      var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }

      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
    }

现在我们可以使用以上方法创建两个着色器

    var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
    var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

然后我们将这两个着色器 *link*（链接）到一个 *program*（着色程序）

    function createProgram(gl, vertexShader, fragmentShader) {
      var program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      var success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }

      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

然后调用它

    var program = createProgram(gl, vertexShader, fragmentShader);

现在我们已经在GPU上创建了一个GLSL着色程序，我们还需要给它提供数据。
WebGL的主要任务就是设置好状态并为GLSL着色程序提供数据。
在这个例子中GLSL着色程序的唯一输入是一个属性值`a_position`。
我们要做的第一件事就是从刚才创建的GLSL着色程序中找到这个属性值所在的位置。

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

寻找属性值位置（和全局属性位置）应该在初始化的时候完成，而不是在渲染循环中。

属性值从缓冲中获取数据，所以我们创建一个缓冲

    var positionBuffer = gl.createBuffer();

WebGL可以通过绑定点操控全局范围内的许多数据，你可以把绑定点想象成一个WebGL内部的全局变量。
首先绑定一个数据源到绑定点，然后可以引用绑定点指向该数据源。
所以让我们来绑定位置信息缓冲（下面的绑定点就是`ARRAY_BUFFER`）。

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

现在我们需要通过绑定点向缓冲中存放数据

    // 三个二维点坐标
    var positions = [
      0, 0,
      0, 0.5,
      0.7, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

这里完成了一系列事情，第一件事是我们有了一个JavaScript序列`positions` 。
然而WebGL需要强类型数据，所以`new Float32Array(positions)`创建了32位浮点型数据序列，
并从`positions`中复制数据到序列中，然后`gl.bufferData`复制这些数据到GPU的`positionBuffer`对象上。
它最终传递到`positionBuffer`上是因为在前一步中我们我们将它绑定到了`ARRAY_BUFFER`（也就是绑定点）上。

最后一个参数`gl.STATIC_DRAW`是提示WebGL我们将怎么使用这些数据。WebGL会根据提示做出一些优化。
`gl.STATIC_DRAW`提示WebGL我们不会经常改变这些数据。

在此之上的代码是 **初始化代码**。这些代码在页面加载时只会运行一次。
接下来的代码是**渲染代码**，而这些代码将在我们每次要渲染或者绘制时执行。

## 渲染

在绘制之前我们应该调整画布（canvas）的尺寸以匹配它的显示尺寸。画布就像图片一样有两个尺寸。
一个是它拥有的实际像素个数，另一个是它显示的大小。CSS决定画布显示的大小。
**你应该尽可能用CSS设置所需画布大小** ，因为它比其它方式灵活的多。

为了使画布的像素数和显示大小匹配，
[我这里使用了一个辅助方法，你可以在这里获取更多相关信息](webgl-resizing-the-canvas.html)。

这里的例子中，有独立窗口显示的示例大多使用400x300像素大小的画布。
但是如果像稍后展示的示例那样嵌在页面中，它就会被拉伸以填满可用空间
（你也可以点击示例下方的“点此在新窗口中浏览”在独立窗口中查看示例）。
通过使用CSS调整画布尺寸可以轻松处理这些情况。

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

我们需要告诉WebGL怎样把提供的`gl_Position`裁剪空间坐标对应到画布像素坐标，
通常我们也把画布像素坐标叫做屏幕空间。为了实现这个目的，我们只需要调用`gl.viewport`
方法并传递画布的当前尺寸。

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

这样就告诉WebGL裁剪空间的 -1 -> +1  分别对应到x轴的 0 -> `gl.canvas.width`
和y轴的 0 -> `gl.canvas.height`。

我们用`0, 0, 0, 0`清空画布，分别对应 r, g, b, alpha （红，绿，蓝，阿尔法）值，
所以在这个例子中我们让画布变透明了。

    // 清空画布
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

我们需要告诉WebGL运行哪个着色程序

    // 告诉它用我们之前写好的着色程序（一个着色器对）
    gl.useProgram(program);

接下来我们需要告诉WebGL怎么从我们之前准备的缓冲中获取数据给着色器中的属性。
首先我们需要启用对应属性

    gl.enableVertexAttribArray(positionAttributeLocation);

然后指定从缓冲中读取数据的方式

    // 将绑定点绑定到缓冲数据（positionBuffer）
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // 告诉属性怎么从positionBuffer中读取数据 (ARRAY_BUFFER)
    var size = 2;          // 每次迭代运行提取两个单位数据
    var type = gl.FLOAT;   // 每个单位的数据类型是32位浮点型
    var normalize = false; // 不需要归一化数据
    var stride = 0;        // 0 = 移动单位数量 * 每个单位占用内存（sizeof(type)）
                           // 每次迭代运行运动多少内存到下一个数据开始点
    var offset = 0;        // 从缓冲起始位置开始读取
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

一个隐藏信息是`gl.vertexAttribPointer`是将属性绑定到当前的`ARRAY_BUFFER`。
换句话说就是属性绑定到了`positionBuffer`上。这也意味着现在利用绑定点随意将
`ARRAY_BUFFER`绑定到其它数据上后，该属性依然从`positionBuffer`上读取数据。

从GLSL的顶点着色器中注意到`a_position`属性的数据类型是`vec4`

    attribute vec4 a_position;

`vec4`是一个有四个浮点数据的数据类型。在JavaScript中你可以把它想象成
`a_position = {x: 0, y: 0, z: 0, w: 0}`。之前我们设置的`size = 2`，
属性默认值是`0, 0, 0, 1`，然后属性将会从缓冲中获取前两个值（ x 和 y ）。
z和w还是默认值 0 和 1 。

我们终于可以让WebGL运行我们的GLSL着色程序了。

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 3;
    gl.drawArrays(primitiveType, offset, count);

因为`count = 3`，所以顶点着色器将运行三次。
第一次运行将会从位置缓冲中读取前两个值赋给属性值`a_position.x`和`a_position.y`。
第二次运行`a_position.xy`将会被赋予后两个值，最后一次运行将被赋予最后两个值。

因为我们设置`primitiveType`（图元类型）为 `gl.TRIANGLES`（三角形），
顶点着色器每运行三次WebGL将会根据三个`gl_Position`值绘制一个三角形，
不论我们的画布大小是多少，在裁剪空间中每个方向的坐标范围都是 -1 到 1 。

由于我们的顶点着色器仅仅是传递位置缓冲中的值给`gl_Position`，
所以三角形在裁剪空间中的坐标如下

      0, 0,
      0, 0.5,
      0.7, 0,

WebGL将会把它们从裁剪空间转换到屏幕空间并在屏幕空间绘制一个三角形，
如果画布大小是400×300我们会得到类似以下的转换

     裁剪空间            屏幕空间
       0, 0       ->   200, 150
       0, 0.5     ->   200, 225
     0.7, 0       ->   340, 150

现在WebGL将渲染出这个三角形。绘制每个像素时WebGL都将调用我们的片断着色器。
我们的片断着色器只是简单设置`gl_FragColor`为`1, 0, 0.5, 1`，
由于画布的每个通道宽度为8位，这表示WebGL最终在画布上绘制`[255, 0, 127, 255]`。

这里有一个在线示例

{{{example url="../webgl-fundamentals.html" }}}

在上例中可以发现顶点着色器只是简单的传递了位置信息。
由于位置数据坐标就是裁剪空间中的坐标，所以顶点着色器没有做什么特别的事。
**如果你想做三维渲染，你需要提供合适的着色器将三维坐标转换到裁剪空间坐标，因为WebGL只是一个光栅化API**。

你可能会好奇为什么这个三角形从中间开始然后朝向右上方。裁剪空间的`x`坐标范围是 -1 到 +1.
这就意味着0在中间并且正值在它右边。

至于它为什么在上方，是因为裁剪空间中 -1 是最底端 +1 是最顶端，
这也意味值0在中间，正值在上方。

对于描述二维空间中的物体，比起裁剪空间坐标你可能更希望使用屏幕像素坐标。
所以我们来改造一下顶点着色器，让我们提供给它像素坐标而不是裁剪空间坐标。
这是我们新的顶点着色器

    <script id="vertex-shader-2d" type="notjs">

    -  attribute vec4 a_position;
    *  attribute vec2 a_position;

    +  uniform vec2 u_resolution;

      void main() {
    +    // 从像素坐标转换到 0.0 到 1.0
    +    vec2 zeroToOne = a_position / u_resolution;
    +
    +    // 再把 0->1 转换 0->2
    +    vec2 zeroToTwo = zeroToOne * 2.0;
    +
    +    // 把 0->2 转换到 -1->+1 (裁剪空间)
    +    vec2 clipSpace = zeroToTwo - 1.0;
    +
    *    gl_Position = vec4(clipSpace, 0, 1);
      }

    </script>

这里有些变化需要注意，我们将`a_position`改成`vec2`类型是因为我们只需要用`x`和`y`值。
`vec2`和`vec4`有些类似但是仅有`x`和`y`值。

接着我们添加了一个`uniform`（全局变量）叫做`u_resolution`，为了设置它的值我们需要找到它的位置。

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

其余变化的应该能从注释中理解。通过设置`u_resolution`为画布的分辨率，
着色器将会从`positionBuffer`中获取像素坐标将之转换为对应的裁剪空间坐标。

现在我们可以将位置信息转换为像素坐标。这次我们将通过绘制两个三角形来绘制一个矩形，
每个三角形有三个点。

    var positions = [
    *  10, 20,
    *  80, 20,
    *  10, 30,
    *  10, 30,
    *  80, 20,
    *  80, 30,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

在我们设置好使用这个着色程序后，可以设置刚才创建的全局变量的值。
`gl.useProgram`就与之前讲到的`gl.bindBuffer`相似，设置当前使用的着色程序。
之后所有类似`gl.uniformXXX`格式的方法都是设置当前着色程序的全局变量。

    gl.useProgram(program);

    ...

    // 设置全局变量 分辨率
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

显然我们需要告诉WebGL要运行六次顶点着色器来画两个三角形。
所以我们将`count`改成`6`。

    // 绘制
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    *var count = 6;
    gl.drawArrays(primitiveType, offset, count);

这里是结果

注意: 这个和以后的例子都将使用[`webgl-utils.js`](/webgl/resources/webgl-utils.js)，
它包含了编译和链接着色器的方法。没有必要让一些[样板代码](webgl-boilerplate.html)干扰示例代码。

{{{example url="../webgl-2d-rectangle.html" }}}

你可能注意到矩形在区域左下角，WebGL认为左下角是 0，0 。
想要像传统二维API那样起点在左上角，我们只需翻转y轴即可。

    *   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

现在矩形在我们期望的位置了

{{{example url="../webgl-2d-rectangle-top-left.html" }}}

让我们来定义一个可以生成矩形的方法，这样我们就可以调用它定义形状不一的多个矩形。
同时我们需要矩形的颜色是可设置的。

首先我们定义一个片断着色器，可以通过全局变量接收自定义颜色。

    <script id="fragment-shader-2d" type="notjs">
      precision mediump float;

    +  uniform vec4 u_color;

      void main() {
    *    gl_FragColor = u_color;
      }
    </script>

这里是一段新代码，可以随机绘制50个随机位置，随机大小，随机颜色的矩形。

      var colorUniformLocation = gl.getUniformLocation(program, "u_color");
      ...

      // 绘制50个随机颜色矩形
      for (var ii = 0; ii < 50; ++ii) {
        // 创建一个随机矩形
        // 并将写入位置缓冲
        // 因为位置缓冲是我们绑定在
        // `ARRAY_BUFFER`绑定点上的最后一个缓冲
        setRectangle(
            gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

        // 设置一个随机颜色
        gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

        // 绘制矩形
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    // 返回 0 到 range 范围内的随机整数
    function randomInt(range) {
      return Math.floor(Math.random() * range);
    }

    // 用参数生成矩形顶点并写进缓冲

    function setRectangle(gl, x, y, width, height) {
      var x1 = x;
      var x2 = x + width;
      var y1 = y;
      var y2 = y + height;

      // 注意: gl.bufferData(gl.ARRAY_BUFFER, ...) 将会影响到
      // 当前绑定点`ARRAY_BUFFER`的绑定缓冲
      // 目前我们只有一个缓冲，如果我们有多个缓冲
      // 我们需要先将所需缓冲绑定到`ARRAY_BUFFER`

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
         x1, y1,
         x2, y1,
         x1, y2,
         x1, y2,
         x2, y1,
         x2, y2]), gl.STATIC_DRAW);
    }

这里是50个矩形。

{{{example url="../webgl-2d-rectangles.html" }}}

我希望你能体会到WebGL其实是一个非常简单的API。好吧，“简单”可能是一个不恰当的描述。
它做的是一件简单的事，它仅仅运行用户提供的两个方法，一个顶点着色器和一个片断着色器，
去绘制点，线和三角形。虽然做三维可以变得很复杂，但是这种复杂只是作为程序员的你，
是一种复杂形式的“着色器”。WebGL API只做光栅化处理并且在概念上十分容易理解。

我们简单的示例向你展示了怎么给属性和两个全局变量提供数据。它和多个属性以及多个全局变量的原理一致。
在这篇文章的开始部分，我们还提到了*varyings*（可变量）和*textures*（纹理），这些将会在随后的课程中出现。

在我们继续之前我想提醒你们，上例中用`setRectangle`更新缓冲数据的方式在**大多数**程序中并不常见。
我这么用只是因为在这个例子中，为了解释GLSL接收像素坐标并通过少量数学运算得到期望结果，
这可能是最简单的方式。这不是常规做法，这里有一些常用的例子，你可以
[继续阅读并发现在WebGL中移动，旋转，缩放物体的通用方式](webgl-2d-translation.html)。

无论你是不是web开发新手都请查看[设置和安装](webgl-setup-and-installation.html)，
获取一些WebGL开发的小技巧。

如果你是100%的WebGL新手甚至不知道GLSL或者着色器是什么，或者GPU是做什么的，查看
[关于WebGL工作原理的基础知识](webgl-how-it-works.html).

你至少应简短浏览一下示例中用到最多的[模板代码](webgl-boilerplate.html)。
你也可以快速浏览一下[怎样绘制多个物体](webgl-drawing-multiple-things.html)，
以便了解WebGL应用程序的典型结构，不幸的是在此之前几乎所有的例子都只绘制一个物体，
所以没有展示那个结构。

除此以外这里有两个方向，如果你对图像处理感兴趣，我会向你展示
[怎样做一些图像处理](webgl-image-processing.html)。
如果你想学习平移，旋转和缩放最终到三维那就[从这里开始](webgl-2d-translation.html)。

<div class="webgl_bottombar">
<h3>type="notjs" 是什么意思?</h3>
<p>
<code>&lt;script&gt;</code> 标签内默认放置的是JavaScript代码。
你可以不定义type或者定义 <code>type="javascript"</code> 或者
<code>type="text/javascript"</code> ，浏览器则会将内容翻译成JavaScript。
如果你对 <code>type</code> 有其它任何定义。浏览器会忽略script标签的内容。
换句话说，对浏览器而言 <code>type="notjs"</code> 或者 <code>type="foobar"</code>
都是没有意义的。</p>
<p>这样就可以很方便的编辑着色器。另一个选择是像下方那样串联字符串</p>
<pre class="prettyprint">
  var shaderSource =
    "void main() {\n" +
    "  gl_FragColor = vec4(1,0,0,1);\n" +
    "}";
</pre>
<p>或者我们可以使用AJAX请求，但是那样会比较慢并且是异步的。</p>
<p>另一个如今常用的做法是多行模板文字。</p>
<pre class="prettyprint">
  var shaderSource = `
    void main() {
      gl_FragColor = vec4(1,0,0,1);
    }
  `;
</pre>
<p>多行模板文字可在支持WebGL的所有浏览器中使用。
不过它不能在较早版本的浏览器中运行，所以如果你很在意浏览器的后向支持，
你也许可以考虑使用<a href="https://babeljs.io/">一个转换器</a>代替多行模板文字。
</p>
</div>
