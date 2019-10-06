Title: Render to a non-zero mip level of a cube map
Description:
TOC: qna

# Question:

I'm trying to render an environment map to a separate cube map mip levels.



    const levels = 8;
    const width = 128;
    const height = 128;

    const internalFormat = gl.RGBA8;
    const type = gl.UNSIGNED_BYTE;
    const format = gl.RGBA;
    
    const bindingPoint = gl.TEXTURE_CUBE_MAP;
    
    const level = 1;
    const target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + 0;
    
    const magFilter = gl.LINEAR;
    const minFilter = gl.LINEAR_MIPMAP_LINEAR;
    const wrapS = gl.CLAMP_TO_EDGE;
    const wrapT = gl.CLAMP_TO_EDGE;
    
    const texId = gl.createTexture();
    
    gl.bindTexture(bindingPoint, texId);
    
    gl.texParameteri(bindingPoint, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(bindingPoint, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(bindingPoint, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(bindingPoint, gl.TEXTURE_MAG_FILTER, magFilter);
    
    gl.texStorage2D(bindingPoint, levels, internalFormat, width, height);
    
    const framebuffer = gl.createFramebuffer();
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, target, texId, level);
    
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    
    console.assert(status === gl.FRAMEBUFFER_COMPLETE, 'incomplete!');
    
    gl.viewport(0, 0, width/2, height/2);
    
    // cube rendering

After all I read it inside fragment shader via `textureLod()` passing level as third argument. But result is black color instead of proper environment color.

According to [this][1] it has to work, but it doesn't.

Tested on Chromium 70.0.3538.110 version, on Firefox 63.0.3.

  [1]: https://www.khronos.org/registry/webgl/sdk/tests/conformance2/renderbuffers/framebuffer-test.html?webglVersion=2&quiet=0

# Answer

I don't see anything wrong with the code you posted. It's working for me. Maybe the issue is somewhere else? Or a bug in your driver? 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement('canvas').getContext('webgl2');
    console.assert(gl !== null, 'no webgl2');
    const levels = 8;
    const width = 128;
    const height = 128;

    const internalFormat = gl.RGBA8;
    const type = gl.UNSIGNED_BYTE;
    const format = gl.RGBA;

    const bindingPoint = gl.TEXTURE_CUBE_MAP;

    const magFilter = gl.LINEAR;
    const minFilter = gl.LINEAR_MIPMAP_LINEAR;
    const wrapS = gl.CLAMP_TO_EDGE;
    const wrapT = gl.CLAMP_TO_EDGE;

    const texId = gl.createTexture();

    gl.bindTexture(bindingPoint, texId);

    gl.texParameteri(bindingPoint, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(bindingPoint, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(bindingPoint, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(bindingPoint, gl.TEXTURE_MAG_FILTER, magFilter);

    gl.texStorage2D(bindingPoint, levels, internalFormat, width, height);

    const levelFaceFBs = [];
    for (let level = 0; level < levels; ++level) {
      const faceFBs = [];
      for (let face = 0; face < 6; ++face) {
        const framebuffer = gl.createFramebuffer();
        const target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + face;

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.framebufferTexture2D(
           gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
           target, texId, level);

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        console.assert(status === gl.FRAMEBUFFER_COMPLETE, 'incomplete!');
        
        const c = face + level;
        gl.clearColor(
           c & 1 ? 1 : 0,
           c & 2 ? 1 : 0,
           c & 4 ? 1 : 0,
           (level + 1) / levels);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        faceFBs.push(framebuffer);
      }
      levelFaceFBs.push(faceFBs);
    }

    log('--> based on clear');
    dumpAll();
    renderToAll();
    log('--> based on render');
    dumpAll();
    log(gl.getError(), '<- 0 = no errors')

    function renderToAll() {
      const vs = `
      void main() {
        gl_PointSize = 10.0;
        gl_Position = vec4(-1, -1, 0, 1);
      }
      `;
      const fs = `
      precision mediump float;
      uniform vec4 color;
      void main() {
        gl_FragColor = color;
      }
      `;
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      gl.useProgram(programInfo.program);

      // render to every face at every level
      levelFaceFBs.forEach((faceFBs, l) => {
        faceFBs.forEach((faceFB, f) => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, faceFB);
          gl.viewport(0, 0, width >> l, height >> l);
          const c = f + l;
          twgl.setUniforms(programInfo, {
            color: [
              c & 1 ? .2 : .7,
              c & 2 ? .2 : .7,
              c & 4 ? .2 : .7,
              (levels - l) / levels,
            ],
          });
          gl.drawArrays(gl.POINTS, 0, 1);
        });
      });
    }

    function dumpAll() {
      // get color of every face at every level
      levelFaceFBs.forEach((faceFBs, l) => {
        faceFBs.forEach((faceFB, f) => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, faceFB);
          const pixel = new Uint8Array(4);
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
          log('level:', l, 'face:', f, 'color:', pixel);
        });
      });
    }

    function log(...args) {
      const elem = document.createElement('pre');
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    pre { margin: 0; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->


