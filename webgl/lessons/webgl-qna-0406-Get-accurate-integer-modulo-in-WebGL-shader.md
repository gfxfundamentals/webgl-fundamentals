Title: Get accurate integer modulo in WebGL shader
Description:
TOC: qna

# Question:

I want to get an accurate modulo of `x` and `y` in a WebGL fragment shader. `x` and `y` are integers.

Graphing `mod(x,y)`, we get the following:
[![a choppy, irregular chart][1]][1]

The actual code used to generate the red-and-black rectangle is:

    gl_FragColor = vec4(mod(
      float(int(v_texCoord[0]*15.))/15.,
      float(int(v_texCoord[1]*15.))/15.
    ), 0, 0, 1);

Where v_texCoord is a vec2 ranging from `0,0` at the top-left to `1,1` at the bottom-right. Precision is set to mediump for both float and int.

Reading the chart, we see that although `mod(6,6)` is correctly `0`, `mod(7,7)` is actually `7`! **How do I fix this?**



I tried to implement my own mod() function. However, it has the same errors, and produces the same graph.

 int func_mod(int x, int y) {
  return int(float(x)-float(y)*floor(float(x)/float(y)));
 }

In Javascript, where I can debug it, the function works perfectly. I then tried an iterative approach, because I was worried I was going insane and I didn't trust the floating-point division anyway.

 int iter_mod(int x, int y) {
  x = int(abs(float(x))); y = int(abs(float(y)));
  for(int i=0; i>-1; i++) {
   if(x < y) break;
   x = x - y;
  }
  return x;
 }

This worked, but I can't graph it because it crashes linux with an error in ring 0 when I try. It works fine for the spritesheet calculations I need it for, but I really feel it's an incorrect solution.

(Update: It works perfectly on my phone. It's not my code in error now, it's just my problem…)

  [1]: http://i.stack.imgur.com/V10Ge.png

# Answer

You're not modding 7 by 7 you're modding 7/15ths by 7/15ths

Try

    gl_FragColor = vec4(mod(
      floor(v_texCoord[0] * 15.),
      floor(v_texCoord[1] * 15.)
    ) / 15., 0, 0, 1);

You can see the 2 versions running here

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    function render(num) {
      var gl = document.getElementById("c" + num).getContext("webgl");
      var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

      var arrays = {
        position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
      };
      var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      var uniforms = {
        resolution: [gl.canvas.width, gl.canvas.height],
        intMod: num == 1,
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, bufferInfo);
    }

    render(0)
    render(1);

<!-- language: lang-css -->

    canvas { margin: 1em; height: 100px; width: 150px; }
    div { display: inline-block; }
    pre { text-align: center; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
      <script id="vs" type="notjs">
    attribute vec4 position;

    void main() {
      gl_Position = position;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    uniform vec2 resolution;
    uniform bool intMod;

    void main() {
      vec2 v_texCoord = gl_FragCoord.xy / resolution.xy;

      if (!intMod) {
      
        gl_FragColor = vec4(mod(
          float(int(v_texCoord[0]*15.))/15.,
          float(int(v_texCoord[1]*15.))/15.
        ), 0, 0, 1);

      } else {

        gl_FragColor = vec4(mod(
          floor(v_texCoord[0]*15.),
          floor(v_texCoord[1]*15.)
        )/15., 0, 0, 1);
        
      }
      
    }
      </script>
    <div><canvas id="c0"></canvas><pre>mod with fractions</pre></div>
    <div><canvas id="c1"></canvas><pre>mod with ints</pre></div>

<!-- end snippet -->

You should also note that mod by 0 is undefined meaning you'll get different results on different GPUs
