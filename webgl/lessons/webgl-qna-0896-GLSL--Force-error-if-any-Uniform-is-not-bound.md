Title: GLSL: Force error if any Uniform is not bound
Description:
TOC: qna

# Question:

I am using GLSL 1.0 with WebGL 1.0 and 2.0 and I just spent hours troubleshooting an issue that in my opinion should have thrown error before things got started.

I have `uniforms` and `sampler2D`'s in my fragment Shader. I had changed one line of code and that change had caused no input textures or arrays be bound to the locations of Shader `uniform`s. The program however runs with no issues but produces zeros when those `uniform`s are read. For example a call to `texture2D(MyTexture, vec2(x,y))` does not throw any errors but rather just returns 0.

Is there anyway for me to force this as an error before or during rendering?

# Answer

There is no way to make WebGL itself check your errors. You can write your own wrappers if you want to check for errors. As one example there's the [webgl-debug context](https://www.khronos.org/webgl/wiki/Debugging) wrapper that calls `gl.getError` after every single WebGL command.

Following a similar pattern you could try to check for not setting uniforms either by wrapping all the functions related to drawing, programs, uniforms, attributes, etc. or by just making functions you call

    function myUseProgram(..args..) {
      checkUseProgramStuff();
      gl.useProgram(..);
    }
 
    function myDrawArrays(..args..) {
      checkDrawArraysStuff();
      gl.drawArrays(..args..);
    }

For uniforms you'd need to track when a program linked successfully then loop over all of its uniforms (which you can query). Track what the current program is. Track calls to `gl.uniform` to track if uniforms are set.

Here's an example

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    (function() {
      const gl = null;  // just to make sure we don't see global gl
      const progDB = new Map();
      let currentUniformMap;
      const limits = {};
      const origGetUniformLocationFn = WebGLRenderingContext.prototype.getUniformLocation;

      function init(gl) {
        [gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS].forEach((pname) => {
          limits[pname] = gl.getParameter(pname);
        });
      }

      function isBuiltIn(info) {
        const name = info.name;
        return name.startsWith("gl_") || name.startsWith("webgl_");
      }

      function addProgramToDB(gl, prg) {
        const uniformMap = new Map();
        const numUniforms = gl.getProgramParameter(prg, gl.ACTIVE_UNIFORMS);
        for (let ii = 0; ii < numUniforms; ++ii) {
          const uniformInfo = gl.getActiveUniform(prg, ii);
          if (isBuiltIn(uniformInfo)) {
            continue;
          }
          const location = origGetUniformLocationFn.call(gl, prg, uniformInfo.name);
          uniformMap.set(location, {set: false, name: uniformInfo.name, type: uniformInfo.type, size: uniformInfo.size});
        }
        progDB.set(prg, uniformMap);
      }

      HTMLCanvasElement.prototype.getContext = function(origFn) {
        return function(type, ...args) {
          const ctx = origFn.call(this, type, ...args);
          if (ctx && type === 'webgl') {
            init(ctx);
          }
          return ctx;
        }
      }(HTMLCanvasElement.prototype.getContext);

      // getUniformLocation does not return the same location object
      // for the same location so mapping a location to uniform data
      // would be a PITA. So, let's make it return the same location objects.
      WebGLRenderingContext.prototype.getUniformLocation = function(origFn) {
        return function(prg, name) {
          const uniformMap = progDB.get(prg);
          for (const [location, uniformInfo] of uniformMap.entries()) {
            // note: not handling names like foo[0] vs foo
            if (uniformInfo.name === name) {
              return location;
            }
          }
          return null;
        };
      }(WebGLRenderingContext.prototype.getUniformLocation);

      WebGLRenderingContext.prototype.linkProgram = function(origFn) {
        return function(prg) {
          origFn.call(this, prg);
          const success = this.getProgramParameter(prg, this.LINK_STATUS);
          if (success) {
            addProgramToDB(this, prg);
          }
        };
      }(WebGLRenderingContext.prototype.linkProgram);

      WebGLRenderingContext.prototype.useProgram = function(origFn) {
        return function(prg) {
          origFn.call(this, prg);
          currentUniformMap = progDB.get(prg);
        };
      }(WebGLRenderingContext.prototype.useProgram);

      WebGLRenderingContext.prototype.uniform1i = function(origFn) {
        return function(location, v) {
          const uniformInfo = currentUniformMap.get(location);
          if (v === undefined) {
            throw new Error(`bad value for uniform: ${uniformInfo.name}`);  // do you care? undefined will get converted to 0
          }
          const val = parseFloat(v);
          if (isNaN(val) || !isFinite(val)) {
            throw new Error(`bad value NaN or Infinity for uniform: ${uniformInfo.name}`);  // do you care?
          }
          switch (uniformInfo.type) {
            case this.SAMPLER_2D:
            case this.SAMPLER_CUBE:
              if (val < 0 || val > limits[this.MAX_COMBINED_TEXTURE_IMAGE_UNITS]) {
                throw new Error(`texture unit out of range for uniform: ${uniformInfo.name}`);
              }
              break;
            default:
              break;
          }
          uniformInfo.set = true;
          origFn.call(this, location, v);
        };
      }(WebGLRenderingContext.prototype.uniform1i);

      WebGLRenderingContext.prototype.drawArrays = function(origFn) {
        return function(...args) {
          const unsetUniforms = [...currentUniformMap.values()].filter(u => !u.set);
          if (unsetUniforms.length) {
            throw new Error(`unset uniforms: ${unsetUniforms.map(u => u.name).join(', ')}`);
          }
          origFn.call(this, ...args);
        };
      }(WebGLRenderingContext.prototype.drawArrays);
    }());

    // ------------------- above is wrapper ------------------------
    // ------------------- below is test ---------------------------

    const gl = document.createElement('canvas').getContext('webgl');

    const vs = `
    uniform float foo;
    uniform float bar;
    void main() {
      gl_PointSize = 1.;
      gl_Position = vec4(foo, bar, 0, 1);
    }
    `;

    const fs = `
    precision mediump float;
    uniform sampler2D tex;
    void main() {
      gl_FragColor = texture2D(tex, vec2(0));
    }
    `;

    const prg = twgl.createProgram(gl, [vs, fs]);
    const fooLoc = gl.getUniformLocation(prg, 'foo');
    const barLoc = gl.getUniformLocation(prg, 'bar');
    const texLoc = gl.getUniformLocation(prg, 'tex');

    gl.useProgram(prg);

    test('fails with undefined', () => {
      gl.uniform1i(fooLoc, undefined);
    });
    test('fails with non number string', () => {
      gl.uniform1i(barLoc, 'abc');
    });
    test('fails with NaN', () => {
      gl.uniform1i(barLoc, 1/0);
    });
    test('fails with too large texture unit', () => {
      gl.uniform1i(texLoc, 1000);
    })
    test('fails with not all uniforms set', () => {
      gl.drawArrays(gl.POINTS, 0, 1);
    });
    test('fails with not all uniforms set',() => {
      gl.uniform1i(fooLoc, 0);
      gl.uniform1i(barLoc, 0);
      gl.drawArrays(gl.POINTS, 0, 1);
    });
    test('passes with all uniforms set', () => {
      gl.uniform1i(fooLoc, 0);
      gl.uniform1i(barLoc, 0);
      gl.uniform1i(texLoc, 0);
      gl.drawArrays(gl.POINTS, 0, 1);   // note there is no texture so will actually generate warning
    });

    function test(msg, fn) {
      const expectFail = msg.startsWith('fails');
      let result = 'success';
      let fail = false;
      try {
        fn();
      } catch (e) {
        result = e;
        fail = true;
      }
      log('black', msg);
      log(expectFail === fail ? 'green' : 'red', '  ', result);
    }

    function log(color, ...args) {
      const elem = document.createElement('pre');
      elem.textContent = [...args].join(' ');
      elem.style.color = color;
      document.body.appendChild(elem);
    }

<!-- language: lang-css -->

    pre { margin: 0; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

The code above only wraps `gl.uniform1i`. It doesn't handle arrays of uniforms nor does it handle individual array element locations. It does show one way to track uniforms and whether or not they've been set.

Following similar pattern you could check that each texture unit has a texture assigned etc, that each attribute is turned on, etc...

Of course you could also write your own WebGL framework that tracks all that stuff instead of hacking the WebGL context itself. In other words for example three.js could track that all it's uniforms are set at a higher level than the WebGL level and your own code could do something similar.

As for why WebGL doesn't emit errors there are lots of reasons. For one, not setting a uniform is not an error. Uniforms have default values and it's perfectly fine to use the default. 

The browser does catch some problems but because WebGL is pipelined it can't give you the error at the moment you issue the command without a huge slow down in performance (the debug context mentioned above will do that for you). So, the browser can sometimes give an warning in the console but it can't stop your JavaScript at the point you issued the command. It might not be that helpful anyway is the only place it can often give an error is at draw time. In other words to 30-100 commands issued before to setup WebGL state are not an error until you draw since you could fix that state at anytime before you draw. So you get the error on draw but that doesn't tell you which of the 30-100 previous commands caused the issue.

Finally there's the philosophical issue of trying to support native ports from OpenGL/OpenGL ES via emscripten or WebAssembly. Many native apps ignore
lots of GL errors and yet still run. This is one reason why WebGL doesn't throw, to stay compatible with OpenGL ES (as well as the reason above). It's also why most WebGL implementations only show a few errors and then print "no more webgl errors will be shown" since browsers didn't want programs that ignore their WebGL errors to fill memory with logging messages.

Fortunately if you really want it you can write your own checking.
