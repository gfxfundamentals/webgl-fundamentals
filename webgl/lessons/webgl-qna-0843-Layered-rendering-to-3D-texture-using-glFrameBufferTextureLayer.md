Title: Layered rendering to 3D texture using glFrameBufferTextureLayer
Description:
TOC: qna

# Question:

My goal is to render slices to a 3D texture using `gl.frameBufferTextureLayer`. However, nothing gets rendered when I read back the data with `gl.readPixels`. 

When I'm changing `gl.TEXTURE_3D`to `gl.TEXTURE_2D_ARRAY` it works fine, but in the tests [here][1] they are certainly attaching a layer of a 3D texture to the FBO. The WebGL [docs][2] doesn't say anything about what texture should be, but 
GLES3 [docs][3] allows texture to be a 3D texture for sure. I've checked framebuffer complete status and all that stuff..

Are there any resources for attaching a 3D texture layer to a FBO in WebGL2, is this even possible? Some code:

    this.fbo= gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
 
    this.colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, this.colorTexture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, 64, 64, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    this.renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 64, 64);    
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderBuffer);

    // Use level 1 in 3D texture
    // Works when texture is GL_TEXTURE_2D_ARRAY
    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.texture, 0, 1);
    
    // ... Render scene

    let data = new Uint8Array(64 * 64 * 4);
    gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, data, 0); // data is empty
    
  [1]: https://github.com/KhronosGroup/WebGL/blob/master/sdk/tests/conformance2/renderbuffers/framebuffer-texture-layer.html
  [2]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/framebufferTextureLayer
  [3]: https://www.khronos.org/registry/OpenGL-Refpages/es3.0/html/glFramebufferTextureLayer.xhtml

# Answer

First let's try a simple one no rendering

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl2");
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, 2, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tex, 0, 1);

    gl.clearColor(.25, .5, .75, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const data = new Uint8Array(2 * 2 * 4);
    gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, data);
    console.log(data);

<!-- end snippet -->

That works

Now let's try rendering

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl2");
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, 2, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tex, 0, 1);

    const vs = `
    #version 300 es
    void main() {
      gl_Position = vec4(0, 0, 0, 1);
      gl_PointSize = 4.0;
    }
    `;

    const fs = `
    #version 300 es
    precision mediump float;
    out vec4 color;
    void main() {
      color = vec4(.75, .5, .25, 1);
    }
    `

    const prg = twgl.createProgram(gl, [vs, fs]);
    gl.useProgram(prg);
    gl.viewport(0, 0, 2, 2);
    gl.drawArrays(gl.POINTS, 0, 1);

    const data = new Uint8Array(2 * 2 * 4);
    gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, data);
    console.log(data);

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

That works too.

Let's try with a depth buffer

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl2");
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, tex);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, 2, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tex, 0, 1);

    const rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 2, 2);    
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);


    const vs = `
    #version 300 es
    uniform float depth;
    void main() {
      gl_Position = vec4(0, 0, depth, 1);
      gl_PointSize = 4.0;
    }
    `;

    const fs = `
    #version 300 es
    precision mediump float;
    uniform vec4 color;
    out vec4 outColor;
    void main() {
      outColor = color;
    }
    `

    const prgInfo = twgl.createProgramInfo(gl, [vs, fs]);
    gl.useProgram(prgInfo.program);
    gl.viewport(0, 0, 2, 2);
    gl.enable(gl.DEPTH_TEST);

    // draw in middle
    twgl.setUniforms(prgInfo, {
      depth: 0,
      color: [1, 0, 0, 1],
    });
    gl.drawArrays(gl.POINTS, 0, 1);


    // draw in front
    twgl.setUniforms(prgInfo, {
      depth: -.5,
      color: [0, 1, 0, 1],
    });
    gl.drawArrays(gl.POINTS, 0, 1);

    // draw in back
    twgl.setUniforms(prgInfo, {
      depth: .5,
      color: [0, 0, 1, 1],
    });
    gl.drawArrays(gl.POINTS, 0, 1);

    // should be front color (0, 255, 0, 255)

    const data = new Uint8Array(2 * 2 * 4);
    gl.readPixels(0, 0, 2, 2, gl.RGBA, gl.UNSIGNED_BYTE, data);
    console.log(data);

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

Seems to work

Maybe you're forgetting to set the viewport? I make that mistake often
