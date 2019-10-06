Title: Unable to read pixels from a grayscale heightmap with WebGL?
Description:
TOC: qna

# Question:

I'm trying to read the pixels of greyscale heightmap in order to store the height values later in a mesh, but whatever I do, I constantly read the same values rgba(0, 0, 0, 255).

**Note:** Color normal images are perfectly read.

**The image used:**

[![enter image description here][1]][1]

**Code I've written:**

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");

    gl.canvas.width = canvas.getBoundingClientRect().width;
    gl.canvas.height = canvas.getBoundingClientRect().height;

    let vertexShaderSource = `
        attribute vec4 a_position;
     
        varying vec2 v_texturePos;
        
        void main() {
            gl_Position = vec4(a_position.xy, 0, 1.0);
            
            v_texturePos = (a_position.xy+1.0)/2.0;
        }
    `;

    let fragmentShaderSource = `
        precision mediump float;
        
        uniform sampler2D u_heightmap;
        
        varying vec2 v_texturePos;
        
        void main() {
            gl_FragColor = texture2D(u_heightmap, v_texturePos);
        }
    `;

    function createShader(gl, type, source) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if(success)
            return shader;
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        let success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(success)
            return program;
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    let mesh = [
        -1, -1, 0,
        -1, 1, 0,
        1, 1, 0,

        1, 1, 0,
        1, -1, 0,
        -1, -1, 0
    ];

    function drawScene(gl) {
        gl.clearColor(0, 0, 0, 0);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
        gl.vertexAttribPointer(attribPositionLoc, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
            let pixels = new Uint8Array(gl.canvas.width*gl.canvas.height*4/625);
            for(let g = 0; g < gl.canvas.width; g += 25) {
                for(let h = 0; h < gl.canvas.height; h += 25) {
                    gl.readPixels(g, h, gl.canvas.width/25, gl.canvas.height/25, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                }
            }
            console.log(pixels);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, frameTexture);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    let attribPositionLoc;
    let frameBuffer;
    let texture, frameTexture;

    function resize(gl) {
        let realToCSSPixels = window.devicePixelRatio;

        let displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
        let displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

        if (gl.canvas.width  !== displayWidth ||
            gl.canvas.height !== displayHeight) {

            gl.canvas.width  = displayWidth;
            gl.canvas.height = displayHeight;
        }
    }

    let img = document.createElement("img");
    img.crossOrigin = "null";
    img.src = "http://localhost:8000/heightmap?filename=terrain.jpg";
    img.addEventListener("load", startWebGL.bind(this, gl));

    function startWebGL(gl) {
        resize(gl);
        let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        let program = createProgram(gl, vertexShader, fragmentShader);

        gl.useProgram(program);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        frameBuffer = gl.createFramebuffer();

        frameTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, frameTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameTexture, 0);

        attribPositionLoc = gl.getAttribLocation(program, "a_position");

        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(attribPositionLoc);

        drawScene(gl);
    }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->


  [1]: https://i.stack.imgur.com/SYljr.jpg

What am I doing wrong and how can I fix it? Any ideas?

# Answer

It's not at all clear what this code is trying to do

    let pixels = new Uint8Array(gl.canvas.width*gl.canvas.height*4/625);
    for(let g = 0; g < gl.canvas.width; g += 25) {
        for(let h = 0; h < gl.canvas.height; h += 25) {
            gl.readPixels(g, h, gl.canvas.width/25, gl.canvas.height/25, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        }
    }
    console.log(pixels);

What does dividing by 625 do? On top of that you only print the last result. If you want read the entire canvas it's just

    let pixels = new Uint8Array(gl.canvas.width*gl.canvas.height*4);
    gl.readPixels(g, h, gl.canvas.width, gl.canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

In any case if I change the URL for the image to something that can be loaded while on stack overflow I see the expected values. Looking at your image since you're only reading at 25x25 area and you're only printing the last 25x25 area since your `console.log` is outside the loop I'm guessing your reading a black corner of the image. 

Also since you're stepping by 25, if your canvas is not a multiple of 25 then you'll read off the edge, past the end of the canvas. Reading off the edge always produces 0,0,0,0.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    let canvas = document.querySelector("canvas");
    let gl = canvas.getContext("webgl");

    gl.canvas.width = canvas.getBoundingClientRect().width;
    gl.canvas.height = canvas.getBoundingClientRect().height;

    let vertexShaderSource = `
        attribute vec4 a_position;
     
        varying vec2 v_texturePos;
        
        void main() {
            gl_Position = vec4(a_position.xy, 0, 1.0);
            
            v_texturePos = (a_position.xy+1.0)/2.0;
        }
    `;

    let fragmentShaderSource = `
        precision mediump float;
        
        uniform sampler2D u_heightmap;
        
        varying vec2 v_texturePos;
        
        void main() {
            gl_FragColor = texture2D(u_heightmap, v_texturePos);
        }
    `;

    function createShader(gl, type, source) {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if(success)
            return shader;
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        let success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(success)
            return program;
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    let mesh = [
        -1, -1, 0,
        -1, 1, 0,
        1, 1, 0,

        1, 1, 0,
        1, -1, 0,
        -1, -1, 0
    ];

    function drawScene(gl) {
        gl.clearColor(0, 0, 0, 0);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
        gl.vertexAttribPointer(attribPositionLoc, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
            let pixels = new Uint8Array(gl.canvas.width*gl.canvas.height*4/625);
            for(let g = 0; g < gl.canvas.width; g += 25) {
                for(let h = 0; h < gl.canvas.height; h += 25) {
                    gl.readPixels(g, h, gl.canvas.width/25, gl.canvas.height/25, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                }
            }
            console.log(pixels);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, frameTexture);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    let attribPositionLoc;
    let frameBuffer;
    let texture, frameTexture;

    function resize(gl) {
        let realToCSSPixels = window.devicePixelRatio;

        let displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
        let displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

        if (gl.canvas.width  !== displayWidth ||
            gl.canvas.height !== displayHeight) {

            gl.canvas.width  = displayWidth;
            gl.canvas.height = displayHeight;
        }
    }

    let img = document.createElement("img");
    img.crossOrigin = "null";
    // img.src = "http://localhost:8000/heightmap?filename=terrain.jpg";
    img.src = "https://i.imgur.com/ZKMnXce.png";
    img.addEventListener("load", startWebGL.bind(this, gl));

    function startWebGL(gl) {
        resize(gl);
        let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        let program = createProgram(gl, vertexShader, fragmentShader);

        gl.useProgram(program);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        frameBuffer = gl.createFramebuffer();

        frameTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, frameTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameTexture, 0);

        attribPositionLoc = gl.getAttribLocation(program, "a_position");

        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(attribPositionLoc);

        drawScene(gl);
    }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->



