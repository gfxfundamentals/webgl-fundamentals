Title: Why is my webgl shader not changing pixel fragments correctly?
Description:
TOC: qna

# Question:

I'm trying to get position of a fragment and change the color at positions, but when I try to do it, I get a weird effect where they don't want to be changed completely.
[![enter image description here][1]][1]

Notice how there is a cyan color, but that part should be transparent. It seems like there's some weird rounding happening, and I'm not sure how to fix it. What is happening here?

   void main() {
      vec4 c0 = vec4(0,1,0,1);
   c0.a *= step(132.0,gl_FragCoord.x);
   gl_FragColor = c0;
            }


  [1]: http://i.stack.imgur.com/id9Z5.png

# Answer

You need to show more code. Did you enable blending? What blending functions and blending equations did you pick. Does your canvas have alpha? What color is the background of the canvas or whatever it's over?

Here's a small program using your example

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    "use strict";
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    var uniforms = { };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);


<!-- language: lang-css -->

    html, body {
      background: red;
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script id="vs" type="notjs">
    attribute vec4 position;

    void main() {
      gl_Position = position;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;
    void main() {
      vec4 c0 = vec4(0,1,0,1);
      c0.a *= step(132.0,gl_FragCoord.x);
      gl_FragColor = c0;
    }
    </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>

<!-- end snippet -->

WebGL composites the canvas with HTML. In this case it draws the canvas using *premultiplied alpha* over the a `red` page

Your shader is outputting `0,1,0,0` when `gl_FragCoord.x` is less than 132 **which is an invalid color**.

I'm sure that sounds like it makes no sense but it's **invalid** because the browser expects premultiplied colors.  Since alpha is 0, that means R, G, and B can't be anything other than zero since anything * 0 = 0. That's another way of saying that what the browser displays in this case is undefined because it's an invalid color The result can be different in each browser.

A few options

1.  Premultiply the alpha

    Put this at the end of your shader

        gl_FragColor.rgb *= gl.FragColor.a;

2.  Tell WebGL you're using un-premultiplied alpha

        gl = someCanvas.getContext("webgl", { premultipliedAlpha: false });

    In that case 0,1,0,0 is a valid color

3.  If you don't need alpha turn it off

        gl = someCanvas.getContext("webgl", { alpha: false });


Another idea is if your canvas is not the same size as it's being displayed then the browser will draw the canvas filtered. Those filtered pixels will be neither 0,1,0,0 nor 0,1,0,1 but instead a bilinear interpolation between the two. 

As an example let's make a canvas that only has 10 pixels across but display 300 pixels across. We'll change your change to 3 instead of 132.


<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    "use strict";
    var gl = twgl.getWebGLContext(document.getElementById("c"));
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    var uniforms = {};

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);


<!-- language: lang-css -->

    html, body {
      background: red;
    }

<!-- language: lang-html -->

    <canvas id="c" width="10" style="width: 300px; height: 150px;"></canvas>
    <script id="vs" type="notjs">
    attribute vec4 position;

    void main() {
      gl_Position = position;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;
    void main() {
      vec4 c0 = vec4(0,1,0,1);
      c0.a *= step(3.0,gl_FragCoord.x);
      gl_FragColor = c0;
    }
    </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>

<!-- end snippet -->


