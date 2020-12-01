Title: WebGL 帧缓冲
Description: WebGL 中的帧缓冲是什么？
TOC: WebGL 帧缓冲


本文旨在尝试让你对 WebGL 中的帧缓冲有一个心理印象。帧缓冲的出现是为了让你可以 [渲染到纹理](webgl-render-to-texture.html)。

一个帧缓冲只是一个 *attachments 的集合*。仅此而已！它是用来允许渲染到纹理或渲染到渲染缓冲中的。

你可以认为一个帧缓冲对象是这样的

```js
class Framebuffer {
  constructor() {
    this.attachments = new Map();  // 按 attachment point 排列的 attachments
  }
}
```

而 `WebGLRenderingContext` (即 `gl` 对象) 就像这样

```js
// 伪代码
gl = {
  framebuffer: defaultFramebufferForCanvas,
}
```

帧缓冲有 2 个 绑定点。它们可以这样设置

```js
gl.bindFramebuffer(target, framebuffer) {
  framebuffer = framebuffer || defaultFramebufferForCanvas; // 如果是 null 则使用 canvas
  switch (target) {
    case: gl.FRAMEBUFFER:
      this.framebufferBinding = framebuffer;
      break;
    default:
      ... error ...
  }
}
```

你可以通过 2 个函数添加 attachments 到一个帧缓冲，`framebufferTexture2D` 和 `framebufferRenderbuffer`。

我们可以想象它们的实现是这样的

```js
// 伪代码
gl._getFramebufferByTarget(target) {
  switch (target) {
    case gl.FRAMEBUFFER:
      return this.framebufferBinding;
  }
}
gl.framebufferTexture2D(target, attachmentPoint, texTarget, texture, mipLevel) {
  const framebuffer = this._getFramebufferByTarget(target);
  framebuffer.attachments.set(attachmentPoint, {
    texture, texTarget, mipLevel,
  });
}
gl.framebufferRenderbuffer(target, attachmentPoint, renderbufferTarget, renderbuffer) {
  const framebuffer = this._getFramebufferByTarget(target);
  framebuffer.attachments.set(attachmentPoint, {
    renderbufferTarget, renderbuffer
  });
}
```

如果你开启了 [`WEBGL_draw_buffers`](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/)
扩展，那么一个 `Framebuffer` 在概念上会扩展为

```js
class Framebuffer {
  constructor() {
    this.attachments = new Map();
+    this.drawBuffers = [gl.COLOR_ATTACHMENT0, gl.NONE, gl.NONE, gl.NONE, ...];
  }
}
```

你可以用 `gl.drawBuffers` 设置绘制缓冲数组，我们可以将它想象成是这样实现的

```js
// 伪代码
ext.drawBuffersWebGL(drawBuffers) {
  const framebuffer = gl._getFramebufferByTarget(gl.FRAMEBUFFER);
  for (let i = 0; i > maxDrawBuffers; ++i) {
    framebuffer.drawBuffers[i] = i < drawBuffers.length
        ? drawBuffers[i]
        : gl.NONE
  }
}
```

重要的是一个 *帧缓冲* 只是一个 attachments 的简单集合。复杂的是这些 attachments 的限制以及这些 attachments 的有效组合。例如，一个浮点型的纹理 attachment 默认是不能被渲染的。可以使用扩展来开启，例如 `WEBGL_color_buffer_float`。类似地，如果有多个 attachments，那么它们宽高必须是一样的。