Title: Render to 3D texture webgl2
Description:
TOC: qna

# Question:

I read [here][1] that it should be possible to render to a 3D texture in WebGL2 by using multiple render targets and attaching each layer of the 3d texture as a layer to the render target. 

However I can't seem to get it to work, no errors but the values of the texture doesn't change between the reads and is just empty. The texture has `gl.RGBA8` as internal format, `gl.RGBA` as format and a size of `64x64x64`

 What am I doing wrong? This is what I tried so far (pseudo code):

    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.TEXTURE_3D, this.my3DTexture, 0);
    
    this.renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 64, 64);    
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderBuffer);
    
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
      alert("FBO not complete!");
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    this.shader.activate();
    
    // Set uniforms ...

    for (let i = 0; i < 64; i += 8) {
      gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.my3DTexture, 0, 0 + i);
      gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, this.my3DTexture, 0, 1 + i);
      gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, this.my3DTexture, 0, 2 + i);
      gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT3, this.my3DTexture, 0, 3 + i);
      gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT4, this.my3DTexture, 0, 4 + i);
      gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT5, this.my3DTexture, 0, 5 + i);
      gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT6, this.my3DTexture, 0, 6 + i);
      gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT7, this.my3DTexture, 0, 7 + i);
    
      gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3,
        gl.COLOR_ATTACHMENT4,
        gl.COLOR_ATTACHMENT5,
        gl.COLOR_ATTACHMENT6,
        gl.COLOR_ATTACHMENT7,
      ]);
    
      let data = new Uint8Array(64*64 * 4);
      gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, data);
      console.log("before", data);
             
      // Render scene
      scene.objects.forEach(object => {
        this._renderObject(object, scene, camera);
      });
    
      gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, data);
      console.log("after one iteration read", data);
    }


Fragment shader:


    #version 300 es            
    precision highp float;

    layout(location = 0) out vec4 layer0;
    layout(location = 1) out vec4 layer1;
    layout(location = 2) out vec4 layer2;
    layout(location = 3) out vec4 layer3;
    layout(location = 4) out vec4 layer4;
    layout(location = 5) out vec4 layer5;
    layout(location = 6) out vec4 layer6;
    layout(location = 7) out vec4 layer7;

    void main() {
        layer0 = vec4(0.5, 0.5, 0.5, 1.0);
        layer1 = vec4(0.5, 0.5, 0.5, 1.0);
        layer2 = vec4(0.5, 0.5, 0.5, 1.0);
        layer3 = vec4(0.5, 0.5, 0.5, 1.0);
        layer4 = vec4(0.5, 0.5, 0.5, 1.0);
        layer5 = vec4(0.5, 0.5, 0.5, 1.0);
        layer6 = vec4(0.5, 0.5, 0.5, 1.0);
        layer7 = vec4(0.5, 0.5, 0.5, 1.0);
    }

**UPDATE**: It works with `gl.TEXTURE_2D_ARRAY` but fails with `gl.TEXTURE_3D` Why? In the tests [here][2]  they are certainly attaching a layer of a 3d texture.

  [1]: https://groups.google.com/forum/#!topic/webgl-dev-list/kDPaWgwg8XA
  [2]: https://github.com/KhronosGroup/WebGL/blob/master/sdk/tests/conformance2/renderbuffers/framebuffer-texture-layer.html

# Answer

AFAICT in your sample you just needed to call `gl.drawArrays`

Your sample though is trying to render to 8 layers. WebGL2 only requires 4 layers to be supported. You can check if 8 are supported by calling `gl.getParameter(gl.MAX_DRAW_BUFFERS)` so that could be another reason you code was failing.

Not required according to the spec but possibly required anyway is making the texture *texture complete*, which means make it renderable (even though we are not rendering with it we are rendering to it). In this case because I didn't make mips I set the `TEXTURE_MIN_FILTER` to `LINEAR` since by default it's `NEAREST_MIPMAP_LINEAR` which requires mips otherwise the texture is not renderable. *not renderable* = *not usable* period in at least some drivers in the past.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext("webgl2");
      if (!gl) {
        return alert('need webgl2');
      }
      
      const vs = `#version 300 es
      void main() {
        gl_Position = vec4(0, 0, 0, 1);
        gl_PointSize = 10.0;
      }
      `;
      const fs = `#version 300 es
      precision mediump float;
      out vec4 outColor[4];
      void main() {
        outColor[0] = vec4(.1, .2, .3, .4);
        outColor[1] = vec4(.5, .6, .7, .8);
        outColor[2] = vec4(.9, 1., .11, .22);
        outColor[3] = vec4(.33, .44, .55, .66);
      }
      `;
      
      const program = twgl.createProgram(gl, [vs, fs]);
      
      const width = 4;
      const height = 4;
      const depth = 4;
      const tex = gl.createTexture(gl.TEXTURE_3D);
      gl.bindTexture(gl.TEXTURE_3D, tex);
      gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, width, height, depth, 0,
                    gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      
      const numAttachments = 4;
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      for (let i = 0; i < numAttachments; ++i) {
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, tex, 0, i);
      }
      
      gl.drawBuffers([
        gl.COLOR_ATTACHMENT0, 
        gl.COLOR_ATTACHMENT1, 
        gl.COLOR_ATTACHMENT2, 
        gl.COLOR_ATTACHMENT3,
      ]);
      
      gl.viewport(0, 0, width, height);
      gl.useProgram(program);
      gl.drawArrays(gl.POINTS, 0, 1);
      
      for (let i = 0; i < numAttachments; ++i) {
        gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
        const pixel = new Uint8Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        console.log('layer:', i, '=', Array.from(pixel).map(v => (v / 255).toFixed(2)).join(', '));
      }
    }
    main();
        

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


