Title: getAttribLocation return always the same index
Description:
TOC: qna

# Question:

      attribute vec2 test; 
      attribute vec2 position;
      
      void main() {
        vTexCoord = position ; 
        vec2 gg = test;
        .....
      }

what stand getAttribLocation for ?
I used to believe it was the index of the attribute in the code,
but no, it always return 0 for position and 1 for test 

?

# Answer

`getAttribLocation` gets the location of the attribute. Just because your GPU/driver returns `0` for `position` and `1` for `test` doesn't mean that all drivers will.

Also, while debugging it's common to comment out parts of a shader. If an attribute is not used the driver may optimize it away. In your case if you were to comment out whatever lines use `position` it's likely `test` would get location `0`. If you weren't looking up the location and you assumed `test` was always at location 1 your code would fail

On the other hand you can set the location *before you call `linkProgram`* by calling `bindAttribLocation`. For example

    gl.bindAttribLocation(program, 10, "position");
    gl.bindAttribLocation(program, 5, "test");
    gl.linkProgram(program);

In which case you don't have to look up the locations.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
      attribute float position;
      attribute float test;
      
      void main() {
        gl_Position = vec4(position, test, 0, 1);
      }
    `;
    var fs = `
      void main() {
        gl_FragColor = vec4(0, 1, 0, 1);
      }
    `;

    function createShader(gl, type, source) {
      var s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(s));
      }
      return s; 
    }

    var gl = document.createElement("canvas").getContext("webgl");
    var prg = gl.createProgram();
    gl.attachShader(prg, createShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(prg, createShader(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(prg, 5, "position");
    gl.bindAttribLocation(prg, 10, "test");
    gl.linkProgram(prg);
    if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
      console.log(gl.getProgramInfoLog(prg));
    }
    console.log("test location:", gl.getAttribLocation(prg, "test"));
    console.log("position location:", gl.getAttribLocation(prg, "position"));
                   
<!-- end snippet -->


