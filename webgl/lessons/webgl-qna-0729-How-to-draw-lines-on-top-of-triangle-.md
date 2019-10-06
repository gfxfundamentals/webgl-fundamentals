Title: How to draw lines on top of triangle?
Description:
TOC: qna

# Question:

Is there a way to draw a `gl.LINE_LOOP` always on top of `gl.TRIANGLES` while still using same program and points.



# Answer

Yes but `gl.LINE_LOOP` will always connect the first and last points which is probably not what you want.

In any case the default depth function is `gl.LESS` meaning with depth testing on WebGL will only render pixels if their depth value is less than that pixel's current depth value. So, change it to `gl.LEQUAL` and you should get what you want.

    gl.depthFunc(gl.LEQUAL);

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";
    twgl.setDefaults({attribPrefix: "a_"});
    const v3 = twgl.v3;
    const m4 = twgl.m4;
    const gl = twgl.getWebGLContext(document.getElementById("c"));

    // compiles shaders, links program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData 
    const bufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 16, 8);

    var uniforms = {
      u_lightDir: twgl.v3.normalize([1, 20, -10]),
    };

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.CULL_FACE);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const fov = 30 * Math.PI / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.5;
      const zFar = 10;
      var projection = m4.perspective(fov, aspect, zNear, zFar);
      var eye = [1, 3, -5];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(projection, view);
      var world = m4.rotationY(time);

      uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
      uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);

      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // calls gl.uniform
      twgl.setUniforms(programInfo, uniforms);
      twgl.setUniforms(programInfo, {
        u_ambient: [0, 0, 0],
        u_diffuse: [1, 0, 0],
      });
      
      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      // calls gl.uniform
      twgl.setUniforms(programInfo, {
        u_ambient: [1, 1, 0],
        u_diffuse: [0, 0, 0],
      });

      gl.drawElements(gl.LINE_LOOP, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { display: block; width: 100vw; height: 100vh; }


<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_world;
    uniform mat4 u_worldInverseTranspose;

    attribute vec4 a_position;
    attribute vec3 a_normal;

    varying vec3 v_normal;

    void main() {
      v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
      gl_Position = u_worldViewProjection * a_position;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    varying vec3 v_normal;

    uniform vec3 u_lightDir;
    uniform vec3 u_diffuse;
    uniform vec3 u_ambient;

    void main() {
      vec3 a_normal = normalize(v_normal);
      float light = dot(a_normal, u_lightDir) * .5 + .5;
      gl_FragColor = vec4(u_diffuse * light + u_ambient, 1);
    }
    </script>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>





<!-- end snippet -->




