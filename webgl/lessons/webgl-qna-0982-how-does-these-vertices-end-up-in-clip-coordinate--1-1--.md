Title: how does these vertices end up in clip coordinate(-1,1)?
Description:
TOC: qna

# Question:

Hi guys I been learning webGl these days and reading this textbook on webGl2.

Here is an example out of this book.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    // A set of utility functions for /common operations across our application
    const utils = {

      // Find and return a DOM element given an ID
      getCanvas(id) {
        const canvas = document.getElementById(id);

        if (!canvas) {
          console.error(`There is no canvas with id ${id} on this page.`);
          return null;
        }

        return canvas;
      },

      // Given a canvas element, return the WebGL2 context
      getGLContext(canvas) {
        return canvas.getContext('webgl2') || console.error('WebGL2 is not available in your browser.');
      },

      // Given a canvas element, expand it to the size of the window
      // and ensure that it automatically resizes as the window changes
      autoResizeCanvas(canvas) {
        const expandFullScreen = () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        };
        expandFullScreen();
        // Resize screen when the browser has triggered the resize event
        window.addEventListener('resize', expandFullScreen);
      },

      // Given a WebGL context and an id for a shader script,
      // return a compiled shader
      getShader(gl, id) {
        const script = document.getElementById(id);
        if (!script) {
          return null;
        }

        const shaderString = script.text.trim();

        let shader;
        if (script.type === 'x-shader/x-vertex') {
          shader = gl.createShader(gl.VERTEX_SHADER);
        } else if (script.type === 'x-shader/x-fragment') {
          shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else {
          return null;
        }

        gl.shaderSource(shader, shaderString);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
          return null;
        }

        return shader;
      },

      // Normalize colors from 0-255 to 0-1
      normalizeColor(color) {
        return color.map(c => c / 255);
      },

      // De-normalize colors from 0-1 to 0-255
      denormalizeColor(color) {
        return color.map(c => c * 255);
      },

      // Returns computed normals for provided vertices.
      // Note: Indices have to be completely defined--NO TRIANGLE_STRIP only TRIANGLES.
      calculateNormals(vs, ind) {
        const
          x = 0,
          y = 1,
          z = 2,
          ns = [];

        // For each vertex, initialize normal x, normal y, normal z
        for (let i = 0; i < vs.length; i += 3) {
          ns[i + x] = 0.0;
          ns[i + y] = 0.0;
          ns[i + z] = 0.0;
        }

        // We work on triads of vertices to calculate
        for (let i = 0; i < ind.length; i += 3) {
          // Normals so i = i+3 (i = indices index)
          const v1 = [],
            v2 = [],
            normal = [];

          // p2 - p1
          v1[x] = vs[3 * ind[i + 2] + x] - vs[3 * ind[i + 1] + x];
          v1[y] = vs[3 * ind[i + 2] + y] - vs[3 * ind[i + 1] + y];
          v1[z] = vs[3 * ind[i + 2] + z] - vs[3 * ind[i + 1] + z];

          // p0 - p1
          v2[x] = vs[3 * ind[i] + x] - vs[3 * ind[i + 1] + x];
          v2[y] = vs[3 * ind[i] + y] - vs[3 * ind[i + 1] + y];
          v2[z] = vs[3 * ind[i] + z] - vs[3 * ind[i + 1] + z];

          // Cross product by Sarrus Rule
          normal[x] = v1[y] * v2[z] - v1[z] * v2[y];
          normal[y] = v1[z] * v2[x] - v1[x] * v2[z];
          normal[z] = v1[x] * v2[y] - v1[y] * v2[x];

          // Update the normals of that triangle: sum of vectors
          for (let j = 0; j < 3; j++) {
            ns[3 * ind[i + j] + x] = ns[3 * ind[i + j] + x] + normal[x];
            ns[3 * ind[i + j] + y] = ns[3 * ind[i + j] + y] + normal[y];
            ns[3 * ind[i + j] + z] = ns[3 * ind[i + j] + z] + normal[z];
          }
        }

        // Normalize the result.
        // The increment here is because each vertex occurs.
        for (let i = 0; i < vs.length; i += 3) {
          // With an offset of 3 in the array (due to x, y, z contiguous values)
          const nn = [];
          nn[x] = ns[i + x];
          nn[y] = ns[i + y];
          nn[z] = ns[i + z];

          let len = Math.sqrt((nn[x] * nn[x]) + (nn[y] * nn[y]) + (nn[z] * nn[z]));
          if (len === 0) len = 1.0;

          nn[x] = nn[x] / len;
          nn[y] = nn[y] / len;
          nn[z] = nn[z] / len;

          ns[i + x] = nn[x];
          ns[i + y] = nn[y];
          ns[i + z] = nn[z];
        }

        return ns;
      },

      // A simpler API on top of the dat.GUI API, specifically
      // designed for this book for a simpler codebase
      configureControls(settings, options = {
        width: 300
      }) {
        // Check if a gui instance is passed in or create one by default
        const gui = options.gui || new dat.GUI(options);
        const state = {};

        const isAction = v => typeof v === 'function';

        const isFolder = v =>
          !isAction(v) &&
          typeof v === 'object' &&
          (v.value === null || v.value === undefined);

        const isColor = v =>
          (typeof v === 'string' && ~v.indexOf('#')) ||
          (Array.isArray(v) && v.length >= 3);

        Object.keys(settings).forEach(key => {
          const settingValue = settings[key];

          if (isAction(settingValue)) {
            state[key] = settingValue;
            return gui.add(state, key);
          }
          if (isFolder(settingValue)) {
            // If it's a folder, recursively call with folder as root settings element
            return utils.configureControls(settingValue, {
              gui: gui.addFolder(key)
            });
          }

          const {
            value,
            min,
            max,
            step,
            options,
            onChange = () => null,
          } = settingValue;

          // set state
          state[key] = value;

          let controller;

          // There are many other values we can set on top of the dat.GUI
          // API, but we'll only need a few for our purposes
          if (options) {
            controller = gui.add(state, key, options);
          } else if (isColor(value)) {
            controller = gui.addColor(state, key)
          } else {
            controller = gui.add(state, key, min, max, step)
          }

          controller.onChange(v => onChange(v, state))
        });
      },

      // Calculate tangets for a given set of vertices
      calculateTangents(vs, tc, ind) {
        const tangents = [];

        for (let i = 0; i < vs.length / 3; i++) {
          tangents[i] = [0, 0, 0];
        }

        let
          a = [0, 0, 0],
          b = [0, 0, 0],
          triTangent = [0, 0, 0];

        for (let i = 0; i < ind.length; i += 3) {
          const i0 = ind[i];
          const i1 = ind[i + 1];
          const i2 = ind[i + 2];

          const pos0 = [vs[i0 * 3], vs[i0 * 3 + 1], vs[i0 * 3 + 2]];
          const pos1 = [vs[i1 * 3], vs[i1 * 3 + 1], vs[i1 * 3 + 2]];
          const pos2 = [vs[i2 * 3], vs[i2 * 3 + 1], vs[i2 * 3 + 2]];

          const tex0 = [tc[i0 * 2], tc[i0 * 2 + 1]];
          const tex1 = [tc[i1 * 2], tc[i1 * 2 + 1]];
          const tex2 = [tc[i2 * 2], tc[i2 * 2 + 1]];

          vec3.subtract(a, pos1, pos0);
          vec3.subtract(b, pos2, pos0);

          const c2c1b = tex1[1] - tex0[1];
          const c3c1b = tex2[0] - tex0[1];

          triTangent = [c3c1b * a[0] - c2c1b * b[0], c3c1b * a[1] - c2c1b * b[1], c3c1b * a[2] - c2c1b * b[2]];

          vec3.add(triTangent, tangents[i0], triTangent);
          vec3.add(triTangent, tangents[i1], triTangent);
          vec3.add(triTangent, tangents[i2], triTangent);
        }

        // Normalize tangents
        const ts = [];
        tangents.forEach(tan => {
          vec3.normalize(tan, tan);
          ts.push(tan[0]);
          ts.push(tan[1]);
          ts.push(tan[2]);
        });

        return ts;
      }

    };


    'use strict';

    let
      gl,
      program,
      vao,
      indices,
      indicesBuffer,
      modelViewMatrix = mat4.create(),
      projectionMatrix = mat4.create(),
      normalMatrix = mat4.create();

    function initProgram() {
      // Configure `canvas`
      const canvas = utils.getCanvas('webgl-canvas');
      utils.autoResizeCanvas(canvas);

      // Configure `gl`
      gl = utils.getGLContext(canvas);
      gl.clearColor(0.9, 0.9, 0.9, 1);
      gl.clearDepth(100);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      // Shader source
      const vertexShader = utils.getShader(gl, 'vertex-shader');
      const fragmentShader = utils.getShader(gl, 'fragment-shader');

      // Configure `program`
      program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Could not initialize shaders');
      }

      gl.useProgram(program);

      // Set locations onto `program` instance
      program.aVertexPosition = gl.getAttribLocation(program, 'aVertexPosition');
      program.aVertexNormal = gl.getAttribLocation(program, 'aVertexNormal');
      program.uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
      program.uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
      program.uNormalMatrix = gl.getUniformLocation(program, 'uNormalMatrix');
      program.uLightDirection = gl.getUniformLocation(program, 'uLightDirection');
      program.uLightAmbient = gl.getUniformLocation(program, 'uLightAmbient');
      program.uLightDiffuse = gl.getUniformLocation(program, 'uLightDiffuse');
      program.uMaterialDiffuse = gl.getUniformLocation(program, 'uMaterialDiffuse');
    }

    // Configure lights
    function initLights() {
      gl.uniform3fv(program.uLightDirection, [0, 0, -1]);
      gl.uniform4fv(program.uLightAmbient, [0.01, 0.01, 0.01, 1]);
      gl.uniform4fv(program.uLightDiffuse, [0.5, 0.5, 0.5, 1]);
      gl.uniform4f(program.uMaterialDiffuse, 0.1, 0.5, 0.8, 1);
    }

    /**
     * This function generates the example data and create the buffers
     *
     *           4          5             6         7
     *           +----------+-------------+---------+
     *           |          |             |         |
     *           |          |             |         |
     *           |          |             |         |
     *           |          |             |         |
     *           |          |             |         |
     *           +----------+-------------+---------+
     *           0          1             2         3
     *
     */
    function initBuffers() {
      const vertices = [-20, -8, 20, // 0
        -10, -8, 0, // 1
        10, -8, 0, // 2
        20, -8, 20, // 3
        -20, 8, 20, // 4
        -10, 8, 0, // 5
        10, 8, 0, // 6
        20, 8, 20 // 7
      ];

      indices = [
        0, 5, 4,
        1, 5, 0,
        1, 6, 5,
        2, 6, 1,
        2, 7, 6,
        3, 7, 2
      ];

      // Create VAO
      vao = gl.createVertexArray();

      // Bind Vao
      gl.bindVertexArray(vao);

      const normals = utils.calculateNormals(vertices, indices);

      const verticesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      //console.log('vertices', vertices);
      // Configure instructions
      gl.enableVertexAttribArray(program.aVertexPosition);
      gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

      const normalsBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
      // Configure instructions
      gl.enableVertexAttribArray(program.aVertexNormal);
      gl.vertexAttribPointer(program.aVertexNormal, 3, gl.FLOAT, false, 0, 0);

      indicesBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

      // Clean
      gl.bindVertexArray(null);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    function draw() {
      const {
        width,
        height
      } = gl.canvas;

      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      mat4.perspective(projectionMatrix, 45, width / height, 0.1, 10000);
      mat4.identity(modelViewMatrix);
      mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -40]);

      mat4.copy(normalMatrix, modelViewMatrix);
      mat4.invert(normalMatrix, normalMatrix);
      mat4.transpose(normalMatrix, normalMatrix);

      gl.uniformMatrix4fv(program.uModelViewMatrix, false, modelViewMatrix);
      gl.uniformMatrix4fv(program.uProjectionMatrix, false, projectionMatrix);
      gl.uniformMatrix4fv(program.uNormalMatrix, false, normalMatrix);

      // We will start using the `try/catch` to capture any errors from our `draw` calls
      try {
        // Bind
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);

        // Draw
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        // Clean
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      }
      // We catch the `error` and simply output to the screen for testing/debugging purposes
      catch (error) {
        console.error(error);
      }
    }

    function render() {
      requestAnimationFrame(render);
      draw();
    }

    function init() {
      initProgram();
      initBuffers();
      initLights();
      render();
    }

    init();

<!-- language: lang-html -->

        <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.4.0/gl-matrix.js"></script>

      <!-- modules -->

      <!-- vertex Shader -->
      <script id="vertex-shader" type="x-shader/x-vertex">
      #version 300 es
        precision mediump float;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uNormalMatrix;
        uniform vec3 uLightDirection;
        uniform vec4 uLightAmbient;
        uniform vec4 uLightDiffuse;
        uniform vec4 uMaterialDiffuse;

        in vec3 aVertexPosition;
        in vec3 aVertexNormal;

        out vec4 vVertexColor;

        void main(void) {
          vec3 N = vec3(uNormalMatrix * vec4(aVertexNormal, 1.0));
          vec3 L = normalize(uLightDirection);
          float lambertTerm = dot(N, -L);

          // Ambient
          vec4 Ia = uLightAmbient;
          // Diffuse
          vec4 Id = uMaterialDiffuse * uLightDiffuse * lambertTerm;

          // Set varying to be used inside of fragment shader
          vVertexColor = vec4(vec3(Ia + Id), 1.0);
          gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
        }
      </script>

      <!-- fragment Shader -->
      <script id="fragment-shader" type="x-shader/x-fragment">
        #version 300 es
        precision mediump float;

        in vec4 vVertexColor;

        out vec4 fragColor;

        void main(void)  {
          fragColor = vVertexColor;
        }
      </script>
      <canvas id="webgl-canvas"></canvas>

<!-- end snippet -->

here the vertices are defined as 

    const vertices = [
            -20, -8, 20, // 0
            -10, -8, 0,  // 1
            10, -8, 0,   // 2
            20, -8, 20,  // 3
            -20, 8, 20,  // 4
            -10, 8, 0,   // 5
            10, 8, 0,    // 6
            20, 8, 20    // 7
          ];

As I've learned that webGl use `clipspace coordinates`, which goes from -1 to +1. However here these vertices are out of this range. 

Could someone please point me to the code where it transforms these vertices to `clipspace coordinates`? I've been looking at the code for a while but cannot seem to find it myself.

# Answer

Please consider reading these lessons on WebGL. [Here are some that explain clipspace](https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html) and here is one that explains [how to use matrices to convert from some space to clipspace using matrix math](https://webgl2fundamentals.org/webgl/lessons/webgl-2d-matrices.html) and here is one that explains [how convert from 3D space to clipspace with matrix math](https://webgl2fundamentals.org/webgl/lessons/webgl-3d-orthographic.html) and one that explains [how to get perspective with matrix math](https://webgl2fundamentals.org/webgl/lessons/webgl-3d-perspective.html) and this one that explains [how cameras work with a view matrix](https://webgl2fundamentals.org/webgl/lessons/webgl-3d-camera.html)

In answer to your question this line in the vertex shader

      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);

converts from those vertices into clip space by choosing the correct matrices to assign `uProjectionMatrix` and `uModelViewMatrix`. `uModelViewMatrix` positions, scales, and orients the model in view space. `uProjectionMatrix` then converts from view space to clip space with a perspective projection.
