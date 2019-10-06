Title: Cube with two textures
Description:
TOC: qna

# Question:



<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    /**
     * A class creating buffers for a textured box to render it with WebGL
     */
    class RasterTextureBox {
        /**
         * Creates all WebGL buffers for the textured box
         *     6 ------- 7
         *    / |       / |
         *   3 ------- 2  |
         *   |  |      |  |
         *   |  5 -----|- 4
         *   | /       | /
         *   0 ------- 1
         *  looking in negative z axis direction
         * @param {WebGLContext} gl - The canvas' context
         * @param {Vector} minPoint - The minimal x,y,z of the box
         * @param {Vector} maxPoint - The maximal x,y,z of the box
         */
        constructor(gl, minPoint, maxPoint, texture) {
            this.gl = gl;
            const mi = minPoint;
            const ma = maxPoint;
            let vertices = [
                // front
                mi.x, mi.y, ma.z, ma.x, mi.y, ma.z, ma.x, ma.y, ma.z,
                ma.x, ma.y, ma.z, mi.x, ma.y, ma.z, mi.x, mi.y, ma.z,
                // back
                ma.x, mi.y, mi.z, mi.x, mi.y, mi.z, mi.x, ma.y, mi.z,
                mi.x, ma.y, mi.z, ma.x, ma.y, mi.z, ma.x, mi.y, mi.z,
                // right
                ma.x, mi.y, ma.z, ma.x, mi.y, mi.z, ma.x, ma.y, mi.z,
                ma.x, ma.y, mi.z, ma.x, ma.y, ma.z, ma.x, mi.y, ma.z,
                // top
                mi.x, ma.y, ma.z, ma.x, ma.y, ma.z, ma.x, ma.y, mi.z,
                ma.x, ma.y, mi.z, mi.x, ma.y, mi.z, mi.x, ma.y, ma.z,
                // left
                mi.x, mi.y, mi.z, mi.x, mi.y, ma.z, mi.x, ma.y, ma.z,
                mi.x, ma.y, ma.z, mi.x, ma.y, mi.z, mi.x, mi.y, mi.z,
                // bottom
                mi.x, mi.y, mi.z, ma.x, mi.y, mi.z, ma.x, mi.y, ma.z,
                ma.x, mi.y, ma.z, mi.x, mi.y, ma.z, mi.x, mi.y, mi.z
            ];

            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            this.vertexBuffer = vertexBuffer;
            this.elements = vertices.length / 3;

            let cubeTexture = gl.createTexture();
            let cubeImage = new Image();
            cubeImage.onload = function () {
                gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
            cubeImage.src = texture;
            this.texBuffer = cubeTexture;

            let uv = [
                // front
                0, 0, 1, 0, 1, 1,
                1, 1, 0, 1, 0, 0,
                // back
                0, 0, 1, 0, 1, 1,
                1, 1, 0, 1, 0, 0,
                // right
                0, 0, 1, 0, 1, 1,
                1, 1, 0, 1, 0, 0,
                // top
                0, 0, 1, 0, 1, 1,
                1, 1, 0, 1, 0, 0,
                // left
                0, 0, 1, 0, 1, 1,
                1, 1, 0, 1, 0, 0,
                // bottom
                0, 0, 1, 0, 1, 1,
                1, 1, 0, 1, 0, 0,
            ];
            let uvBuffer = this.gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
            gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(uv),
                gl.STATIC_DRAW);
            this.texCoords = uvBuffer;
        }

        /**
         * Renders the textured box
         * @param {Shader} shader - The shader used to render
         */
        render(shader) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
            const positionLocation = shader.getAttributeLocation("a_position");
            this.gl.enableVertexAttribArray(positionLocation);
            this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);

            // Bind the texture coordinates in this.texCoords
            // to their attribute in the shader
            // TODO [exercise 9]
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoords);
            const texCoordLocation = shader.getAttributeLocation("a_texCoord");
            this.gl.enableVertexAttribArray(texCoordLocation);
            this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

            this.gl.activeTexture(gl.TEXTURE0);
            this.gl.bindTexture(gl.TEXTURE_2D, this.texBuffer);
            shader.getUniformInt("sampler").set(0);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, this.elements);

            this.gl.disableVertexAttribArray(positionLocation);

            // TODO [exercise 9] disable texture vertex attrib array
            this.gl.disableVertexAttribArray(texCoordLocation);
        }
    }

<!-- language: lang-html -->

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    uniform sampler2D sampler;
    varying vec2 v_texCoord;

    void main( void ) {
      //gl_FragColor = vec4( 0.0, 0.0, 0.5, 1.0 );
      // Read fragment color from texture
      // TODO [exercise 9]
      gl_FragColor = texture2D(sampler, vec2(v_texCoord.s, v_texCoord.t));
    }
    </script>

    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec3 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;

    uniform mat4 M;
    uniform mat4 V;
    uniform mat4 P;

    void main(void)
    {
        gl_Position = P * V * M * vec4( a_position, 1.0 );
        v_texCoord = a_texCoord;
    }

<!-- end snippet -->

Hey there, I`m trying tp add two textures on my cube (code on top). I can combine two images two one, but I have no idea how to combine my cube with the two images. My cube already has one texture, I just want to add another one via constructor. Looking forward for your help! I´m thankful for every advice or code examples!

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-html -->

    <!-- Licensed under a BSD license. See license.html for license -->
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <title>WebGL - 2 Textures</title>
        <link type="text/css" href="webgl-tutorials.css" rel="stylesheet" />
    </head>
    <body>
    <canvas id="canvas"></canvas>
    </body>
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    uniform vec2 u_resolution;

    varying vec2 v_texCoord;

    void main() {
       // convert the rectangle from pixels to 0.0 to 1.0
       vec2 zeroToOne = a_position / u_resolution;

       // convert from 0->1 to 0->2
       vec2 zeroToTwo = zeroToOne * 2.0;

       // convert from 0->2 to -1->+1 (clipspace)
       vec2 clipSpace = zeroToTwo - 1.0;

       gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

       // pass the texCoord to the fragment shader
       // The GPU will interpolate this value between points.
       v_texCoord = a_texCoord;
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // our textures
    uniform sampler2D u_image0;
    uniform sampler2D u_image1;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    void main() {
       vec4 color0 = texture2D(u_image0, v_texCoord);
       vec4 color1 = texture2D(u_image1, v_texCoord);
       gl_FragColor = color0 * color1;
    }
    </script>
    <!--
    for most samples webgl-utils only provides shader compiling/linking and
    canvas resizing because why clutter the examples with code that's the same in every sample.
    See http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html
    and http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    for webgl-utils, m3, m4, and webgl-lessons-ui.
    -->
    <script src="https://webgl2fundamentals.org/webgl/resources/webgl-utils.js"></script>
    <script>
        "use strict";

        function loadImage(url, callback) {
            var image = new Image();
            image.src = url;
            image.onload = callback;
            return image;
        }

        function loadImages(urls, callback) {
            var images = [];
            var imagesToLoad = urls.length;

            // Called each time an image finished
            // loading.
            var onImageLoad = function() {
                --imagesToLoad;
                // If all the images are loaded call the callback.
                if (imagesToLoad == 0) {
                    callback(images);
                }
            };

            for (var ii = 0; ii < imagesToLoad; ++ii) {
                var image = loadImage(urls[ii], onImageLoad);
                images.push(image);
            }
        }

        function main() {
            loadImages([
                "star.jpg",
                "normal.png",
            ], render);
        }

        function render(images) {
            // Get A WebGL context
            /** @type {HTMLCanvasElement} */
            var canvas = document.getElementById("canvas");
            var gl = canvas.getContext("webgl");
            if (!gl) {
                return;
            }

            // setup GLSL program
            var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
            gl.useProgram(program);

            // look up where the vertex data needs to go.
            var positionLocation = gl.getAttribLocation(program, "a_position");
            var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

            // Create a buffer to put three 2d clip space points in
            var positionBuffer = gl.createBuffer();

            // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            // Set a rectangle the same size as the image.
            setRectangle(gl, 0, 0, images[0].width, images[0].height);

            // provide texture coordinates for the rectangle.
            var texcoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                0.0,  0.0,
                1.0,  0.0,
                0.0,  1.0,
                0.0,  1.0,
                1.0,  0.0,
                1.0,  1.0,
            ]), gl.STATIC_DRAW);

            // create 2 textures
            var textures = [];
            for (var ii = 0; ii < 2; ++ii) {
                var texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);

                // Set the parameters so we can render any size image.
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                // Upload the image into the texture.
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);

                // add the texture to the array of textures.
                textures.push(texture);
            }

            // lookup uniforms
            var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

            // lookup the sampler locations.
            var u_image0Location = gl.getUniformLocation(program, "u_image0");
            var u_image1Location = gl.getUniformLocation(program, "u_image1");

            webglUtils.resizeCanvasToDisplaySize(gl.canvas);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            // Clear the canvas
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Tell it to use our program (pair of shaders)
            gl.useProgram(program);

            // Turn on the position attribute
            gl.enableVertexAttribArray(positionLocation);

            // Bind the position buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

            // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
            var size = 2;          // 2 components per iteration
            var type = gl.FLOAT;   // the data is 32bit floats
            var normalize = false; // don't normalize the data
            var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
            var offset = 0;        // start at the beginning of the buffer
            gl.vertexAttribPointer(
                positionLocation, size, type, normalize, stride, offset)

            // Turn on the teccord attribute
            gl.enableVertexAttribArray(texcoordLocation);

            // Bind the position buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

            // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
            var size = 2;          // 2 components per iteration
            var type = gl.FLOAT;   // the data is 32bit floats
            var normalize = false; // don't normalize the data
            var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
            var offset = 0;        // start at the beginning of the buffer
            gl.vertexAttribPointer(
                texcoordLocation, size, type, normalize, stride, offset)

            // set the resolution
            gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

            // set which texture units to render with.
            gl.uniform1i(u_image0Location, 0);  // texture unit 0
            gl.uniform1i(u_image1Location, 1);  // texture unit 1

            // Set each texture unit to use a particular texture.
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[0]);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, textures[1]);

            // Draw the rectangle.
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        function setRectangle(gl, x, y, width, height) {
            var x1 = x;
            var x2 = x + width;
            var y1 = y;
            var y2 = y + height;
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                x1, y1,
                x2, y1,
                x1, y2,
                x1, y2,
                x2, y1,
                x2, y2,
            ]), gl.STATIC_DRAW);
        }

        main();
    </script>
    </html>

<!-- end snippet -->



# Answer

Assuming your code works you need to change your fragment shader to use two textures

    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
    
    uniform sampler2D sampler1;
    uniform sampler2D sampler2;
    varying vec2 v_texCoord;
    
    void main( void ) {
      //gl_FragColor = vec4( 0.0, 0.0, 0.5, 1.0 );
      // Read fragment color from texture
      // TODO [exercise 9]
      gl_FragColor = texture2D(sampler1, vec2(v_texCoord.s, v_texCoord.t)) *
                     texture2D(sampler2, vec2(v_texCoord.s, v_texCoord.t));
    }
    </script>

And you need to make your JavaScript load 2 textures

     * @param {strings[]} textures An array of urls for textures
     */
    constructor(gl, minPoint, maxPoint, textures) {

        this.texBuffers = textures.map((texture) => {
          const cubeTexture = gl.createTexture();
          const cubeImage = new Image();
          cubeImage.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImage);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
          }
          cubeImage.src = texture;
          return cubeTexture;
        });

Then in your render code you need to set both textures

        this.texBuffers.forEach((texBuffer, ndx) => {
          this.gl.activeTexture(gl.TEXTURE0 + ndx);
          this.gl.bindTexture(gl.TEXTURE_2D, texBuffer);
          shader.getUniformInt(`sampler${ndx}`).set(ndx);
        });

And you'd call your constructor like this

    const rtBox = new RasterTextureBox(gl, minPoint, maxPoint, [
      "some/url/to/image1.png",
      "some/url/to/image2.png",
    ]);


