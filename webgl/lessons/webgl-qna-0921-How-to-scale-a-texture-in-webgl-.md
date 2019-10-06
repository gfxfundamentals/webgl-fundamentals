Title: How to scale a texture in webgl?
Description:
TOC: qna

# Question:

I have a texture of size 800x600. How do I scale it on a webgl `<canvas>`  at another size and keep the original aspect ratio? Assuming that the drawing buffer and the canvas have the same dimensions.


# Answer

Given the WebGL only cares about clipsapce coordinates you can just draw a 2 unit quad (-1 to +1) and scale it by the aspect of the canvas vs the aspect of the image.

In other words

      const canvasAspect = canvas.clientWidth / canvas.clientHeight;
      const imageAspect = image.width / image.height;

      let scaleY = 1;
      let scaleX = imageAspect / canvasAspect;

Note that you need to decide how you want to fit the image. `scaleY= 1` means the image will always fit vertically and horizontally will just be whatever it comes out to.

If you want it to fit horizontally then you need to make scaleX = 1

      let scaleX = 1;
      let scaleY = canvasAspect / imageAspect;

If you want it to `contain` then 

      let scaleY = 1;
      let scaleX = imageAspect / canvasAspect;
      if (scaleX > 1) {
        scaleY = 1 / scaleX;
        scaleX = 1;
      }

If you want it to `cover` then 

      let scaleY = 1;
      let scaleX = imageAspect / canvasAspect;
      if (scaleX < 1) {
        scaleY = 1 / scaleX;
        scaleX = 1;
      }

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    let scaleMode = 'fitV';

    const gl = document.querySelector("canvas").getContext('webgl');
    const vs = `
    attribute vec4 position;
    uniform mat4 u_matrix;
    varying vec2 v_texcoord;
    void main() {
      gl_Position = u_matrix * position;
      v_texcoord = position.xy * .5 + .5;  // because we know we're using a -1 + 1 quad
    }
    `;
    const fs = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_tex;
    void main() {
      gl_FragColor = texture2D(u_tex, v_texcoord);
    }
    `;

    let image = { width: 1, height: 1 }; // dummy until loaded
    const tex = twgl.createTexture(gl, {
      src: 'https://i.imgur.com/TSiyiJv.jpg',
      crossOrigin: 'anonymous',
    }, (err, tex, img) => {
      // called after image as loaded
      image = img;
      render();
    });

    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [
          -1, -1,  // tri 1
           1, -1,
          -1,  1,      
          -1,  1,  // tri 2
           1, -1,
           1,  1,
        ],
      }
    });


    function render() {
      // this line is not needed if you don't
      // care that the canvas drawing buffer size
      // matches the canvas display size
      twgl.resizeCanvasToDisplaySize(gl.canvas);

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      const canvasAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const imageAspect = image.width / image.height;
      let scaleX;
      let scaleY;

      switch (scaleMode) {
        case 'fitV':
          scaleY = 1;
          scaleX = imageAspect / canvasAspect;
          break;
        case 'fitH':
          scaleX = 1;
          scaleY = canvasAspect / imageAspect;
          break;
        case 'contain':
          scaleY = 1;
          scaleX = imageAspect / canvasAspect;
          if (scaleX > 1) {
            scaleY = 1 / scaleX;
            scaleX = 1;
          }
          break;
        case 'cover':
          scaleY = 1;
          scaleX = imageAspect / canvasAspect;
          if (scaleX < 1) {
            scaleY = 1 / scaleX;
            scaleX = 1;
          }
          break;
      }
      
      twgl.setUniforms(programInfo, {
        u_matrix: [
          scaleX, 0, 0, 0,
          0, -scaleY, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        ],
      });
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    render();
    window.addEventListener('resize', render);
    document.querySelectorAll('button').forEach((elem) => {
      elem.addEventListener('click', setScaleMode);
    });

    function setScaleMode(e) {
     scaleMode = e.target.id;
     render();
    }

<!-- language: lang-css -->

    html, body { 
      margin: 0;
      height: 100%;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .ui {
      position: absolute;
      left: 0;
      top: 0;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>
    <div class="ui">
      <button id="fitV">fit vertical</button>
      <button id="fitH">fit horizontal</button>
      <button id="contain">contain</button>
      <button id="cover">cover</button>
    </div>

<!-- end snippet -->

The code above uses a 4x4 matrix to apply the scale

      gl_Position = u_matrix * position;

It could just as easily pass in the scale directly

      uniform vec2 scale;
      ...
      gl_Position = vec4(scale * position.xy, 0, 1);

