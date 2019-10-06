Title: Emscripten OpenGL (3) gives versions errors
Description:
TOC: qna

# Question:

OS X - Chrome.

Im new to OpenGL / emscripten and trying to setup a simple script that uses WebGL 2, OpenGL 3+ and gets build through emscripten into webassembly. 

Compiling of WebGL 1 / OpenGL 2 worked without a problem. And setting the canvas to WebGL 2 / OpenGL 3 also seems to work. When I check the current version that is running,  it informs me about OpenGL 3.0 and WebGL2 (but maybe its not using it..?). 

But, emcc still screams errors about the shader im giving being only compatible from version 3.0+ and thus implying im running openGL 1/2 ?

*Setting a new context through emscripten*

    EmscriptenWebGLContextAttributes ctxAttrs;
    emscripten_webgl_init_context_attributes(&ctxAttrs);
    ctxAttrs.alpha = GL_TRUE;
    ctxAttrs.depth = GL_TRUE;
    ctxAttrs.stencil = GL_TRUE;
    ctxAttrs.antialias = 4;
    ctxAttrs.premultipliedAlpha = false;
    ctxAttrs.preserveDrawingBuffer = false;
    ctxAttrs.minorVersion = 0;
    ctxAttrs.majorVersion = 2; // WebGL2

    this->context = emscripten_webgl_create_context(0, &ctxAttrs);
    assert(this->context > 0); // Must have received a valid context.
    int res = emscripten_webgl_make_context_current(this->context);
    assert(res == EMSCRIPTEN_RESULT_SUCCESS);
    assert(emscripten_webgl_get_current_context() == this->context);

*Shaders* : 

    const char *vertexShaderSource = "#version 300 core\n"
            "layout (location = 0) in vec3 aPos;\n"
            "void main()\n"
            "{\n"
            "   gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);\n"
            "}\0";

    const char *fragmentShaderSource = "#version 300 core\n"
            "out vec4 FragColor;\n"
            "void main()\n"
            "{\n"
            "   FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);\n"
            "}\n\0";

When I do a log of the current OpenGL version right after the creation of the context,

    printf("OpenGL version supported by this platform : %s\n", glGetString(GL_VERSION));

I get this :

> OpenGL version supported by this platformOpenGL ES 3.0 (WebGL 2.0
> (OpenGL ES 3.0 Chromium))

Chrome console says this

    ERROR::SHADER::VERTEX::COMPILATION_FAILEDERROR: 0:1: 'core' : invalid version directive
    00:53:19.828 index.js:1 ERROR: 0:2: 'layout' : syntax error
    00:53:19.829 index.js:1
    00:53:19.830 index.js:1 ERROR::SHADER::FRAGMENT::COMPILATION_FAILEDERROR: 0:1: 'core' : invalid version directive
    00:53:19.831 index.js:1 ERROR: 0:2: 'out' : storage qualifier supported in GLSL ES 3.00 and above only
    00:53:19.832 index.js:1 ERROR: 0:2: '' : No precision specified for (float)
    00:53:19.833 index.js:1 ERROR: 0:5: '1.0f' : Floating-point suffix unsupported prior to GLSL ES 3.00
    00:53:19.834 index.js:1 ERROR: 0:5: '1.0f' : syntax error
    00:53:19.835 

I call emscripten like this, with FULL_ES3 and WEBGL2 enabled.

    emcc src/main.cpp src/lib/Chart.cpp -s SAFE_HEAP=1 --bind  -s WASM=1 -O3 -o index.js -s LEGACY_GL_EMULATION=0  -s GL_UNSAFE_OPTS=0 --pre-js pre-module.js --post-js post-module.js -s GL_ASSERTIONS=1 -s INVOKE_RUN=0  -std=c++11 -s USE_WEBGL2=1 -s FULL_ES3=1 -s USE_GLFW=3 -s OFFSCREENCANVAS_SUPPORT=1

[![enter image description here][1]][1]



  [1]: https://i.stack.imgur.com/cosYs.png

Thanks!

# Answer

I just wanted to add my solution was to modify the emscripten library as such

1. copy `emscripten/src/library_gl.js` into your project

2. edit your copy and add these lines to the end of `getSource` 

          getSource: function(shader, count, string, length) {

            ...

            const isFragmentShader = GLctx.getShaderParameter(GL.shaders[shader], 0x8B4F /* GL_SHADER_TYPE */) === 0x8B30 /* GL_FRAGMENT_SHADER */;
            const header = isFragmentShader ? "#version 300 es\nprecision mediump float;\n" : "#version 300 es\n";
            source = source.replace(/#version.*?\n/, header);

            return source;
          },

3. compile my code with something like

        emcc -std=c++11 -s WASM=1 -s USE_WEBGL2=1 --js-library library_gl.js myprogram.cpp 

Basically search and replace parts of GLSL into GLSL ES. That way I don't have to modify the shaders, depending on the shader.

Also, if your C++ is not printing out shader complilation and link errors you can add them in from JavaScript like this.  

Before you include your emscripten code include this script

    WebGL2RenderingContext.prototype.compileShader = (function(origFn) {
       return function(shader) {
          origFn.call(this, shader);
          const status = this.getShaderParameter(shader, this.COMPILE_STATUS);
          if (!status) {
            console.error(this.getShaderInfoLog(shader));
          }
       };
    }(WebGL2RenderingContext.prototype.compileShader));
    
    WebGL2RenderingContext.prototype.linkProgram = (function(origFn) {
       return function(program) {
          origFn.call(this, program);
          const status = this.getProgramParameter(program, this.LINK_STATUS);
          if (!status) {
            console.error(this.getProgramInfoLog(program));
          }
       };
    }(WebGL2RenderingContext.prototype.compileShader));

This will print compilation errors to the JavaScript console and would have shown the error

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    WebGL2RenderingContext.prototype.compileShader = (function(origFn) {
       return function(shader) {
          origFn.call(this, shader);
          const status = this.getShaderParameter(shader, this.COMPILE_STATUS);
          if (!status) {
            console.error(this.getShaderInfoLog(shader));
          }
       };
    }(WebGL2RenderingContext.prototype.compileShader));

    WebGL2RenderingContext.prototype.linkProgram = (function(origFn) {
       return function(program) {
          origFn.call(this, program);
          const status = this.getProgramParameter(program, this.LINK_STATUS);
          if (!status) {
            console.error(this.getProgramInfoLog(program));
          }
       };
    }(WebGL2RenderingContext.prototype.compileShader));

    function main() {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) {
        alert("need webgl2");
        return;
      }
      
      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, `#version 300 core
        void main() {
          gl_Position = vec4(0);
        }
      `);
      gl.compileShader(vs);
    }
    main();

<!-- end snippet -->

When I run the code above I get

    ERROR: 0:1: 'core' : invalid version directive


