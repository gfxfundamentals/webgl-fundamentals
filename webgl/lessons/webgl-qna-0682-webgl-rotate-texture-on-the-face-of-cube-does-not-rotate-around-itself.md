Title: webgl rotate texture on the face of cube does not rotate around itself
Description:
TOC: qna

# Question:

i need help with webgl.

i draw a simple cube and apply texture on each face of cube,and i am rotating the texture on the each face of the cube but the problem is:

the texture does not rotate **around itself** it rotate's around **left bottom corner of the cube**:

here is my code relative to rotation :

in the vertex shader :
        
        vTextureCoord = ((uTMatrix) * vec4(aTextureCoord, 0.0 , 1.0)).xy;
        
in the script:

        mat4.identity(TMatrix);
        
        mat4.rotate(TMatrix,xRot3, [0.0, 0.0, 1.0]);



# Answer

See [this article](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html) and maybe [this one](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html)

Rotation is always around 0,0 so if you want to rotate around some other point you need to move stuff to 0,0 first then in your case you need to move it back

    // moves texcoords back since they're we moved from where they need to be
    mat4.translate(TMatrix, [.5, .5, 0]);

    // rotates around 0,0
    mat4.rotate(TMatrix,degToRad(xRot3), [0.0, 0.0, 1.0]);

    // moves texcoords so they're centered around 0,0
    mat4.translate(TMatrix, [-.5, -.5, 0]);  

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

        var gl;

        function initGL(canvas) {
            try {
                gl = canvas.getContext("webgl");
                gl.viewportWidth = canvas.width;
                gl.viewportHeight = canvas.height;
            } catch (e) {
            }
            if (!gl) {
                alert("Could not initialise WebGL, sorry");
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
            shaderProgram.TMatrixUniform = gl.getUniformLocation(shaderProgram, "uTMatrix");
            shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        }

        var mvMatrix = mat4.create();
        var mvMatrixStack = [];
        var pMatrix = mat4.create();
        var TMatrix = mat4.create();


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
            gl.uniformMatrix4fv(shaderProgram.TMatrixUniform, false, TMatrix);
        }


        function degToRad(degrees) {
            return degrees * Math.PI / 180;
        }

        var xRot1 = 0;
        var xSpeed1 = 0;

        var xRot2 = 0;
        var xSpeed2 = 0;

        var xRot3 = 0;
        var xSpeed3 = 0;

        var z = -5.0;

        var filter = 0;

        var depth = 0;

        var currentlyPressedKeys = {};

        var rot_flag = 0;

        var text_rot_flag = 0;


    ///////////////////////////////////////// keyboard ///////////////////////////////////////////

        function handleKeyDown(event) {
            currentlyPressedKeys[event.keyCode] = true;

            if (String.fromCharCode(event.keyCode) == "F") {
                filter += 1;
                if (filter == 3) {
                    filter = 0;
                }
            }
            
            if(String.fromCharCode(event.keyCode) == "R"){
                if (rot_flag == 0){
                    rot_flag = 1;
                    xSpeed1 = 20;
                    xSpeed2 = 30;
                }
                else{
                    rot_flag = 0;
                    xSpeed1 = 0;
                    xSpeed2 = 0;
                }
            }

            if(String.fromCharCode(event.keyCode) == "O"){
                depth = depth - 1;
            }

            if(String.fromCharCode(event.keyCode) == "I"){
                depth = depth + 1;
            }

            if(String.fromCharCode(event.keyCode) == "T"){
                if(text_rot_flag == 0){
                    text_rot_flag = 1;
                    xSpeed3 = 15;

                }
                else{
                    text_rot_flag = 0;
                    xSpeed3 = 0;
                }
            }

        }

        function handleKeyUp(event) {
            currentlyPressedKeys[event.keyCode] = false;
        }

    ///////////////////////////////////////// Texture ///////////////////////////////////////////

        function handleLoadedTexture(textures) {

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.bindTexture(gl.TEXTURE_2D, textures[0]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[0].image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            gl.bindTexture(gl.TEXTURE_2D, textures[1]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures[1].image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);

        }

        var crateTextures = Array();

        var crateTextures1 = Array();

        function initTexture() {

            var crateImage = document.createElement("canvas");
            crateImage.width = 64;
            crateImage.height = 64;
            var ctx = crateImage.getContext("2d");
            ctx.translate(32, 32);
            ctx.rotate(Math.PI * .25);
            ctx.fillRect(-24, -24, 48, 48);

            for (var i=0; i < 3; i++) {
                var texture = gl.createTexture();
                texture.image = crateImage;
                crateTextures.push(texture);
            }

            handleLoadedTexture(crateTextures)


            var crateImage1 = document.createElement("canvas");
            crateImage1.width = 64;
            crateImage1.height = 64;
            var ctx = crateImage1.getContext("2d");
            ctx.fillStyle="red";
            ctx.translate(32, 32);
            ctx.rotate(Math.PI * .25);
            ctx.fillRect(-24, -24, 48, 48);

            for (var i=0; i < 3; i++) {
                var texture = gl.createTexture();
                texture.image = crateImage1;
                crateTextures1.push(texture);
            }

            handleLoadedTexture(crateTextures1)
        }   

        var cubeVertexPositionBuffer;
        var cubeVertexTextureCoordBuffer;
        var cubeVertexIndexBuffer;

        function initBuffers() {

            cubeVertexPositionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
            vertices = [
                // Front face
                -2.00, -2.00,  2.00,
                 2.00, -2.00,  2.00,
                 2.00,  2.00,  2.00,
                -2.00,  2.00,  2.00,

                // Back face
                -2.00, -2.00, -2.00,
                -2.00,  2.00, -2.00,
                 2.00,  2.00, -2.00,
                 2.00, -2.00, -2.00,

                // Top face
                -2.00,  2.00, -2.00,
                -2.00,  2.00,  2.00,
                 2.00,  2.00,  2.00,
                 2.00,  2.00, -2.00,

                // Bottom face
                -2.00, -2.00, -2.00,
                 2.00, -2.00, -2.00,
                 2.00, -2.00,  2.00,
                -2.00, -2.00,  2.00,

                // Right face
                 2.00, -2.00, -2.00,
                 2.00,  2.00, -2.00,
                 2.00,  2.00,  2.00,
                 2.00, -2.00,  2.00,

                // Left face
                -2.00, -2.00, -2.00,
                -2.00, -2.00,  2.00,
                -2.00,  2.00,  2.00,
                -2.00,  2.00, -2.00,
            ];

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            cubeVertexPositionBuffer.itemSize = 3;
            cubeVertexPositionBuffer.numItems = 24;

    //////////////////////////////////////////////////// cube1 //////////////////////////////////////////////////////

            cubeVertexTextureCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);

                var textureCoords = [
                    // Front face
                    1.000, 1.000,
                    0.0, 1.000,
                    0.0, 0.0,
                    1.000, 0.0,

                    // Back face
                    1.000, 0.0,
                    1.000, 1.000,
                    0.0, 1.000,
                    0.0, 0.0,

                    // Top face
                    0.0, 1.000,
                    0.0, 0.0,
                    1.000, 0.0,
                    1.000, 1.000,

                    // Bottom face
                    0.0, 0.0,
                    1.000, 0.0,
                    1.000, 1.000,
                    0.0, 1.000,

                    // Right face
                    1.000, 0.0,
                    1.000, 1.000,
                    0.0, 1.000,
                    0.0, 0.0,

                    // Left face
                    0.0, 0.0,
                    1.000, 0.0,
                    1.000, 1.000,
                    0.0, 1.000,
                ];

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
            cubeVertexTextureCoordBuffer.itemSize = 2;
            cubeVertexTextureCoordBuffer.numItems = 24;

    /////////////////////////////////////////////////////// cube2 /////////////////////////////////////////////////////

            cubeVertexTextureCoordBuffer1 = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer1);

                var textureCoords1 = [
                    // Front face
                    1.000, 1.000,
                    0.0, 1.000,
                    0.0, 0.0,
                    1.000, 0.0,

                    // Back face
                    1.000, 0.0,
                    1.000, 1.000,
                    0.0, 1.000,
                    0.0, 0.0,

                    // Top face
                    0.0, 1.000,
                    0.0, 0.0,
                    1.000, 0.0,
                    1.000, 1.000,

                    // Bottom face
                    0.0, 0.0,
                    1.000, 0.0,
                    1.000, 1.000,
                    0.0, 1.000,

                    // Right face
                    1.000, 0.0,
                    1.000, 1.000,
                    0.0, 1.000,
                    0.0, 0.0,

                    // Left face
                    0.0, 0.0,
                    1.000, 0.0,
                    1.000, 1.000,
                    0.0, 1.000,
                ];

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords1), gl.STATIC_DRAW);
            cubeVertexTextureCoordBuffer1.itemSize = 2;


    /////////////////////////////////////////////// vertex ////////////////////////////////////////////////

            cubeVertexIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
            var cubeVertexIndices = [
                0, 1, 2,      0, 2, 3,    // Front face
                4, 5, 6,      4, 6, 7,    // Back face
                8, 9, 10,     8, 10, 11,  // Top face
                12, 13, 14,   12, 14, 15, // Bottom face
                16, 17, 18,   16, 18, 19, // Right face
                20, 21, 22,   20, 22, 23  // Left face
            ]
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
            cubeVertexIndexBuffer.itemSize = 1;
            cubeVertexIndexBuffer.numItems = 36;
        }


        function drawScene() {

            gl.viewport(0, 0, canvas.width, canvas.height);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            mat4.perspective((-50+depth) , canvas.width/canvas.height , 0.1 , 100.0 , pMatrix );

            //////////////////////////////////////////////////////// cube1 /////////////////////////////////////////////

            mat4.identity(mvMatrix);

            mat4.translate(mvMatrix, [4.0, 0.0, -10.0]);

            mat4.scale(mvMatrix, [1, 1, 1]);

            mat4.rotate(mvMatrix, degToRad(xRot1), [0, 1, 0]);


            mat4.identity(TMatrix);

            mat4.scale(TMatrix, [2.0, 2.0, 2.0]);


            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
            gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, crateTextures[1]);

            gl.uniform1i(shaderProgram.samplerUniform, 0);

            setMatrixUniforms();
            gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

            /////////////////////////////////////////////// cube2 ///////////////////////////////////////////////

            mat4.identity(mvMatrix);

            mat4.translate(mvMatrix, [-4.0, 0.0, -10.0]);

            mat4.scale(mvMatrix, [1, 1, 1]);

            mat4.rotate(mvMatrix, degToRad(xRot2), [1, 0, 0]);

            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

            mat4.identity(TMatrix);
            
            if(text_rot_flag){

                mat4.translate(TMatrix,[.5, .5, 0]);
                mat4.rotate(TMatrix,degToRad(xRot3), [0.0, 0.0, 1.0]);
                mat4.translate(TMatrix,[-.5, -.5, 0]);

            }

            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer1);
            gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0.0, 0.0);


            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, crateTextures1[0]);
            gl.uniform1i(shaderProgram.samplerUniform, 0);

            setMatrixUniforms();
            gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

        }

        var lastTime = 0;

        function animate() {
            var timeNow = new Date().getTime()/ 1000;
            if (lastTime != 0) {
                var elapsed = timeNow - lastTime;

                xRot1 += (xSpeed1 * elapsed);
                xRot2 += (xSpeed2 * elapsed);
                xRot3 += (xSpeed3 * elapsed);

            }
            lastTime = timeNow;
        }

        function render() {
            requestAnimFrame(render);
            drawScene();
            animate();
        }

        function webGLStart() {

            var canvas = document.getElementById("canvas");
            initGL(canvas);
            initShaders();
            initBuffers();
            initTexture();

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.enable(gl.DEPTH_TEST);

            document.onkeydown = handleKeyDown;
            document.onkeyup = handleKeyUp;

            render();
        }
        
        webGLStart();
        

<!-- language: lang-html -->

    <script id="shader-vs" type="x-shader/x-vertex">
        attribute vec3 aVertexPosition;
        attribute vec2 aTextureCoord;
        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        varying vec2 vTextureCoord;
        uniform mat4 uTMatrix;

        void main(void) {

            gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

            vTextureCoord = ((uTMatrix) * vec4(aTextureCoord, 0.0 , 1.0)).xy;

            // vTextureCoord = aTextureCoord;
        }

    </script>

    <script id="shader-fs" type="x-shader/x-fragment">

        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;

        void main(void) {

            gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));

        }

    </script>

    <canvas id="canvas"></canvas>
    <script src="http://stabriz.bol.ucla.edu/hw3/gl-matrix.js"></script>
    <script src="http://stabriz.bol.ucla.edu/hw3/webgl-utils.js"></script>

<!-- end snippet -->

Note, I always look at matrix backward. I start with the vertices of the cube and then consider applying each matrix. But, most matrix math libraries are such that the last matrix applied is the first one applied to the vertices.

On other words to me these 3 lines

    mat4.translate(TMatrix, [.5, .5, 0]);
    mat4.rotate(TMatrix,degToRad(xRot3), [0.0, 0.0, 1.0]);
    mat4.translate(TMatrix, [-.5, -.5, 0]);  

mean

    first translate the vertices by [-.5, -.5, 0]
    then rotate around the origin by xRot
    then translate the vertices by [.5, .5, 0]

Note how that's the opposite order of the code but it's effectively what happens.

Other people look at the matrices as "transforming the space" in which case it can be interpreted in order

    move the origin to [.5, .5, 0]
    rotate the origin by xRot
    move the origin by [-.5, -.5, 0]


