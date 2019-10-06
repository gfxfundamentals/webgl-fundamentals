Title: WebGL: Is it forbidden to bind the same uniform in a vertex shader and fragment shader?
Description:
TOC: qna

# Question:

I am porting an OpenGL framework to JavaScript using Emscriten. 

The state is stored in a uniform struct:

    struct UniformState {
        ...
        mat4 modelviewprojection_matrix; 
        mat4 modelview_matrix;
        mat3 normal_matrix; 
        mat4 texture_matrix;
        ...
    };

that I'd like to access in both the vertex and the fragment shaders as:

    uniform UniformState GLUP;

when I do that, I get an error at link time:

    Uniform `GLUP`is not linkable between attached shaders

Is it forbidden to bind the same uniform in the vertex shader and fragment shader ? 

(if it is forbidden, then clearly I can declare two different sets of uniform variables for each shader, but I'd prefer to have only one, since it makes the code cleaner / simpler, this is why I'm asking in case there
is something special to do to make it possible).



# Answer

Seems to work for me.

Note as Reto mentioned if I don't set the precision I get a link error

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    "use strict";
    var gl = document.createElement("canvas").getContext("webgl");
    var program = twgl.createProgramFromScripts(gl, ["vs", "fs"], [], [], log);
    log("--done--");

    function log(msg) {
      var elem = document.createElement("pre");
      elem.appendChild(document.createTextNode(msg));
      document.body.appendChild(elem);
    }

<!-- language: lang-html -->

      <script id="vs" type="notjs">
    struct Test {
      vec4 color;
      vec4 mult;
    };

    uniform Test test;
      
    attribute vec4 position;

    void main() {
      gl_Position = position * test.mult;
    }
      </script>
      <script id="fs" type="notjs">
    precision highp float;

    struct Test {
      vec4 color;
      vec4 mult;
    };

    uniform Test test;

    void main() {
      gl_FragColor = test.color;
      }
      </script>
      <script src="https://twgljs.org/dist/twgl.min.js"></script>


<!-- end snippet -->


