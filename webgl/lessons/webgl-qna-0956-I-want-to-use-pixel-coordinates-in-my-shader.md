Title: I want to use pixel coordinates in my shader
Description:
TOC: qna

# Question:

From https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html

> WebGL2 adds the ability to read a texture using pixel coordinates as well. Which way is best is up to you. I feel like it's more common to use texture coordinates than pixel coordinates.

Nowhere is this mentioned other then passing uniform with texture dimensions in pixels and calculate from there, is there a way to access these pixel coords without calculation as it is supposed here?



# Answer

You can read individual pixels/texels from a texture in WebGL2 with `texelFetch`

    vec4 color = texelFetch(someUniformSampler, ivec2(pixelX, pixelY), intMipLevel);

For example, compute the average color of a texture by reading each pixel

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `#version 300 es
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 1.0;
    }
    `;

    const fs = `#version 300 es
    precision highp float;
    uniform sampler2D tex;
    out vec4 outColor;
    void main() {
      int level = 0;
      ivec2 size = textureSize(tex, level);
      vec4 color = vec4(0);
      for (int y = 0; y < size.y; ++y) {
        for (int x = 0; x < size.x; ++x) {
          color += texelFetch(tex, ivec2(x, y), level);
        }
      }
      outColor = color / float(size.x * size.y);
    }
    `;

    function main() {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      const prg = twgl.createProgram(gl, [vs, fs]);
      
      gl.canvas.width = 1;
      gl.canvas.height = 1;
      gl.viewport(0, 0, 1, 1);

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      // so we can pass a non multiple of 4 bytes
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      
      const values = new Uint8Array([10, 255, 13, 70, 56, 45, 89]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, values.length, 1, 0, gl.RED, gl.UNSIGNED_BYTE, values);
      
      gl.useProgram(prg);
      gl.drawArrays(gl.POINTS, 0, 1);
      
      const gpuAverage = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, gpuAverage);
      
      const jsAverage = values.reduce((s, v) => s + v) / values.length;
      
      console.log('gpuAverage:', gpuAverage[0]);
      console.log('jsAverage:', jsAverage);
    }

    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

notes: since the canvas is RGBA8 can only get integer result. Could change to some float format but that would complicate the example which is not about rendering it's about `texelFetch`.

Of course just by changing the data from R8 to RGBA8 we can do 4 arrays as once if we interleave the values

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `#version 300 es
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 1.0;
    }
    `;

    const fs = `#version 300 es
    precision highp float;
    uniform sampler2D tex;
    out vec4 outColor;
    void main() {
      int level = 0;
      ivec2 size = textureSize(tex, level);
      vec4 color = vec4(0);
      for (int y = 0; y < size.y; ++y) {
        for (int x = 0; x < size.x; ++x) {
          color += texelFetch(tex, ivec2(x, y), level);
        }
      }
      outColor = color / float(size.x * size.y);
    }
    `;

    function main() {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      const prg = twgl.createProgram(gl, [vs, fs]);
      
      gl.canvas.width = 1;
      gl.canvas.height = 1;
      gl.viewport(0, 0, 1, 1);

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      // so we can pass a non multiple of 4 bytes
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      
      const values = new Uint8Array([
         10, 100, 200, 1,
         12, 150, 231, 9,
         50, 129, 290, 3,
         45, 141, 300, 2,
         12, 123, 212, 4,
      ]);
      const width = 1;
      const height = values.length / 4;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
      
      gl.useProgram(prg);
      gl.drawArrays(gl.POINTS, 0, 1);
      
      const gpuAverages = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, gpuAverages);
      
      let jsAverages = [0, 0, 0, 0];
      for (let i = 0; i < height; ++i) {
        for (let j = 0; j < 4; ++j) {
          jsAverages[j] += values[i * 4 + j];
        }
      }
      jsAverages = jsAverages.map(v => v / height);
      
      console.log('gpuAverage:', gpuAverages.join(', '));
      console.log('jsAverage:', jsAverages.join(', '));
    }

    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

To do more requires figuring out some way to arrange the data and use an input to the fragment shader to figure out where the data is. For example we again interleave the data, 5 arrays so the data goes 0,1,2,3,4,0,1,2,3,4,0,1,2,3,4.

Let's go back to R8 and do 5 separate arrays. We need to draw 5 pixels. We can tell which pixel is being drawn by looking at `gl_FragCoord`. We can use that to offset which pixels we look at and pass in how many to skip.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `#version 300 es
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 100.0;
    }
    `;

    const fs = `#version 300 es
    precision highp float;
    uniform sampler2D tex;
    uniform int numArrays;
    out vec4 outColor;
    void main() {
      int level = 0;
      int start = int(gl_FragCoord.x);
      ivec2 size = textureSize(tex, level);
      vec4 color = vec4(0);
      for (int y = 0; y < size.y; ++y) {
        for (int x = start; x < size.x; x += numArrays) {
          color += texelFetch(tex, ivec2(x, y), level);
        }
      }
      outColor = color / float(size.x / numArrays * size.y);
    }
    `;

    function main() {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      const prg = twgl.createProgram(gl, [vs, fs]);
      const numArraysLoc = gl.getUniformLocation(prg, "numArrays");
      
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      // so we can pass a non multiple of 4 bytes
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      
      const numArrays = 5;
      const values = new Uint8Array([
         10, 100, 200, 1, 70,
         12, 150, 231, 9, 71,
         50, 129, 290, 3, 90,
         45, 141, 300, 2, 80,
         12, 123, 212, 4, 75,
      ]);
      const width = values.length;
      const height = 1;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, values);
      
      gl.canvas.width = numArrays;
      gl.canvas.height = 1;
      gl.viewport(0, 0, numArrays, 1);

      gl.useProgram(prg);
      gl.uniform1i(numArraysLoc, numArrays);
      gl.drawArrays(gl.POINTS, 0, 1);
      
      const gpuData = new Uint8Array(4 * numArrays);
      gl.readPixels(0, 0, numArrays, 1, gl.RGBA, gl.UNSIGNED_BYTE, gpuData);
      const gpuAverages = [];
      for (let i = 0; i < numArrays; ++i) {
        gpuAverages.push(gpuData[i * 4]); // because we're only using the RED channel
      }
      const jsAverages = (new Array(numArrays)).fill(0);
      const numValues = (width / numArrays) * height;
      for (let i = 0; i < width / numArrays; ++i) {
        for (let j = 0; j < numArrays; ++j) {
          jsAverages[j] += values[i * numArrays + j] / numValues;
        }
      }
      
      console.log('gpuAverage:', gpuAverages.join(', '));
      console.log('jsAverage:', jsAverages.join(', '));
    }

    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->


