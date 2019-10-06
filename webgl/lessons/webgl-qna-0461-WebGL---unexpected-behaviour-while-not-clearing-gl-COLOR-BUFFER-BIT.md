Title: WebGL - unexpected behaviour while not clearing gl.COLOR_BUFFER_BIT
Description:
TOC: qna

# Question:

I was trying to implement a sort of motionblur effect in my page and tought to simply specify a blend function for the main framebuffer

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
 gl.enable(gl.BLEND);

and not to clear the gl.COLOR_BUFFER_BIT in my draw routine

    //gl.clearColor(0.0, 0.0, 0.0, 1.0);
 gl.clear(/*gl.COLOR_BUFFER_BIT |*/ gl.DEPTH_BUFFER_BIT);

I expected to see the screen getting filled with old color values that would have never cleaned up but the actual result is the same as if I cleared the color_buffer_bit to white


Here's the link to the test page with all the code in it, it's very simple since it just plot a function on screen with colored particles

http://deepdown.altervista.org/WebGl/test/sample.html

is the color buffer cleared anyway if I don't specify so?
what need to be done in order to keep the rendered colors in each buffer without having them overwritten?

# Answer

You might find [this answer useful](https://stackoverflow.com/a/33331594/128511).

The short version is, by default WebGL clears the drawingBuffer.

As for alpha issues [there's this answer](https://stackoverflow.com/a/35376364/128511).

The specification is totally clear about all of this. It's just that it's a specification and is extremely detailed and hard to follow as it's over 300 pages long since it's not only the WebGL spec but the WebGL spec says it's based on the OpenGL ES 2.0 spec and the GLSL ES 1.0 spec.

Why have an alpha buffer? Because it's HTML and all other elements have alpha. You can set text or background colors to `rgba(255,0,0,0.5)`. You can display .PNG files with alpha transparency, and the 2D canvas has alpha and transparency so so does WebGL as the default. 

Setting alpha to false is a concession to non-HTML based apps (ie, ports).

So, the down side is not being able to have transparency with the rest of the page. [Not the best sample but here is one of the first examples of this](https://www.khronos.org/registry/webgl/sdk/demos/google/shiny-teapot/index.html). Without alpha you couldn't do that.

As for how to blend, blending with the webpage is by default using premulitplied alpha.

Otherwise if you want things to stack up you need probably need to blend with additive blending

     gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

Example:

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    "use strict";
    var m4 = twgl.m4;
    var gl = twgl.getWebGLContext(document.getElementById("c"), { preserveDrawingBuffer: true } );
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function render(time) {
      
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      
      var matrix = m4.identity();
      m4.translate(matrix, [rand(-1, 1), rand(-1, 1), 0], matrix);
      m4.scale(matrix, [rand(0.1, 0.2), rand(0.1, 0.2), 1], matrix);
      
      var color = [Math.random(), Math.random(), Math.random(), 0.1];
      var preMultipliedColor = [color[0] * color[3], color[1] * color[3], color[2] * color[3], color[3]];
      
      var uniforms = {
        matrix: matrix,
        color: preMultipliedColor,
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    .msg {
      display: flex;
      justify-content: center;
      align-content: center;
      align-items: center;
      width: 300px;
      height: 150px;
    }
    .msg>div {
      width: 200px;
    }
    canvas {
      position: absolute;
      left: 5px;
      top: 5px;
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
      <script id="vs" type="notjs">
    attribute vec4 position;
    uniform mat4 matrix;

    void main() {
      gl_Position = matrix * position;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    uniform vec4 color;

    void main() {
      gl_FragColor = color;
    }
      </script>
    <div class="msg"><div>lets put some text under the canvas so we can see if things are blending and
      being composited </div></div>
    <canvas id="c"></canvas>

<!-- end snippet -->


