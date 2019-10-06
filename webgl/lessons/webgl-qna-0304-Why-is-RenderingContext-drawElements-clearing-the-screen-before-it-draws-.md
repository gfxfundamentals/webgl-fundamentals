Title: Why is RenderingContext.drawElements clearing the screen before it draws?
Description:
TOC: qna

# Question:

Is RenderingContext.drawElements correct when it clears the screen before it draws?

Consider these screenshots that show a step across a call to drawElements with the object already drawn being erased.

![enter image description here][1]


![enter image description here][2]


  [1]: http://i.stack.imgur.com/zZVG1.png
  [2]: http://i.stack.imgur.com/Qfbrv.png

# Answer

WebGL *effectively* clears the screen after the page has been composited. When you're stepping through stuff one line at a time it's going to be composited every time you stop.

If you don't want it to be cleared ask for `preserveDrawingBuffer: true` when you create the WebGL context as in

    gl = someCanvas.getContext("webgl", { preserveDrawingBuffer: true });

As for why, [from the spec](https://www.khronos.org/registry/webgl/specs/latest/1.0/#2.2)

> While it is sometimes desirable to preserve the drawing buffer, it can cause significant performance loss on some platforms. Whenever possible this flag should remain false and other techniques used. Techniques like synchronous drawing buffer access (e.g., calling readPixels or toDataURL in the same function that renders to the drawing buffer) can be used to get the contents of the drawing buffer. If the author needs to render to the same drawing buffer over a series of calls, a Framebuffer Object can be used.

> Implementations may optimize away the required implicit clear operation of the Drawing Buffer as long as a guarantee can be made that the author cannot gain access to buffer contents from another process. For instance, if the author performs an explicit clear then the implicit clear is not needed.

The TL;DR version is `preserveDrawingBuffer: false` (the default) allows WebGL to swap buffers when compositing (that doesn't mean it will swap buffers but it can if it chooses to). `preserveDrawingBuffer: true` means it can't swap buffers, it must copy buffers. Copying is much slower than swapping.
