Title: can't render canvas as a texture in webgl, but a blue color does render
Description:
TOC: qna

# Question:

I am trying to render a canvas as a texture in webgl.

This is the code:

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                     new Uint8Array([0, 0, 255, 255]));

First line, `texture` is a canvas dom element, which is filled with red, and if I append it to `document.body` it renders fine. But this line doesn't render anything on webgl.

If I uncomment second line, It renders blue just fine.


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->


    const fShaderSource = `#version 300 es

    precision mediump float;

    out vec4 outColor;

    uniform sampler2D u_texture;

    void main() {
      outColor = texture(u_texture, vec2(0.0));
    }

    `;

    const vShaderSource = `#version 300 es

    precision mediump float;

    in vec2 a_position;

    void main() {
      gl_Position = vec4(a_position, 0, 1);
    }
    `;

    main(document.getElementById('app'));

    function main(element) {
      
      const canvas = document.createElement('canvas'),
            gl = canvas.getContext('webgl2');
      element.append(canvas);
      const displayWidth = canvas.clientWidth,
            displayHeight = canvas.clientHeight;
      canvas.width = displayWidth;
      canvas.height = displayHeight;


      let graphics = new Graphics({width: displayWidth, height: displayHeight}, gl);
      
      new Loop(() => {
         graphics.render();
      }).start();
    }

    function Graphics(state, gl) {

      const { width, height } = state;

      let vShader = createShader(gl, gl.VERTEX_SHADER, vShaderSource);
      let fShader = createShader(gl, gl.FRAGMENT_SHADER, fShaderSource);

      let program = createProgram(gl, vShader, fShader);

      let posAttrLocation = gl.getAttribLocation(program, "a_position");
      let posBuffer = gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);


      /*
        (-1, 1).( 1, 1)
            .
        (-1,-1).( 1,-1)
       */
      let positions = [
        -1, 1,
        -1, -1,
        1, -1,
        -1, 1,
        1,-1,
        1, 1
      ];

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);


      let vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      gl.enableVertexAttribArray(posAttrLocation);

      let size = 2,
          type = gl.FLOAT,
          normalize = false,
          stride = 0,
          offset = 0;

      gl.vertexAttribPointer(posAttrLocation,
                             size,
                             type,
                             normalize,
                             stride,
                             offset);

      let glTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvasTexture());
      //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));




      let resUniformLocation = gl.getUniformLocation(program, "u_resolution");

      let texUniformLocation = gl.getUniformLocation(program, "u_texture");




      gl.clearColor(0, 0, 0, 0);

      this.render = () => {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniform2f(resUniformLocation, gl.canvas.width, gl.canvas.height);
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 6);


      };

    }

    function canvasTexture() {
     
     return withCanvasTexture(256, 256, (w, h, canvas, ctx) => {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, w, h);
        ctx.font = '50pt Comic Sans';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('label', w / 2, 50);

        return canvas;
     });
     
    function withCanvasTexture(width, height, f) {
      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      f(width, height, canvas, canvas.getContext('2d'));
      const texture = canvas;
      document.body.append(canvas);
      return texture;
    }
    }

    function createShader(gl, type, source) {
      let shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

      if (success) {
        return shader;
      }

      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    };

    function createProgram(gl, vShader, fShader) {
      let program = gl.createProgram();
      gl.attachShader(program, vShader);
      gl.attachShader(program, fShader);
      gl.linkProgram(program);
      let success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }

      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }


    // Loop Library
    function Loop(fn) {

    const perf = window.performance !== undefined ? window.performance : Date;

    const now = () => perf.now();

    const raf = window.requestAnimationFrame;

      let running = false,
          lastUpdate = now(),
          frame = 0;

      this.start = () => {
        if (running) {
          return this;
        }

        running = true;
        lastUpdate = now();
        frame = raf(tick);
        return this;
      };

      this.stop = () => {
        running = false;

        if (frame != 0) {
          raf.cancel(frame);
        }

        frame = 0;
        return this;
      };

      const tick = () => {
        frame = raf(tick);
        const time = now();
        const dt = time - lastUpdate;
        fn(dt);
        lastUpdate = time;
      };
    }

<!-- language: lang-css -->

    #app canvas {
      position: fixed;
      top: 50%;
      bottom: 0;
      left: 50%;
      right: 0;

      width: 100vmin;
      height: 70vmin;

      transform: translate(-50%, -25%);

      image-rendering: optimizeSpeed;
      cursor: none;
      margin: auto;
    }

<!-- language: lang-html -->

    <div id="app">
    </div>

<!-- end snippet -->



# Answer

you haven't set the filtering correctly.

To render a texture without mips you have to set min filter to LINEAR or NEAREST since those modes that don't try to use mips

     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

Either that or you need to supply mips

     gl.generateMipmap(gl.TEXTURE_2D);

