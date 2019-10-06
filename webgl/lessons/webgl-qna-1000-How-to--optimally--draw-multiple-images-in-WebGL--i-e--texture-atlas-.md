Title: How to *optimally* draw multiple images in WebGL (i.e. texture atlas)
Description:
TOC: qna

# Question:

[Here](https://stackoverflow.com/questions/12321781/drawing-multiple-2d-images-in-webgl) lists how to draw multiple images in WebGL but it draws them one at a time which I've learned is suboptimal.

What was recommended is using texture atlassing or perhaps something else. Somehow reducing the draw calls. Can you demonstrate generally how this works, with some code or pseudocode?

(I am trying to create a photo gallery with many vector-like drawings alongside dozens of photos in a grid, then you select a photo and zoom in.)

# Answer

There are 100s of ways. Which way depends on your needs.

The simplest example though it to just take one of the most common examples of how to draw a cube with 6 images one on each face.

https://stackoverflow.com/questions/37116831/how-to-map-different-textures-to-different-faces-of-a-cube-in-webgl

Now adjust the positions of the faces of the cube so they are separated and all facing the same way. Here is the same example from the answer linked above but with the faces move to all face the same direction

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    "use strict";
    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl");
    // compiles shader, links and looks up locations
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    function quadPoints(x, y) {
      return [
        x - .5, y - .5, 0,
        x + .5, y - .5, 0,
        x + .5, y + .5, 0,
        x - .5, y + .5, 0,
      ];
    };

    function uvCoords(x, y, width, height, imageWidth, imageHeight) {
      const left   = x / imageWidth;
      const bottom = y / imageHeight;
      const right  = (x + width ) / imageWidth;
      const top    = (y + height) / imageHeight;
      return [
        left, top,
        right, top,
        right, bottom,
        left, bottom,
      ];
    }

    const textureAtlasDimensions = [512, 256];
    const thumbnailDimensions = [128, 128];

    const arrays = {
      position: [
        ...quadPoints(-3.0, 0),
        ...quadPoints(-1.8, 0),
        ...quadPoints( -.6, 0),
        ...quadPoints(  .6, 0),
        ...quadPoints( 1.8, 0),
        ...quadPoints( 3.0, 0),
      ],
      texcoord: [
        ...uvCoords(  0,   0, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(128,   0, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(256,   0, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(  0, 128, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(128, 128, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(256, 128, ...thumbnailDimensions, ...textureAtlasDimensions),
      ],
      indices:  [
        0, 1, 2, 0, 2, 3, 
        4, 5, 6, 4, 6, 7, 
        8, 9, 10, 8, 10, 11, 
        12, 13, 14, 12, 14, 15, 
        16, 17, 18, 16, 18, 19, 
        20, 21, 22, 20, 22, 23,
      ],
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    const tex = twgl.createTexture(gl, {
      src: "https://webglfundamentals.org/webgl/resources/noodles.jpg",
      crossOrigin: "",
    });

    const uniforms = {
      u_texture: tex,
    };

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 20);
      const eye = [0, 0, 10];
      const target = [0, 0, 0];
      const up = [0, 1, 0];

      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(view, projection);
      const world = m4.rotationZ(time * .1);

      uniforms.u_worldViewProjection = m4.multiply(world, viewProjection);

      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
      twgl.setUniforms(programInfo, uniforms);
      // calls gl.drawArray or gl.drawElements
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0px; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 v_texCoord;

    void main() {
      v_texCoord = texcoord;
      gl_Position = u_worldViewProjection * position;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_texCoord;

    uniform sampler2D u_texture;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
      </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c"></canvas>

<!-- end snippet -->

You've just drawn 6 images with 1 draw call.

You can move the images separately by updating the vertex positions and re-uploading them with `gl.bufferData`

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    "use strict";
    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl");
    // compiles shader, links and looks up locations
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    function quadPoints(x, y) {
      return [
        x - .5, y - .5, 0,
        x + .5, y - .5, 0,
        x + .5, y + .5, 0,
        x - .5, y + .5, 0,
      ];
    };

    function uvCoords(x, y, width, height, imageWidth, imageHeight) {
      const left   = x / imageWidth;
      const bottom = y / imageHeight;
      const right  = (x + width ) / imageWidth;
      const top    = (y + height) / imageHeight;
      return [
        left, top,
        right, top,
        right, bottom,
        left, bottom,
      ];
    }

    const textureAtlasDimensions = [512, 256];
    const thumbnailDimensions = [128, 128];
    const baseQuad = quadPoints(0, 0);

    const position = new Float32Array([
      ...quadPoints(-3.0, 0),
      ...quadPoints(-1.8, 0),
      ...quadPoints( -.6, 0),
      ...quadPoints(  .6, 0),
      ...quadPoints( 1.8, 0),
      ...quadPoints( 3.0, 0),
    ]);

    const arrays = {
      position,
      texcoord: [
        ...uvCoords(  0,   0, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(128,   0, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(256,   0, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(  0, 128, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(128, 128, ...thumbnailDimensions, ...textureAtlasDimensions),
        ...uvCoords(256, 128, ...thumbnailDimensions, ...textureAtlasDimensions),
      ],
      indices:  [
        0, 1, 2, 0, 2, 3, 
        4, 5, 6, 4, 6, 7, 
        8, 9, 10, 8, 10, 11, 
        12, 13, 14, 12, 14, 15, 
        16, 17, 18, 16, 18, 19, 
        20, 21, 22, 20, 22, 23,
      ],
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    const tex = twgl.createTexture(gl, {
      src: "https://webglfundamentals.org/webgl/resources/noodles.jpg",
      crossOrigin: "",
    });

    const uniforms = {
      u_texture: tex,
    };

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 20);
      const eye = [0, 0, 10];
      const target = [0, 0, 0];
      const up = [0, 1, 0];

      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(view, projection);
      const world = m4.identity();

      uniforms.u_worldViewProjection = m4.multiply(world, viewProjection);
      
      // move the vertices of the quad
      const numQuads = 6;
      for (let i = 0; i < numQuads; ++i) {
        const u = i / (numQuads - 1);
        const x = -3 + u * 6;
        const y = Math.sin(time + u * Math.PI * 2) * 2;
        for (let j = 0; j < 4; ++j) {
          const srcOffset = j * 3;
          const dstOffset = i * 12 + j * 3;
          position[dstOffset + 0] = baseQuad[srcOffset + 0] + x;
          position[dstOffset + 1] = baseQuad[srcOffset + 1] + y;
        }
      }
      // upload them to the gpu
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.position.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, position, gl.DYNAMIC_DRAW);

      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
      twgl.setUniforms(programInfo, uniforms);
      // calls gl.drawArray or gl.drawElements
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0px; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 v_texCoord;

    void main() {
      v_texCoord = texcoord;
      gl_Position = u_worldViewProjection * position;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_texCoord;

    uniform sampler2D u_texture;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
      </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c"></canvas>

<!-- end snippet -->

Now add more quads instead of just 6

