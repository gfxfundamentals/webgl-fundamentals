Title: Q: why does sampler2d always return vec4(0.0) when alpha is zero?
Description:
TOC: qna

# Question:

I'm trying to pass some non-texture values to a pixel shader in a texture and i'm running into a weird problem where `sampler2d` returns `vec4(0.0)` when the texture's alpha value is zero, regardless of the value of the other 3 bytes.

this isn't a premultiplied alpha thing, or a blending thing, it doesn't happen when the alpha's byte value is 1 through 255, just zero.

if you run the code below you'll see a 2x2 texture in the small 2d canvas being rendered into the large 3d canvas. all 4 pixels have r,g,b = 255. and all 4 pixels have different a values. the top-left pixel of the texture has an alpha value of zero.

the pixel shader sets `gl_FragColor.a = 1.0` always.

the reason i don't believe this is a premultiplied alpha thing is that if it were, then surely all 3 pixels would be different shades of grey?

can anyone tell me why this happens?

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const cvs = document.getElementById("cvs"),
      {
        width: W,
        height: H
      } = cvs.getBoundingClientRect();
    cvs.width = W;
    cvs.height = H;


    const gl = cvs.getContext("experimental-webgl", {
        premultipliedAlpha: false
      }),
      VERTEX_SHADER = `attribute vec4 a_Position;
        attribute vec2 a_TexCoord;
        varying vec2 v_TexCoord;
        void main() {
          gl_Position = a_Position;
          v_TexCoord = a_TexCoord;
        }`,
      FRAGMENT_SHADER = `precision mediump float;
        uniform sampler2D u_Sampler;
        varying vec2 v_TexCoord;
        void main() {
          gl_FragColor.rgb = texture2D(u_Sampler, v_TexCoord).rgb;
          gl_FragColor.a = 1.0;
        }`,
      vshader = gl.createShader(gl.VERTEX_SHADER),
      fshader = gl.createShader(gl.FRAGMENT_SHADER),
      program = gl.createProgram();

    gl.shaderSource(vshader, VERTEX_SHADER);
    gl.shaderSource(fshader, FRAGMENT_SHADER);
    gl.compileShader(vshader);
    gl.compileShader(fshader);
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    gl.useProgram(program);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const farr = new Float32Array([-1, 1, 0, 1, -1, -1, 0, 0,
      1, 1, 1, 1,
      1, -1, 1, 0
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, farr, gl.STATIC_DRAW);
    const a_Position = gl.getAttribLocation(program, "a_Position"),
      a_TexCoord = gl.getAttribLocation(program, "a_TexCoord"),
      fsize = farr.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 4 * fsize, 0);
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 4 * fsize, 2 * fsize);
    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_TexCoord);

    var image = document.getElementById("img"),
      context = image.getContext("2d"),
      imageData = context.getImageData(0, 0, 2, 2),
      pixels = imageData.data;

    for (var i = 0; i < pixels.length; i++) {
      pixels[i] = 255;
    }
    pixels[0 * 4 + 3] = 0;
    pixels[1 * 4 + 3] = 1;
    pixels[2 * 4 + 3] = 128;

    context.putImageData(imageData, 0, 0, 0, 0, 2, 2);

    const texture = gl.createTexture(),
      u_Sampler = gl.getUniformLocation(program, "u_Sampler");

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    gl.uniform1i(u_Sampler, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

<!-- language: lang-css -->

    html,
    body,
    canvas {
      padding: 0;
      margin: 0;
    }

    canvas {
      border: 1px solid red;
      display: block;
      margin: 5px;
    }

    body {
      background: black;
      display: block;
      position: absolute;
      width: 100%;
      height: 100%;
    }

    #cvs {
      width: 100px;
      height: 100px;
    }

<!-- language: lang-html -->

    <canvas id="cvs"></canvas>

    <canvas id="img" width="2" height="2"></canvas>

<!-- end snippet -->



# Answer

What @pleup said. Canvas 2d values are always written into the canvas premultiplied. That means the moment you called `putImageData` your data was multiplied by alpha and the data was lost.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const ctx = document.createElement("canvas").getContext("2d");
    const imgData = ctx.createImageData(2, 2);
    const data = imgData.data;
    data[ 0] = 255; data[ 3] = 255;
    data[ 4] = 255; data[ 7] = 192;
    data[ 8] = 255; data[11] = 64;
    data[12] = 255; data[15] = 0;

    ctx.putImageData(imgData, 0, 0);

    const newImgData = ctx.getImageData(0, 0, 2, 2);
    const newData = newImgData.data;
    console.log(newData[ 0], newData[ 3]);
    console.log(newData[ 4], newData[ 7]);
    console.log(newData[ 8], newData[11]);
    console.log(newData[12], newData[15]);

<!-- end snippet -->

Using 255 for color partly hides the issue since what's in the 2d canvas after you call `putImageData` is

    red = 255   alpha = 255
    red = 192   alpha = 192
    red =  64   alpha = 64
    red =   0   alpha = 0

Unpremultiplying (when uploading to WebGL) you get 255s back for all values except 0

                               red        alpha  result
    red = 255   alpha = 255  = 255 * 255 / 255 = 255 
    red = 192   alpha = 192  = 192 * 255 / 192 = 255
    red =  64   alpha = 64   =  64 * 255 / 64  = 255
    red =   0   alpha = 0    =   0 * 0         =   0

If the color value was say 20 and different alphas

    red = 20 *  10 / 255 = 1   alpha = 10
    red = 20 *   7 / 255 = 1   alpha = 7
    red = 20 *   4 / 255 = 0   alpha = 4
    red = 20 *   0 / 255 = 0   alpha = 0

And then unpremultiplying gets

     1 * 255 / 10  = 26    not even close to what we put in
     1 * 255 /  7  = 36    not even close to what we put in
     0 * 255 /  4  = 0
     0 * 0         = 0

Just pointing out how lossy it is.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const ctx = document.createElement("canvas").getContext("2d");
    const imgData = ctx.createImageData(2, 2);
    const data = imgData.data;
    data[ 0] = 20; data[ 3] = 10;
    data[ 4] = 20; data[ 7] = 7;
    data[ 8] = 20; data[11] = 4;
    data[12] = 20; data[15] = 0;

    ctx.putImageData(imgData, 0, 0);

    const newImgData = ctx.getImageData(0, 0, 2, 2);
    const newData = newImgData.data;
    console.log(newData[ 0], newData[ 3]);
    console.log(newData[ 4], newData[ 7]);
    console.log(newData[ 8], newData[11]);
    console.log(newData[12], newData[15]);

<!-- end snippet -->


If you actually want to manually put data in a texture in WebGL you should just use a typedArray

    const width = 2;
    const height = 2;
    const data = new Uint8Array(width * height * 4);

    data[ 0] = 255; data[ 3] = 255;
    data[ 4] = 255; data[ 7] = 192;
    data[ 8] = 255; data[11] = 64;
    data[12] = 255; data[15] = 0;

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
                  format, type, data);

If you want to read that data instead of going through a 2d canvas just call `gl.readPixels`

    const newData = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, format, type);

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("canvas").getContext("webgl", {
      premultipliedAlpha: false,
    });
    const VERTEX_SHADER = `
      attribute vec4 a_Position;
      attribute vec2 a_TexCoord;
      varying vec2 v_TexCoord;
      void main() {
        gl_Position = a_Position;
        v_TexCoord = a_TexCoord;
      }
    `;
    const FRAGMENT_SHADER = `
      precision mediump float;
      uniform sampler2D u_Sampler;
      varying vec2 v_TexCoord;
      void main() {
        gl_FragColor = texture2D(u_Sampler, v_TexCoord);
      }
    `;
    const vshader = gl.createShader(gl.VERTEX_SHADER);
    const fshader = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();

    gl.shaderSource(vshader, VERTEX_SHADER);
    gl.shaderSource(fshader, FRAGMENT_SHADER);
    gl.compileShader(vshader);
    gl.compileShader(fshader);
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    gl.useProgram(program);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const farr = new Float32Array([
      -1, 1, 0, 1, 
      -1, -1, 0, 0,
      1, 1, 1, 1,
      1, -1, 1, 0
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, farr, gl.STATIC_DRAW);
    const a_Position = gl.getAttribLocation(program, "a_Position");
    const a_TexCoord = gl.getAttribLocation(program, "a_TexCoord");
    const fsize = farr.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 4 * fsize, 0);
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 4 * fsize, 2 * fsize);
    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_TexCoord);

    const pixels = new Uint8Array(2 * 2 * 4);
    pixels.fill(255);
    pixels[0 * 4 + 3] = 0;
    pixels[1 * 4 + 3] = 1;
    pixels[2 * 4 + 3] = 128;
    const texture = gl.createTexture();
    const u_Sampler = gl.getUniformLocation(program, "u_Sampler");

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);


<!-- language: lang-css -->

    canvas { background: red; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->


