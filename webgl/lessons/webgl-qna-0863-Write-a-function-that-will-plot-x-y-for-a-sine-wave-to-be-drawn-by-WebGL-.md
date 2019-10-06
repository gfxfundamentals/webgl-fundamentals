Title: Write a function that will plot x/y for a sine wave to be drawn by WebGL?
Description:
TOC: qna

# Question:

I'm trying to learn WebGL (and some math from [codingmath][2]).  The goal today is to draw a sine wave at any start and ending direction.
Something like this:
[![wave][3]][3]

I'm just missing something in my `makePoints()` method.  My points plot out oddly and I'm kinda dumbfounded on where to go next.

[![line][4]][4]

**QUESTION:**
-------------

**How do I fix my `makePoints()` function, so that it will plot out the x and y coords of a sine wave.**

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    let gl,
        shaderProgram,
        vertices,
        canvas;

    const VERTEX_LENGTH = 1500;
    const VERTEX_SHADER = `
    attribute vec4 coords;
    attribute float pointSize;
    void main(void) {
      gl_Position = coords;
      gl_PointSize = pointSize;
    }
    `;

    const FRAGMENT_SHADER = `
    precision mediump float;
    uniform vec4 color;
    void main(void) {
      gl_FragColor = color;
    }
    `;

    initGL();
    createShader();
    createVertices();
    draw();
    window.addEventListener('resize', setCanvasSize, false);

    function setCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    function initGL() {
        canvas = document.querySelector('#canvas');
        gl = canvas.getContext('webgl');
        setCanvasSize();
        console.log(gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 1);
    }

    function makePoints(points) {
        const diff = (Math.PI * 2) / (points - 1);
        const len = {length: points};
        return Array.from(len, (_, i) => Math.sin(i * diff));
    }

    function createVertices() {
        vertices = makePoints(VERTEX_LENGTH);
       
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        const coords = gl.getAttribLocation(shaderProgram, 'coords');
        gl.vertexAttribPointer(coords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coords);
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const pointSize = gl.getAttribLocation(shaderProgram, 'pointSize');
        gl.vertexAttrib1f(pointSize, 2);

        const uniformColor = gl.getUniformLocation(shaderProgram, 'color');
        gl.uniform4f(uniformColor, 0, normalize(200), normalize(83), 1);
    }

    function createShader() {
        const vs = VERTEX_SHADER;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vs);
        gl.compileShader(vertexShader);

        const fs = FRAGMENT_SHADER;

        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fs);
        gl.compileShader(fragmentShader);

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);

        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);
    }


    function draw() {
        console.log(vertices)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, VERTEX_LENGTH/2);
        requestAnimationFrame(draw);
    }

    function normalize(val, max=255, min=0) { return (val - min) / (max - min); }


<!-- language: lang-css -->

    html, body, canvas {
        padding: 0;
        margin: 0;
        height: 100%;
        width: 100%;
        display: block;
        position: relative;
    }


<!-- language: lang-html -->

    <canvas id="canvas" width="500" height="500"></canvas>


<!-- end snippet -->

  [1]: https://codepen.io/matthewharwood/pen/JvBmWb
  [2]: https://www.youtube.com/watch?v=yAHl_kpqr-k
  [3]: https://i.stack.imgur.com/5xulJ.png
  [4]: https://i.stack.imgur.com/cDA10.png

# Answer

Since your code expects a 2 points per vertex you need your makePoints to return different values for even (x) and odd (y) values.

I find that it's much easier to understand verbose code so here's my `makePoints`. Note that I find it useful to always compute a `lerp0to1` value in the loop like this. I can then use that value to easily convert to nearly any type of data I want.

    function makePoints(points) {
      const highestPointNdx = points / 2 - 1;
      return Array.from({length: points}, (_, i) => {
        const pointId = i / 2 | 0;
        const lerp0To1 = pointId / highestPointNdx;
        const odd = i % 2;
        return odd
          ? Math.sin(lerp0To1 * Math.PI * 2) // Y
          : (lerp0To1 * 2 - 1);              // X
      });
    }

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    let gl,
        shaderProgram,
        vertices,
        canvas;

    const VERTEX_LENGTH = 1500;
    const VERTEX_SHADER = `
    attribute vec4 coords;
    attribute float pointSize;
    void main(void) {
      gl_Position = coords;
      gl_PointSize = pointSize;
    }
    `;

    const FRAGMENT_SHADER = `
    precision mediump float;
    uniform vec4 color;
    void main(void) {
      gl_FragColor = color;
    }
    `;

    initGL();
    createShader();
    createVertices();
    draw();
    window.addEventListener('resize', setCanvasSize, false);

    function setCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    function initGL() {
        canvas = document.querySelector('#canvas');
        gl = canvas.getContext('webgl');
        setCanvasSize();
        console.log(gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 1);
    }

    function makePoints(points) {
      const highestPointNdx = points / 2 - 1;
      return Array.from({length: points}, (_, i) => {
        const pointId = i / 2 | 0;
        const lerp0To1 = pointId / highestPointNdx;
        const odd = i % 2;
        return odd
          ? Math.sin(lerp0To1 * Math.PI * 2) // Y
          : (lerp0To1 * 2 - 1);              // X
      });
    }


    function createVertices() {
        vertices = makePoints(VERTEX_LENGTH);
    console.log(vertices);   
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        const coords = gl.getAttribLocation(shaderProgram, 'coords');
        gl.vertexAttribPointer(coords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coords);
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const pointSize = gl.getAttribLocation(shaderProgram, 'pointSize');
        gl.vertexAttrib1f(pointSize, 2);

        const uniformColor = gl.getUniformLocation(shaderProgram, 'color');
        gl.uniform4f(uniformColor, 0, normalize(200), normalize(83), 1);
    }

    function createShader() {
        const vs = VERTEX_SHADER;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vs);
        gl.compileShader(vertexShader);

        const fs = FRAGMENT_SHADER;

        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fs);
        gl.compileShader(fragmentShader);

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);

        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);
    }


    function draw() {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, VERTEX_LENGTH/2);
        requestAnimationFrame(draw);
    }

    function normalize(val, max=255, min=0) { return (val - min) / (max - min); }

<!-- language: lang-css -->

    html, body, canvas {
        padding: 0;
        margin: 0;
        height: 100%;
        width: 100%;
        display: block;
        position: relative;
    }

<!-- language: lang-html -->

    <canvas id="canvas" width="500" height="500"></canvas>

<!-- end snippet -->

Let me add I think `makePoints` is currently a little confusing. I'd change it to take the number of points you want, not the number of values in the vertex buffer (which is what it takes now) which is different from the number of points. You if you want N points you need 2*N values. So, I'd change it to

    function makePoints(numPoints) {
      const highestPointNdx = numPoints - 1;
      return Array.from({length: numPoints * 2}, (_, i) => {
        const pointId = i / 2 | 0;
        const lerp0To1 = pointId / highestPointNdx;
        const isY = i % 2;
        return isY
          ? Math.sin(lerp0To1 * Math.PI * 2) // Y
          : (lerp0To1 * 2 - 1);              // X
      });
    }

Then I pass in `VERTEX_LENGTH` and I use the same value for `gl.drawArrays` and neither would have to change if I was using 3D points instead of 2D points.

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    let gl,
        shaderProgram,
        vertices,
        canvas;

    const VERTEX_LENGTH = 1500;
    const VERTEX_SHADER = `
    attribute vec4 coords;
    attribute float pointSize;
    void main(void) {
      gl_Position = coords;
      gl_PointSize = pointSize;
    }
    `;

    const FRAGMENT_SHADER = `
    precision mediump float;
    uniform vec4 color;
    void main(void) {
      gl_FragColor = color;
    }
    `;

    initGL();
    createShader();
    createVertices();
    draw();
    window.addEventListener('resize', setCanvasSize, false);

    function setCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    function initGL() {
        canvas = document.querySelector('#canvas');
        gl = canvas.getContext('webgl');
        setCanvasSize();
        console.log(gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 1);
    }

    function makePoints(numPoints) {
      const highestPointNdx = numPoints - 1;
      return Array.from({length: numPoints * 2}, (_, i) => {
        const pointId = i / 2 | 0;
        const lerp0To1 = pointId / highestPointNdx;
        const isY = i % 2;
        return isY
          ? Math.sin(lerp0To1 * Math.PI * 2) // Y
          : (lerp0To1 * 2 - 1);              // X
      });
    }

    function createVertices() {
        vertices = makePoints(VERTEX_LENGTH);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        const coords = gl.getAttribLocation(shaderProgram, 'coords');
        gl.vertexAttribPointer(coords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(coords);
        // gl.bindBuffer(gl.ARRAY_BUFFER, null);

        const pointSize = gl.getAttribLocation(shaderProgram, 'pointSize');
        gl.vertexAttrib1f(pointSize, 2);

        const uniformColor = gl.getUniformLocation(shaderProgram, 'color');
        gl.uniform4f(uniformColor, 0, normalize(200), normalize(83), 1);
    }

    function createShader() {
        const vs = VERTEX_SHADER;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vs);
        gl.compileShader(vertexShader);

        const fs = FRAGMENT_SHADER;

        fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fs);
        gl.compileShader(fragmentShader);

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);

        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);
    }


    function draw() {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, VERTEX_LENGTH);
        requestAnimationFrame(draw);
    }

    function normalize(val, max=255, min=0) { return (val - min) / (max - min); }

<!-- language: lang-css -->

    html, body, canvas {
        padding: 0;
        margin: 0;
        height: 100%;
        width: 100%;
        display: block;
        position: relative;
    }

<!-- language: lang-html -->

    <canvas id="canvas" width="500" height="500"></canvas>

<!-- end snippet -->


