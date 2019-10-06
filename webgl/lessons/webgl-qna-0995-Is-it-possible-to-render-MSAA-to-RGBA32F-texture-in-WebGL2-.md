Title: Is it possible to render MSAA to RGBA32F texture in WebGL2?
Description:
TOC: qna

# Question:

Firstly, I have msaa working good, like this(abstract):

        sceneFramebuffer = new MultisampleRenderbuffer({
            msaa: 8,
            internalFormat: "RGBA8"
        });
    
        blitFramebuffer = new Framebuffer({
            internalFormat: "RGBA8",
            format: "RGBA",
            type: "UNSIGNED_INT"
        });
    
       Draw scene with sceneFramebuffer;

       sceneFramebuffer.blit(blitFramebuffer);

       Draw blitFramebuffer on the screen quad;

Now, I want to render sceneFramebuffer to RGBA32F for HDR purpose, and when I try this configuration:

    sceneFramebuffer = new MultisampleRenderbuffer({
        msaa: 8
        internalFormat: "RGBA32F"
    });

    blitFramebuffer = new Framebuffer({
        internalFormat: "RGBA32F",
        format: "RGBA",
        type: "FLOAT"
    });

I get this:
GL ERROR :GL_INVALID_OPERATION : glBlitFramebufferCHROMIUM: src and dst formats differ for color

But, when I set **msaa: 0** for sceneFramebuffer it shows my scene but no msaa antialiasing ofcourse.

Is it possible somehow to combine multisampling and float output, which I'd use for hdr?

Thanks!

# Answer

Seem to work for me



<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      // without this we can't render to RGBA32F
      if (!gl.getExtension('EXT_color_buffer_float')) {
        return alert('need EXT_color_buffer_float');
      }
      // just guessing without this we can't downsample
      if (!gl.getExtension('OES_texture_float_linear')) {
        return alert('need OES_texture_float_linear');
      }
      
      const msFB = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, msFB);
      const msRB = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, msRB);
      const samples = 4;
      const internalFormat = gl.RGBA32F;
      const width = 16;
      const height = 16;
      gl.renderbufferStorageMultisample(
         gl.RENDERBUFFER, samples, internalFormat, width, height);
      gl.framebufferRenderbuffer(
         gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msRB);
      checkFramebuffer(gl);
      
      gl.clearColor(1,0,0,1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      const texFB = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, texFB);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const levels = 1;
      gl.texStorage2D(gl.TEXTURE_2D, levels, internalFormat, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.framebufferTexture2D(
          gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      
      checkFramebuffer(gl);
      
      // check before
      checkPixel(gl, 'before blit')
      
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFB);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, texFB);
      gl.blitFramebuffer(
         0, 0, width, height,
         0, 0, width, height,
         gl.COLOR_BUFFER_BIT, gl.LINEAR);
         
      console.log('ERROR?:', glEnumToString(gl, gl.getError()));
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, texFB);
      checkPixel(gl, 'after blit:');
    }

    function checkFramebuffer(gl) {
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error(glEnumToString(gl, status));
      }
    }

    function checkPixel(gl, msg) {
      const pixel = new Float32Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixel);
      console.log(msg, Array.from(pixel).join(', '));
    }
      
    function glEnumToString(gl, v) {
      const hits = [];
      for (const key in gl) {
        if (gl[key] === v) {
          hits.push(key);
        }
      }
      return hits.length ? hits.join(' | ') : `0x${v.toString(16)}`;
    }

    main();

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

Just to make it clear it has nothing to do with texStorage2D



<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      // without this we can't render to RGBA32F
      if (!gl.getExtension('EXT_color_buffer_float')) {
        return alert('need EXT_color_buffer_float');
      }
      // just guessing without this we can't downsample
      if (!gl.getExtension('OES_texture_float_linear')) {
        return alert('need OES_texture_float_linear');
      }
      
      const msFB = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, msFB);
      const msRB = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, msRB);
      const samples = 4;
      const internalFormat = gl.RGBA32F;
      const width = 16;
      const height = 16;
      gl.renderbufferStorageMultisample(
         gl.RENDERBUFFER, samples, internalFormat, width, height);
      gl.framebufferRenderbuffer(
         gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msRB);
      checkFramebuffer(gl);
      
      gl.clearColor(1,0,0,1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      const texFB = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, texFB);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const level = 0;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, 0,
                    gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.framebufferTexture2D(
          gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      
      checkFramebuffer(gl);
      
      // check before
      checkPixel(gl, 'before blit')
      
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFB);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, texFB);
      gl.blitFramebuffer(
         0, 0, width, height,
         0, 0, width, height,
         gl.COLOR_BUFFER_BIT, gl.LINEAR);
         
      console.log('ERROR?:', glEnumToString(gl, gl.getError()));
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, texFB);
      checkPixel(gl, 'after blit:');
    }

    function checkFramebuffer(gl) {
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error(glEnumToString(gl, status));
      }
    }

    function checkPixel(gl, msg) {
      const pixel = new Float32Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixel);
      console.log(msg, Array.from(pixel).join(', '));
    }
      
    function glEnumToString(gl, v) {
      const hits = [];
      for (const key in gl) {
        if (gl[key] === v) {
          hits.push(key);
        }
      }
      return hits.length ? hits.join(' | ') : `0x${v.toString(16)}`;
    }

    main();

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->


