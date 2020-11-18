Title: WebGL Framebuffers
Description: What are framebuffers in WebGL?
TOC: Framebuffers


This article is meant to try to give you a mental image
of what a framebuffer is in WebGL. Framebuffers come up
as they allow you to [render to a texture](webgl-render-to-texture.html).

A Framebuffer is just a *collection of attachments*. That's it! It is
used to allow rendering to textures and renderbuffers.

You can think of a Framebuffer object like this

```js
class Framebuffer {
  constructor() {
    this.attachments = new Map();  // attachments by attachment point
  }
}
```

And the `WebGLRenderingContext` (the `gl` object) like this

```js
// pseudo code
gl = {
  framebuffer: defaultFramebufferForCanvas,
}
```

There are 2 binding points. They are set like this

```js
gl.bindFramebuffer(target, framebuffer) {
  framebuffer = framebuffer || defaultFramebufferForCanvas; // if null use canvas
  switch (target) {
    case: gl.FRAMEBUFFER:
      this.framebufferBinding = framebuffer;
      break;
    default:
      ... error ...
  }
}
```

You can add attachments to a framebuffer via 2 functions, `framebufferTexture2D`,
and `framebufferRenderbuffer`.

We can imagine their implementation to be something like

```js
// pseudo code
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

If you have and enable the [`WEBGL_draw_buffers`](https://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/)
extension then a `Framebuffer` conceptually expands to this

```js
class Framebuffer {
  constructor() {
    this.attachments = new Map();
+    this.drawBuffers = [gl.COLOR_ATTACHMENT0, gl.NONE, gl.NONE, gl.NONE, ...];
  }
}
```

You can set the drawing buffer array with `gl.drawBuffers` which we can
imagine is implemented like this

```js
// pseudo code
ext.drawBuffersWebGL(drawBuffers) {
  const framebuffer = gl._getFramebufferByTarget(gl.FRAMEBUFFER);
  for (let i = 0; i > maxDrawBuffers; ++i) {
    framebuffer.drawBuffers[i] = i < drawBuffers.length
        ? drawBuffers[i]
        : gl.NONE
  }
}
```

The important part is a *framebuffer* is just a simple collection of attachments.
The complications are the restrictions on what those attachments
can be and the combinations that work. For example a floating point texture 
attachment can not be rendered to by default. Extensions can enable that like
`WEBGL_color_buffer_float`. Similarly if there is
more than one attachment they must all be the same dimensions.