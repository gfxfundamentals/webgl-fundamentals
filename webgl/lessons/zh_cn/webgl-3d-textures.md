Title: WebGL 三维纹理
Description: WebGL中如何使用纹理
TOC: WebGL 三维纹理


此文上接一系列WebGL文章，从[基础概念](webgl-fundamentals.html)开始，
上一篇讲的是[动画](webgl-animation.html)。

在WebGL中如何使用纹理？你可能会从[二维图像处理的文章](webgl-image-processing.html)
中得到启发，如果我们讲的再深入一点可能更好理解。

首先需要调整着色器以便使用纹理，这里是顶点着色器的修改部分，
我们需要传递纹理坐标，在这个例子中直接将它们传到片断着色器中。

    attribute vec4 a_position;
    *attribute vec2 a_texcoord;

    uniform mat4 u_matrix;

    *varying vec2 v_texcoord;

    void main() {
      // 将位置和矩阵相乘
      gl_Position = u_matrix * a_position;

    *  // 传递纹理坐标到片断着色器
    *  v_texcoord = a_texcoord;
    }

在片断着色器中声明一个 sampler2D 类型的全局变量，可以让我们引用一个纹理，
然后使用从顶点着色器传入的纹理坐标调用 `texture2D` 方法，
在纹理上找到对应的颜色。

    precision mediump float;

    // 从顶点着色器中传入的值
    *varying vec2 v_texcoord;

    *// 纹理
    *uniform sampler2D u_texture;

    void main() {
    *   gl_FragColor = texture2D(u_texture, v_texcoord);
    }

我们需要设置纹理坐标

    // 找到顶点坐标中的属性
    var positionLocation = gl.getAttribLocation(program, "a_position");
    *var texcoordLocation = gl.getAttribLocation(program, "a_texcoords");

    ...

    *// 为纹理坐标创建一个缓冲
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    *gl.enableVertexAttribArray(texcoordLocation);
    *
    *// 以浮点型格式传递纹理坐标
    *gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    *
    *// 设置纹理坐标
    *setTexcoords(gl);

如你所见，我们将图像映射到 'F' 中的每个矩形面上。

    *// 为 F 设置纹理坐标缓冲
    *function setTexcoords(gl) {
    *  gl.bufferData(
    *      gl.ARRAY_BUFFER,
    *      new Float32Array([
    *        // 正面左竖
    *        0, 0,
    *        0, 1,
    *        1, 0,
    *        0, 1,
    *        1, 1,
    *        1, 0,
    *
    *        // 正面上横
    *        0, 0,
    *        0, 1,
    *        1, 0,
    *        0, 1,
    *        1, 1,
    *        1, 0,
    * ...
    *       ]),
    *       gl.STATIC_DRAW);

我们还需要一个纹理，我们可以从头做一个但在这个例子中就直接加载一个图像把，
因为那可能是常用的做法。

这是我们将要使用的图像

<img class="webgl_center" src="../resources/f-texture.png" />

一颗赛艇的图像！事实上使用一个带有 'F' 的图像能够在结果中清楚的分辨出纹理的方向。

加载图像的过程是异步的，我们请求图像资源后浏览器需要一段时间去下载。
通常有两种处理方法，一种是等纹理下载完成后再开始绘制，另一种是在图像加载前使用生成的纹理，
这种方式可以立即启动渲染，一旦图像下载完成就拷贝到纹理。我们将使用下方的方法。

    *// 创建一个纹理
    *var texture = gl.createTexture();
    *gl.bindTexture(gl.TEXTURE_2D, texture);
    *
    *// 用 1x1 个蓝色像素填充纹理
    *gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    *              new Uint8Array([0, 0, 255, 255]));
    *
    *// 异步加载图像
    *var image = new Image();
    *image.src = "resources/f-texture.png";
    *image.addEventListener('load', function() {
    *  // 现在图像加载完成，拷贝到纹理中
    *  gl.bindTexture(gl.TEXTURE_2D, texture);
    *  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    *  gl.generateMipmap(gl.TEXTURE_2D);
    *});

这是结果

{{{example url="../webgl-3d-textures.html" }}}

如果我只想使用一部分图像覆盖 'F' 的正面怎么办，纹理是通过“纹理坐标”来引用的，
纹理坐标 0.0 到 1.0 对应纹理从左到右，0.0 到 1.0 对应第一个像素所在行到最后一行。
注意我没有使用上或者下，上下在纹理坐标空间中是没有意义的，因为绘制一些东西后再重定向后，
是没有上下的概念的，主要是依据传递给WebGL的纹理数据，纹理数据的开头对应纹理坐标 0, 0，
结尾对应纹理坐标 1, 1

<img class="webgl_center noinvertdark" width="405" src="resources/texture-coordinates-diagram.svg" />

我将纹理载入到Photoshop中得到一些点的坐标。

<img class="webgl_center" width="256" height="256" src="../resources/f-texture-pixel-coords.png" />

可以像这样将像素坐标转换到纹理坐标

    texcoordX = pixelCoordX / (width  - 1)
    texcoordY = pixelCoordY / (height - 1)

这是正面的纹理坐标

    // 正面左竖
     38 / 255,  44 / 255,
     38 / 255, 223 / 255,
    113 / 255,  44 / 255,
     38 / 255, 223 / 255,
    113 / 255, 223 / 255,
    113 / 255,  44 / 255,

    // 正面上横
    113 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 44 / 255,
    113 / 255, 85 / 255,
    218 / 255, 85 / 255,
    218 / 255, 44 / 255,

    // 正面中横
    113 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 112 / 255,
    113 / 255, 151 / 255,
    203 / 255, 151 / 255,
    203 / 255, 112 / 255,

对背面也使用相同的纹理坐标，得到这样的结果。

{{{example url="../webgl-3d-textures-texture-coords-mapped.html" }}}

并不是非常好看，但是希望这样能展示出纹理坐标的用法。
如果你使用代码生成几何体（立方体，球体，等等），
通常情况下计算期望的纹理坐标也是比较容易的。
另一方面如果通过软件例如 Blender, Maya, 3D Studio Max 制作几何体，
那么你的美术（或者你自己）就会用软件调整纹理坐标。

如果纹理坐标再 0.0 到 1.0 之外会怎样？WebGL默认会重复纹理，
0.0 到 1.0 是一份纹理的“拷贝”，1.0 到 2.0 是另外一份拷贝，
-4.0 到 -3.0 也是另外一份拷贝。让我们在一个平面上使用这些纹理坐标。

     -3, -1,
      2, -1,
     -3,  4,
     -3,  4,
      2, -1,
      2,  4,

这是结果

{{{example url="../webgl-3d-textures-repeat-clamp.html" }}}

你可以使用`CLAMP_TO_EDGE`告诉WebGL再某个方向不需要重复，例如

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

点击上方示例中的按钮，观察结果。

你可能注意到在加载纹理时调用了 `gl.generateMipmap`，那是干什么的？

假设我们有这样一个 16×16 像素的纹理。

<img class="webgl_center" src="resources/mip-low-res-enlarged.png" style="border: 2px solid black;" />

假设我们要将它绘制在屏幕的 2×2 个像素上，那么这 4 个像素应该使用什么颜色？
这里有 256 个像素可以选择，如果在Photoshop中将 16×16 的图像缩放到 2×2，
它会将每个角 8×8 的像素的平均值赋给这四个像素。不幸的是绘制 64 个像素再求平均在 GPU
中是非常慢的。假设你有一个 2048x2048 像素的纹理想要绘制成 2x2 个像素，
就需要对 1024x1024 或 100 万个像素求平均 4 次，这需要很多运算同时速度要快。

事实上 GPU 使用的是一个纹理贴图（mipmap），纹理贴图是一个逐渐缩小的图像集合，
每一个是前一个的四分之一大小，16×16 纹理的纹理贴图看起来像这样。

<img class="webgl_center noinvertdark nobg" src="resources/mipmap-low-res-enlarged.png" />

通常每个子图都是前一级的双线性插值，这就是 `gl.generateMipmap` 做的事情，
它根据原始图像创建所有的缩小级别，你也可以自己提供缩小级别的图像。

现在如果你想将 16x16 像素的纹理绘制到屏幕的 2×2 个像素上，
WebGL会从创建的贴图中找到从之前级别贴图插值出的 2×2 贴图来使用。

你可以为纹理选择不同的贴图筛选条件来控制WebGL的插值，
一共有这 6 种模式

*   `NEAREST` = 从最大的贴图中选择 1 个像素
*   `LINEAR` = 从最大的贴图中选择4个像素然后混合
*   `NEAREST_MIPMAP_NEAREST` = 选择最合适的贴图，然后从上面找到一个像素
*   `LINEAR_MIPMAP_NEAREST` = 选择最合适的贴图，然后取出 4 个像素进行混合
*   `NEAREST_MIPMAP_LINEAR` = 选择最合适的两个贴图，从每个上面选择 1 个像素然后混合
*   `LINEAR_MIPMAP_LINEAR` = 选择最合适的两个贴图，从每个上选择 4 个像素然后混合

你可以通过这两个例子看到贴图的重要性，第一个显示的是使用 `NEAREST` 或 `LINEAR`，
只从最大的体贴图上选择像素，当物体运动时就会出现抖动。由于每个像素都从最大的图上选择，
随着位置和大小的改变，可能会在不同的时间选择不同的像素，从而出现抖动。

{{{example url="../webgl-3d-textures-mips.html" }}}

观察发现左边和中间的抖动会多于右边。
由于右边的使用多级贴图并且混合颜色，绘制的越小WebGL挑选的像素离原图关系越远。
相反的中间的小图虽然使用了 `LINEAR` 混合 4 个像素的颜色，但这 4 个像素是从大图中选出来，
不同的选择会有较大的差别，所以还是抖动明显。右下角的图保持颜色一致是从右中图中挑选的像素。

第二个例子显示了一些深入屏幕中的多边形。

{{{example url="../webgl-3d-textures-mips-tri-linear.html" }}}

6 个深入屏幕的横梁使用的是之前 6 种不同的筛选模式。左上使用的是 `NEAREST`，
你会感受到明显的块状感；中上使用的是 `LINEAR` 也没有好到哪里去；
右上使用的是 `NEAREST_MIPMAP_NEAREST` ，点击图像切换纹理，每个贴图都是不同的颜色，
就可以清除的看出它使用的是哪个贴图；左下使用的是 `LINEAR_MIPMAP_NEAREST`，
意思是挑选最合适贴图种的 4 个像素进行混合，你会发现贴图切换的部分非常突兀；
中下使用的是 `NEAREST_MIPMAP_LINEAR`，也就是找到最合适的两个贴图各取一点进行混合，
如果仔细看会发现仍然有块状感，尤其是水平方向；右下使用的是 `LINEAR_MIPMAP_LINEAR`，
也就是选出最合适的两个贴图各取 4 个点进行混合。

<img class="webgl_center noinvertdark nobg" src="resources/different-colored-mips.png" />
<div class="webgl_center">不同颜色的贴图</div>

你可能会想既然理论上 `LINEAR_MIPMAP_LINEAR` 是最好的选择为什么还要有其他选择，
一个原因是 `LINEAR_MIPMAP_LINEAR` 是最慢的，读 8 个像素比读 1 个像素慢一些，
在现代的 GPU 上如果一次使用一个贴图可能没什么问题，但是现在的游戏可能一次就需要 2
到 4 个贴图，4 贴图 \* 8 像素每贴图 = 绘制每个像素需要读取 32 个像素，那就会慢很多了。
另一个原因是如果想实现特定的效果，比如做一些**复古**的东西可能就需要使用 `NEAREST`。
贴图也占用内存，事实上它占用额外 33% 的内存，那是非常多的内存，
尤其是使用很大的纹理例如想要在游戏的标题屏幕上绘制的东西。如果你不会绘制比最大的贴图要小的东西，
为什么要把内存浪费在贴图上，直接使用 `NEAREST` 或 `LINEAR` 就只使用第一个贴图。

设置筛选器可以调用 `gl.texParameter`

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

`TEXTURE_MIN_FILTER` 是当绘制的比最大贴图小的时候。
`TEXTURE_MAG_FILTER` 是绘制的比最大的贴图大的时候。
对于 `TEXTURE_MAG_FILTER` 只有 `NEAREST` 和 `LINEAR` 两个可选设置。

假设我们想使用这个纹理。

<img class="webgl_center" src="../resources/keyboard.jpg" />

这是结果。

{{{example url="../webgl-3d-textures-bad-npot.html" }}}

为什么键盘的纹理没有出现？那是因为WebGL限制了纹理的维度必须是2的整数次幂，
2 的幂有 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 等等。
'F' 纹理是 256 × 256，256 是 2 的幂。键盘纹理是 320x240，都不是 2 的幂，
所以显示纹理失败，在着色器中当 `texture2D` 被调用的时候由于纹理没有正确设置，
就会使用颜色 (0, 0, 0, 1) 也就是黑色。如果打开 JavaScript 控制台或者浏览器控制台，
根据浏览器不同可能会显示不同的错误信息，像这样

    WebGL: INVALID_OPERATION: generateMipmap: level 0 not power of 2
       or not all the same size
    WebGL: drawArrays: texture bound to texture unit 0 is not renderable.
       It maybe non-power-of-2 and have incompatible texture filtering or
       is not 'texture complete'.

解决这个问题只需要将包裹模式设置为 `CLAMP_TO_EDGE` 并且通过设置过滤器为 `LINEAR` or `NEAREST`
来关闭贴图映射。

让我们来更新图像加载的代码解决这个问题，首先需要一个方法判断一个数是不是 2 的幂。

    function isPowerOf2(value) {
      return (value & (value - 1)) == 0;
    }

我不准备深入讲解二进制运算，以及它的的原理。有了它后，就可以这样使用。

    // 异步加载图像
    var image = new Image();
    image.src = "resources/keyboard.jpg";
    image.addEventListener('load', function() {
      // 现在有了图像，拷贝到纹理
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);

    *  // 检查每个维度是否是 2 的幂
    *  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
    *     // 是 2 的幂，一般用贴图
         gl.generateMipmap(gl.TEXTURE_2D);
    *  } else {
    *     // 不是 2 的幂，关闭贴图并设置包裹模式为到边缘
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    *     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    *  }
    }

这是结果

{{{example url="../webgl-3d-textures-good-npot.html" }}}

一个常见的问题是“如何为立方体的每个面设置不同的图像？”，假设我们有 6 个这样的图片。

<div class="webgl_table_div_center">
<table class="webgl_table_center">
<tr><td><img src="resources/noodles-01.jpg" /></td><td><img src="resources/noodles-02.jpg" /></td><td><img src="resources/noodles-03.jpg" /></td></tr>
<tr><td><img src="resources/noodles-04.jpg" /></td><td><img src="resources/noodles-05.jpg" /></td><td><img src="resources/noodles-06.jpg" /></td></tr>
</table>
</div>

脑中出现了 3 个答案

1) 制作一个复杂的着色器，引用 6 个纹理，传入一些额外的顶点信息表明使用的纹理是什么。**不要这样做！**
稍微一想就知道你要写一大堆不同的着色器应用于不同面数量的图形之类。

2) 绘制 6 个面代替立方体，这是常用的解决办法，不错但是只能用在简单的图形例如立方体。
如果有一个包含 1000 个方形的图形就要绘制 1000 个面，会非常慢。

3) 我敢说，**最好的方法**就是将图像放在一个纹理中，然后利用纹理坐标映射不同的图像到每个面，
这是很多高性能应用（读作**游戏**）使用的技术。例如我们将所有的图像放入这样一个纹理中

<img class="webgl_center" src="../resources/noodles.jpg" />

然后为立方体的每个面设置不同的纹理坐标。

        // 选择左下图
        0   , 0  ,
        0   , 0.5,
        0.25, 0  ,
        0   , 0.5,
        0.25, 0.5,
        0.25, 0  ,
        // 选择中下图
        0.25, 0  ,
        0.5 , 0  ,
        0.25, 0.5,
        0.25, 0.5,
        0.5 , 0  ,
        0.5 , 0.5,
        // 选择中右图
        0.5 , 0  ,
        0.5 , 0.5,
        0.75, 0  ,
        0.5 , 0.5,
        0.75, 0.5,
        0.75, 0  ,
        // 选择左上图
        0   , 0.5,
        0.25, 0.5,
        0   , 1  ,
        0   , 1  ,
        0.25, 0.5,
        0.25, 1  ,
        // 选择中上图
        0.25, 0.5,
        0.25, 1  ,
        0.5 , 0.5,
        0.25, 1  ,
        0.5 , 1  ,
        0.5 , 0.5,
        // 选择右上图
        0.5 , 0.5,
        0.75, 0.5,
        0.5 , 1  ,
        0.5 , 1  ,
        0.75, 0.5,
        0.75, 1  ,

然后得到

{{{example url="../webgl-3d-textures-texture-atlas.html" }}}

这种将多个图像通过一个纹理提供的方法通常被叫做**纹理图集**，
它是最好的方式，因为只需要加载一个贴图，着色器也会因为只用一个贴图而保持简单，
不同于多个平面需要多次调用绘制，这样只需要调用一次绘制。

你可能还想知道关于纹理的其他重要内容，一个是[如何一次使用多个纹理](webgl-2-textures.html)，
另一个是[如何使用其他域名下的图像](webgl-cors-permission.html)，还有一个是
[纹理映射的透视纠正](webgl-3d-perspective-correct-texturemapping.html)，
讲的是一些值得注意的小细节。

接下来讲的是[利用 JavaScript 向纹理提供数据](webgl-data-textures.html)，
或者你也可以看看[WenGL代码简化](webgl-less-code-more-fun.html)。

<div class="webgl_bottombar">
<h3>UVs vs. 纹理坐标</h3>
<p>纹理坐标经常被简写为 texture coords，texcoords 或 UVs(发音为 Ew-Vees)，
我不知道术语 UVs 是从哪来的，除了一点那就是顶点位置使用 <code>x, y, z, w</code>，
所以对于纹理坐标他们决定使用<code>s, t, u, v</code>，好让你清楚使用的两个类型的区别。
有了这些你可能会想它应该读作 Es-Tees，因为纹理包裹的设置被叫做
 <code>TEXTURE_WRAP_S</code> 和 <code>TEXTURE_WRAP_T</code>，
 但是出于某些原因我的图形相关的同事都叫它 Ew-Vees。
</p>
<p>所以现在你就知道了如果有人说 UVs 其实就是再说纹理坐标。</p>
</div>



