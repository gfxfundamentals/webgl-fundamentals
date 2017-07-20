Title: WebGL 进一步处理图像
Description: 怎么用WebGL叠加多种图像处理模式

此文上接[WebGL 图像处理](webgl-image-processing.html)，
如果还没有读过我建议你[从那开始](webgl-image-processing.html)。

图像处理的下一个问题是如何同时施加多种效果？

当然，你可以试着在运行时创建着色器，根据用户从交互界面选择的一些效果，
创建一个可以全部实现的着色器。尽管有人用过
[在运行时创建渲染效果](http://www.youtube.com/watch?v=cQUn0Zeh-0Q)，
但是大部分情况下是不适合的。

一个更灵活的方式是使用2个或以上的纹理，然后交替渲染它们，
像乒乓球一样每次渲染一种效果，传给另一个渲染下一个效果，如下所示。

<blockquote><pre>原始图像 -&gt; [模糊]        -&gt; 纹理纹理 1
纹理 1      -&gt; [锐化]     -&gt; 纹理 2
纹理 2      -&gt; [边缘检测] -&gt; 纹理 1
纹理 1      -&gt; [模糊]        -&gt; 纹理 2
纹理 2      -&gt; [平滑]      -&gt; 画布</pre></blockquote>

需要使用帧缓冲来实现这个操作。在WebGL和OpenGL中，帧缓冲是一个事实上是一个糟糕的名字。
WebGL/OpenGL 中的帧缓冲不是任何形式的缓冲。但是当我们给帧缓冲绑定一个纹理后，
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

现在让哦我们使用
And now let's use that function to make 2 more textures and attach them to
2 framebuffers.

```
  // create 2 textures and attach them to framebuffers.
  var textures = [];
  var framebuffers = [];
  for (var ii = 0; ii < 2; ++ii) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture);

    // make the texture the same size as the image
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);

    // Create a framebuffer
    var fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Attach a texture to it.
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  }
```

Now let's make a set of kernels and then a list of them to apply.

```
  // Define several convolution kernels
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

  // List of effects to apply.
  var effectsToApply = [
    "gaussianBlur",
    "emboss",
    "gaussianBlur",
    "unsharpen"
  ];
```

And finally let's apply each one, ping ponging which texture we are rendering too

```
  // start with the original image
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // don't y flip images while drawing to the textures
  gl.uniform1f(flipYLocation, 1);

  // loop through each effect we want to apply.
  for (var ii = 0; ii < effectsToApply.length; ++ii) {
    // Setup to draw into one of the framebuffers.
    setFramebuffer(framebuffers[ii % 2], image.width, image.height);

    drawWithKernel(effectsToApply[ii]);

    // for the next draw, use the texture we just rendered to.
    gl.bindTexture(gl.TEXTURE_2D, textures[ii % 2]);
  }

  // finally draw the result to the canvas.
  gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
  setFramebuffer(null, canvas.width, canvas.height);
  drawWithKernel("normal");

  function setFramebuffer(fbo, width, height) {
    // make this the framebuffer we are rendering to.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Tell the shader the resolution of the framebuffer.
    gl.uniform2f(resolutionLocation, width, height);

    // Tell webgl the viewport setting needed for framebuffer.
    gl.viewport(0, 0, width, height);
  }

  function drawWithKernel(name) {
    // set the kernel
    gl.uniform1fv(kernelLocation, kernels[name]);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
```

Here's a working version with a slightly more flexible UI.  Check the
effects to turn them on.  Drag the effects to reorder how they are
applied.

{{{example url="../webgl-2d-image-processing.html" }}}

Some things I should go over.

Calling <code>gl.bindFramebuffer</code> with <code>null</code> tells WebGL
you want to render to the canvas instead of to one of your framebuffers.

WebGL has to convert from [clipspace](webgl-fundamentals.html) back into
pixels.  It does this based on the settings of <code>gl.viewport</code>.
Since the framebuffers we are rendering into are a different size than the
canvas we need to set the viewport appropriately when rendering to the
framebuffer textures and then again when finally rendering to the canvas.

Finally in the [original example](webgl-fundamentals.html) we flipped the
Y coordinate when rendering because WebGL displays the canvas with 0,0
being the bottom left corner instead of the more traditional for 2D top
left.  That's not needed when rendering to a framebuffer.  Because the
framebuffer is never displayed, which part is top and bottom is
irrelevant.  All that matters is that pixel 0,0 in the framebuffer
corresponds to 0,0 in our calculations.  To deal with this I made it
possible to set whether to flip or not by adding one more input into the
shader.

```
&lt;script id="2d-vertex-shader" type="x-shader/x-vertex"&gt;
...
uniform float u_flipY;
...

void main() {
   ...

   gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);

   ...
}
&lt;/script&gt;
```

And then we can set it when we render with

```
  ...

  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  ...

  // don't flip
  gl.uniform1f(flipYLocation, 1);

  ...

  // flip
  gl.uniform1f(flipYLocation, -1);

```

I kept this example simple by using a single GLSL program that can achieve
multiple effects.  If you wanted to do full on image processing you'd
probably need many GLSL programs.  A program for hue, saturation and
luminance adjustment.  Another for brightness and contrast.  One for
inverting, another for adjusting levels, etc.  You'd need to change the
code to switch GLSL programs and update the parameters for that particular
program.  I'd considered writing that example but it's an exercise best
left to the reader because multiple GLSL programs each with their own
parameter needs probably means some major refactoring to keep it all from
becoming a big mess of spaghetti.

I hope this and the preceding examples have made WebGL seem a little more
approachable and I hope starting with 2D helps make WebGL a little easier
to understand.  If I find the time I'll try to write [a few more
articles](webgl-2d-translation.html) about how to do 3D as well as more
details on what WebGL is really doing under the hood.  For a next step
consider learning [how to use 2 or more textures](webgl-2-textures.html).


