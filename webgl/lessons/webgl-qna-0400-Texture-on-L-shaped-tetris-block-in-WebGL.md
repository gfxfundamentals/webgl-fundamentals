Title: Texture on L-shaped tetris block in WebGL
Description:
TOC: qna

# Question:

I try to get idea of textures in WebGL. I want to implement textures on my blocks in webgl tetris. I work with code from here: http://learningwebgl.com/blog/?p=507 to learn textures. My question is how to implement texture on such L-shaped or different then square shapes. Since clearly this code I wrote (just small changes from tutorial - making it 2d in initBuffers method) isn't working and I don't have any clue why.

    <script type="text/javascript" src="glMatrix-0.9.5.min.js"></script>
    <script type="text/javascript" src="webgl-utils.js"></script>

    <script id="shader-fs" type="x-shader/x-fragment">
    precision mediump float;
    varying vec2 vTextureCoord;
    uniform sampler2D uSampler;
    void main(void) {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    }
</script>

    <script id="shader-vs" type="x-shader/x-vertex">
    attribute vec3 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;
    varying vec2 vTextureCoord;
    void main(void) {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
        vTextureCoord = aTextureCoord;
    }
</script>


    <script type="text/javascript">
        var gl;
        function initGL(canvas) {
            try {
                gl = canvas.getContext("experimental-webgl");
                gl.viewportWidth = canvas.width;
                gl.viewportHeight = canvas.height;
            } catch (e) {
            }
            if (!gl) {
                alert("Could not initialise WebGL, sorry :-(");
            }
        }
        function getShader(gl, id) {
            var shaderScript = document.getElementById(id);
            if (!shaderScript) {
                return null;
            }
            var str = "";
            var k = shaderScript.firstChild;
            while (k) {
                if (k.nodeType == 3) {
                    str += k.textContent;
                }
                k = k.nextSibling;
            }
            var shader;
            if (shaderScript.type == "x-shader/x-fragment") {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if (shaderScript.type == "x-shader/x-vertex") {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                return null;
            }
            gl.shaderSource(shader, str);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert(gl.getShaderInfoLog(shader));
                return null;
            }
            return shader;
        }
        var shaderProgram;
        function initShaders() {
            var fragmentShader = getShader(gl, "shader-fs");
            var vertexShader = getShader(gl, "shader-vs");
            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert("Could not initialise shaders");
            }
            gl.useProgram(shaderProgram);
            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
            shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
            gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
            shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
            shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        }
        function handleLoadedTexture(texture) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        var neheTexture;
        function initTexture() {
            neheTexture = gl.createTexture();
            neheTexture.image = new Image();
            neheTexture.image.onload = function () {
                handleLoadedTexture(neheTexture)
            };
            neheTexture.image.src = 'nehe.gif';
        }
        var mvMatrix = mat4.create();
        var mvMatrixStack = [];
        var pMatrix = mat4.create();
        function mvPushMatrix() {
            var copy = mat4.create();
            mat4.set(mvMatrix, copy);
            mvMatrixStack.push(copy);
        }
        function mvPopMatrix() {
            if (mvMatrixStack.length == 0) {
                throw "Invalid popMatrix!";
            }
            mvMatrix = mvMatrixStack.pop();
        }
        function setMatrixUniforms() {
            gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
            gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
        }
        function degToRad(degrees) {
            return degrees * Math.PI / 180;
        }
        var cubeVertexPositionBuffer;
        var cubeVertexTextureCoordBuffer;
        var cubeVertexIndexBuffer;
        function initBuffers() {
            cubeVertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
            var vertices = [
                -0.5, -1.5, 0.0,
                0.5, -1.5, 0.0,
                -0.5, 1.5, 0.0,
                0.5, 1.5, 0.0,
                0.5, -0.5, 0.0,
                1.5, -0.5, 0.0,
                1.5, -1.5, 0.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            cubeVertexPositionBuffer.itemSize = 3;
            cubeVertexPositionBuffer.numItems = 7;
            cubeVertexTextureCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
            var textureCoords = [
                // Front face
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
            cubeVertexTextureCoordBuffer.itemSize = 2;
            cubeVertexTextureCoordBuffer.numItems = 4;
            cubeVertexIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
            var cubeVertexIndices = [
                0,1,2,  1,2,3,
                    4,5,6, 6,1,4
            ];
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
            cubeVertexIndexBuffer.itemSize = 1;
            cubeVertexIndexBuffer.numItems = 12;
        }
        var xRot = 0;
        var yRot = 0;
        var zRot = 0;
        function drawScene() {
            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
            mat4.identity(mvMatrix);
            mat4.translate(mvMatrix, [0.0, 0.0, -25.0]);
            //mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
            //mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
            //mat4.rotate(mvMatrix, degToRad(zRot), [0, 0, 1]);
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
            gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, neheTexture);
            gl.uniform1i(shaderProgram.samplerUniform, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
            setMatrixUniforms();
            gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }
        var lastTime = 0;
        function animate() {
            var timeNow = new Date().getTime();
            if (lastTime != 0) {
                var elapsed = timeNow - lastTime;
                xRot += (90 * elapsed) / 1000.0;
                yRot += (90 * elapsed) / 1000.0;
                zRot += (90 * elapsed) / 1000.0;
            }
            lastTime = timeNow;
        }
        function tick() {
            requestAnimFrame(tick);
            drawScene();
            animate();
        }
        function webGLStart() {
            var canvas = document.getElementById("lesson05-canvas");
            initGL(canvas);
            initShaders();
            initBuffers();
            initTexture();
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);
            tick();
        }
    </script>

# Answer

In general you need an equal number of texture coordinates to positions. In your code you have 7 positions but only 4 texture coordinates

