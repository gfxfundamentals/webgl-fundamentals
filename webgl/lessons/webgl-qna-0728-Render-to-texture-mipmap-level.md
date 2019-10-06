Title: Render to texture mipmap level
Description:
TOC: qna

# Question:

I am trying to understand the correct approach to render to a specific texture mipmap level.

In the example below, I attempt to render the color cyan to mipmap level 1 of `texture`. If I change the level from `1` to `0` in the `framebufferTexture2D` call, the canvas displays cyan as expected. However I don't understand why only level `0` works here, because non-zero levels are supported in the WebGL 2/OpenGL ES 3 specification.

I've also tried explicitly detaching level 0 (binding to `null`) and various other combinations (i.e. using `texImage2D` instead of `texStorage2D`), but none of the combinations seem to render to the mipmap level.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const
      canvas = document.createElement('canvas'),
      gl = canvas.getContext('webgl2'),
      triangle = new Float32Array([ 0, 0, 2, 0, 0, 2 ]);
      texture = gl.createTexture(),
      framebuffer = gl.createFramebuffer(),
      size = 100,
      vertex = createShader(gl.VERTEX_SHADER, `#version 300 es
        precision mediump float;
        uniform sampler2D sampler;
        layout(location = 0) in vec2 position;
        out vec4 color;
        void main() {
          color = textureLod(sampler, position, 0.5);
          gl_Position = vec4(position * 2. - 1., 0, 1);
        }`
      ),
      fragment = createShader(gl.FRAGMENT_SHADER, `#version 300 es
        precision mediump float;
        in vec4 color;
        out vec4 fragColor;
        void main() {
          fragColor = color;
        }`
      ),
      program = gl.createProgram();

    canvas.width = canvas.height = size;
    document.body.appendChild(canvas);

    gl.viewport(0, 0, size, size);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('program');
    }
    gl.useProgram(program);

    // Create a big triangle
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, triangle, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // Create a texture with mipmap levels 0 (base) and 1
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texStorage2D(gl.TEXTURE_2D, 2, gl.RGB8, 2, 2);

    // Setup framebuffer to render to texture level 1, clear to cyan
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        1 // Switching this to `0` will work fine
    );
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error(status);
    }
    gl.clearColor(0, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Detach framebuffer, clear to red
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Some utility functions to cleanup the above code
    function createShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
      }
      return shader;
    }
<!-- end snippet -->

I expect that I'm doing something wrong in the setup, but I haven't been able to find many examples of this.

# Answer

Don't you want either

    color = textureLod(sampler, position, 0.0); // lod 0

or

    color = textureLod(sampler, position, 1.0); // lod 1

?

The code didn't set filtering in a way that you can actually access the other lods. 

It had them set to `gl.NEAREST` which means only ever use lod 0.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const triangle = new Float32Array([0, -1, 1, -1, 1, 1]);
    const texture = gl.createTexture();
    const framebuffers = [];
      
    canvas.width = canvas.height = 100;
    document.body.appendChild(canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const vertex = createShader(gl.VERTEX_SHADER, `#version 300 es
      precision mediump float;
      uniform sampler2D sampler;
      uniform float lod;
      uniform vec4 offset;
      layout(location = 0) in vec4 position;
      out vec4 color;
      void main() {
        color = textureLod(sampler, vec2(.5), lod);
        gl_Position = position + offset;
      }`
    );

    const fragment = createShader(gl.FRAGMENT_SHADER, `#version 300 es
      precision mediump float;
      in vec4 color;
      out vec4 fragColor;
      void main() {
        fragColor = color;
      }`
    );

    const program = createProgram(vertex, fragment);
    const lodLocation = gl.getUniformLocation(program, "lod");
    const offsetLocation = gl.getUniformLocation(program, "offset");

    // Create a big triangle
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, triangle, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    // Create a texture with mipmap levels 0 (base) and 1
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.texStorage2D(gl.TEXTURE_2D, 2, gl.RGB8, 2, 2);

    // Setup framebuffers for each level
    for (let i = 0; i < 2; ++i) {
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        i);
      let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error(glErrToString(gl, status));
      }
      const r = (i === 0) ? 1 : 0;
      const g = (i === 1) ? 1 : 0;
      gl.clearColor(r, g, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      framebuffers.push(framebuffer);
    };

    // Detach framebuffer, clear to red
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the triangle
    gl.uniform1f(lodLocation, 0);
    gl.uniform4fv(offsetLocation, [0, 0, 0, 0]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.uniform1f(lodLocation, 1.);
    gl.uniform4fv(offsetLocation, [-1, 0, 0, 0]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Some utility functions to cleanup the above code
    function createShader(shaderType, source) {
      const shader = gl.createShader(shaderType);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    function createProgram(vertex, fragment) {
      const program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('program');
      }
      gl.useProgram(program);
      return program;
    }

    function glErrToString(gl, error) {
      for (var key in gl) {
        if (gl[key] === error) {
          return key;
        }
      }
      return "0x" + error.toString(16);
    }

<!-- end snippet -->


