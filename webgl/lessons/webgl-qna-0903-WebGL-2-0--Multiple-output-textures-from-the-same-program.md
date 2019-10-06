Title: WebGL 2.0: Multiple output textures from the same program
Description:
TOC: qna

# Question:

I'm trying to learn how to do multiple outputs from the same program in WebGL2 leveraging `gl.drawBuffer()` capabilities. 

I looked at the book "**OpenGL ES 3.0 Programming Guide**", chapter 11 where it lists what is needed for multi-output to take place. However the shader source example is very trivial outputting only constant values.

I'd like to know if someone has a better example? or if one could explain what happened to the TextureCoordinates varying? In normal shader code I would use that to find data values from my inputs and write them out. Now in the face of multiple layouts, how would the TextureCoordinates varying correspond to each layout? What happens to the dimensions of my viewPort? which output Texture does that correspond with?

Here are some steps the way I understood them:

1. Create a Color attachment array GL_COLOR_ATTACHMENT0, ...
2. Create a framebuffer object for each output
3. Create output textures
4. For each FB: 
    - BindFramebuffer
    - BindTexture
    - Associate texture with FBO: frameBufferTexture2D (..., color_attchment_from_step1)

5. call drawBuffers passing the color attachment array

Inside the shader access output values like this:

    layout(location = 0) out vec4 fragData0;
    
    layout(location = 1) out vec4 fragData1;



# Answer

You only need one framebuffer object. You attach all the textures to it. So your steps would be

1. Create a framebuffer object and BindFramebuffer
2. Create output textures
3. For each texture:
  1. Associate texture with FBO: frameBufferTexture2D(...)
4. Create a Color attachment array GL_COLOR_ATTACHMENT0, ...
5. call drawBuffers passing the color attachment array



<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert("need WebGL2");
      }
      const vs = `
      #version 300 es
      void main() {
        gl_PointSize = 300.0;
        gl_Position = vec4(0, 0, 0, 1);
      }
      `;

      const fs = `
      #version 300 es
      precision mediump float;

      layout(location = 0) out vec4 outColor0;
      layout(location = 1) out vec4 outColor1;
      layout(location = 2) out vec4 outColor2;
      layout(location = 3) out vec4 outColor3;

      void main() {
        outColor0 = vec4(1, .5, .3, .7);   // orange
        outColor1 = vec4(.6, .5, .4, .3);  // brown
        outColor2 = vec4(.2, .8, .0,  1);  // green
        outColor3 = vec4(.3, .4, .9, .6);  // blue
      } 
      `

      const program = twgl.createProgram(gl, [vs, fs]);

      const textures = [];
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      for (let i = 0; i < 4; ++i) {
        const tex = gl.createTexture();
        textures.push(tex);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        const width = 1;
        const height = 1;
        const level = 0;
        gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, width, height, 0, 
                      gl.RGBA, gl.UNSIGNED_BYTE, null);
        // attach texture to framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i,
                                gl.TEXTURE_2D, tex, level);
      }

      // our framebuffer textures are only 1x1 pixels
      gl.viewport(0, 0, 1, 1);

      // tell it we want to draw to all 4 attachments
      gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1, 
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3,
      ]);

      // draw a single point
      gl.useProgram(program);
      {
        const offset = 0;
        const count = 1
        gl.drawArrays(gl.POINT, 0, 1);
      }

      // --- below this is not relevant to the question but just so we
      // --- we can see it's working

      // render the 4 textures
      const fs2 = `
      #version 300 es
      precision mediump float;
      uniform sampler2D tex[4];
      out vec4 outColor;
      void main() {
        vec4 color = vec4(0);
        for (int i = 0; i < 4; ++i) { 
          float x = gl_PointCoord.x * 4.0;
          float amount = step(float(i), x) * step(x, float(i + 1));
          color = mix(color, texture(tex[i], vec2(0)), amount);
        }
        outColor = vec4(color.rgb, 1);
      }
      `;
      const prgInfo2 = twgl.createProgramInfo(gl, [vs, fs2]);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(prgInfo2.program);
      // binds all the textures and set the uniforms
      twgl.setUniforms(prgInfo2, {
        tex: textures,
      });
      gl.drawArrays(gl.POINTS, 0, 1);
    }
    main();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


