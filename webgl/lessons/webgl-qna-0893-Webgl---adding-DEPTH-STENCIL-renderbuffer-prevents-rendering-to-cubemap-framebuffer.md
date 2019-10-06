Title: Webgl - adding DEPTH_STENCIL renderbuffer prevents rendering to cubemap framebuffer
Description:
TOC: qna

# Question:

We're working in Webgl 1 and attempting to render to a cubemap using a stencil. Rendering to the cubemap on its own works fine. When we add a `DEPTH_STENCIL` renderbuffer it stops writing to the cubemap and issues no error.

- This doesn't happen with a normal `TEXTURE_2D` instead of a `TEXTURE_CUBE_MAP`.
- Depth/stencil/scissor tests are disabled.
- The call to `framebufferRenderbuffer` is what breaks it.
- Switching the renderbuffer to be either just a stencil or just a depth has the same effect.
- Switching the renderbuffer to be a colour buffer makes it work again.

Here's a minimal-ish recreation. As you can see, we're getting a console output with the correct values for the first three calls and zeroes for the last call.

Why is this happening and what little thing are we missing to make renderbuffers work with cubemaps?


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");

    console.log(TEST(false, false));
    console.log(TEST(false, true));
    console.log(TEST(true, false));
    console.log(TEST(true, true));

    function TEST(useCubemap, useBuffer) {
      const size = 512;
      const textureType = useCubemap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

      // SETUP THE PROGRAM
      {
        const program = gl.createProgram();
        const vertShader = gl.createShader(gl.VERTEX_SHADER);
        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertShader, `
                attribute vec2 a_position;
                
                void main() {           
                    gl_Position = vec4(a_position, 0.2, 1.0);
                }
            `);
        gl.compileShader(vertShader);
        gl.attachShader(program, vertShader);

        gl.shaderSource(fragShader, `
                void main() {
                    gl_FragColor = vec4(0.1, 0.2, 0.3, 0.4);
                }
            `);
        gl.compileShader(fragShader);
        gl.attachShader(program, fragShader);

        gl.linkProgram(program);
        gl.useProgram(program);
      }

      // SETUP THE QUAD
      {
        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, +1, -1, -1, +1, +1, +1, -1]), gl.STATIC_DRAW);
      }

      // SETUP THE FRAMEBUFFER
      {
        const fb = gl.createFramebuffer();
        const targetTexture = gl.createTexture();

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        gl.bindTexture(textureType, targetTexture);
        gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(textureType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(textureType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // SWITCH TEXTURE TYPE
        if (textureType === gl.TEXTURE_2D) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);
        } else {
          for (let i = 0; i < 6; i++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, targetTexture, 0);
        }
      }

      // SETUP THE RENDER BUFFER
      {
        const rb = gl.createRenderbuffer();

        gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, size, size);

        // TAKING THIS OUT MAKES IT WORK
        if (useBuffer) gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rb);
      }


      // DISABLE THE OBVIOUS CULPRITS
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.SCISSOR_TEST);

      // DO A RENDERYFUCK
      gl.viewport(0, 0, size, size);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // GET THE OUTFUCK
      const pixels = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels;
    }

<!-- end snippet -->



# Answer

It works for me. I get the same values for all 4 calls in the code you posted. What OS/GPU/Driver are you using? Can you pastebin your `about:gpu` contents if you're using Chrome?

It sounds like a bug in your drivers. It's possible it's a also a bug in the WebGL spec. 

The OpenGL ES spec does **not** require any combinations of framebuffer attachments to work (zero, zilch, nada). The WebGL spec require 3 combinations to work. From [the spec, section 6.8](https://www.khronos.org/registry/webgl/specs/latest/1.0/#6.8):

> The following combinations of framebuffer object attachments, when all of the attachments are framebuffer attachment complete, non-zero, and have the same width and height, must result in the framebuffer being framebuffer complete:
> 
> * COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture
> * COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture + DEPTH_ATTACHMENT = DEPTH_COMPONENT16 renderbuffer
> * COLOR_ATTACHMENT0 = RGBA/UNSIGNED_BYTE texture + DEPTH_STENCIL_ATTACHMENT = DEPTH_STENCIL renderbuffer

But looking at the WebGL Conformance tests [only `TEXTURE_2D` is tested](https://www.khronos.org/registry/webgl/sdk/tests/conformance/renderbuffers/framebuffer-object-attachment.html).

So, first off that suggests your driver/gpu doesn't support that combination with cubemaps. Test by calling `gl.checkFramebufferStatus`. If it doesn't return `gl.FRAMEBUFFER_COMPLETE` your setup doesn't support rendering to a cubemap with a depth stencil attachment.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");

    TEST("TEXTURE_2D", "DEPTH_COMPONENT16");
    TEST("TEXTURE_2D", "DEPTH_STENCIL");
    TEST("TEXTURE_CUBE_MAP", "DEPTH_COMPONENT16");
    TEST("TEXTURE_CUBE_MAP", "DEPTH_STENCIL");

    function TEST(target, depthBufferFormat) {
      const size = 16;
      const textureType = gl[target];

      // SETUP THE FRAMEBUFFER
      {
        const fb = gl.createFramebuffer();
        const targetTexture = gl.createTexture();

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        gl.bindTexture(textureType, targetTexture);
        gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(textureType, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(textureType, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // SWITCH TEXTURE TYPE
        if (textureType === gl.TEXTURE_2D) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);
        } else {
          for (let i = 0; i < 6; i++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, targetTexture, 0);
        }
      }

      // SETUP THE RENDER BUFFER
      {
        const rb = gl.createRenderbuffer();
        const format = gl[depthBufferFormat];

        gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
        gl.renderbufferStorage(gl.RENDERBUFFER, format, size, size);

        // TAKING THIS OUT MAKES IT WORK
        const attachmentPoint = depthBufferFormat === "DEPTH_COMPONENT16"
          ? gl.DEPTH_ATTACHMENT
          : gl.DEPTH_STENCIL_ATTACHMENT;
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachmentPoint, gl.RENDERBUFFER, rb);
      }

      const success =  gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      console.log(target, depthBufferFormat, success ? "PASS" : "**FAIL**");
    }

<!-- end snippet -->

Do you need the stencil or just the depth buffer? Does [this sample run](http://webglsamples.org/dynamic-cubemap/dynamic-cubemap.html) for you? It's using a `DEPTH_COMPONENT16` attachment.




