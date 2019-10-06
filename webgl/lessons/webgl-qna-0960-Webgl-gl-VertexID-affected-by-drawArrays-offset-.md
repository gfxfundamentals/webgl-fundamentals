Title: Webgl gl_VertexID affected by drawArrays offset?
Description:
TOC: qna

# Question:

When drawArrays is called with an offset, (the "first" argument being non zero), does the first gl_VertexID still start at 0, or does it start at the offset value?

# Answer

#update 

This appears to be a bug in ANGLE on Windows. Filed a bug

https://github.com/KhronosGroup/WebGL/issues/2770

---

Let's try it

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    [...document.querySelectorAll('canvas')].forEach((canvas, ndx) => {
      const vs = `#version 300 es
      void main() {
        gl_Position = vec4(float(gl_VertexID) / 10., 0, 0, 1);
        gl_PointSize = 10.0;
      }`;
      const fs = `#version 300 es
      precision mediump float;
      out vec4 outColor;
      void main() {
        outColor = vec4(1, 0, 0, 1);
      }`;
      const gl = canvas.getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      const prg = twgl.createProgram(gl, [vs, fs]);
      gl.useProgram(prg);
      gl.drawArrays(gl.POINTS, ndx * 5, 5);
    });

<!-- language: lang-css -->

    canvas {border: 1px solid black;}

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>
    <canvas></canvas>

<!-- end snippet -->

Looks like the answer is it starts at the offset value.
