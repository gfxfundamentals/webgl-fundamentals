Title: WebGL: async operations?
Description:
TOC: qna

# Question:

I'd like to know if there are any async calls for WebGL that one could take advantage of?

I have looked into Spec v1 and Spec v2 they don't mention anything. In V2, there is a WebGL Query mechanism which I don't think is what I'm looking for.

A search on the web didn't come up with anything definitive. There is this example and is not clear how the sync and async version differ. http://toji.github.io/shader-perf/

Ultimately I'd like to be able to some of all of these asynchronously:

- readPixels
- texSubImage2D and texImage2D
- Shader compilation
- program linking
- draw???

There is a glFinish operation and the documentation for it says: "does not return until the effects of all previously called GL commands are complete.". To me this means that there are asynchronous operations which can be awaited for by calling Finish()?

And some posts on the web suggest that calling getError() also forces some synchronicity and is not a very desired thing to do after every call.


# Answer

It depends on your definition of async.

In Chrome (Firefox might also do this now? not sure). Chrome runs all GPU code in a separate process from JavaScript. That means your commands are running asynchronous. Even OpenGL itself is designed to be asynchronous. The functions (WebGL/OpenGL) insert commands into a command buffer. Those are executed by some other thread/process. You tell OpenGL "hey, I have new commands for you to execute!" by calling `gl.flush`. It executes those commands asynchronously. If you don't call `gl.flush` it will be called for you periodically when too many commands have been issued. It will also be called when the current JavaScript event exits, assuming you called any rendering command to the canvas (gl.drawXXX, gl.clear).

In this sense everything about WebGL is async. If you don't query something (gl.getXXX, gl.readXXX) then stuff is being handled (drawn) out of sync with your JavaScript. WebGL is giving you access to a GPU after all running separately from your CPU.

Knowing this one way to take advantage of it in Chrome is to compile shaders async by submitting the shaders

    for each shader
      s = gl.createShader()
      gl.shaderSource(...);
      gl.compileShader(...);
      gl.attachShader(...);
    gl.linkProgram(...)
    gl.flush()

The GPU process will now be compiling your shaders. So, say, 250ms later you only then start asking if it succeeded and querying locations, then if it took less then 250ms to compile and link the shaders it all happened async.

In WebGL2 there is at least one more clearly async operation, occlusion queries, in which WebGL2 can tell you how many pixels were drawn for a group of draw calls. If non were drawn then your draws were occluded. To get the answer you periodically pole to see if the answer is ready. Typically you check next frame and in fact the WebGL spec requires the answer to not be available until the next frame.

Otherwise, at the moment (August 2018), there is no explicitly async APIs.

## Update

HankMoody brought up in comments that `texImage2D` is sync. Again, it **depends on your definition of async**. It takes time to add commands and their data. A command like `gl.enable(gl.DEPTH_TEST)` only has to add 2-8 bytes. A command like `gl.texImage2D(..., width = 1024, height = 1024, RGBA, UNSIGNED_BYTE)` has to add 4meg!. Once that 4meg is uploaded the rest is async, but the uploading takes time. That's the same for both commands it's just that adding 2-8 bytes takes a lot less time than adding 4meg. 

To more be clear, after that 4 meg is uploaded many other things happen asynchronously. The driver is called with the 4 meg. The driver copies that 4meg. The driver schedules that 4meg to be used sometime later as it can't upload the data immediately if the texture is already in use. Either that or it does upload it immediately just to a new area and then swaps what the texture is pointing to at just before a draw call that actually uses that new data. Other drivers just copy the data and store it and wait until the texture is used in a draw call to actually update the texture. This is because texImage2D has crazy semantics where you can upload different size mips in any order so the driver can't know what's actually needed in GPU memory until draw time since it has no idea what order you're going to call texIamge2D. All of this stuff mentioned in this paragraph happens asynchronously.

But that does bring up some more info.

`gl.texImage2D` and related commands have to do a TON of work. One is they have to honor `UNPACK_FLIP_Y_WEBGL` and `UNPACK_PREMULTIPLY_ALPHA_WEBGL` so they man need to make a copy of multiple megs of data to flip it or premultiply it. Second, if you pass them a video, canvas, or image they may have to do heavy conversions or even reparse the image from source especially in light of `UNPACK_COLORSPACE_CONVERSION_WEBGL`. Whether this happens in some async like way or not is up to the browser. Since you don't have direct access to the image/video/canvas it would be possible for the browser to do all of this async but one way or another all that work has to happen.

To make much of that work ASYNC the `ImageBitmap` API was added. Like most Web APIs it's under-specified but the idea is you first do a `fetch` (which is async). You then request to create an `ImageBitmap` and give it options for color conversion, flipping, pre-multiplied alpha. This also happens async. You then pass the result to `gl.texImage2D` with the hope being that the browser was able to make do all the heavy parts before it got to this last step.

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // note: mode: 'cors' is because we are loading
    // from a different domain

    async function main() {
      const response = await fetch('https://i.imgur.com/TSiyiJv.jpg', {mode: 'cors'})
      if (!response.ok) {
        return console.error('response not ok?');
      }
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      });

      const gl = document.querySelector("canvas").getContext("webgl");

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      {
        const level = 0;
        const internalFormat = gl.RGBA;
        const format = gl.RGBA;
        const type = gl.UNSIGNED_BYTE;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                      format, type, bitmap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }

      const vs = `
      uniform mat4 u_worldViewProjection;
      attribute vec4 position;
      attribute vec2 texcoord;
      varying vec2 v_texCoord;

      void main() {
        v_texCoord = texcoord;
        gl_Position = u_worldViewProjection * position;
      }
      `;
      const fs = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_tex;
      void main() {
        gl_FragColor = texture2D(u_tex, v_texCoord);
      }
      `;

      const m4 = twgl.m4;
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);
      const uniforms = {
        u_tex: tex,
      };

      function render(time) {
        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        const fov = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.5;
        const zFar = 10;
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [1, 4, -6];
        const target = [0, 0, 0];
        const up = [0, 1, 0];

        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
        const world = m4.rotationY(time);

        uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
    main();


<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Unfortunately this only works in Chrome as of 2018 August. Firefox [bug is here](https://bugzilla.mozilla.org/show_bug.cgi?id=1335594). Other browsers I don't know.
