Title: Usage of webGL2 Uniform Buffer Object and layout(std140)
Description:
TOC: qna

# Question:

I'm working on a webgl cloth simulation project, trying to use transform feedback. The simulation will be done in the vertex shader. I need to access the vertex's neighbor vertices to calculate forces. I'm thinking using uniform buffer object to store all vertices' positions. 

I defined a uniform block something like below:

    layout(std140) uniform u_testBlock
    {
        vec4 v0;
        vec4 v1;
        ...
    };

However, I'm having 'layout: syntax error'. Is that the right way to use UBO in webGL2? The webGL2 specification says that only std140 layout is supported for uniform blocks, why there's such syntax error?

Thanks very much!

 

# Answer

Did you prefix your shader with `#version 300 es`? That must be the first line (no blank lines before it) to use glsl es 3.0 features

Also your precisions must match. 

Your example works for me in Firefox. Chrome Canary as of version 54.0.2824.0 seems to be broken (it used to work). I'm sure it will be fixed soon.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `#version 300 es

    // NOTE: We need to mark these as mediump to match
    // the fragment shader (or of course we could mark
    // the fragment shader's uniform block to highp)
    //
    layout(std140) uniform u_testBlock
    {
        mediump vec4 v0;
        mediump vec4 v1;
    };

    void main() {
      gl_Position = v0;
    }
    `;
    var fs = `#version 300 es
    precision mediump float;

    layout(std140) uniform u_testBlock
    {
        vec4 v0;
        vec4 v1;
    };

    out vec4 theColor;

    void main() {
      theColor = v1;
    }
    `;

    var gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) {
      log ("ERROR: need WebGL 2 support");
    }
    var prg = createProgram(gl, [vs, fs]);
    log("there should be no errors above");

    function log() {
      var pre = document.createElement("pre");
      pre.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
      document.body.appendChild(pre);
    }

    function createShader(gl, type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        log("ERROR:", gl.getShaderInfoLog(s));
      }
      return s;
    }

    function createProgram(gl, shaders) {
      var prg = gl.createProgram();
      gl.attachShader(prg, createShader(gl, gl.VERTEX_SHADER, shaders[0]));
      gl.attachShader(prg, createShader(gl, gl.FRAGMENT_SHADER, shaders[1]));
      gl.linkProgram(prg);
      if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
        log("ERROR:", gl.getProgramInfoLog(prg));
      }
      return prg;
    }

<!-- end snippet -->


