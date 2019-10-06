Title: WebGL: How to correctly blend alpha channel png
Description:
TOC: qna

# Question:

I'm pretty new to OpenGL and even newer to WebGL. I'm trying to draw a textured quad with an alpha channel. However I just can't get the blending right.

This is the result I'm looking for

![This is the result I'm looking for][1]

And this is what the WebGL result looks like

![And this is what the WebGL result looks like][2]

As you can see there is kind of a white outline on the dice edges, where in the original image, there is not. 

This is how I do my blending in WebGL

            gl.clearColor(0.5, 0.5, 0.5, 1);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

Here is my fragment shader:

    precision mediump float;

    varying vec2 vUV;

    uniform sampler2D texture;

    void main(void) {
        vec4 frag = texture2D(texture, vUV);
        gl_FragColor = frag;
    }

Any idea why this is happening? I'm not creating mipmaps, BTW.

  [1]: http://i.stack.imgur.com/TF3Nf.png
  [2]: http://i.stack.imgur.com/MAvX6.png

# Answer

This has been answered elsewhere on SO but ...

WebGL Canvases default to requiring premultiplied alpha. WebGL canvases are composited on the webpage (blended on to the page). So ...

## Do you or do you not want your WebGL image blended with the webpage?

If no, you don't want to blend with the webpage then do one of the following

*  Turn off alpha in the canvas

        var gl = someCanvas.getContext("webgl", { alpha: false });

*  Make sure your alpha stays at 1.0

   The easy way to do that is to just clear it after rendering with

        gl.colorMask(false, false, false, true);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

If yes, you do want to blend with the webpage then do one of the following

*  Make sure the values you write into the canvas are premultiplied alpha values.

*  Tell the browser the values in the canvas are not premultiplied

        var gl = someCanvas.getContext("webgl", {premultipliedAlpha: false});

On top of that by default, images loaded into WebGL use *un-premultiplied alpha*  Which means you either need to 

*   Set your canvas to not be premultiplied

*   Do the multiplication yourself in your shader

        gl_FragColor.rgb *= gl_FragColor.a;

*   Tell WebGL to premultiply the texture when you load it into WebGL

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

Assuming your canvas is premultiplied you want your blend function to be 

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

That's because you don't need the source to be multiplied by alpha becaue it's already *premultiplied*

Here's an example of blending with the page by multiplying by alpha in the shader. The purple stripes are a CSS background. The image is drawn twice, once to fill the canvas, once on top of that 1/2 size. You can see it's all blended correctly.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;
    varying vec2 v_texcoord;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * position;
      v_texcoord = position.xy * .5 + .5;
    }
    `;

    var fs = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_tex;
    void main() {
      gl_FragColor = texture2D(u_tex, v_texcoord);
      gl_FragColor.rgb *= gl_FragColor.a;
    }
    `;

    var gl = document.querySelector("canvas").getContext("webgl");
    var m4 = twgl.m4;
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    var tex = twgl.createTexture(gl, { 
      src: "https://i.imgur.com/iFom4eT.png",
      crossOrigin: "",
    }, render);

    function render() {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, {
        u_tex: tex,
        u_matrix: m4.identity(),
      });
      twgl.drawBufferInfo(gl, bufferInfo);

      twgl.setUniforms(programInfo, {
        u_tex: tex,
        u_matrix: m4.scaling([0.5, 0.5, 1]),
      });
      twgl.drawBufferInfo(gl, bufferInfo);
    }

<!-- language: lang-css -->

    canvas {
      background-color: purple;
      background-image: linear-gradient(45deg, rgba(255, 255, 255, 1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 1) 75%, transparent 75%, transparent);
      background-size: 50px 50px;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

and here's an example of setting the canvas to be un-premultiplied. The only differences being I passed `{premultipliedAlpha: false}` to `getContext`. I removed the `gl_FragColor.rgb *= gl_FragColor.a`. And, I changed the blend function to `gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)`

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;
    varying vec2 v_texcoord;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * position;
      v_texcoord = position.xy * .5 + .5;
    }
    `;

    var fs = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_tex;
    void main() {
      gl_FragColor = texture2D(u_tex, v_texcoord);
    }
    `;

    var gl = document.querySelector("canvas").getContext("webgl", {
      premultipliedAlpha: false,
    });
    var m4 = twgl.m4;
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

    var tex = twgl.createTexture(gl, { 
      src: "https://i.imgur.com/iFom4eT.png",
      crossOrigin: "",
    }, render);

    function render() {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, {
        u_tex: tex,
        u_matrix: m4.identity(),
      });
      twgl.drawBufferInfo(gl, bufferInfo);

      twgl.setUniforms(programInfo, {
        u_tex: tex,
        u_matrix: m4.scaling([0.5, 0.5, 1]),
      });
      twgl.drawBufferInfo(gl, bufferInfo);
    }

<!-- language: lang-css -->

    canvas {
      background-color: purple;
      background-image: linear-gradient(45deg, rgba(255, 255, 255, 1) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 1) 75%, transparent 75%, transparent);
      background-size: 50px 50px;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


