Title: WebGL 渲染到纹理
Description: 如何往纹理渲染内容
TOC: WebGL 渲染到纹理


此文上接WebGL系列文章，第一篇是[基础概念](webgl-fundamentals.html)，
上一篇是[写入数据到纹理](webgl-data-textures.html)，
如果没读请先去那里。

上篇讲到如何利用JavaScript向纹理提供数据，这篇文章我们会使用WebGL渲染内容到纹理上，
这个话题在[图像处理](webgl-image-processing-continued.html)中简单讲到过，
但这里将详细介绍。

渲染到纹理非常简单，创建一个确定大小的纹理

    // 创建渲染对象
    const targetTextureWidth = 256;
    const targetTextureHeight = 256;
    const targetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    {
      // 定义 0 级的大小和格式
      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);

      // 设置筛选器，不需要使用贴图
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

注意 `data` 是 `null`，我们不需要提供数据，只需要让WebGL分配一个纹理。

接下来创建一个帧缓冲（framebuffer），帧缓冲只是一个附件集，附件是纹理或者 renderbuffers，
我们之前讲过纹理，Renderbuffers 和纹理很像但是支持纹理不支持的格式和可选项，同时，
不能像纹理那样直接将 renderbuffer 提供给着色器。

让我们来创建一个帧缓冲并和纹理绑定

    // 创建并绑定帧缓冲
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // 附加纹理为第一个颜色附件
    const attachmentPoint = gl.COLOR_ATTACHMENT0;
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

与纹理和缓冲相似，在创建完帧缓冲后我们需要将它绑定到 `FRAMEBUFFER` 绑定点，
那样所有的方法都会作用到绑定的帧缓冲，无论是哪个帧缓冲。

绑定帧缓冲后，每次调用 `gl.clear`, `gl.drawArrays`, 或 `gl.drawElements`
WebGL都会渲染到纹理上而不是画布上。

将原来的渲染代码构造成一个方法，就可以调用两次，一次渲染到纹理，一次渲染到画布。

```
function drawCube(aspect) {
  // 告诉它使用的程序（着色器对）
  gl.useProgram(program);

  // 启用位置属性
  gl.enableVertexAttribArray(positionLocation);

  // 绑定到位置缓冲
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 告诉位置属性如何从 positionBuffer (ARRAY_BUFFER) 中读取数据
  var size = 3;          // 每次迭代需要三个单位数据
  var type = gl.FLOAT;   // 单位数据类型为 32 位浮点型
  var normalize = false; // 不需要单位化
  var stride = 0;        // 每次迭代移动的距离
  var offset = 0;        // 从缓冲起始处开始
  gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset)

  // 启用纹理坐标属性
  gl.enableVertexAttribArray(texcoordLocation);

  // 绑定纹理坐标缓冲
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // 告诉纹理坐标属性如何从 texcoordBuffer 读取数据
  var size = 2;          // 每次迭代两个单位数据
  var type = gl.FLOAT;   // 单位数据类型是 32 位浮点型
  var normalize = false; // 不需要单位化数据
  var stride = 0;        // 每次迭代移动的数据
  var offset = 0;        // 从缓冲起始处开始
  gl.vertexAttribPointer(
      texcoordLocation, size, type, normalize, stride, offset)

  // 计算投影矩阵

-  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  var cameraPosition = [0, 0, 2];
  var up = [0, 1, 0];
  var target = [0, 0, 0];

  // 计算相机矩阵
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // 根据相机矩阵计算视图矩阵
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
  matrix = m4.yRotate(matrix, modelYRotationRadians);

  // 设置矩阵
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // 使用纹理单元 0
  gl.uniform1i(textureLocation, 0);

  // 绘制几何体
  gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
}
```

注意到我们需要传入 `aspect` 计算投影矩阵，因为目标纹理的比例和画布不同。

然后这样调用

```
// 绘制场景
function drawScene(time) {

  ...

  {
    // 通过绑定帧缓冲绘制到纹理
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // 使用 3×2 的纹理渲染立方体
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 告诉WebGL如何从裁剪空间映射到像素空间
    gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);

    // 清空画布和深度缓冲
    gl.clearColor(0, 0, 1, 1);   // clear to blue
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = targetTextureWidth / targetTextureHeight;
    drawCube(aspect)
  }

  {
    // 渲染到画布
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 立方体使用刚才渲染的纹理
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);

    // 告诉WebGL如何从裁剪空间映射到像素空间
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // 清空画布和深度缓冲
    gl.clearColor(1, 1, 1, 1);   // clear to white
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    drawCube(aspect)
  }

  requestAnimationFrame(drawScene);
}
```

这是结果

{{{example url="../webgl-render-to-texture.html" }}}

**十分重要**的是要记得调用 `gl.viewport` 设置要绘制的对象的大小，
在这个例子中第一次渲染到纹理，所以设置视图大小覆盖纹理，
第二次渲染到画布所以设置视图大小覆盖画布。

同样的当我们计算投影矩阵的时候需要使用正确的比例，我花了无数个小时调试，寻找出现搞笑的渲染结果的原因，
最后发现是少调用了一个 `gl.viewport` 或者都忘了，并使用正确的比例，由于在代码中很少直接调用
`gl.bindFramebuffer` 所以就容易忘掉这些。所以我把这个方法调用放在一个方法里，像这样

    function bindFrambufferAndSetViewport(fb, width, height) {
       gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
       gl.viewport(0, 0, width, height);
    }

然后使用这个方法改变渲染对象，就不容易忘记了。

还有一个需要注意的事情是我们的帧缓冲没有深度缓冲，只有纹理。这意味着没有深度检测，
所以三维就不能正常体现，如果我们绘制三个立方体就会看到这样。

{{{example url="../webgl-render-to-texture-3-cubes-no-depth-buffer.html" }}}

如果仔细看中间的立方体，会看到 3 个垂直绘制的立方体，一个在后面，一个在中间另一个在前面，
但是我们绘制的三个立方体是相同深度的，观察画布上水平方向的 3 个立方体就会发现他们是正确相交的。
那是因为在帧缓冲中没有深度缓冲，但是画布有。

<img class="webgl_center" src="resources/cubes-without-depth-buffer.jpg" width="100%" height="100%" />

想要加深度缓冲就需要创建一个，然后附加到帧缓冲中

```
// 创建一个深度缓冲
const depthBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

// 设置深度缓冲的大小和targetTexture相同
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
```

有了这个以后的结果。

{{{example url="../webgl-render-to-texture-3-cubes-with-depth-buffer.html" }}}

现在帧缓冲附加了深度缓冲以后内部的立方体也能正确相交了。

<img class="webgl_center" src="resources/cubes-with-depth-buffer.jpg" width="100%" height="100%" />

需要特别注意的是WebGL只允许三种附件组合形式。
[根据规范](https://www.khronos.org/registry/webgl/specs/latest/1.0/#FBO_ATTACHMENTS)
一定能正确运行的附件组合是：

* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` texture
* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` texture + `DEPTH_ATTACHMENT` = `DEPTH_COMPONENT16` renderbuffer
* `COLOR_ATTACHMENT0` = `RGBA/UNSIGNED_BYTE` texture + `DEPTH_STENCIL_ATTACHMENT` = `DEPTH_STENCIL` renderbuffer

对于其他的组合就需要检查用户系统/gpu/驱动/浏览器的支持情况。
要检查的话需要创建帧缓冲，附加附件，然后调用

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

如果状态是 `FRAMEBUFFER_COMPLETE` 那这种组合就能使用，反之不能使用。
你就需要告诉用户他们不走运或者撤销一些方法。

如果你还没有看过[简化WebGL代码](webgl-less-code-more-fun.html)的话，
可以看一下。

<div class="webgl_bottombar">
<h3>其实 Canvas 本身就是一个纹理</h3>
<p>
只是一点小事，浏览器使用上方的技术实现的画布，在背后它们创建了一个颜色纹理，
一个深度缓冲，一个帧缓冲，然后绑定到当前的帧缓冲，
当你调用你的渲染方法时就会绘制到那个纹理上，
然后再用那个纹理将画布渲染到网页中。
</p>
</div>


