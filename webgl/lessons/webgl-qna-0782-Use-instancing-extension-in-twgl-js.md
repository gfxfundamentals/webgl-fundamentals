Title: Use instancing extension in twgl.js
Description:
TOC: qna

# Question:

I'm newbie in twgl.js. I want to know how to use extensions, especially instancing 
does it makes a simple way for us or I must use pure webgl inside it?


# Answer

Instancing was added in v3.6.0.

To use instancing in twgl call set a `divisor` on your `FullArraySpec`s or `AttribInfo`s   If you created the WebGL context yourself call `twgl.addExtensionsOnContext`

It's suggested you use vertex array objects as twgl doesn't automatically reset the divisor for attributes where a divisor was previously set.

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    uniform mat4 u_viewProjection;

    attribute vec4 instanceColor;
    attribute mat4 instanceWorld;
    attribute vec4 position;
    attribute vec3 normal;

    varying vec4 v_position;
    varying vec3 v_normal;
    varying vec4 v_color;

    void main() {
      gl_Position = u_viewProjection * instanceWorld * position;
      v_color = instanceColor;
      v_normal = (instanceWorld * vec4(normal, 0)).xyz;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec3 v_normal;
    varying vec4 v_color;

    uniform vec3 u_lightDir;

    void main() {
      vec3 a_normal = normalize(v_normal);
      float light = dot(u_lightDir, a_normal) * .5 + .5;
      gl_FragColor = vec4(v_color.rgb * light, v_color.a);
    }
    `;


    "use strict";
    function main() {
      const m4 = twgl.m4;
      const v3 = twgl.v3;
      const gl = document.querySelector("canvas").getContext("webgl");
      twgl.addExtensionsToContext(gl);
      if (!gl.drawArraysInstanced || !gl.createVertexArray) {
        alert("need drawArraysInstanced and createVertexArray"); // eslint-disable-line
        return;
      }
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

      function rand(min, max) {
        if (max === undefined) {
          max = min;
          min = 0;
        }
        return min + Math.random() * (max - min);
      }

      const numInstances = 100000;
      const instanceWorlds = new Float32Array(numInstances * 16);
      const instanceColors = [];
      const r = 100;
      for (let i = 0; i < numInstances; ++i) {
        const mat = new Float32Array(instanceWorlds.buffer, i * 16 * 4, 16);
        m4.translation([rand(-r, r), rand(-r, r), rand(-r, r)], mat);
        m4.rotateZ(mat, rand(0, Math.PI * 2), mat);
        m4.rotateX(mat, rand(0, Math.PI * 2), mat);
        instanceColors.push(rand(1), rand(1), rand(1));
      }
      const arrays = twgl.primitives.createCubeVertices();
      Object.assign(arrays, {
        instanceWorld: {
          numComponents: 16,
          data: instanceWorlds,
          divisor: 1,
        },
        instanceColor: {
          numComponents: 3,
          data: instanceColors,
          divisor: 1,
        },
      });
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
      const vertexArrayInfo = twgl.createVertexArrayInfo(gl, programInfo, bufferInfo);

      const uniforms = {
        u_lightDir: v3.normalize([1, 8, -30]),
      };

      function render(time) {
        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fov = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.5;
        const zFar = 500;
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const radius = 25;
        const speed = time * .1;
        const eye = [
          Math.sin(speed) * radius, 
          Math.sin(speed * .7) * 10, 
          Math.cos(speed) * radius,
        ];
        const target = [0, 0, 0];
        const up = [0, 1, 0];

        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
        const world = m4.rotationY(time);

        uniforms.u_viewProjection = viewProjection;

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, vertexArrayInfo);
        twgl.setUniforms(programInfo, uniforms);
        gl.drawElementsInstanced(gl.TRIANGLES, vertexArrayInfo.numElements, gl.UNSIGNED_SHORT, 0, numInstances);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


