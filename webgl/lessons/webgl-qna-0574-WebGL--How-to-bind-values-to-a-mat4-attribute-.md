Title: WebGL: How to bind values to a mat4 attribute?
Description:
TOC: qna

# Question:

In some WebGL application, let's assume that we have a GLSL vertex shader which starts like this:

    attribute vec4 foo1;
    attribute vec4 foo2;
    attribute vec4 foo3;
    attribute vec4 foo4;

and some corresponding Javascript code for binding a data structure for those attributes:

    var buf = gl.createBuffer(), loc;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([…]));
    
    loc = gl.getAttribLocation(program, 'foo1');
    gl.enableVertexArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 16, 0);
    
    loc = gl.getAttribLocation(program, 'foo2');
    gl.enableVertexArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 16, 4);
    
    loc = gl.getAttribLocation(program, 'foo3');
    gl.enableVertexArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 16, 8);
    
    loc = gl.getAttribLocation(program, 'foo4');
    gl.enableVertexArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 16, 12);

Now, according to the GL ES 2.0 specs, a vertex shader attribute can be defined as either a `float`, `vec2`, `vec3`, `vec4`, `mat2`, `mat3` or `mat4`.

So if I change the vertex shader code to define just one `mat4` attribute, like so...

    attribute mat4 foo;

... the question is **what is the corresponding JS code to bind some pointers to a `mat4` attribute?**

I have found the question https://stackoverflow.com/questions/27326904/mat3-attribute-in-webgl, but the answer is not explicit enough. Reading the answers and some other documentation, it *seems* that the correct solution is along the lines of:

    loc = gl.getAttribLocation(program, 'foo');
    gl.enableVertexArray(loc);
    gl.vertexAttribPointer(loc  , 4, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(loc+1, 4, gl.FLOAT, false, 16, 4);
    gl.vertexAttribPointer(loc+2, 4, gl.FLOAT, false, 16, 8);
    gl.vertexAttribPointer(loc+3, 4, gl.FLOAT, false, 16, 12);

Am I right in assuming that the **locations of the 4 `vec4` components of a `mat4` are always adjacent and in increasing order?** Is this documented somewhere?

Besides these locations counting towards the `MAX_VERTEX_ATTRIBS` limit (normally 16 in WebGL), is there any other good practice to be aware of?


# Answer

You're correct. [From the spec](https://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf) section 2.10.4

>  When an attribute variable is declared as a `mat2`, its matrix columns are taken from the `(x, y)` components of generic attributes `i` and `i + 1`. When an attribute variable is declared as a `mat3`, its matrix columns are taken from the `(x, y, z)` components of generic attributes `i` through `i + 2`. When an attribute variable is declared as a `mat4`, its matrix columns are taken from the `(x, y, z, w)` components of generic attributes `i` through `i + 3`.

stride and offsets in WebGL are in bytes so I suspect you wanted

    gl.vertexAttribPointer(loc  , 4, gl.FLOAT, false, 64, 0);
    gl.vertexAttribPointer(loc+1, 4, gl.FLOAT, false, 64, 16);
    gl.vertexAttribPointer(loc+2, 4, gl.FLOAT, false, 64, 32);
    gl.vertexAttribPointer(loc+3, 4, gl.FLOAT, false, 64, 48);

Let's check

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute mat4 matrix;
    attribute vec4 color;

    varying vec4 v_color;

    void main() {
      gl_PointSize = 10.0;
      gl_Position = matrix * vec4(0, 0, 0, 1);
      v_color = color;
    }
    `;
    var fs = `
    precision mediump float;

    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }
    `;

    var m4 = twgl.m4;
    var gl = document.querySelector("canvas").getContext("webgl");
    var program = twgl.createProgramFromSources(gl, [vs, fs]);

    var matrixLoc = gl.getAttribLocation(program, "matrix");
    var colorLoc = gl.getAttribLocation(program, "color");

    function r(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    }

    var numPoints = 100;
    var matrices = [];
    var colors = [];
    for (var ii = 0; ii < numPoints; ++ii) {
      matrices.push.apply(matrices, m4.translation([r(-1,1), r(-1,1), 0]));
      colors.push(r(1), r(1), r(1), 1);
    }

    var buffers = twgl.createBuffersFromArrays(gl, {
      matrices: matrices,
      colors: colors,
    });

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.matrices);
    for (var ii = 0; ii < 4; ++ii) {
      gl.enableVertexAttribArray(matrixLoc + ii);
      gl.vertexAttribPointer(matrixLoc + ii, 4, gl.FLOAT, 0, 64, ii * 16);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors);
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, 0, 0, 0);

    gl.drawArrays(gl.POINTS, 0, numPoints);








<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


