Title: Is there a way to get WebGL to render offscreen, without the webgl canvas attached to the DOM?
Description:
TOC: qna

# Question:

I thought this would be an easy question to find an answer for, but it's turning out to be very elusive. Basically, I'm trying to use WebGL to do the heavy lifting on some image processing and generation tasks, and I want it to work offscreen. Ideally, I'd like WebGL to render a scene to a framebuffer that I can `gl.readPixels()` from, or to the webgl canvas so I can use it as a *source* for `context.drawImage()`. The thing is, I don't want to display the webgl canvas itself, I only want to copy portions of it to a visible canvas that I have a regular "2d" context for. So far, I can't seem to get it to work without the following initialization, which seems like an ugly hack to me:

    glCanvas = document.createElement('canvas');
 glCanvas.width = 256;
 glCanvas.height = 256;
    document.body.appendChild(glCanvas); // seems necessary, but why?
 glCanvas.style.visibility = 'hidden'; // ugh, is this the only way?

Currently, I'm rendering a scene to a framebuffer I create with:`gl.createFramebuffer()`, using a single `gl.drawArrays()` call, and then using `gl.readPixels()` to get the result out to an ImageData. With the glCanvas attached to the DOM it works exactly as planned. But if I leave off those last 2 lines of code above where I attach the glCanvas and hide it, I get no image when I try to readPixels from the framebuffer I've rendered to.

I don't understand why the glCanvas needs to be attached to the DOM, if it's not even being rendered to. I thought that rendering to a framebuffer happens entirely on the graphics card and that the buffer will persist for me to use as a texture. Is it simply the case that WebGL doesn't render at all unless there is at least one webgl-context canvas attached to the DOM? Or am I missing some other detail? Thanks!

# Answer

You don't have to have the canvas in the DOM to use WebGL. There's plenty of tests in the [WebGL Conformance Tests](https://www.khronos.org/registry/webgl/sdk/tests/webgl-conformance-tests.html) that run without ever adding a canvas to the DOM

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl = document.createElement("canvas").getContext("webgl");
    gl.clearColor(1,0,1,1); // purple;
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw in 2d canvas
    var ctx = document.querySelector("#c2d").getContext("2d");
    ctx.drawImage(gl.canvas, 10, 20, 30, 40);


<!-- language: lang-html -->

    <canvas id="c2d"></canvas>

<!-- end snippet -->

Maybe you should post some more code. You probably have some other bug.

---
## Update

Coming soon is also the [`OffscreenCanvas API`](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas). As of 2017/11/15 It's available in both Firefox and Chrome behind a flag. It allows using WebGL in a Web Worker

## Update 2

As of Chrome 69 OffscreenCanvas is shipping without a flag. 
