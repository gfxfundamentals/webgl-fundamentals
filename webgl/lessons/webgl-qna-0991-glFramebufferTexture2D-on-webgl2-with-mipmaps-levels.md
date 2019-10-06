Title: glFramebufferTexture2D on webgl2 with mipmaps levels
Description:
TOC: qna

# Question:

With webGL2 derived from ES3.0 I thought that we can use **mipmap levels** as the last parameter of:

    void glFramebufferTexture2D(GLenum target,
  GLenum attachment,
  GLenum textarget,
  GLuint texture,
  GLint level);

Now from [Khronos ES3.0][1] official documentation states that mipmap levels are supposed to work:

> level:
Specifies the mipmap level of texture to attach.

From [Khronos ES2.0][2] instead it says it *must* be 0

> level:
Specifies the mipmap level of the texture image to be attached, which must be 0.

Now, the I cannot find any docs from WebGL2.0 context about glFramebufferTexture2D, but the mozilla docs states that mipmap layer must be 0, as in ES2.0, here:
[Mozilla WebGL doc][3]

> level:
A GLint specifying the mipmap level of the texture image to be attached. Must be 0.

That page I think refers to WebGL1 context but it has mentions of WebGL2 features in it, and I cannot find glFramebufferTexture2D on WebGL2 docs.

So to wrap it up, is there a way to use **mipmap levels** on framebuffer targets on **WebGL2.0**? 

(I've looked into layered images but AFAIK layered rendering is not available for WebGL2.0)

  [1]: https://www.khronos.org/registry/OpenGL-Refpages/es3.0/html/glFramebufferTexture2D.xhtml
  [2]: https://www.khronos.org/registry/OpenGL-Refpages/es2.0/xhtml/glFramebufferTexture2D.xml
  [3]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D

# Answer

> is there a way to use mipmap levels on framebuffer targets on WebGL2.0

Yes

I'd close the answer there but I guess I wonder did you actually try something and have it not work? You have to create a WebGL2 context to use mipmap levels as framebuffer attachments but otherwise yes, it works. On WebGL1 it will not work.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      
      const vs = `#version 300 es
      void main() {
        // just draw an 8x8 pixel point in the center of the target
        // this shader needs/uses no attributes
        gl_Position = vec4(0, 0, 0, 1);
        gl_PointSize = 8.0;
      }
      `;
      const fsColor = `#version 300 es
      precision mediump float;
      uniform vec4 color;
      out vec4 outColor;
      void main() {
        outColor = color;
      }
      `;
      const fsTexture = `#version 300 es
      precision mediump float;
      uniform sampler2D tex;
      out vec4 outColor;
      void main() {
        // this shader needs no texcoords since we just
        // use gl_PoitnCoord provided by rendering a point with gl.POINTS
        // bias lets select the mip level so no need for 
        // some fancier shader just to show that it's working.        
        float bias = gl_PointCoord.x * gl_PointCoord.y * 4.0;
        outColor = texture(tex, gl_PointCoord.xy, bias);
      }
      `;
      
      // compile shaders, link into programs, look up attrib/uniform locations
      const colorProgramInfo = twgl.createProgramInfo(gl, [vs, fsColor]);
      const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fsTexture]);
      
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const levels = 4;
      const width = 8;
      const height = 8;
      gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, width, height);
      
      // make a framebuffer for each mip level
      const fbs = [];
      for (let level = 0; level < levels; ++level) {
        const fb = gl.createFramebuffer();
        fbs.push(fb);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, tex, level);
      }
      
      // render a different color to each level
      const colors = [
        [1, 0, 0, 1],  // red
        [0, 1, 0, 1],  // green
        [0, 0, 1, 1],  // blue
        [1, 1, 0, 1],  // yellow
      ];
      gl.useProgram(colorProgramInfo.program);
      for (let level = 0; level < levels; ++level) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[level]);
        const size = width >> level;
        gl.viewport(0, 0, size, size);
        twgl.setUniforms(colorProgramInfo, { color: colors[level] });
        const offset = 0;
        const count = 1;
        gl.drawArrays(gl.POINTS, offset, count);  // draw 1 point
      }
      
      // draw the texture's mips to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(textureProgramInfo.program);
      // no need to bind the texture it's already bound
      // no need to set the uniform it defaults to 0
      gl.drawArrays(gl.POINT, 0, 1);  // draw 1 point
    }
    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas width="8" height="8" style="width: 128px; height: 128px;"></canvas>

<!-- end snippet -->

You can also render to layers of TEXTURE_2D_ARRAY texture. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      
      const vs = `#version 300 es
      void main() {
        // just draw an 8x8 pixel point in the center of the target
        // this shader needs/uses no attributes
        gl_Position = vec4(0, 0, 0, 1);
        gl_PointSize = 8.0;
      }
      `;
      const fsColor = `#version 300 es
      precision mediump float;
      uniform vec4 color;
      out vec4 outColor;
      void main() {
        outColor = color;
      }
      `;
      const fsTexture = `#version 300 es
      precision mediump float;
      uniform mediump sampler2DArray tex;
      out vec4 outColor;
      void main() {
        // this shader needs no texcoords since we just
        // use gl_PoitnCoord provided by rendering a point with gl.POINTS
        float layer = gl_PointCoord.x * gl_PointCoord.y * 4.0;
        outColor = texture(tex, vec3(gl_PointCoord.xy, layer));
      }
      `;
      
      // compile shaders, link into programs, look up attrib/uniform locations
      const colorProgramInfo = twgl.createProgramInfo(gl, [vs, fsColor]);
      const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fsTexture]);
      
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      const levels = 1;
      const width = 8;
      const height = 8;
      const layers = 4;
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, width, height, layers);
      // only use level 0 (of course we could render to levels in layers as well)
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      
      // make a framebuffer for each layer
      const fbs = [];
      for (let layer = 0; layer < layers; ++layer) {
        const fb = gl.createFramebuffer();
        fbs.push(fb);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        const level = 0;  
        gl.framebufferTextureLayer(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            tex, level, layer);
      }
      
      // render a different color to each layer
      const colors = [
        [1, 0, 0, 1],  // red
        [0, 1, 0, 1],  // green
        [0, 0, 1, 1],  // blue
        [1, 1, 0, 1],  // yellow
      ];
      gl.useProgram(colorProgramInfo.program);
      for (let layer = 0; layer < layers; ++layer) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[layer]);
        gl.viewport(0, 0, width, height);
        twgl.setUniforms(colorProgramInfo, { color: colors[layer] });
        const offset = 0;
        const count = 1;
        gl.drawArrays(gl.POINTS, offset, count);  // draw 1 point
      }
      
      // draw the texture's mips to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(textureProgramInfo.program);
      // no need to bind the texture it's already bound
      // no need to set the uniform it defaults to 0
      gl.drawArrays(gl.POINT, 0, 1);  // draw 1 point
    }
    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas width="8" height="8" style="width: 128px; height: 128px; image-rendering: pixelated;"></canvas>

<!-- end snippet -->


