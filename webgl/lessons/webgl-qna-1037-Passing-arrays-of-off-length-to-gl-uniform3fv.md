Title: Passing arrays of off-length to gl.uniform3fv
Description:
TOC: qna

# Question:

It seems that when using WebGL `uniform3fv` you MUST pass an array of *length equal to 3* if your shader uniform is `vec3` OR an array having length equal to *multiple of 3* if your shader uniform is an array of `vec3`'s.

Doing this:

    var data = new Float32Array([ 1, 2, 3, 4 ]);
    gl.uniform3fv( uniformLocation, data );

when your uniform is declared as:

    uniform vec3 some_uniform;

will result in `some_uniform` getting `(0,0,0)` value.

I searched the web and SO and MDN and forums and stuff (one of the stuff being WebGL specification) and I can't find a requirement (or mention) for this limitation.

My question is: is this required by WebGL specification (and if yes, can you please point me to it) or is it just some undocumented behaviour you are supposed to know about?

If it is required, we'll change code to support it as requirement, if it is undocumented quirk, we'll change code to support that quirk with an option to disable/remove the support once the quirk is gone.

# Answer

From [the WebGL spec section 5.14.10](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.10)

> If the array passed to any of the vector forms (those ending in v) has an invalid length, an INVALID_VALUE error will be generated. The length is invalid if it is too short for **or is not an integer multiple of the assigned type**.

Did you check your JavaScript console? When I tried it I clearly saw the `INVALID_VALUE` error in the console.

The code below

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext('webgl');
    const vs = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
    `;
    const fs = `
    precision mediump float;
    uniform vec3 color;
    void main() {
      gl_FragColor = vec4(color, 1);
    }
    `;
    const program = twgl.createProgram(gl, [vs, fs]);
    const loc = gl.getUniformLocation(program, 'color');
    gl.useProgram(program);
    gl.uniform3fv(loc, [1, 2, 3, 4]);  // generates INVALID_VALUE

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

prints

[![enter image description here][1]][1]

in the JavaScript console

In other words, your uniform was not set to 0,0,0. Instead your `gl.uniform3fv` function failed to execute since it got an error and so the uniform was left at whatever value it already was. Uniforms default to 0 so that's where the 0s came from


If you want to catch this kind of error during debugging consider using [this helper library](https://www.khronos.org/webgl/wiki/Debugging#Programmatically_Debugging_WebGL_applications). Generally I find just looking at the JavaScript console is enough for me to figure out where the issue though.

  [1]: https://i.stack.imgur.com/tpV1E.png
