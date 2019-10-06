Title: Whats an efficient way to stop these transparency overlaps in webgl?
Description:
TOC: qna

# Question:


I would like to make it so that these blocks are all drawn to one layer than that entire layer is made transparent. Or if there is a way I can use blend functions or alpha blending to do it that would be fine too. Thanks a lot. 


![](https://i.stack.imgur.com/IaNLn.png)

# Answer

What is your definition of efficient? Under what circumstances? What conditions?

Here's a few solutions. It's hard to tell if they fit without more details.

First let's repo the issue

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');
    const vs = `
    attribute vec4 position;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * position;
    }
    `;

    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0, .5, 0, .5);
    }
    `;

    // compile shaders, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // create buffers and upload vertex data
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    render();
    function render() {
      gl.clearColor(0, .4, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      gl.enable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(programInfo.program);

      const halfHeight = 1;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const halfWidth = halfHeight * aspect;
      const projection = m4.ortho(
        -halfWidth, halfWidth, -halfHeight, halfWidth, 0.1, 20);

      const camera = m4.lookAt(
        [5, 2, 5],  // eye
        [0, -.5, 0],  // target
        [0, 1, 0],  // up
      );
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);

      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      for (let x = -1; x <= 1; ++x) {
        let mat = m4.translate(viewProjection, [x, 0, 0]);
        twgl.setUniforms(programInfo, {
          u_matrix: mat,
        });
        // calls drawArrays or drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Note the example above just clears the background to [0, .4, 0, 1] which is dark green. It then draws 3 cubes using [0, .5, 0, .5] which is full green (as in [0, 1, 0, 1]) except premultiplied by 50% alpha. Using premultiplied colors the blending is set to `gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)` Face culling is on.

As for solutions off the top of my head looking at your picture you could

## Draw front to back with z-test on

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');
    const vs = `
    attribute vec4 position;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * position;
    }
    `;

    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0, .5, 0, .5);
    }
    `;

    // compile shaders, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // create buffers and upload vertex data
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    render();
    function render() {
      gl.clearColor(0, .4, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      gl.enable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(programInfo.program);

      const halfHeight = 1;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const halfWidth = halfHeight * aspect;
      const projection = m4.ortho(
        -halfWidth, halfWidth, -halfHeight, halfWidth, 0.1, 20);

      const camera = m4.lookAt(
        [5, 2, 5],  // eye
        [0, -.5, 0],  // target
        [0, 1, 0],  // up
      );
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);
      
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      for (let x = 1; x >= -1; --x) {
        let mat = m4.translate(viewProjection, [x, 0, 0]);
        twgl.setUniforms(programInfo, {
          u_matrix: mat,
        });
        // calls drawArrays or drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Note the only changes to the top version are the addition of

     gl.enable(gl.DEPTH_TEST);

And drawing in reverse order

     for (let x = 1; x >= -1; --x) {

I have no idea how your data is stored. Assuming it's a grid you'd have to write code to iterate over the grid in the correct order from the view of the camera.

## Your example only shows a green background so you could just draw opaque and multiply or mix by a color, the same color as your background.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');
    const vs = `
    attribute vec4 position;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * position;
    }
    `;

    const fs = `
    precision mediump float;
    uniform vec4 u_backgroundColor;
    uniform float u_mixAmount;
    void main() {
      gl_FragColor = mix(vec4(0, 1, 0, 1), u_backgroundColor, u_mixAmount);
    }
    `;

    // compile shaders, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // create buffers and upload vertex data
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    render();
    function render() {
      gl.clearColor(0, .4, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      
      gl.useProgram(programInfo.program);

      const halfHeight = 1;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const halfWidth = halfHeight * aspect;
      const projection = m4.ortho(
        -halfWidth, halfWidth, -halfHeight, halfWidth, 0.1, 20);

      const camera = m4.lookAt(
        [5, 2, 5],  // eye
        [0, -.5, 0],  // target
        [0, 1, 0],  // up
      );
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);
      
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      for (let x = 1; x >= -1; --x) {
        let mat = m4.translate(viewProjection, [x, 0, 0]);
        twgl.setUniforms(programInfo, {
          u_matrix: mat,
          u_backgroundColor: [0, 0.4, 0, 1],
          u_mixAmount: 0.5,
        });
        // calls drawArrays or drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

The solution above changes the fragment shader to

    uniform vec4 u_backgroundColor;
    uniform float u_mixAmount;
    void main() {
      gl_FragColor = mix(vec4(0, 1, 0, 1), u_backgroundColor, u_mixAmount);
    }

Where `vec4(0, 1, 0, 1)` is the cube's green color. We then set `u_backgroundColor` to match the background color of 0, .4, 0, 1 and set `u_mixAmount` to .5 (50%)

This solution might sound dumb but it's common to want to fade to a background color which is basically how fog works. You don't actually make things more transparent in the distance you just draw with the fog color.

## draw all the tiles without transparency into another texture, then draw that texture with transparency 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl', {alpha: false});
    const vs = `
    attribute vec4 position;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * position;
    }
    `;

    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0, 1, 0, 1);
    }
    `;

    const mixVs = `
    attribute vec4 position;
    attribute vec2 texcoord;
    uniform mat4 u_matrix;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = u_matrix * position;
      v_texcoord = texcoord;
    }
    `;

    const mixFs = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_tex;
    uniform float u_alpha;
    void main() {
      gl_FragColor = texture2D(u_tex, v_texcoord) * u_alpha;
    }
    `;

    // compile shaders, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const mixProgramInfo = twgl.createProgramInfo(gl, [mixVs, mixFs]);

    // create buffers and upload vertex data
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
    const xyQuadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    // create framebuffer with RGBA/UNSIGNED_BYTE texture
    // and depth buffer renderbuffer that matches the size 
    // of the canvas
    const fbi = twgl.createFramebufferInfo(gl);

    render();

    function render() {
      renderTiles();
      renderScene();
    }

    function renderScene() {
      // bind canvas and set viewport
      twgl.bindFramebufferInfo(gl, null);
      gl.clearColor(0, 0.4, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(mixProgramInfo.program);
      twgl.setBuffersAndAttributes(gl, mixProgramInfo, xyQuadBufferInfo);
      twgl.setUniforms(mixProgramInfo, {
        u_matrix: m4.identity(),
        u_tex: fbi.attachments[0],  // the texture
        u_alpha: .5,
      });
      // calls drawArrays or drawElements
      twgl.drawBufferInfo(gl, xyQuadBufferInfo);
    }

    function renderTiles() {
      // bind framebuffer and set viewport
      twgl.bindFramebufferInfo(gl, fbi);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      
      gl.useProgram(programInfo.program);

      const halfHeight = 1;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const halfWidth = halfHeight * aspect;
      const projection = m4.ortho(
        -halfWidth, halfWidth, -halfHeight, halfWidth, 0.1, 20);

      const camera = m4.lookAt(
        [5, 2, 5],  // eye
        [0, -.5, 0],  // target
        [0, 1, 0],  // up
      );
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);
      
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      for (let x = 1; x >= -1; --x) {
        let mat = m4.translate(viewProjection, [x, 0, 0]);
        twgl.setUniforms(programInfo, {
          u_matrix: mat,
          u_backgroundColor: [0, 0.4, 0, 1],
          u_mixAmount: 0.5,
        });
        // calls drawArrays or drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
      }
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

The change above creates an RGBA texture and a depth renderbuffer the same size as the canvas and attaches them to a framebuffer. It then renders the tiles into that texture opaquely. Then it renders the texture over the canvas with 50% alpha. Note that the canvas itself is set to `{alpha: false}` so that the canvas doesn't blend with the elements behind it.

## Generate new geometry that doesn't have the hidden surfaces

The problem is your drawing 3 cubes and the edges between them. A Minecraft like solution would probably generate new geometry that didn't have the inner edges. It would be pretty easy to walk a grid of tiles and decide whether or not to add that edge of the cube based on if there is a neighbor or not.

In Minecraft they only have to generate new geometry when blocks are added or removed and with some creative coding that might involve only modifying a few vertices rather than regenerating the entire mesh. They also probably generate in a gird like very 64x64x64 area.


