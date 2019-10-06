Title: gl.texImage2D works with Image, but not with ImageData
Description:
TOC: qna

# Question:

I have a texture that renders correctly when I use `gl.texImage2D` with javascript's `Image` object to specify the pixel data.  But if I render the `Image` to an off-screen canvas, then pull an `ImageData` object out of that, and then feed that to `gl.texImage2D` instead, the texture does not draw correctly.  When I examine the `ImageData` object, the pixel data is correct.  What could `gl.texImage2D` be doing differently with the `Image` object than with the `ImageData` object?

The image is simply 32-bit, 8-bits per component, RGBA.  My fragment shader gets and expects these components as values in `[0,1]`.  Could it be that when I pass in the `ImageData` object that my shader is now getting them in the range `[0,255]`?  I'll have to test that hypothesis.  In any case, I am at a complete loss.

EDIT: After much toil, I have come to find that there isn't anything wrong with the OpenGL and shader pipe-line stuff.  The problem I'm facing has to do with the conversion from Image to ImageData.  Here is some code...


    let perm_image = new Image();
    ...
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    canvas.width = perm_image.width;
    canvas.height = perm_image.height;
    context.drawImage(perm_image, 0, 0);
    let perm_image_data = context.getImageData(0, 0, perm_image.width, perm_image.height);
        

I have compared the returned image data with the actual image data and while the first part of the buffer looked correct, the rest of it is wrong.  I had made this check before, but stopped too soon.

Anyhow, I'm going to poke around and see how I can change/fix the above code.

FINAL EDIT: I've decided to give up.  There is no bullet-proof way I know of to get the raw, unaltered RGBA data out of a JS `Image` object, which I think is a total failure on the part of whoever invented that damn object.  What I'm going to have to do is just not use PNG files, but my own binary format.

# Answer

Seems to work for me. Maybe compare and see what you might be doing differently?

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const img = new Image();
    img.addEventListener('load', render);
    img.crossOrigin = "";
    img.src = "https://i.imgur.com/ZKMnXce.png";

    function render() {
      const vs = `
      attribute vec4 position;
      void main() {
        gl_PointSize = 80.0;
        gl_Position = position;
      }
      `;

      const fs = `
      precision mediump float;
      uniform sampler2D tex;
      void main() {
        gl_FragColor = texture2D(tex, gl_PointCoord);
      }
      `;

      const gl = document.querySelector("canvas").getContext("webgl");
      const program = twgl.createProgram(gl, [vs, fs]);
      const positionLoc = gl.getAttribLocation(program, "position");
      
      const ctx = document.createElement("canvas").getContext("2d");
      ctx.canvas.width = img.width;
      ctx.canvas.height = img.height;
      ctx.fillStyle = '#FFF'
      ctx.drawImage(img, 0, 0);
      ctx.font = "bold 48px sans-serif";
      ctx.fillText("imageData", 10, 200);

      const imgData = ctx.getImageData(0, 0, img.width, img.height);

      ctx.drawImage(img, 0, 0);
      ctx.fillText("canvas", 10, 200);

      gl.useProgram(program);

      createTextureAndDraw(img, -.6);
      createTextureAndDraw(ctx.canvas, 0);
      createTextureAndDraw(imgData, .6);
      
      function createTextureAndDraw(src, x) {
      
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        {
          const level = 0;
          const internalFormat = gl.RGBA;
          const width = 1;
          const height = 1;
          const border = 0;
          const format = gl.RGBA;
          const type = gl.UNSIGNED_BYTE;
          gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        format, type, src);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        
        gl.vertexAttrib1f(positionLoc, x);

        const primitiveType = gl.POINTS;
        const offset = 0;
        const count = 1;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Reading the updates to your question you should probably open a new question since your actual problem is not at all related to the question you asked.

First off, Canvas is **ALWAYS PREMULTIPLIED**. That means it's lossy.

That's covered in detail in this answer: https://stackoverflow.com/a/50566789/128511

Since you are going Image(png) -> Canvas -> ImageData then if your PNG has any non 255 alpha you're going to lose data.

Second you mentioned gamma correction. Yes, the browser will gamma correct and or apply other color conversions to the images. This is so images drawn in WebGL will match images draw into Canvas as well as images displayed on the page. 

To avoid the color conversion you need to set ` gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)` which tells WebGL to do whatever it has to get the original data out of the image (which could include re-decoding the image from scratch since the image's default data is whatever format the browser needs for drawing image tags in HTML).

Here's an example of not applying color conversion. It creates 2 textures from the same image. Once with the default color conversion, once without. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const img = new Image();
    img.addEventListener('load', render);
    img.crossOrigin = "";
    img.src = "https://cdn.rawgit.com/KhronosGroup/WebGL/8ea92581/sdk/tests/resources/small-square-with-colorspin-profile.png";

    function render() {
      const vs = `
      attribute vec4 position;
      void main() {
        gl_PointSize = 130.0;
        gl_Position = position;
      }
      `;

      const fs = `
      precision mediump float;
      uniform sampler2D tex;
      void main() {
        gl_FragColor = texture2D(tex, gl_PointCoord);
      }
      `;

      const gl = document.querySelector("canvas").getContext("webgl");
      const program = twgl.createProgram(gl, [vs, fs]);
      const positionLoc = gl.getAttribLocation(program, "position");
      
      gl.useProgram(program);

      createTextureAndDraw(img, -.5, true);   // default (with COLOR CONVERSION)
      createTextureAndDraw(img,  .5, false);  // color conversion OFF
      
      function createTextureAndDraw(src, x, colorConversion) {
      
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        const mode = colorConversion ? gl.BROWSER_DEFAULT_WEBGL : gl.NONE;
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, mode);
        {
          const level = 0;
          const internalFormat = gl.RGBA;
          const width = 1;
          const height = 1;
          const border = 0;
          const format = gl.RGBA;
          const type = gl.UNSIGNED_BYTE;
          gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                        format, type, src);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        
        gl.vertexAttrib1f(positionLoc, x);

        const primitiveType = gl.POINTS;
        const offset = 0;
        const count = 1;
        gl.drawArrays(primitiveType, offset, count);
      }
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Note: this is an extreme example as the texture is red with color conversion and blue without. If you open the file in photoshop you'll see as far as the raw data it's blue but based on the color profile it's displayed as red.

[![enter image description here][1]][1]

There are several extreme examples in the [WebGL conformance test for this feature](https://www.khronos.org/registry/webgl/sdk/tests/conformance/textures/misc/gl-teximage.html?webglVersion=1&quiet=0) to test that you can get the raw data from an PNG in WebGL.


  [1]: https://i.stack.imgur.com/vdHet.png
