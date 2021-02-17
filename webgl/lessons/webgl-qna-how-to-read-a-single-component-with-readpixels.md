Title: How to read a single component with readPixels
Description: How to read a single component with readPixels
TOC: How to read a single component with readPixels

## Question:

I've converted a RGBA image to greyscale image using webgl.

When reading the pixel using `gl.readPixels()` with `gl.RGBA` format, getting the values for each pixel as YYYA because an RGBA pixel is converted to YYYA and assigned to `gl_FragColor`. I want only 1 byte Y component for each pixel instead of 4 bytes.

Tried reading the pixels with `gl.RED` format(instead of `gl.RGBA`)

```
gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RED, gl.UNSIGNED_BYTE, pixels);
```

but getting the following error on Chrome and getting only zeroes.

```
WebGL: INVALID_ENUM: readPixels: invalid format
```

1. Is it possible to make `gl_FragColor` to output 1 byte per pixel in LUMINANCE mode, instead of RGBA, but the input texture has to be RGBA?
2. If the format of gl rendering cannot be changed, is it possible to read only the first byte of each 4 bytes pixel, when calling `gl.readPixels()`?

Note: 
3. I've already done copy the `gl.readPixels()` output to another array by jumping every 4 bytes. But I want to avoid this copy as it takes more time.
4. Also, I need the solution to be a mobile browser(ios safari and android chrome) compatible.
<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function webGL() {
        var gTexture;
        var gFramebuffer;
        var srcCanvas = null;
        var programs = {};
        var program;
        var pixels;

        this.convertRGBA2Gray = function(inCanvas, inArray) {
            // Y component from YCbCr
            const shaderSourceRGB2GRAY = `
                    precision mediump float;

                    uniform sampler2D u_image;
                    uniform vec2 u_textureSize;
                    vec4 scale = vec4(0.299,  0.587,  0.114, 0.0);
                    void main() {
                        vec4 color = texture2D(u_image, gl_FragCoord.xy / u_textureSize);
                        gl_FragColor = vec4(vec3(dot(color,scale)), color.a);
                    }`;

            if (srcCanvas === null) {
                console.log('Setting up webgl');
                srcCanvas = inCanvas;
                _initialize(srcCanvas.width, srcCanvas.height);
                program = _createProgram("rgb2grey", shaderSourceRGB2GRAY);
            }
            pixels = inArray;
            _run(program);
        }

        ///////////////////////////////////////
        // Private functions

        var _getWebGLContext = function(canvas) {
            try {
                return (canvas.getContext("webgl", {premultipliedAlpha: false, preserveDrawingBuffer: true}) || canvas.getContext("experimental-webgl", {premultipliedAlpha: false, preserveDrawingBuffer: true}));
            }
            catch(e) {
                console.log("ERROR: %o", e);
            }
            return null;
        }

        var gl = _getWebGLContext(document.createElement('canvas'));

        var _initialize = function(width, height) {
            var canvas = gl.canvas;
            canvas.width = width;
            canvas.height = height;

            if (this.originalImageTexture) {
                return;
            }

            this.originalImageTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, gTexture);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, null);

            gFramebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, gFramebuffer);

            var positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1.0,  1.0,
                1.0,  1.0,
                1.0, -1.0,

                -1.0,  1.0,
                1.0, -1.0,
                -1.0, -1.0
                ]), gl.STATIC_DRAW);

            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gTexture, 0);

            gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
        }

        var _createProgram = function(name, fragmentSource, vertexSource) {
            shaderProgram = programs[name];

            if (shaderProgram){
                console.log('Reusing program');
                gl.useProgram(shaderProgram);
                return shaderProgram;
            }

            function createShader(type, source){
                var shader = gl.createShader(type);

                gl.shaderSource(shader, source);

                gl.compileShader(shader);  

                return shader;
            }

            var vertexShader, fragmentShader;

            if (!vertexSource){
                vertexShader = createShader(gl.VERTEX_SHADER,   `attribute vec2 a_position;
                                                                void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`
                                                                );
            } else {
                vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
            }
            fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);

            gl.useProgram(shaderProgram);
            return shaderProgram;
        }

        var _render = function(gl, program){
      var positionLocation = gl.getAttribLocation(program, "a_position"); 

      var u_imageLoc = gl.getUniformLocation(program, "u_image");
      var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionLocation);

      var width = gl.canvas.width,
       height = gl.canvas.height;

      gl.bindFramebuffer(gl.FRAMEBUFFER, gFramebuffer);

      gl.uniform2f(textureSizeLocation, width, height);
      
      gl.uniform1i(u_imageLoc, 0);

      gl.viewport(0, 0, width, height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

     }

        var _run = function(program){
            let t0 = performance.now();
            _render(gl, program);
            gl.bindTexture(gl.TEXTURE_2D, gTexture);
            let t1 = performance.now();

            // gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RED, gl.UNSIGNED_BYTE, pixels);

            let t2 = performance.now();
            console.log('_render dur = ' + Number((t1-t0).toFixed(3)) + ' ms');
            console.log('_run dur = ' + Number((t2-t0).toFixed(3)) + ' ms');
        }

    };


<!-- language: lang-html -->

    <div>
        <canvas id="source"></canvas>
    </div>

    <script src="webgl.js" type="text/javascript"></script>

    <script>
        window.addEventListener('load', function(e) {
            var srcImg = new Image();
            srcImg.crossOrigin = "anonymous";
            srcImg.src = "https://i.picsum.photos/id/17/480/480.jpg";
            srcImg.width = 480;
            srcImg.height = 480;

            srcImg.onload = function(){
                // image  has been loaded
                let srcCanvas = document.getElementById("source");
                srcCanvas.width = srcImg.width;
                srcCanvas.height = srcImg.height;

                let ctx = srcCanvas.getContext('2d');
                ctx.drawImage(srcImg, 0, 0, srcImg.width, srcImg.height);

                var webgl = new webGL();
                let pixels = new Uint8Array(srcCanvas.width * srcCanvas.height * 4);
                webgl.convertRGBA2Gray(srcCanvas, pixels);

                var outData = ctx.createImageData(srcCanvas.width, srcCanvas.height);

                console.log('\n');
                for (let k = 0; k < 12; ++k) {
                    console.log(pixels[k] + ', ');
                }
                console.log('\n');

                // Luminance plot
                for (let i = 0, j = 0; i < (srcCanvas.width * srcCanvas.height * 4); i+=4, ++j ) {
                    outData.data[i] = outData.data[i+1] = outData.data[i+2] = pixels[j];
                    outData.data[i+3] = 255;
                }

                // RGB plot
                // for ( let i = 0; i < (srcCanvas.width * srcCanvas.height * 4); ++i ) {
                //     outData.data[i] = pixels[i];
                // }

                srcCanvas.getContext('2d').putImageData(outData, 0, 0);

            };

        }, true);

    </script>


<!-- end snippet -->



## Answer:

> Is it possible to make gl_FragColor to output 1 byte per pixel in LUMINANCE mode, instead of RGBA, but the input texture has to be RGBA?

Not portably. The spec for WebGL1 says rendering to a texture only has to be supported for gl.RGBA / gl.UNSIGNED_BYTE. All other formats are optional. 

> If the format of gl rendering cannot be changed, is it possible to read only the first byte of each 4 bytes pixel, when calling gl.readPixels()?

No, [The spec](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf) section 4.3.1 says only `gl.RGBA`, `gl.UNSIGNED_BYTE` is supported. All other formats are optional and up to the implementation. This is the same on WebGL2. Even if you make a R8 texture (red only, 8 bits) it's up to the implemenation if if you can read it as `gl.RED`/`gl.UNSIGNED_BYTE`.

See [Webgl1](https://webglfundamentals.org/webgl/lessons/webgl-readpixels.html) and [Webgl2](https://webgl2fundamentals.org/webgl/lessons/webgl-readpixels.html)

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="https://stackoverflow.com/users/7718655">rayen</a>
    from
    <a data-href="https://stackoverflow.com/questions/60796680">here</a>
  </div>
</div>
