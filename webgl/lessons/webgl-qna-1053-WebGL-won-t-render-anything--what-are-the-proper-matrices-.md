Title: WebGL won't render anything, what are the proper matrices?
Description:
TOC: qna

# Question:

I'm trying to understand and learn WebGL and computer graphics from button up, that is why I started to work on my own little library for that. I've spent couple of days looking for right answer and I can't make it work.

I have column major matrices and I'm just trying to render basic triangle but for some reason no matter what I do after multiplification by perspective matrix my Z of vertex is always out of bounds.

I have an object set in space at position 0,0,0 with vertex positions of = 

        [
            -0.5, -0.5, 0,
            0.5, -0.5, 0,
            0.5, 0.5, 0
        ]

my camera is set with 60 degree angle fov, aspect of `canvas.width / canvas.height`, near plane is `1/1000` and far plane of `50`. And is positioned on `(0,0,-10)` looking at my object.

On render time I supply to my vertex shader:

Unifrom Matrix4 u_model

    [1 0 0 0
     0 1 0 0
     0 0 1 0
     0 0 0 1]
so basically Identity matrix

Uniform Matrix4 u_view

    [-1  0  0  0
      0  1  0  0
      0  0 -1 -10
      0  0  0  1]

and Uniform Matrix4 u_projection
 

     0.0003282401348280833 0                      -0.3129605393123332  0
     0                     0.0003282401348280833  -0.3129605393123332  0
     0                     0                      -1.0000400008000159 -0.002000040000800016
     0                     0                      -1                   0

My Matrix model is

    [n11, n12, n13, n14
     n21, n22, n23, n24,
     n31, n32, n33, n34,
     n41, n42, n43, n44 ]

my perspective matrix calculation : 

    static perspective(fov, aspect, near, far) {
        const r = fov * aspect;
        const l = -4;
        const t = r;
        const b = l;
        const matrix = new Matrix4();
        matrix.n11 = (2 * near) / (r - l);
        matrix.n12 = 0;
        matrix.n13 = (r+l)/(r-l);
        matrix.n14 = 0;
        matrix.n21 = 0;
        matrix.n22 = (2 * near) / (t - b);
        matrix.n23 = (t+b)/(t-b);
        matrix.n24 = 0;
        matrix.n31 = 0;
        matrix.n32 = 0;
        matrix.n33 = (near + far) / (near - far);
        matrix.n34 = (2 * near * far) / (near - far);
        matrix.n41 = 0;
        matrix.n42 = 0;
        matrix.n43 = -1;
        matrix.n44 = 0;
        return matrix;
    }


my vertex shader

     this.vertexShaderScript =
            '\r\n' +
            'precision highp float;\r\n' +
            'uniform mat4 u_model;\r\n' +
            'uniform mat4 u_view;\r\n' +
            'uniform mat4 u_projection;\r\n' +
            'attribute vec3 a_position;\r\n' +
            'attribute vec4 a_color;\r\n' +
            'varying vec4 v_color;\r\n' +
            'void main(void) {\r\n' +
            '    v_color = a_color;\r\n' +
            '    gl_Position = u_projection * u_view *  u_model * vec4(a_position, 1.0);\r\n' +
            '}\r\n';

And fragment shader

     this.fragmentShaderScript = '\r\n' +
            'precision highp float;\r\n' +
            'varying vec4 v_color;\r\n' +
            'void main(void) {\r\n' +
            '    gl_FragColor = v_color;\r\n' +
            '}\r\n';

I have checked the view matrix, tryied to transpose projection, checked with spector js if I get matrices to shader and none of it worked. I also checked other answers but none works for me.

Which of the matrices is wrong?

rest of the code can be found on my github: [https://github.com/barteq100/webgl][1]


  [1]: https://github.com/barteq100/webgl

# Answer

What are you trying to accomplish?

Your perspective function makes no sense to me. It appears to be based on the [`glFrustum` function from long deprecated OpenGL 2.1](https://docs.microsoft.com/en-us/windows/desktop/opengl/glfrustum)

You'll notice that function takes 6 arguments, left, right, bottom, top, near far. Yours takes only 4 and the numbers you put in seem to be nonsense. Why is `l` which stands for left hardcoded to -4? Why do you think `r` should be `fov * aspect`?

Then you haven't shown the code that sets your matrixes so we have no idea how you're passing it. WebGL (and OpenGL) matrices are expected to be row major. Or to put it another way a translation matrix will be specified like this in JavaScript

    const translationMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 1, 1, 0,
      x, y, z, 1,
    ];

The OpenGL spec calls each row of that matrix a column but by computer language standards they are rows. See https://webglfundamentals.org/webgl/lessons/webgl-matrix-vs-math.html

If you want to learn WebGL perspective matrices [try this article](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html). That article uses far more common perspective math.

In any case here is your perspective function. If I move the camera I can find a cube I'm drawing at the origin with some really strange perspective

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global twgl, m4, requestAnimationFrame, document */

    class Matrix4 { }

    function perspective(fov, aspect, near, far) {
      const r = fov * aspect;
      const l = -4;
      const t = r;
      const b = l;
      const matrix = new Matrix4();
      matrix.n11 = (2 * near) / (r - l);
      matrix.n12 = 0;
      matrix.n13 = (r+l)/(r-l);
      matrix.n14 = 0;
      matrix.n21 = 0;
      matrix.n22 = (2 * near) / (t - b);
      matrix.n23 = (t+b)/(t-b);
      matrix.n24 = 0;
      matrix.n31 = 0;
      matrix.n32 = 0;
      matrix.n33 = (near + far) / (near - far);
      matrix.n34 = (2 * near * far) / (near - far);
      matrix.n41 = 0;
      matrix.n42 = 0;
      matrix.n43 = -1;
      matrix.n44 = 0;
      return matrix;
    }

    function toMat(m) {
      return [
        m.n11, m.n21, m.n31, m.n41,
        m.n12, m.n22, m.n32, m.n42,
        m.n13, m.n23, m.n33, m.n43,
        m.n14, m.n24, m.n34, m.n44,
      ];
    }

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');

    const vs = `
    attribute vec4 position;
    attribute vec3 normal;
    attribute vec2 texcoord;

    uniform mat4 projection;
    uniform mat4 modelView;

    varying vec3 v_normal;
    varying vec2 v_texcoord;

    void main() {
      gl_Position = projection * modelView * position;
      v_normal = mat3(modelView) * normal;
      v_texcoord = texcoord;
    }
    `;

    const fs = `
    precision highp float;

    varying vec3 v_normal;
    varying vec2 v_texcoord;
    varying float v_modelId;

    void main() {
      vec3 lightDirection = normalize(vec3(1, 2, -3));  // arbitrary light direction
      
      float l = dot(lightDirection, normalize(v_normal)) * .5 + .5;
      gl_FragColor = vec4(vec3(0,1,0) * l, 1);
    }
    `;

    // compile shader, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make some vertex data
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    function render(time) {
      time *= 0.001;  // seconds
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);

      const fov = Math.PI * 0.25;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const near = 0.1;
      const far = 100;
      const projection = toMat(perspective(fov, aspect, near, far));
      
      const camera = m4.translation([0, 0, 1]);
      const view = m4.inverse(camera);
      let modelView = m4.rotateY(view, time);

      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, {
        projection,
        modelView,
      });  
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

If I change the perspective function to something more traditional then it I'll get something more normal after moving the camera 

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global twgl, m4, requestAnimationFrame, document */

    class Matrix4 { }

    function perspective(fov, aspect, near, far) {

      const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
      const rangeInv = 1.0 / (near - far);

      const matrix = new Matrix4();
      matrix.n11 = f / aspect;
      matrix.n12 = 0;
      matrix.n13 = 0;
      matrix.n14 = 0;
      matrix.n21 = 0;
      matrix.n22 = f;
      matrix.n23 = 0;
      matrix.n24 = 0;
      matrix.n31 = 0;
      matrix.n32 = 0;
      matrix.n33 = (near + far) * rangeInv;
      matrix.n34 = near * far * rangeInv * 2;
      matrix.n41 = 0;
      matrix.n42 = 0;
      matrix.n43 = -1;
      matrix.n44 = 0;
      return matrix;
    }

    function toMat(m) {
      return [
        m.n11, m.n21, m.n31, m.n41,
        m.n12, m.n22, m.n32, m.n42,
        m.n13, m.n23, m.n33, m.n43,
        m.n14, m.n24, m.n34, m.n44,
      ];
    }

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');

    const vs = `
    attribute vec4 position;
    attribute vec3 normal;
    attribute vec2 texcoord;

    uniform mat4 projection;
    uniform mat4 modelView;

    varying vec3 v_normal;
    varying vec2 v_texcoord;

    void main() {
      gl_Position = projection * modelView * position;
      v_normal = mat3(modelView) * normal;
      v_texcoord = texcoord;
    }
    `;

    const fs = `
    precision highp float;

    varying vec3 v_normal;
    varying vec2 v_texcoord;
    varying float v_modelId;

    void main() {
      vec3 lightDirection = normalize(vec3(1, 2, -3));  // arbitrary light direction
      
      float l = dot(lightDirection, normalize(v_normal)) * .5 + .5;
      gl_FragColor = vec4(vec3(0,1,0) * l, 1);
    }
    `;

    // compile shader, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make some vertex data
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    function render(time) {
      time *= 0.001;  // seconds
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);

      const fov = Math.PI * 0.25;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const near = 0.1;
      const far = 100;
      const projection = toMat(perspective(fov, aspect, near, far));
      
      const camera = m4.translation([0, 0, 3]);
      const view = m4.inverse(camera);
      let modelView = m4.rotateY(view, time);

      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, {
        projection,
        modelView,
      });  
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

If you want to keep the same perspective math (ie, use the matrix from `glFrustum` linked above) then these are the values you need for `l`, `r`, `t`, `b`

```
  const t = near * Math.tan(0.5 * fov);
  const b = -t;
  const r = t * aspect;
  const l = -r;
```

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    /* global twgl, m4, requestAnimationFrame, document */

    class Matrix4 { }

    function perspective(fov, aspect, near, far) {

      const t = near * Math.tan(0.5 * fov);
      const b = -t;
      const r = t * aspect;
      const l = -r;
      
      const matrix = new Matrix4();
      matrix.n11 = (2 * near) / (r - l);
      matrix.n12 = 0;
      matrix.n13 = (r+l)/(r-l);
      matrix.n14 = 0;
      matrix.n21 = 0;
      matrix.n22 = (2 * near) / (t - b);
      matrix.n23 = (t+b)/(t-b);
      matrix.n24 = 0;
      matrix.n31 = 0;
      matrix.n32 = 0;
      matrix.n33 = (near + far) / (near - far);
      matrix.n34 = (2 * near * far) / (near - far);
      matrix.n41 = 0;
      matrix.n42 = 0;
      matrix.n43 = -1;
      matrix.n44 = 0;
      return matrix;
    }

    function toMat(m) {
      return [
        m.n11, m.n21, m.n31, m.n41,
        m.n12, m.n22, m.n32, m.n42,
        m.n13, m.n23, m.n33, m.n43,
        m.n14, m.n24, m.n34, m.n44,
      ];
    }

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');

    const vs = `
    attribute vec4 position;
    attribute vec3 normal;
    attribute vec2 texcoord;

    uniform mat4 projection;
    uniform mat4 modelView;

    varying vec3 v_normal;
    varying vec2 v_texcoord;

    void main() {
      gl_Position = projection * modelView * position;
      v_normal = mat3(modelView) * normal;
      v_texcoord = texcoord;
    }
    `;

    const fs = `
    precision highp float;

    varying vec3 v_normal;
    varying vec2 v_texcoord;
    varying float v_modelId;

    void main() {
      vec3 lightDirection = normalize(vec3(1, 2, -3));  // arbitrary light direction
      
      float l = dot(lightDirection, normalize(v_normal)) * .5 + .5;
      gl_FragColor = vec4(vec3(0,1,0) * l, 1);
    }
    `;

    // compile shader, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make some vertex data
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    function render(time) {
      time *= 0.001;  // seconds
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);

      const fov = Math.PI * 0.25;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const near = 0.1;
      const far = 100;
      const projection = toMat(perspective(fov, aspect, near, far));
      
      const camera = m4.translation([0, 0, 3]);
      const view = m4.inverse(camera);
      let modelView = m4.rotateY(view, time);

      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, {
        projection,
        modelView,
      });  
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


