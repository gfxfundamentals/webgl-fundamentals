Title: Unable to generate mipmap for half_float texture
Description:
TOC: qna

# Question:

I am using webgl2 and loading my texture data as half floats. I can render the image correctly when using `LINEAR` MIN_FILTER. However, I want to use a mipmap filter. When I use a mipmap filter and attempt to generate mipmaps it fails. The webgl documentation https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D indicates R16F textures are filterable and doesn't indicate it is limited to LINEAR filters. Is there a step I am missing or is this an undocumented limitation of webgl2? 

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    const tex = gl.createTexture();
    const unit = 1;  // Pick some texture unit
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    const numPixels = this.width * this.height;

    const level = 0;

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //Works
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST); //Does NOT work
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Upload the image into the texture
    const pixel = new Uint16Array(this.binaryImage);

    gl.texImage2D(gl.TEXTURE_2D, level, gl.R16F, this.width, this.height, 0, gl.RED, gl.HALF_FLOAT, pixel);

    gl.generateMipmap(gl.TEXTURE_2D); //FAILS

    const sampler2DLoc = gl.getUniformLocation(program, "u_image");
    gl.uniform1i(sampler2DLoc, unit);



# Answer

WebGL2's spec says WebGL2 is OpenGL ES 3.0 with the differences listed in the WebGL2 spec. Otherwise the WebGL2 spec says to read the OpenGL ES 3.0 spec for the details.

From the OpenGL ES 3.0 spec section 3.8.10.5

> # 3.8.10.5    Manual Mipmap Generation
>
> Mipmaps can be generated manually with the command
>
>     void GenerateMipmap(enumtarget);
>
> ...
>
> If the level base array was not specified with an unsized internal format from table 3.3 or a sized internal format that is both color-renderable and texture-filterable according to table 3.13, an `INVALID_OPERATION` error is generated

R16F is texture-filterable but it is not color-renderable

You'd need to check for and enable [the `EXT_color_buffer_float` extension](https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/) to be able to generate mips for half float formats.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext){
        return alert('need EXT_color_buffer_float');
      }

      const vs = `#version 300 es
      void main() {
        gl_Position = vec4(0, 0, 0, 1);
        gl_PointSize = 120.0;
      } 
      `;

      const fs = `#version 300 es
      precision mediump float;

      uniform sampler2D tex;

      out vec4 outColor;

      void main() {
        outColor = vec4(texture(tex, gl_PointCoord.xy).r, 0, 0, 1);
      }
      `;

      // setup GLSL program
      const program = twgl.createProgram(gl, [vs, fs]);

      // a 2x2 pixel data
      const h0 = 0x0000;
      const h1 = 0x3c00;
      const pixels = new Uint16Array([
        h0, h1,
        h1, h0,
      ]);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
          gl.TEXTURE_2D,
          0,                 // level
          gl.R16F,           // internal format
          2,                 // width
          2,                 // height
          0,                 // border
          gl.RED,            // format
          gl.HALF_FLOAT,     // type
          pixels,            // data
      );
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.useProgram(program);

      const offset = 0;
      const count = 1;
      gl.drawArrays(gl.POINTS, offset, count);
      console.log('gl.getError should be 0 was:', gl.getError());
    }

    main();


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


