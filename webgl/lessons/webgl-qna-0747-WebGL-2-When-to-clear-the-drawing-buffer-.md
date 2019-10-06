Title: WebGL 2 When to clear the drawing buffer?
Description:
TOC: qna

# Question:

I am currently working on a demo that calls [readPixels][2]. 

[This answer on SO][1] is most of the information I can find on the `preserveDrawingBuffer` option.

While testing I've observed that in WebGL 2 [this answer][3] remains true - you have to set `preserveDrawingBuffer` to `true`.

Is this actually correct? 

Is there an OpenGL equivalent for `preserveDrawingBuffer`?

Is there any way to set `preserveDrawingBuffer` to `false` and still call readPixels?

[This answer][4] makes it seem like you could call `gl.flush` instead. 

How is preserveDrawingBuffer the same thing as flushing the context?


  [1]: https://stackoverflow.com/questions/27746091/preservedrawingbuffer-false-is-it-worth-the-effort
  [2]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels
  [3]: https://stackoverflow.com/questions/7156971/webgl-readpixels-is-always-returning-0-0-0-0
  [4]: https://stackoverflow.com/a/40098594/3291506

# Answer

You don't need `preserveDrawingBuffer: true` to call `readPixels`. What you need is to call `readPixels` before exiting the current event.

The spec says if you call any function that affects the canvas (gl.clear, gl.drawXXX) then the browser will clear the canvas after the next composite operation. When that composite operation happens is up to the browser. It could be after it processes several mouse events or keyboard events or click events. The order is undefined. What is defined is that it won't do it until the current event exits so

    render
    read

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext("webgl2");

    render();
    read();  // read in same event

    function render() {
      gl.clearColor(.25, .5, .75, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function read() {
      const pixel = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      log(pixel);
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

works where as

    render
    setTimeout(read, 1000);  // some other event

does not work

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext("webgl2");

    render();
    setTimeout(read, 1000);  // read in other event

    function render() {
      gl.clearColor(.25, .5, .75, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function read() {
      const pixel = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      log(pixel);
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }


<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

Note that since it's the composite operation (the browser actually drawing the canvas on the page with the rest of the HTML) that triggers the clear, if the canvas is not on the page then it's not composited and won't be cleared.

In other words the case that didn't work above does work here

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // create an offscreen canvas. Because it's offscreen it won't be composited
    // and therefore will not be cleared.
    const gl = document.createElement("canvas").getContext("webgl2");

    render();
    setTimeout(read, 1000);  // read in other event

    function render() {
      gl.clearColor(.25, .5, .75, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function read() {
      const pixel = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      log(pixel);
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- end snippet -->

If you want to call `readPixels` in some other event, like when the user clicks an element, then you have at least 2 options

1.  Set `preserveDrawingBuffer: true`

2.  Render again in your event

        screenshotButton.addEventListener('click', () => {
           render();
           read();
        });

From [the spec section 2.2](https://www.khronos.org/registry/webgl/specs/1.0/)

> WebGL presents its drawing buffer to the HTML page compositor immediately before a compositing operation, but only if at least one of the following has occurred since the previous compositing operation:

> * Context creation
> * Canvas resize
> * clear, drawArrays, or drawElements has been called while the drawing buffer is the currently bound framebuffer
>
> Before the drawing buffer is presented for compositing the implementation shall ensure that all rendering operations have been flushed to the drawing buffer. By default, after compositing the contents of the drawing buffer shall be cleared to their default values, as shown in the table above.
>
> This default behavior can be changed by setting the preserveDrawingBuffer attribute of the WebGLContextAttributes object. If this flag is true, the contents of the drawing buffer shall be preserved until the author either clears or overwrites them. If this flag is false, attempting to perform operations using this context as a source image after the rendering function has returned can lead to undefined behavior. This includes readPixels or toDataURL calls, or using this context as the source image of another context's texImage2D or drawImage call.


