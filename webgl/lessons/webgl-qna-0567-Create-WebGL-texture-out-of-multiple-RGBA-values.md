Title: Create WebGL texture out of multiple RGBA values
Description:
TOC: qna

# Question:

I am creating a WebGL texture out of one RGBA value based on [this](https://stackoverflow.com/a/38668764/6609337) answer, and was wondering how to create one based off of multiple RGBA values. 

For this array,

    var textureData = new Uint8Array([128, 128, 0, 255]);

I tried to add additional values for another RGBA value, but nothing changed. For reference, I will have 262,144 RGBA values, if that makes a difference.

Thank you!



# Answer

[From the spec](https://www.khronos.org/registry/webgl/specs/1.0/) The signature for `gl.texImage2D` is

    gl.texImage2D(
      target,          // TEXTURE_2D or TEXTURE_CUBE_MAP
      level,           // mip level 0 to n
      internalFormat,  // must match `format` below in WebGL 1.0
      width,           // width of `data` in pixels
      height,          // height of `data` in pixels
      border,          // must always be 0 in WebGL
      format,          // gl.RGBA, gl.RGB, gl.ALPHA, gl.LUMINANCE, ...
      type,            // gl.UNSIGNED_BYTE, ...
      data);           // your data which is width * height pixels

Example 3x2

    // here's 3x2 RGBA/UNSIGNED_BYTE pixels
    var data = new Uint8Array([
      255, 0, 0, 255,      255, 255, 0, 255,    0, 255, 0, 255,
      0, 255, 255, 255,    0, 0, 255, 255,      255, 255, 255, 255,
    ]);
    var level = 0;
    var width = 3;
    var height = 2;
    var format = gl.RGBA;
    var type = gl.UNSIGNED_BYTE;
    var internalFormat = format;
    var border = 0;
    var target = gl.TEXTURE_2D;

    gl.texImage2D(
      target,          // TEXTURE_2D or TEXTURE_CUBE_MAP
      level,           // mip level 0 - n
      internalFormat,  // must match `format` below in WebGL 1.0
      width,           // width of `data` in pixels
      height,          // height of `data` in pixels
      border,          // must always be 0 in WebGL
      format,          // gl.RGBA, gl.RGB, gl.ALPHA, gl.LUMINANCE, ...
      type,            // gl.UNSIGNED_BYTE, ...
      data);           // your data which is width * height pixels

There's also `gl.texSubImage2D` if you want to update a smaller portion of a larger texture.

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    void main() {
      gl_PointSize = 100.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;
    var fs = `
    precision mediump float;
    uniform sampler2D texture;
    void main() {
      gl_FragColor = texture2D(texture, gl_PointCoord);
    }
    `;
    var gl = document.createElement("canvas").getContext("webgl");
    document.body.appendChild(gl.canvas);
    var program = twgl.createProgramFromSources(gl, [vs, fs]);
    gl.useProgram(program);

    // here's 3x2 RGBA/UNSIGNED_BYTE pixels
    var data = new Uint8Array([
      255, 0, 0, 255,      255, 255, 0, 255,    0, 255, 0, 255,
      0, 255, 255, 255,    0, 0, 255, 255,      200, 200, 200, 255,
    ]);
    var level = 0;
    var width = 3;
    var height = 2;
    var format = gl.RGBA;
    var type = gl.UNSIGNED_BYTE;
    var internalFormat = format;
    var border = 0;
    var target = gl.TEXTURE_2D;

    var texture = gl.createTexture();
    gl.bindTexture(target, texture);
    gl.texImage2D(
      target,          // TEXTURE_2D or TEXTURE_CUBE_MAP
      level,           // 0 to n (mip level)
      internalFormat,  // must match `format` below in WebGL 1.0
      width,           // width of `data` in pixels
      height,          // height of `data` in pixels
      border,          // must always be 0 in WebGL
      format,          // gl.RGBA, gl.RGB, gl.ALPHA, gl.LUMINANCE, ...
      type,            // gl.UNSIGNED_BYTE, ...
      data);           // your data which is width * height pixels

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      
    gl.drawArrays(gl.POINTS, 0, 1);
      

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl.min.js"></script>

<!-- end snippet -->


