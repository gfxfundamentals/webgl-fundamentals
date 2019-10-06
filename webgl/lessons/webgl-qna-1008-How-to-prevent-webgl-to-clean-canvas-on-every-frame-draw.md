Title: How to prevent webgl to clean canvas on every frame draw
Description:
TOC: qna

# Question:

I'm trying to display multiple frames from different streams in a single canvas, using viewports and calling draw function on every frame I have to render. What I'm trying to replicate is a camera videowall that uses only one canvas and one webgl context. The problem is that, every time I render a frame into a specific viewport, then the other frames I rendered before in a different viewport, it disappear.

I even tried to initiate the webgl context setting "preserveDrawingBuffer" attribute to true, but it does not solved.

Following the code I'm using:

```
this.drawNextOuptutPictureGL = function (par) {

        var gl = this.contextGL;

        var texturePosBuffer = this.texturePosBuffer;
        var uTexturePosBuffer = this.uTexturePosBuffer;
        var vTexturePosBuffer = this.vTexturePosBuffer;

        var yTextureRef = this.yTextureRef;
        var uTextureRef = this.uTextureRef;
        var vTextureRef = this.vTextureRef;

        var width = this.width;
        var height = this.height;

        var yData = par.yData;
        var uData = par.uData;
        var vData = par.vData;

        var yDataPerRow = par.yDataPerRow || width;
        var yRowCnt = par.yRowCnt || height;

        var uDataPerRow = par.uDataPerRow || (width / 2);
        var uRowCnt = par.uRowCnt || (height / 2);

        var vDataPerRow = par.vDataPerRow || uDataPerRow;
        var vRowCnt = par.vRowCnt || uRowCnt;

        var viewportRow = par.viewportRow;
        var viewportColumn = par.viewportColumn;

        // Calculate coordinates basing on a square matrix
        var square = Math.sqrt(this.viewports.length);
        var x = (this.canvasElement.width / square) * (viewportColumn - 1);
        var y = (this.canvasElement.height / square) * (square - viewportRow);

        gl.viewport(x, y, width, height);

        var tTop = 0;
        var tLeft = 0;
        var tBottom = height / yRowCnt;
        var tRight = width / yDataPerRow;
        var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);

        if (this.customYUV444) {
          tBottom = height / uRowCnt;
          tRight = width / uDataPerRow;
        } else {
          tBottom = (height / 2) / uRowCnt;
          tRight = (width / 2) / uDataPerRow;
        };
        var uTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, uTexturePosValues, gl.DYNAMIC_DRAW);


        if (this.customYUV444) {
          tBottom = height / vRowCnt;
          tRight = width / vDataPerRow;
        } else {
          tBottom = (height / 2) / vRowCnt;
          tRight = (width / 2) / vDataPerRow;
        };
        var vTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);

        gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vTexturePosValues, gl.DYNAMIC_DRAW);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, yDataPerRow, yRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, uDataPerRow, uRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, uData);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, vDataPerRow, vRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, vData);

        // draw image
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
```

Is there a way to just update a specific viewport without having the entire context to be cleaned?

Thanks

# Answer

You need to turn on the scissor test and set the scissor rectangle

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, width, height);

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');

    const vs = `
    attribute vec4 position;
    uniform mat4 matrix;
    void main() {
      gl_Position = matrix * position;
    }
    `;
    const fs = `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }
    `;

    // compiles shaders, links program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = twgl.primitives.createCylinderBufferInfo(gl, 1, 1, 24, 1);

    const scenes = [
      { 
         viewport: [0, 0, 150, 150],
         xRot: 0, 
         zRot: 0, 
         bg: [1, 0, 0, 1], 
         color: [0, 1, 1, 1],
      },
      { 
         viewport: [150, 0, 150, 50],
         xRot: Math.PI * .5, 
         zRot: 0, 
         bg: [0, 1, 0, 1], 
         color: [1, 0, 1, 1],
      },
      { 
         viewport: [150, 50, 150, 100],
         xRot: 0, 
         zRot: Math.PI * 0.25, 
         bg: [0, 0, 1, 1], 
         color: [1, 1, 0, 1],
      },
    ];

    function render(time) {
      time *= 0.001;
     
      gl.enable(gl.SCISSOR_TEST);

      scenes.forEach((scene, ndx) => {
        gl.viewport(...scene.viewport);
        gl.scissor(...scene.viewport);
        
        gl.clearColor(...scene.bg);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const fov = Math.PI * 0.25;
        const aspect = scene.viewport[2] / scene.viewport[3];
        const near = 0.1;
        const far = 10;
        const matrix = m4.perspective(fov, aspect, near, far);
        m4.translate(matrix, [Math.sin(time + ndx), 0, -4], matrix);
        m4.rotateX(matrix, scene.xRot, matrix);
        m4.rotateZ(matrix, scene.zRot, matrix);
        m4.rotateZ(matrix, time, matrix);
        
        gl.useProgram(programInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        // calls gl.uniformXXX
        twgl.setUniforms(programInfo, {
          color: scene.color,
          matrix: matrix,
        });
        // calls gl.drawArrays or gl.drawElements
        twgl.drawBufferInfo(gl, bufferInfo);
      });

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

and if you are not rendering every viewport every frame then you'll need to pass in `preserveDrawingBuffer: true` when creating the webgl context.

Example that only updates one viewport per frame

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl', {
      preserveDrawingBuffer: true,
    });

    const vs = `
    attribute vec4 position;
    uniform mat4 matrix;
    void main() {
      gl_Position = matrix * position;
    }
    `;
    const fs = `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }
    `;

    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const bufferInfo = twgl.primitives.createCylinderBufferInfo(gl, 1, 1, 24, 1);

    const scenes = [
      { 
         viewport: [0, 0, 150, 150],
         xRot: 0, 
         zRot: 0, 
         bg: [1, 0, 0, 1], 
         color: [0, 1, 1, 1],
      },
      { 
         viewport: [150, 0, 150, 50],
         xRot: Math.PI * .5, 
         zRot: 0, 
         bg: [0, 1, 0, 1], 
         color: [1, 0, 1, 1],
      },
      { 
         viewport: [150, 50, 150, 100],
         xRot: 0, 
         zRot: Math.PI * 0.25, 
         bg: [0, 0, 1, 1], 
         color: [1, 1, 0, 1],
      },
    ];

    let count = 0;
    function render(time) {
      ++count;
      time *= 0.001;
     
      gl.enable(gl.SCISSOR_TEST);

      const ndx = count % scenes.length;
      const scene = scenes[ndx];
      gl.viewport(...scene.viewport);
      gl.scissor(...scene.viewport);

      gl.clearColor(...scene.bg);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const fov = Math.PI * 0.25;
      const aspect = scene.viewport[2] / scene.viewport[3];
      const near = 0.1;
      const far = 10;
      const matrix = m4.perspective(fov, aspect, near, far);
      m4.translate(matrix, [Math.sin(time + ndx), 0, -4], matrix);
      m4.rotateX(matrix, scene.xRot, matrix);
      m4.rotateZ(matrix, scene.zRot, matrix);
      m4.rotateZ(matrix, time, matrix);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, {
        color: scene.color,
        matrix: matrix,
      });
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


