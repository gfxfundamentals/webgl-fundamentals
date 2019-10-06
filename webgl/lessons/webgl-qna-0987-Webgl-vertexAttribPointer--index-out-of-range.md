Title: Webgl vertexAttribPointer: index out of range
Description:
TOC: qna

# Question:

I'm trying to pass uv buffer as well as the normal buffer in webgl. But for some reason I get this warning `vertexAttribPointer: index out of range` when passing values. I don't get what I m doing wrong since the uv array seems to be good, same goes for the normals.

It seems like the errors only occured with normal and uv not with position.

`enableVertexAttribArray: index out of range`

`vertexAttribPointer: index out of range`

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const vsSource = `
        attribute vec4 position;
        attribute vec2 uv;
        attribute vec3 normal;
        uniform mat4 modelViewMatrix;
        varying vec4 vColor;
        void main(void) {
          gl_Position = position;
        }
      `;

    const fsSource = `  
        precision mediump float;
        varying vec4 vColor;
        void main(void) {
          gl_FragColor = vec4(1.0,0.0,1.0,1.0);
        }
      `;

    // Shader setup

    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        var log = gl.getShaderInfoLog(vertexShader);
        throw "Shader compilation failed\n\n" + log + "\n\n";
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        var log = gl.getShaderInfoLog(fragmentShader);
        throw "Shader compilation failed\n\n" + log + "\n\n";
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    gl.validateProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var log = gl.getProgramInfoLog(program);
        throw "Program link failed\n\n" + log;
    }

    gl.useProgram(program);

    let modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");

    let model = mat4.create();

    gl.uniformMatrix4fv(modelViewMatrix, false, model);

    var vertices = new Float32Array([
        0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        -0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        0.5,
        -0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        0.5,
        -0.5,
        0.5,
        0.5,
        0.5,
        -0.5,
        -0.5,
        0.5,
        -0.5,
        0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5,
        -0.5
    ]);

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    let position = gl.getAttribLocation(program, "position");

    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position);

    var uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            0,
            1,
            1,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            1,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            1,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            1,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            1,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            1,
            1,
            0,
            0,
            1,
            0
        ]),
        gl.STATIC_DRAW
    );

    let uv = gl.getAttribLocation(program, "uv");

    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uv);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            0,
            0,
            -1,
            0,
            0,
            -1,
            0,
            0,
            -1,
            0,
            0,
            -1,
            0,
            0,
            0,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            0,
            0,
            -1,
            0,
            0,
            -1,
            0,
            0,
            -1,
            0,
            0,
            -1,
            0,
            0,
            0,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            0,
            0,
            1,
            0,
            0,
            -1,
            0,
            0,
            -1,
            0,
            0,
            -1,
            0,
            0,
            -1
        ]),
        gl.STATIC_DRAW
    );

    let normal = gl.getAttribLocation(program, "normal");

    gl.vertexAttribPointer(normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normal);

    var indices = new Uint16Array([
        0,
        2,
        1,
        2,
        3,
        1,
        4,
        6,
        5,
        6,
        7,
        5,
        8,
        10,
        9,
        10,
        11,
        9,
        12,
        14,
        13,
        14,
        15,
        13,
        16,
        18,
        17,
        18,
        19,
        17,
        20,
        22,
        21,
        22,
        23,
        21
    ]);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);


<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js"></script>
    <canvas></canvas>

<!-- end snippet -->



# Answer

Your shaders are not using `uv` or `normal` so your driver is optimizing out those attributes. In that case `gl.getAttribLocation` returns -1 for location (-1 = attribute by this name does not exist). -1 is out of range. Valid values are 0 to `gl.getParameter(gl.MAX_VERTEX_ATTRIBS) - 1`

In other words you need check the location of your attributes and if they don't exist, don't set them up.

This is one reason why it's good to [write some helper functions for WebGL](https://webglfundamentals.org/webgl/lessons/webgl-less-code-more-fun.html) to kind of handle these issues for you so as you modify your shaders your code doesn't break.
