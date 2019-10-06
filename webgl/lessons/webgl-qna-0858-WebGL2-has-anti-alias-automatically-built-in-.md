Title: WebGL2 has anti-alias automatically built-in?
Description:
TOC: qna

# Question:

I've been reading the source code for these [examples][1] and I continue to see this option, however, I can't locate anywhere whether this is a supported feature. Do you simply get `antialias` by turning on this flag? Any more details on this feature?


  [1]: https://github.com/WebGLSamples/WebGL2Samples/blob/master/samples/draw_image_space.html#L54

# Answer

> Do you simply get antialias by turning on this flag?

No, it's only a request, not a requirement

From the spec:

> # 5.2.1 Context creation parameters
>
> ...
>
> **antialias**
>   >If the value is true and the implementation supports antialiasing the drawing buffer will perform antialiasing using its choice of technique (multisample/supersample) and quality. If the value is false or the implementation does not support antialiasing, no antialiasing is performed.

And this

> #2.2 The Drawing Buffer

> ...

> The depth, stencil and antialias attributes, when set to true, are requests, not requirements. The WebGL implementation should make a best effort to honor them. When any of these attributes is set to false, however, the WebGL implementation must not provide the associated functionality. 

By setting it to `false` you're telling the browser "Don't turn on antialiasing" period. For example if you're making a pixelated game you might want to tell the browser to not antialias.

By NOT setting the flag the browser will generally try to use antialiasing. By setting the flag to true the browser might take it as a hint but it's still up to the browser whether antialiasing happens or not and how it happens (what settings or techniques it uses etc...). There are often bugs related to anti-aliasing and so browsers are often forced to not support it for certain GPUs. A browser might also refuse based on performance. For example when not setting the flag the browser might decide not to use antialiasing to favor performance on a smartphone and then setting the flag it might take that as a hint that the app prefers antialiasing over performance but it's still up to the browser to decide.

Here's a test

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    test("webgl");
    test("webgl2");

    function test(webglVersion) {
      antialiasTest(webglVersion, {}, "default");
      antialiasTest(webglVersion, {antialias: true}, "true");
      antialiasTest(webglVersion, {antialias: false}, "false");
    }

    function antialiasTest(webglVersion, options, desc) {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      const gl = canvas.getContext(webglVersion, options);
      if (!gl) {
        log(webglVersion, 'not supported');
        return;
      }
      
      const vs = `
      attribute vec4 position;
      void main() {
         gl_Position = position;
      }
      `;
      const fs = `
      void main() {
        gl_FragColor = vec4(1, 0, 0, 1);
      }
      `;
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
        position: {
          numComponents: 2,
          data: [
            -1, -1, 
             1, -1,
            -1,  1,
          ],
        },
      });
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const pixels = new Uint8Array(2 * 2 * 4);
      gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const isNotAntialiased = 
        isRedOrBlack(pixels[ 0]) && 
        isRedOrBlack(pixels[ 4]) && 
        isRedOrBlack(pixels[ 8]) && 
        isRedOrBlack(pixels[12]) ; 
      log(webglVersion, 'with antialias =', desc, 'was', isNotAntialiased ? 'NOT' : '', 'antialiased');
    }

    function isRedOrBlack(r) {
      return r === 255 || r === 0;
    }
    function log(...args) {
      const elem = document.createElement("div");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

Tangentially related though, WebGL2 allows you to create antialiased renderbuffers with `renderbufferStorageMultisample` and resolve them using `blitFramebuffer`, a feature which was not available in WebGL1. Rendering to an antialiased framebuffer and then blitting that to the canvas is a way to force antialiasing, at least in WebGL2.

