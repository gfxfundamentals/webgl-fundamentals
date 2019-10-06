Title: Render to 16bits unsigned integer 2D texture in WebGL2
Description:
TOC: qna

# Question:

As stated in the WebGL 2 official specs or docs ([look here][1]), gl.RGBA16UI internal size format is a color-renderable format. That means I should be able to render to a RGBA16UI texture.

I can easily fill a texture with an UInt16Array and then use it. But I fail filling a texture rendering into it with a shader. Then, I only get zeros when I sample the values in the next shader.

Did anyone already succeed in rendering to an unsigned integer texture with WebGL 2 ? I would be very grateful, I'm playing with texture formats for weeks and I don't get what I'm doing wrong here... And I didn't find my mistake in the other SO questions about the subject.

You can find the full code in the snippet below. The 6 colors printed on the left side are the result of displaying a RGBA16UI texture filled with an UInt16Array. On the right side, we should get the same result if rendering to a RGBA16UI texture was a success.

**[EDIT] That was just a stupid typo. I updated my code and I accepted gman answer as two functional examples of how to render to an unsigned integer texture in WebGL 2.**

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // Position/UV data
    var displayPlanePositions = new Float32Array([
      -1, 1,
      -1, -1,
      0, -1,

      -1, 1,
      0, -1,
      0, 1
    ]);
    var displayPlaneRTTPositions = new Float32Array([
      0, 1,
      0, -1,
      1, -1,

      0, 1,
      1, -1,
      1, 1
    ]);
    var effectPlanePositions = new Float32Array([
      -1, 1,
      -1, -1,
      1, -1,

      -1, 1,
      1, -1,
      1, 1
    ]);
    var displayPlaneUVs = new Float32Array([
      0, 1,
      0, 0,
      1, 0,

      0, 1,
      1, 0,
      1, 1
    ]);
    var displayPlaneRTTUVs = new Float32Array([
      0, 1,
      0, 0,
      1, 0,

      0, 1,
      1, 0,
      1, 1
    ]);

    // Texture data
    var pixelsRGBA16UI = new Uint16Array([
      65535, 0, 0, 65535,
      0, 65535, 0, 65535,
      0, 0, 65535, 65535,
      65535, 65535, 0, 65535,
      0, 65535, 65535, 65535,
      65535, 65535, 65535, 65535
    ]);

    // Shaders
    var displayPlane16UIVertexShaderSource =
     `#version 300 es

      in vec2 position;
      in vec2 uv;
      out vec2 vUV;

      void main()
      {
        vUV = uv;
        gl_Position = vec4(position, 1.0, 1.0);
      }`;
    var displayPlane16UIFragmentShaderSource =
     `#version 300 es
      precision highp float;
      precision highp usampler2D;

      uniform usampler2D sampler;

      in vec2 vUV;
      out vec4 color;

      void main()
      {
        uvec4 samplerUIntColor = texture(sampler, vUV);
        vec4 samplerFloatColor = vec4(samplerUIntColor) / 65535.0;
        color = samplerFloatColor;
      }`;
    var effectPlane16UIVertexShaderSource =
     `#version 300 es

      in vec2 position;

      void main(void) {
        gl_Position = vec4(position, 1.0, 1.0);
      }`;
    var effectPlane16UIFragmentShaderSource =
     `#version 300 es
      precision highp float;

      out uvec4 color;

      void main(void) {
        if (gl_FragCoord.x == 0.5) {
          if (gl_FragCoord.y == 0.5) {
            color = uvec4(65535u, 0.0, 0.0, 65535u);
          } else {
            color = uvec4(65535u, 65535u, 0.0, 65535u);
          }
        } else if (gl_FragCoord.x == 1.5) {
          if (gl_FragCoord.y == 0.5) {
            color = uvec4(0.0, 65535u, 0.0, 65535u);
          } else {
            color = uvec4(0.0, 65535u, 65535u, 65535u);
          }
        } else {
          if (gl_FragCoord.y == 0.5) {
            color = uvec4(0.0, 0.0, 65535u, 65535u);
          } else {
            color = uvec4(65535u, 65535u, 65535u, 65535u);
          }
        }
      }`;
    var displayPlaneRTT16UIVertexShaderSource =
     `#version 300 es

      in vec2 position;
      in vec2 uv;
      out vec2 vUV;

      void main(void) {
        vUV = uv;
        gl_Position = vec4(position, 1.0, 1.0);
      }`;
    var displayPlaneRTT16UIFragmentShaderSource =
     `#version 300 es
      precision highp float;
      precision highp usampler2D;

      uniform usampler2D sampler;

      in vec2 vUV;
      out vec4 color;

      void main(void) {
        uvec4 samplerUIntColor = texture(sampler, vUV);
        vec4 samplerFloatColor = vec4(samplerUIntColor) / 65535.0;
        color = samplerFloatColor;
      }`;
      
    // Create and get context
    var canvas16UI = document.getElementById('webgl2-opti-tests-16ui');
    var gl16UI = canvas16UI.getContext('webgl2');
    canvas16UI.width = 512;
    canvas16UI.height = 512;

    // Get extension
    var color_buffer_float_16ui = gl16UI.getExtension('EXT_color_buffer_float');

    // Clear canvas
    gl16UI.clearColor(0.0, 0.0, 0.0, 1.0);
    gl16UI.clear(gl16UI.COLOR_BUFFER_BIT);

    var log;


    /* DISPLAY PLANE */

    // Create Program
    var displayPlane16UIVertexShader = gl16UI.createShader(gl16UI.VERTEX_SHADER);
    var displayPlane16UIFragmentShader = gl16UI.createShader(gl16UI.FRAGMENT_SHADER);
    var displayPlane16UIProgram = gl16UI.createProgram();
    gl16UI.shaderSource(displayPlane16UIVertexShader, displayPlane16UIVertexShaderSource);
    gl16UI.compileShader(displayPlane16UIVertexShader);
    gl16UI.attachShader(displayPlane16UIProgram, displayPlane16UIVertexShader);
    gl16UI.shaderSource(displayPlane16UIFragmentShader, displayPlane16UIFragmentShaderSource);
    gl16UI.compileShader(displayPlane16UIFragmentShader);
    gl16UI.attachShader(displayPlane16UIProgram, displayPlane16UIFragmentShader);
    gl16UI.linkProgram(displayPlane16UIProgram);
    log = gl16UI.getProgramInfoLog(displayPlane16UIProgram);
    if (log) {
        console.log(log);
    }

    log = gl16UI.getShaderInfoLog(displayPlane16UIVertexShader);
    if (log) {
        console.log("Vertex Shader", log);
    }

    log = gl16UI.getShaderInfoLog(displayPlane16UIFragmentShader);
    if (log) {
        console.log("Fragment Shader", log);
    }
    gl16UI.useProgram(displayPlane16UIProgram);

    // Get attribute locations
    var displayPlane16UIPositionAttributeLocation = gl16UI.getAttribLocation(displayPlane16UIProgram, "position");
    var displayPlane16UIUVAttributeLocation = gl16UI.getAttribLocation(displayPlane16UIProgram, "uv");

    // Get uniform locations
    var displayPlane16UISamplerLocation = gl16UI.getUniformLocation(displayPlane16UIProgram, "sampler");

    // Create and bind VAO
    var displayPlane16UIVAO = gl16UI.createVertexArray();
    gl16UI.bindVertexArray(displayPlane16UIVAO);

    // Create and bind Position Buffer
    var displayPlane16UIPositionBuffer = gl16UI.createBuffer();
    gl16UI.bindBuffer(gl16UI.ARRAY_BUFFER, displayPlane16UIPositionBuffer);
    gl16UI.bufferData(gl16UI.ARRAY_BUFFER, displayPlanePositions, gl16UI.STATIC_DRAW);
    gl16UI.enableVertexAttribArray(displayPlane16UIPositionAttributeLocation);
    gl16UI.vertexAttribPointer(displayPlane16UIPositionAttributeLocation, 2, gl16UI.FLOAT, false, 0, 0);

    // Create and bind UV Buffer
    var displayPlane16UIUVBuffer = gl16UI.createBuffer();
    gl16UI.bindBuffer(gl16UI.ARRAY_BUFFER, displayPlane16UIUVBuffer);
    gl16UI.bufferData(gl16UI.ARRAY_BUFFER, displayPlaneUVs, gl16UI.STATIC_DRAW);
    gl16UI.enableVertexAttribArray(displayPlane16UIUVAttributeLocation);
    gl16UI.vertexAttribPointer(displayPlane16UIUVAttributeLocation, 2, gl16UI.FLOAT, true, 0, 0);

    // Create and bind texture to display
    var displayPlane16UITexture = gl16UI.createTexture();
    gl16UI.activeTexture(gl16UI.TEXTURE0 + 0);
    gl16UI.bindTexture(gl16UI.TEXTURE_2D, displayPlane16UITexture);

    gl16UI.pixelStorei(gl16UI.UNPACK_ALIGNMENT, 1);
    gl16UI.texImage2D(gl16UI.TEXTURE_2D, 0, gl16UI.RGBA16UI, 3, 2, 0, gl16UI.RGBA_INTEGER, gl16UI.UNSIGNED_SHORT, pixelsRGBA16UI);

    gl16UI.texParameteri(gl16UI.TEXTURE_2D, gl16UI.TEXTURE_MIN_FILTER, gl16UI.NEAREST);
    gl16UI.texParameteri(gl16UI.TEXTURE_2D, gl16UI.TEXTURE_MAG_FILTER, gl16UI.NEAREST);
    gl16UI.texParameteri(gl16UI.TEXTURE_2D, gl16UI.TEXTURE_WRAP_S, gl16UI.CLAMP_TO_EDGE);
    gl16UI.texParameteri(gl16UI.TEXTURE_2D, gl16UI.TEXTURE_WRAP_T, gl16UI.CLAMP_TO_EDGE);

    // Bind uniforms
    gl16UI.uniform1i(displayPlane16UISamplerLocation, 0);

    // Execute program
    gl16UI.viewport(0, 0, gl16UI.canvas.width, gl16UI.canvas.height);
    gl16UI.drawArrays(gl16UI.TRIANGLES, 0, 6);


    /* EFFECT PLANE */

    // Create and link Program
    var effectPlane16UIVertexShader = gl16UI.createShader(gl16UI.VERTEX_SHADER);
    var effectPlane16UIFragmentShader = gl16UI.createShader(gl16UI.FRAGMENT_SHADER);
    var effectPlane16UIProgram = gl16UI.createProgram();
    gl16UI.shaderSource(effectPlane16UIVertexShader, effectPlane16UIVertexShaderSource);
    gl16UI.compileShader(effectPlane16UIVertexShader);
    gl16UI.attachShader(effectPlane16UIProgram, effectPlane16UIVertexShader);
    gl16UI.shaderSource(effectPlane16UIFragmentShader, effectPlane16UIFragmentShaderSource);
    gl16UI.compileShader(effectPlane16UIFragmentShader);
    gl16UI.attachShader(effectPlane16UIProgram, effectPlane16UIFragmentShader);
    gl16UI.linkProgram(effectPlane16UIProgram);
    log = gl16UI.getProgramInfoLog(effectPlane16UIProgram);
    if (log) {
        console.log(log);
    }

    log = gl16UI.getShaderInfoLog(effectPlane16UIVertexShader);
    if (log) {
        console.log("VERTEX SHADER", log);
    }

    log = gl16UI.getShaderInfoLog(effectPlane16UIFragmentShader);
    if (log) {
        console.log("FRAGMENT SHADER", log);
    }
    gl16UI.useProgram(effectPlane16UIProgram);

    // Get attribute locations
    var effectPlane16UIPositionAttributeLocation = gl16UI.getAttribLocation(effectPlane16UIProgram, "position");

    // Create and bind VAO
    var effectPlane16UIVAO = gl16UI.createVertexArray();
    gl16UI.bindVertexArray(effectPlane16UIVAO);

    // Create and bind Position Buffer
    var effectPlane16UIPositionBuffer = gl16UI.createBuffer();
    gl16UI.bindBuffer(gl16UI.ARRAY_BUFFER, effectPlane16UIPositionBuffer);
    gl16UI.bufferData(gl16UI.ARRAY_BUFFER, effectPlanePositions, gl16UI.STATIC_DRAW);
    gl16UI.enableVertexAttribArray(effectPlane16UIPositionAttributeLocation);
    gl16UI.vertexAttribPointer(effectPlane16UIPositionAttributeLocation, 2, gl16UI.FLOAT, false, 0, 0);

    // Create and bind target texture
    var effectPlane16UITexture = gl16UI.createTexture();
    gl16UI.bindTexture(gl16UI.TEXTURE_2D, effectPlane16UITexture);

    gl16UI.pixelStorei(gl16UI.UNPACK_ALIGNMENT, 1);
    gl16UI.texImage2D(gl16UI.TEXTURE_2D, 0, gl16UI.RGBA16UI, 3, 2, 0, gl16UI.RGBA_INTEGER, gl16UI.UNSIGNED_SHORT, null);

    gl16UI.texParameteri(gl16UI.TEXTURE_2D, gl16UI.TEXTURE_MIN_FILTER, gl16UI.NEAREST);
    gl16UI.texParameteri(gl16UI.TEXTURE_2D, gl16UI.TEXTURE_MAG_FILTER, gl16UI.NEAREST);
    gl16UI.texParameteri(gl16UI.TEXTURE_2D, gl16UI.TEXTURE_WRAP_S, gl16UI.CLAMP_TO_EDGE);
    gl16UI.texParameteri(gl16UI.TEXTURE_2D, gl16UI.TEXTURE_WRAP_T, gl16UI.CLAMP_TO_EDGE);

    // Create and bind the framebuffer
    var framebuffer = gl16UI.createFramebuffer();
    gl16UI.bindFramebuffer(gl16UI.FRAMEBUFFER, framebuffer);

    // Attach the texture as the first color attachment
    gl16UI.framebufferTexture2D(gl16UI.FRAMEBUFFER, gl16UI.COLOR_ATTACHMENT0, gl16UI.TEXTURE_2D, effectPlane16UITexture, 0);
    console.log("Render to RGBA16UI Texture:", gl16UI.checkFramebufferStatus(gl16UI.FRAMEBUFFER) === 36053 ? "FRAMEBUFFER_COMPLETE" : "FRAMEBUFFER_INCOMPLETE");

    // Execute program
    gl16UI.viewport(0, 0, 3, 2);
    gl16UI.drawArrays(gl16UI.TRIANGLES, 0, 6);

    // Unbind framebuffer
    gl16UI.bindFramebuffer(gl16UI.FRAMEBUFFER, null);


    /* DISPLAY PLANE RTT */

    // Create Program
    var displayPlaneRTT16UIVertexShader = gl16UI.createShader(gl16UI.VERTEX_SHADER);
    var displayPlaneRTT16UIFragmentShader = gl16UI.createShader(gl16UI.FRAGMENT_SHADER);
    var displayPlaneRTT16UIProgram = gl16UI.createProgram();
    gl16UI.shaderSource(displayPlaneRTT16UIVertexShader, displayPlaneRTT16UIVertexShaderSource);
    gl16UI.compileShader(displayPlaneRTT16UIVertexShader);
    gl16UI.attachShader(displayPlaneRTT16UIProgram, displayPlaneRTT16UIVertexShader);
    gl16UI.shaderSource(displayPlaneRTT16UIFragmentShader, displayPlaneRTT16UIFragmentShaderSource);
    gl16UI.compileShader(displayPlaneRTT16UIFragmentShader);
    gl16UI.attachShader(displayPlaneRTT16UIProgram, displayPlaneRTT16UIFragmentShader);
    gl16UI.linkProgram(displayPlaneRTT16UIProgram);
    log = gl16UI.getProgramInfoLog(displayPlaneRTT16UIProgram);
    if (log) {
        console.log(log);
    }

    log = gl16UI.getShaderInfoLog(displayPlaneRTT16UIVertexShader);
    if (log) {
        console.log("VERTEX SHADER", log);
    }

    log = gl16UI.getShaderInfoLog(displayPlaneRTT16UIFragmentShader);
    if (log) {
        console.log("FRAGMENT SHADER", log);
    }
    gl16UI.useProgram(displayPlaneRTT16UIProgram);

    // Get attribute locations
    var displayPlaneRTT16UIPositionAttributeLocation = gl16UI.getAttribLocation(displayPlaneRTT16UIProgram, "position");
    var displayPlaneRTT16UIUVAttributeLocation = gl16UI.getAttribLocation(displayPlaneRTT16UIProgram, "uv");

    // Get uniform locations
    var displayPlaneRTT16UISamplerLocation = gl16UI.getUniformLocation(displayPlaneRTT16UIProgram, "sampler");

    // Create and bind VAO
    var displayPlaneRTT16UIVAO = gl16UI.createVertexArray();
    gl16UI.bindVertexArray(displayPlaneRTT16UIVAO);

    // Create and bind Position Buffer
    var displayPlaneRTT16UIPositionBuffer = gl16UI.createBuffer();
    gl16UI.bindBuffer(gl16UI.ARRAY_BUFFER, displayPlaneRTT16UIPositionBuffer);
    gl16UI.bufferData(gl16UI.ARRAY_BUFFER, displayPlaneRTTPositions, gl16UI.STATIC_DRAW);
    gl16UI.enableVertexAttribArray(displayPlaneRTT16UIPositionAttributeLocation);
    gl16UI.vertexAttribPointer(displayPlaneRTT16UIPositionAttributeLocation, 2, gl16UI.FLOAT, false, 0, 0);

    // Create and bind UV Buffer
    var displayPlaneRTT16UIUVBuffer = gl16UI.createBuffer();
    gl16UI.bindBuffer(gl16UI.ARRAY_BUFFER, displayPlaneRTT16UIUVBuffer);
    gl16UI.bufferData(gl16UI.ARRAY_BUFFER, displayPlaneRTTUVs, gl16UI.STATIC_DRAW);
    gl16UI.enableVertexAttribArray(displayPlaneRTT16UIUVAttributeLocation);
    gl16UI.vertexAttribPointer(displayPlaneRTT16UIUVAttributeLocation, 2, gl16UI.FLOAT, true, 0, 0);

    // Bind texture to display
    gl16UI.activeTexture(gl16UI.TEXTURE0 + 0);
    gl16UI.bindTexture(gl16UI.TEXTURE_2D, effectPlane16UITexture);

    // Bind uniforms
    gl16UI.uniform1i(displayPlaneRTT16UISamplerLocation, 0);

    // Execute program
    gl16UI.viewport(0, 0, gl16UI.canvas.width, gl16UI.canvas.height);
    gl16UI.drawArrays(gl16UI.TRIANGLES, 0, 6);

<!-- language: lang-html -->

    <!DOCTYPE html>

    <html>
    <head>
      <meta charset="UTF-8" />
      <title>RGBA16UI RenderTarget</title>
    </head>

    <body>
      <canvas id="webgl2-opti-tests-16ui" width="512" height="512" style="position: absolute; z-index: 1000;"></canvas>
    </body>
    </html>

<!-- end snippet -->

Thanks for reading me.

  [1]: https://www.khronos.org/registry/OpenGL-Refpages/es3.0/html/glTexImage2D.xhtml

# Answer

Sorry but I found it hard to read your code. Maybe [make an mcve next time](https://meta.stackoverflow.com/questions/349789/how-do-i-create-a-minimal-complete-verifiable-example)?

In any case here's a working sample. When you're just trying to debug texture or rendering it's simplest to just draw a single point. Then you don't need any attributes or vertex array objects or buffers. Since there is only one texture you don't need to set sampler uniforms either.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector("canvas").getContext("webgl2");
      if (!gl) {
        return alert("need webgl2");
      }
      
      const vs = `
      #version 300 es
      void main() {
        // use a point as it's easier
        gl_PointSize = 300.0;   // because the canvas is 300x150
        gl_Position = vec4(0, 0, 0, 1);
      }
      `;
      
      const uintFS = `
      #version 300 es
      precision highp float;
      out uvec4 color;
      void main() {
        // will fill texture with values from 0 to 30000
        // if the texture is 300x100 and we're rendering
        // to the entire texture
        color = uvec4(gl_FragCoord.xy, 0, 300) * 100u;
      }
      `;
      
      const uintToFloatFS = `
      #version 300 es
      precision highp float;
      uniform highp usampler2D tex;
      out vec4 color;
      void main() {
        uvec4 data = texture(tex, gl_PointCoord.xy);
        color = vec4(data) / 30000.0;
      }
      `;
      
      // compile shaders 
      const renderUintPrg = twgl.createProgram(gl, [vs, uintFS]);
      const uintToFloatPrg = twgl.createProgram(gl, [vs, uintToFloatFS]);

      // make an 300x150 RGBA16UI texture and attach to framebuffer
      const fbi = twgl.createFramebufferInfo(gl, [
        {internalFormat: gl.RGBA16UI, minMag: gl.NEAREST, },
      ], 300, 150);
      
      // bind framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbi.framebuffer);
      
      gl.useProgram(renderUintPrg);
      
      gl.drawArrays(gl.POINTS, 0, 1);
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      gl.useProgram(uintToFloatPrg);
      
      gl.drawArrays(gl.POINTS, 0, 1);
    }
    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


