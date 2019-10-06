Title: Syntax error encountered in WebGL 2.0 GLSL when using sampler3D
Description:
TOC: qna

# Question:

I am trying to render a 3D medical data in a brower using WebGL 2.0.

AFAIK 3D textures are now supported in WebGL 2.0.

texImage3D() is a recognized function call.

I am writing a fragment shader and declaring a uniform sampler:

    uniform sampler3D samp;

When i run it on Firefox, I get an error :

>  uncaught exception: Shader compile error: ERROR: 0:19: 'sampler3D' :
>  Illegal use of reserved word  ERROR: 0:19: 'sampler3D' : syntax error

Works just fine when I use sampler2D (does not solve my purpose though).

Could anybody please point me as to what am I doing wrong here?

Is sampler3D not supported yet?
But in that case how is any texture that is loaded using texImage3D() supposed to be accessed?

# Answer

Did you change all the things you need to change to use WebGL 2.0 features like `sampler3D`?

To use `sampler3D` you need to add 

    #version 300 es

To the top of your shader. **IT HAS TO BE THE FIRST LINE WITH NO WHITESPACE IN FRONT**

Note there are many other changes to GLSL 3.00 from GLSL 1.0

Testing here

<!-- begin snippet: js hide: false console: true -->

<!-- language: lang-js -->

    "use strict";

    const vs = `#version 300 es

    in vec4 position;

    void main() {
      gl_Position = position;
    }
    `;

    const fs = `#version 300 es
    precision mediump float;
    precision lowp sampler3D;

    uniform sampler3D u_someTexture;

    out vec4 theColor;

    void main() {
      theColor = texture(u_someTexture, vec3(0,0,0));
    }
    `;

    function main() {
      var m4 = twgl.m4;
      var gl = twgl.getContext(document.createElement("canvas"));
      log("using: " + gl.getParameter(gl.VERSION));  
      if (!twgl.isWebGL2(gl)) {
        log("Sorry, this example requires WebGL 2.0");  
        return;
      }

      var programInfo = twgl.createProgramInfo(gl, [vs, fs], (err) => {
        log("could not compile shader: " + err);
      });
      if (programInfo) {
        log("compiled shader with sampler3D");
      }

    }
    main();

    function log() {
      var elem = document.createElement("pre");
      elem.appendChild(document.createTextNode(Array.prototype.join.call(arguments, " ")));
      document.body.appendChild(elem);
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>

<!-- end snippet -->


