Title: Rendering unsigned 8-bit textures specificities
Description:
TOC: qna

# Question:

I have been trying to use integer-based textures (see this question for context), but I can't manage to make the transition from float-based textures `gl.RGBA/gl.RGBA` to `gl.RGBA8UI/gl.RGBA_INTEGER`.

I've replaced mentions of `sampler2D` to `usampler2D`, `vec4` to `uvec4` (for `fragColor`), rewritten the texture formats, but nothing is drawn. I couldn't also use glClear either, showing with the error: `glClear: can't be called on integer buffers`. Is there any specificities to have in mind when using integer-based textures? 

Edit: It seems that it is working on Google Chrome, not on Firefox?

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const baseImage = new Image();
    baseImage.src = 'https://i.imgur.com/O6aW2Tg.png';
    baseImage.crossOrigin = 'anonymous';
    baseImage.onload = function() {
      render(baseImage);
    };

    const vertexShaderSource = `#version 300 es
    precision mediump float;

    in vec2 position;
    out vec2 textureCoordinate;

    void main() {
      textureCoordinate = vec2(1.0 - position.x, 1.0 - position.y);
      gl_Position = vec4((1.0 - 2.0 * position), 0, 1);
    }`;

    const fragmentShaderSource = `#version 300 es
    precision mediump float;
    precision highp usampler2D;

    uniform usampler2D inputTexture;
    in vec2 textureCoordinate;
    out uvec4 fragColor;

    void main() {
        fragColor = texture(inputTexture, textureCoordinate);
    }`;

    function render(image) {
      const canvas = document.getElementById('canvas');
      const gl = canvas.getContext('webgl2');
      if (!gl) {
        return;
      }

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]),
        gl.STATIC_DRAW
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      const program = webglUtils.createProgramFromSources(gl, [
        vertexShaderSource,
        fragmentShaderSource,
      ]);
      const positionAttributeLocation = gl.getAttribLocation(
        program,
        'position'
      );
      const inputTextureUniformLocation = gl.getUniformLocation(
        program,
        'inputTexture'
      );
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      const rawTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, rawTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8UI, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);

      const outputTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, outputTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8UI, image.width,
        image.height,
        0, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);

      const framebuffer = gl.createFramebuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        outputTexture,
        0
      );
      gl.viewport(0, 0, image.width, image.height);
      gl.clearColor(0, 0, 0, 1.0);
      // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1i(inputTextureUniformLocation, 0);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, rawTexture);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);

      const pixels = new Uint8Array(4 * image.width * image.height);
      gl.readPixels(
        0,
        0,
        image.width,
        image.height,
        gl.RGBA_INTEGER,
        gl.UNSIGNED_BYTE,
        pixels
      );
      console.log(pixels);
    }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>
    <script src="https://webgl2fundamentals.org/webgl/resources/webgl-utils.js"></script>

<!-- end snippet -->



# Answer

Your code rendered just fine. It failed on readPixels which we can see in the JavaScript console, firefox printed the error

    Error: WebGL warning: readPixels: Incompatible format or type.

This is an unfortunate [part of the spec](https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf).

The spec lists all the internal formats of textures you can create and what format/type combinations of data you can pass to `texImage2D` to upload data to each of them. But, going the opposite way it is not as explicit which format/type combinations you can use to read pixels.

This is what it says, section 4.3.2

> Only two combinations of format and type are accepted in most cases. The first varies depending on the format of the currently bound rendering surface. For normalized fixed-point rendering surfaces, the combination format `RGBA` and type
`UNSIGNED_BYTE` is accepted. For signed integer rendering surfaces, the combination format `RGBA_INTEGER` and type `INT` is accepted. For unsigned integer rendering surfaces, the combination format `RGBA_INTEGER` and type `UNSIGNED_INT` is accepted.
>
> The second is an implementation-chosen format from among those defined
in table 3.2, excluding formats `DEPTH_COMPONENT` and `DEPTH_STENCIL`. The
values of format and type for this format may be determined by calling **GetIntegerv** with the symbolic constants `IMPLEMENTATION_COLOR_READ_FORMAT`
and `IMPLEMENTATION_COLOR_READ_TYPE`, respectively. ... The implementation-chosen format may vary depending on the format of the selected read buffer of the currently bound read framebuffer.
>
> Additionally, when the internal format of the rendering surface is RGB10_A2,
a third combination of format RGBA and type UNSIGNED_INT_2_10_10_10_REV
is accepted.

Table 3.2, which you can see a version of [on this page](https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html) 4th table on the page, lists tons a format/type combos and it's important to note the spec does not dictate which format/type combos are valid. In other words it does **not** say pick a format/type combo from table 3.2 that corresponds to the current internal format. Instead it just says any format/type combo in that table is valid. Yes, you read that right. According to the spec you could upload RGBA/INT textures and the implementation might decide your second format is R/FLOAT ¯\\_(ツ)_/¯ 

Here's some code to print out the 2nd allowed readPixels format/type combo for a RGBA8UI texture

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const canvas = document.getElementById('canvas');
      const gl = canvas.getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }

      const outputTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, outputTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8UI, 4, 4,
        0, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const framebuffer = gl.createFramebuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        outputTexture,
        0
      );

      console.log(
        `format/type: ${
          glEnumToString(gl, gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT))
        }/${
          glEnumToString(gl, gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE))
        }`);
      
    }
    main();

    function glEnumToString(gl, value) {
      for (const key in gl) {
        if (gl[key] === value) {
          return key;
        }
      }
      return `0x${value.toFixed(16)}`;
    }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>


<!-- end snippet -->

If I run the code above Chrome says

    format/type: RGBA_INTEGER/UNSIGNED_BYTE

But firefox says

    format/type: RGBA_INTEGER/UNSIGNED_INT

Both of which are valid according to the spec. 

If you want it to work everywhere you need to read the data as `RGBA_INTEGER/UNSIGNED_INT` as the first part of the spec above says that format is always supported for unsigned integer formats.

Changing your code to do that makes it work on both browsers

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const baseImage = new Image();
    baseImage.src = 'https://i.imgur.com/O6aW2Tg.png';
    baseImage.crossOrigin = 'anonymous';
    baseImage.onload = function() {
      render(baseImage);
    };

    const vertexShaderSource = `#version 300 es
    precision mediump float;

    in vec2 position;
    out vec2 textureCoordinate;

    void main() {
      textureCoordinate = vec2(1.0 - position.x, 1.0 - position.y);
      gl_Position = vec4((1.0 - 2.0 * position), 0, 1);
    }`;

    const fragmentShaderSource = `#version 300 es
    precision mediump float;
    precision highp usampler2D;

    uniform usampler2D inputTexture;
    in vec2 textureCoordinate;
    out uvec4 fragColor;

    void main() {
        fragColor = texture(inputTexture, textureCoordinate);
    }`;

    function render(image) {
      const canvas = document.getElementById('canvas');
      const gl = canvas.getContext('webgl2');
      if (!gl) {
        return;
      }

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]),
        gl.STATIC_DRAW
      );
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      const program = webglUtils.createProgramFromSources(gl, [
        vertexShaderSource,
        fragmentShaderSource,
      ]);
      const positionAttributeLocation = gl.getAttribLocation(
        program,
        'position'
      );
      const inputTextureUniformLocation = gl.getUniformLocation(
        program,
        'inputTexture'
      );
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      const rawTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, rawTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8UI, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);

      const outputTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, outputTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8UI, image.width,
        image.height,
        0, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 0);

      const framebuffer = gl.createFramebuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        outputTexture,
        0
      );
      gl.viewport(0, 0, image.width, image.height);
      gl.clearColor(0, 0, 0, 1.0);
      // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1i(inputTextureUniformLocation, 0);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, rawTexture);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);

      const pixels = new Uint32Array(4 * image.width * image.height);
      gl.readPixels(
        0,
        0,
        image.width,
        image.height,
        gl.RGBA_INTEGER,
        gl.UNSIGNED_INT,
        pixels
      );
      console.log(pixels.slice(0, 40));
    }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>
    <script src="https://webgl2fundamentals.org/webgl/resources/webgl-utils.js"></script>

<!-- end snippet -->


