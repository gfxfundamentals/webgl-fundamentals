Title: How to draw a single pixel using `gl.POINTS` on webgl?
Description:
TOC: qna

# Question:

I'm trying to draw a single pixel using WebGL. I'm using `gl_PointSize = 1.0`, and `gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0)`. I expected single black pixels. Yet, this is how my points are rendered:

[![enter image description here][1]][1]

That is, what I get is gray dots covering an area of about 3x3. How do I get actually single pixels?

  [1]: http://i.stack.imgur.com/2ozE0.png


# Answer

First off does your canvas's size match its display size 1x1 pixels? If not you'll get stretched pixels. [Canvases have 2 sizes](http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html). The size of their drawingBuffer and the size they're displayed. CSS sets the size they're displayed. Their width and height set the size of the drawingBuffer.

Second pixels in GL are addressed by their edges. In other words let's say you have 3x1 pixel canvas. There's the 3 pixels

    -1,1                              1,1
      +----------+----------+----------+
      |          |          |          |
      |          |          |          |
      |          |          |          |
      |          |          |          |
      +----------+----------+----------+
    -1,-1                             1,-1

To draw the first pixel you need to give its center point. In the above diagram the first pixel's center point is

          -2/3,0


Let's try it. The code below draws to a 3x1 pixel texture then draws that texture to a 300x100 canvas so we can see it clearly


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    var vs_point = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
      gl_PointSize = 1.0;
    }
    `;
    var fs_point = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0, 0, 0, 1);
    }`;

    var vs_tex = `
    attribute vec4 position;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = position;
      v_texcoord = position.xy * 0.5 + 0.5;
    }
    `;
    var fs_tex = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying vec2 v_texcoord;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    `;

    // Let's make a 3x1 texture, render to it
    // then render it to the canvas with gl.NEAREST
    var canvas = document.querySelector("canvas");
    var gl = canvas.getContext("webgl");
    var pointProgramInfo = twgl.createProgramInfo(
        gl, [vs_point, fs_point]);
    var texProgramInfo = twgl.createProgramInfo(
        gl, [vs_tex, fs_tex]);

    var pointBufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: [ -2/3, 0 ] },
    });
    var quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);
      
    // make a 3x1 pixel texture and attach to framebuffer
    var framebufferInfo = twgl.createFramebufferInfo(gl, [
      { format: gl.RGBA, mag: gl.NEAREST, min: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, }
    ], 3, 1);

    // draw 1 pixel into texture
    twgl.bindFramebufferInfo(gl, framebufferInfo);
    gl.useProgram(pointProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, pointProgramInfo, pointBufferInfo);
    twgl.drawBufferInfo(gl, gl.POINTS, pointBufferInfo);
        
    // put in a clipspace quad
    twgl.bindFramebufferInfo(gl, null);
    gl.useProgram(texProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, texProgramInfo, quadBufferInfo);
    twgl.drawBufferInfo(gl, gl.TRIANGLES, quadBufferInfo);
        

<!-- language: lang-css -->

    canvas { border: 1px solid red; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas width="300" height="100"></canvas>

<!-- end snippet -->

Or as another example let's draw random pixels to a canvas. 

The important part is a pixel's position is

     clipspaceX = (x + 0.5) / destWidth  * 2 - 1;
     clipspaceY = (y + 0.5) / destHeight * 2 - 1;

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    var vs = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
      gl_PointSize = 1.0;
    }
    `;
    var fs = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }`;

    var canvas = document.querySelector("canvas");
    var gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});

    // make canvas 1x1 with display
    var bounds = canvas.getBoundingClientRect();
    gl.canvas.width  = Math.round(bounds.width  * window.devicePixelRatio);
    gl.canvas.height = Math.round(bounds.height * window.devicePixelRatio);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    var positions = new Float32Array(2000);
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: positions, },
    });

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    function randInt(max) {
      return Math.random() * max | 0;
    }

    var offset = [0, 0];
    var color = [0, 0, 0, 1];

    var uniforms = {
      u_offset: offset,
      u_color: color,
    };

    function render() {
      var length = positions.length;
      for (var i = 0; i < length; i += 2) {
        var x = randInt(gl.canvas.width);
        var y = randInt(gl.canvas.height);

        positions[i + 0] = (x + 0.5) / gl.canvas.width  * 2 - 1;
        positions[i + 1] = (y + 0.5) / gl.canvas.height * 2 - 1;
      }
      twgl.setAttribInfoBufferFromArray(
        gl, bufferInfo.attribs.position, positions);  
      
      var cndx = randInt(3);
      color[cndx] = 1;
      color[(cndx + 1) % 3] = 0;

      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, gl.POINTS, bufferInfo);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas style="width:300px; height:150px;"></canvas>

<!-- end snippet -->





