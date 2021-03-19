Title: WebGL 进一步处理图像
Description: 怎么用WebGL叠加多种图像处理模式
TOC: WebGL 进一步处理图像


此文上接[WebGL 图像处理](webgl-image-processing.html)，
如果还没有读过我建议你[从那里开始](webgl-image-processing.html)。

图像处理的下一个问题是如何同时施加多种效果？

当然，你可以试着在运行时创建着色器，根据用户从交互界面选择的一些效果，
创建一个可以全部实现的着色器。尽管有人用过
[在运行时创建渲染效果](https://www.youtube.com/watch?v=cQUn0Zeh-0Q)，
但是大部分情况下是不适合的。

一个更灵活的方式是使用2个或以上的纹理，然后交替渲染它们，
像乒乓球一样每次渲染一种效果，传给另一个渲染下一个效果，如下所示。

<div class="webgl_center"><pre>原始图像    -&gt; [模糊]     -&gt; 纹理纹理 1
纹理 1      -&gt; [锐化]     -&gt; 纹理 2
纹理 2      -&gt; [边缘检测] -&gt; 纹理 1
纹理 1      -&gt; [模糊]     -&gt; 纹理 2
纹理 2      -&gt; [平滑]     -&gt; 画布</pre></div>

这个操作需要使用帧缓冲来实现。在WebGL和OpenGL中，帧缓冲是一个事实上是一个糟糕的名字。
WebGL/OpenGL 中的帧缓冲只是一系列状态（一列附加物）不是任何形式的缓冲。
但是当我们给帧缓冲绑定一个纹理后，
可以将渲染结果写入那个纹理。

首先让我们把[以前创建纹理的代码](webgl-image-processing.html)写到一个方法里

```
  function createAndSetupTexture(gl) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 设置材质，这样我们可以对任意大小的图像进行像素操作
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  // 创建一个纹理并写入图像
  var originalImageTexture = createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
```

现在让我们用这个方法生成两个纹理并绑定到两个帧缓冲。

```
  // 创建两个纹理绑定到帧缓冲
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // 设置纹理大小和图像大小一致
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);

    // 创建一个帧缓冲
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // 绑定纹理到帧缓冲
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  }
```

现在让我们做一些卷积核并按使用顺序存入列表中

```
  // 定义一些卷积核
  var kernels = {
    normal: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    gaussianBlur: [
      0.045, 0.122, 0.045,
      0.122, 0.332, 0.122,
      0.045, 0.122, 0.045
    ],
    unsharpen: [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ],
    emboss: [
       -2, -1,  0,
       -1,  1,  1,
        0,  1,  2
    ]
  };

  // 将要使用的效果列表
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

最后让我们使用所有渲染效果，像乒乓一样来回渲染

```
  // 从原始图像开始
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // 在渲染效果时不翻转y轴
  gl.uniform1f(flipYLocation, 1);

  // 循环施加每一种渲染效果
  for (var ii = 0; ii < effectsToApply.length; ++ii) {
    // 使用两个帧缓冲中的一个
    setFramebuffer(framebuffers[ii % 2], image.width, image.height);

    drawWithKernel(effectsToApply[ii]);

    // 下次绘制时使用刚才的渲染结果
    gl.bindTexture(gl.TEXTURE_2D, textures[ii % 2]);
  }

  // 最后将结果绘制到画布
  gl.uniform1f(flipYLocation, -1);  // 需要绕y轴翻转
  setFramebuffer(null, canvas.width, canvas.height);
  drawWithKernel("normal");

  function setFramebuffer(fbo, width, height) {
    // 设定当前使用帧缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // 告诉着色器分辨率是多少
    gl.uniform2f(resolutionLocation, width, height);

    // 告诉WebGL帧缓冲需要的视图大小
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // 设置卷积核
    gl.uniform1fv(kernelLocation, kernels[name]);

    // 画出矩形
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
```

下面是一个可交互示例，用了稍微灵活一点的用户交互。勾选表示开启对应效果，
拖拽改变渲染顺序。

{{{example url="../webgl-2d-image-processing.html" }}}

有些东西需要回顾一下。

调用 <code>gl.bindFramebuffer</code> 设置为 <code>null</code>是告诉WebGL
你想在画布上绘制，而不是在帧缓冲上。

WebGL需要从[裁剪空间](webgl-fundamentals.html)对应到屏幕像素，
设置<code>gl.viewport</code>就是为了实现这个。因为我们的帧缓冲的大小和画布的大小不同，
所以我们需要给帧缓冲设置一个合适的视图大小让它渲染到对应的纹理上，最后再渲染到画布上。

[原例](webgl-fundamentals.html)中，我们在渲染时绕 y 轴翻转是因为WebGL
的 0, 0 点在左下角而不是常见二维屏幕坐标的左上角。而在帧缓冲中绘制的时候不需要翻转，
因为帧缓冲不用显示，谁上谁下无所谓，最重要的是我们计算中的 0, 0 也对应帧缓冲中的 0, 0
像素。为了解决这个问题，通过在着色器中添加一个输入来决定是否翻转。

```
<script id="vertex-shader-2d" type="x-shader/x-vertex">
...
uniform float u_flipY;
...

void main() {
   ...

   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);

   ...
}
</script>
```

然后在渲染的时候可以这样设置

```
  ...

  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  ...

  // 不翻转
  gl.uniform1f(flipYLocation, 1);

  ...

  // 翻转
  gl.uniform1f(flipYLocation, -1);

```

为了让这个例子简单化，我只用了一个GLSL实现了多种渲染效果。
如果专做图像处理可能需要多个GLSL程序，一个调节色彩,饱和度和明度，
一个调节亮度和对比度，一个做反色，一个做色彩平衡，等等。
你需要用代码更换GLSL程序，并更新程序对应的参数。我想过写一个类似的例子，
但最好留给读者自己实现，因为多个GLSL程序和参数需要良好的重构，
不然代码会一团糟，所以它是一个很好的练习机会。

希望这个和之前的例子让你更了解WebGL，从二维开始讲解是希望你更有利于对WebGL的理解。
如果有时间我会试着写一些关于如何实现三维效果的[文章](webgl-2d-translation.html)，
讲一些一些关于WebGL的底层原理和细节。接下来可以考虑学习[如何使用多个纹理](webgl-2-textures.html)。


