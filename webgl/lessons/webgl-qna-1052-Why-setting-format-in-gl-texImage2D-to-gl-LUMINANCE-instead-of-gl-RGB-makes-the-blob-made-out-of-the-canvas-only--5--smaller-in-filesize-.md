Title: Why setting format in gl.texImage2D to gl.LUMINANCE instead of gl.RGB makes the blob made out of the canvas only ~5% smaller in filesize?
Description:
TOC: qna

# Question:

While exploring javascript, I encountered a question that is quite baffling. The preface is: I convert images of different mime types (mostly pngs/jpgs) into bitmaps with ImageBitmap interface, then transfer them to worker to convert in separate thread into blob(to do so I firstly draw them into offscreen canvas context) and then save into IDB, while main thread continues to load new images. While doing so, to broaden my horizons, I decided to use webgl2 rendering context in the canvas since GL is something I never touched.

To apply bitmap to canvas I use texImage2D function, which I seem to not understand. There I can specify format of data stored in memory being presented to GLSL (it should be rgb(right?) since bitmap was created with no alpha premultiplying), internal format and type. Since the combinations of format/internal format/type are specified by spec, I tried to make use of their multitude and chose the best(quality-/filesize-wise) for my purposes. Since images being converted to bitmap are mostly black and white, I thought that luminance is what I need. But first I used standard RGB format:

    gl.texImage2D(
     gl.TEXTURE_2D, 0, gl.RGB, bitmap.width, bitmap.height, 0, gl.RGB, gl.UNSIGNED_BYTE, bitmap
    );

Then I used RGB565 with UNSIGNED_SHORT_5_6_5 data type and didn't see any quality losses while blob size was decreased by ~30% from RGB. How I understand, it decreased because RGB565 is 2 unsigned short bytes per pixel, right? Then I used UNSIGNED_SHORT_5_5_5_1 RGBA and blob file size compared to standard RGB was decreased by ~43%. Even less then RGB565! But gradients on images became wonky so no 5551RGBA for me. The big difference in size between 5551 RGBA and RGB565 is something I don't understand. And what is more confusing is when using Luminance according to [spec][1] type/format/internal format combination, the decrease from standard RGB is only ~5%. Why did RGB565 decreased size for whooping ~30% while luma for a mere ~5%?

For all this I used the same floating-point sampler in fragment shader:

     #version 300 es
     precision mediump float;
     precision mediump sampler2D;

     uniform sampler2D sampler;
     uniform vec2 dimensions;

     out vec4 color;

     void main(){
          color = texture(sampler, vec2(gl_FragCoord.x/dimensions.x, 1.0 - (gl_FragCoord.y/dimensions.y)));
     }

Also the same pixelStorei and texParameteri:

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



As shows snippet below, the luma doesn't change the file size of blob if image is black and white, while if colored the decrease is apparent, though still smaller then RGBA4. Quite counterintuitive considering RGBA4 has 2 bytes per pixel, while LUMA - 1.
<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    (async() => {
    function createImage(src) {
     return new Promise((rs, rj) => {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => rs(img);
      img.onerror = e => rj(e);
        });
    };

    var jpeg = await createImage('https://upload.wikimedia.org/wikipedia/commons/a/aa/5inchHowitzerFiringGallipoli1915.jpeg');

    var png = await createImage('https://upload.wikimedia.org/wikipedia/commons/2/2c/6.d%C3%ADl_html_m2fdede78.png');

    var jpgClr = await createImage('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/%22Good_bye%2C_sweetheart%22%2C_tobacco_label%2C_ca._1865.jpg/117px-%22Good_bye%2C_sweetheart%22%2C_tobacco_label%2C_ca._1865.jpg');


    var format = {
        standard: {
            internalFormat: 'RGB8',
            format: 'RGB',
            type: 'UNSIGNED_BYTE',
        },
        rgb565: {
            internalFormat: 'RGB565',
            format: 'RGB',
            type: 'UNSIGNED_SHORT_5_6_5',
        },
        rgb9e5: {
            internalFormat: 'RGB9_E5',
            format: 'RGB',
            type: 'FLOAT',
        },
        srgb: {
            internalFormat: 'SRGB8',
            format: 'RGB',
            type: 'UNSIGNED_BYTE',
        },
        rgba32f: {
            internalFormat: 'RGB32F',
            format: 'RGB',
            type: 'FLOAT',
        },
        rgba4: {
            internalFormat: 'RGBA4',
            format: 'RGBA',
            type: 'UNSIGNED_SHORT_4_4_4_4',
        },
        rgb5a1: {
            internalFormat: 'RGB5_A1',
            format: 'RGBA',
            type: 'UNSIGNED_SHORT_5_5_5_1',
        },
        luma: {
            internalFormat: 'LUMINANCE',
            format: 'LUMINANCE',
            type: 'UNSIGNED_BYTE',
        },
    };


    function compareFormatSize(image) {
        return new Promise((r, _) => {
      createImageBitmap(image, {
                premultiplyAlpha: 'none',
                colorSpaceConversion: 'none',
            }).then(async bitmap => {
    var text = String(image.src.match(/(?<=\.)\w{3,4}$/)).toUpperCase();
                console.log(`${text === 'JPG' ? 'Colored jpg' : text}:`);
                for (let val of Object.values(format)) {
                    await logBlobSize(bitmap, val);
                if(val.format === 'LUMINANCE') r();
                }
            }).catch(console.warn);
        });
    };

    compareFormatSize(jpeg).then(_ => compareFormatSize(png)).then(_ => compareFormatSize(jpgClr));


    function logBlobSize(bitmap, { internalFormat, format, type }) {
      return new Promise(r => {
        drawCanvas(bitmap, internalFormat, format, type).convertToBlob({
          type: `image/webp`
        }).then(blob => { console.log(`Blob from ${internalFormat} is ${blob.size}b`); r(); });
      })
    }


    function drawCanvas(bitmap, internalFormat, format, type) {
        const gl = (new OffscreenCanvas(bitmap.width, bitmap.height)).getContext("webgl2", {
            antialias: false,
            alpha: false,
            depth: false,
        });

        function createShader(gl, type, glsl) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, glsl)
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return;
            }
            return shader;
        }


        const vs = createShader(
            gl,
            gl.VERTEX_SHADER,
            `#version 300 es
            #define POSITION_LOCATION 0
            layout(location = POSITION_LOCATION) in vec2 position;

            void main()
            {
                gl_Position = vec4(position, 0.0, 1.0);
            }`,
        );

        const fs = createShader(
            gl,
            gl.FRAGMENT_SHADER,
            `#version 300 es
            precision mediump float;
            precision mediump sampler2D;

            uniform sampler2D sampler;
            uniform vec2 dimensions;

            out vec4 color;

            void main()
            {
                color = texture(sampler, vec2(gl_FragCoord.x/dimensions.x, 1.0 - (gl_FragCoord.y/dimensions.y)));
            }`,
        );

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        const sampler = gl.getUniformLocation(program, 'sampler');
        const dimensions = gl.getUniformLocation(program, 'dimensions');
        const position = 0; // GLSL location


        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        gl.enableVertexAttribArray(position);
        const vxBuffer = gl.createBuffer();
        const vertices = new Float32Array([
            -1.0,-1.0,
             1.0,-1.0,
            -1.0, 1.0,
             1.0, 1.0,
        ]);
        gl.bindBuffer(gl.ARRAY_BUFFER, vxBuffer);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl[internalFormat],
            bitmap.width,
            bitmap.height,
            0,
            gl[format],
            gl[type],
            bitmap
        );

        gl.useProgram(program);
        gl.uniform1i(sampler, 0);
        gl.uniform2f(dimensions, gl.canvas.width, gl.canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.deleteTexture(texture);
        gl.deleteVertexArray(vao);
        gl.deleteBuffer(vxBuffer);
        gl.deleteProgram(program);

     return gl.canvas;
    }
    })()

<!-- end snippet -->

Thanks in advance!

  [1]: https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf#nameddest=section-3.7.2

# Answer

The canvas is always RGBA 8bit (32bit color). There is talk of adding options for having a deeper depth canvas to support HD color displays but that hasn't shipped.

So, calling `canvas.converToBlob` is always going to give you an RGBA32bit png (or jpeg). You create a LUMIANCE texture will give you a black and white texture but it gets drawn into an RGBA 32bit canvas. There is no option to get a 1 channel PNG.

As for RGB565, RGBA5551 etc those formats may or may not be supported directly by the hardware, the spec allows the driver to choose a format that is a higher resolution and I'm guessing most desktops expand the data into RGBA8 when you upload the data so it won't save any memory. 

On the other hand uploading as RGB565 or RGBA5551 the WebGL spec requires that when you pass an image that the image is first converted to that format, so the browser is going to take your image and effectively quantize it down to those color depths which means you're loosing colors. You then draw the quantized image back to the canvas and save so of course it's likely to compress better since there are more similar colors.

From the [WebGL spec](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14.8) for the version of `texImage2D` that takes an `ImageBitmap`

> The source image data is conceptually first converted to the data type and format specified by the format and type arguments, and then transferred to the WebGL implementation. Format conversion is performed according to the following table. **If a packed pixel format is specified which would imply loss of bits of precision from the image data, this loss of precision must occur.**

Let's try it without WebGL

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    (async() => {
      function createImage(src) {
        return new Promise((rs, rj) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = src;
          img.onload = () => rs(img);
          img.onerror = rj;
        });
      };

      const jpeg = await createImage('https://upload.wikimedia.org/wikipedia/commons/a/aa/5inchHowitzerFiringGallipoli1915.jpeg');

      const png = await createImage('https://upload.wikimedia.org/wikipedia/commons/2/2c/6.d%C3%ADl_html_m2fdede78.png');

      const jpgClr = await createImage('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/%22Good_bye%2C_sweetheart%22%2C_tobacco_label%2C_ca._1865.jpg/117px-%22Good_bye%2C_sweetheart%22%2C_tobacco_label%2C_ca._1865.jpg');


      const format = {
        standard: {
          internalFormat: 'RGB8',
          format: 'RGB',
          type: 'UNSIGNED_BYTE',
          fn: p => [p[0], p[1], p[2], 255],
        },
        rgb565: {
          internalFormat: 'RGB565',
          format: 'RGB',
          type: 'UNSIGNED_SHORT_5_6_5',
          fn: p => [
            (p[0] >> 3) * 255 / 31,
            (p[1] >> 2) * 255 / 63,
            (p[2] >> 3) * 255 / 31,
            255,
          ],
        },
        rgba4: {
          internalFormat: 'RGBA4',
          format: 'RGBA',
          type: 'UNSIGNED_SHORT_4_4_4_4',
          fn: p => [
            (p[0] >> 4) * 255 / 15,
            (p[1] >> 4) * 255 / 15,
            (p[2] >> 4) * 255 / 15,
            (p[3] >> 4) * 255 / 15,
          ],
        },
        rgb5a1: {
          internalFormat: 'RGB5_A1',
          format: 'RGBA',
          type: 'UNSIGNED_SHORT_5_5_5_1',
          fn: p => [
            (p[0] >> 3) * 255 / 31,
            (p[1] >> 3) * 255 / 31,
            (p[2] >> 3) * 255 / 31,
            (p[3] >> 7) * 255 / 1,
          ],
        },
        luma: {
          internalFormat: 'LUMINANCE',
          format: 'LUMINANCE',
          type: 'UNSIGNED_BYTE',
          fn: p => [p[0], p[0], p[0], 255],
        },
      };


      async function compareFormatSize(image) {
        const bitmap = await createImageBitmap(image, {
          premultiplyAlpha: 'none',
          colorSpaceConversion: 'none',
        });
        const text = String(image.src.match(/(?<=\.)\w{3,4}$/)).toUpperCase();
        log(`${text === 'JPG' ? 'Colored jpg' : text}:`);
        for (const val of Object.values(format)) {
          await logBlobSize(bitmap, val);
        }
      };

      await compareFormatSize(jpeg);
      await compareFormatSize(png);
      await compareFormatSize(jpgClr);

      async function logBlobSize(bitmap, {
        internalFormat,
        format,
        type,
        fn,
      }) {
        const canvas = drawCanvas(bitmap, internalFormat, format, type);
        const blob = await canvas.convertToBlob({
          type: `image/webp`
        });
        const canvas2 = drawFn(bitmap, fn);
        const blob2 = await canvas2.convertToBlob({
          type: `image/webp`
        });
        log(`Blob from ${internalFormat} is ${blob.size}b(webgl) vs ${blob2.size}b(code)`);
        if (false) {
          const img = new Image();
          img.src = URL.createObjectURL(blob);
          document.body.appendChild(img);
          const img2 = new Image();
          img2.src = URL.createObjectURL(blob2);
          document.body.appendChild(img2);
        }
      }

      function drawFn(bitmap, fn) {
        const ctx = (new OffscreenCanvas(bitmap.width, bitmap.height)).getContext("2d");
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          const n = fn(pixels.subarray(i, i + 4));
          pixels.set(n, i);
        }
        ctx.putImageData(imageData, 0, 0);
        return ctx.canvas;
      }

      function drawCanvas(bitmap, internalFormat, format, type) {
        const gl = (new OffscreenCanvas(bitmap.width, bitmap.height)).getContext("webgl2", {
          antialias: false,
          alpha: false,
          depth: false,
        });

        function createShader(gl, type, glsl) {
          const shader = gl.createShader(type);
          gl.shaderSource(shader, glsl)
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return;
          }
          return shader;
        }


        const vs = createShader(
          gl,
          gl.VERTEX_SHADER,
          `#version 300 es
            #define POSITION_LOCATION 0
            layout(location = POSITION_LOCATION) in vec2 position;

            void main()
            {
                gl_Position = vec4(position, 0.0, 1.0);
            }`,
        );

        const fs = createShader(
          gl,
          gl.FRAGMENT_SHADER,
          `#version 300 es
            precision mediump float;
            precision mediump sampler2D;

            uniform sampler2D sampler;
            uniform vec2 dimensions;

            out vec4 color;

            void main()
            {
                color = texture(sampler, vec2(gl_FragCoord.x/dimensions.x, 1.0 - (gl_FragCoord.y/dimensions.y)));
            }`,
        );

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        const sampler = gl.getUniformLocation(program, 'sampler');
        const dimensions = gl.getUniformLocation(program, 'dimensions');
        const position = 0; // GLSL location


        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        gl.enableVertexAttribArray(position);
        const vxBuffer = gl.createBuffer();
        const vertices = new Float32Array([-1.0, -1.0,
          1.0, -1.0, -1.0, 1.0,
          1.0, 1.0,
        ]);
        gl.bindBuffer(gl.ARRAY_BUFFER, vxBuffer);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl[internalFormat],
          bitmap.width,
          bitmap.height,
          0,
          gl[format],
          gl[type],
          bitmap
        );

        gl.useProgram(program);
        gl.uniform1i(sampler, 0);
        gl.uniform2f(dimensions, gl.canvas.width, gl.canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.deleteTexture(texture);
        gl.deleteVertexArray(vao);
        gl.deleteBuffer(vxBuffer);
        gl.deleteProgram(program);

        return gl.canvas;
      }
    })()

    function log(...args) {
      const elem = document.createElement('pre');
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    pre { margin: 0; }

<!-- end snippet -->

> Why setting format in gl.texImage2D to gl.LUMINANCE instead of gl.RGB makes the blob made out of the canvas only ~5% smaller in filesize?

I'm not seeing these results. In your example the black and white images stay the same size as RGB vs LUMIANCE. The color image becomes 1/2 size. But of course it depends on the compression algorithm whether or not a black and white 32bit image gets compressed smaller than a color 32bit image since in all cases the canvas is 32bits when convertToBlob is called.
