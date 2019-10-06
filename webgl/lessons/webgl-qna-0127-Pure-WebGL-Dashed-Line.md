Title: Pure WebGL Dashed Line
Description:
TOC: qna

# Question:

I'm trying to create a dashed line using pure webgl.  I know there is already a question on this, and maybe I'm dumb, but I cannot figure out how to make it work.  I understand the concept, but I do not know how to get the distance along the path in the shader.  A previous answer had the following line:

    varying float LengthSoFar; // <-- passed in from the vertex shader

So how would I get `LengthSoFar`?  How can I calculate it in the vertex shader?

Am I totally missing something?  Can someone give me a working example?  Or at least some good leads?  I've been banging my head against the wall on this for days.

# Answer

I'm assuming it works like this. You have a buffer of positions. You make a corresponding buffer of `lengthSoFar` so,

    function distance(array, ndx1, ndx2) 
    {
      ndx1 *= 3;
      ndx2 *= 3;

      var dx = array[ndx1 + 0] - array[ndx2 + 0];
      var dy = array[ndx1 + 1] - array[ndx2 + 1];
      var dz = array[ndx1 + 2] - array[ndx2 + 2];

      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    var positions = 
    [
      0.123, 0.010, 0.233,
      0.423, 0.312, 0.344,
      0.933, 1.332, 0.101,
    ];

    var lengthSoFar = [0];  // the length so far starts at 0
    for (var ii = 1; ii < positions.length / 3; ++ii) 
    {
      lengthSoFar.push(lengthSoFar[ii - 1] + distance(positions, ii - 1, ii));
    }

Now you can make buffers for both `positions` and `lengthSoFar` and pass `lengthSoFar` as an attribute into your vertex shader and from there pass it as a varying to to your fragment shader.

Unfortunately it won't work with indexed geometry (the most common type?). In other words it won't work with `gl.drawElements`, only with `gl.drawArrays`. Also the dashed line would be dashed in 3D not 2D so a line going into the screen (away from the viewer) would look different than a line going across the screen. Of course if you're drawing 2D then there's no problem. 

If those limitations are good for you does this answer you question?

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector("#c").getContext("webgl");

    // Note: createProgramFromScripts will call bindAttribLocation
    // based on the index of the attibute names we pass to it.
    var program = twgl.createProgramFromScripts(
        gl, 
        ["vshader", "fshader"], 
        ["a_position", "a_lengthSoFar"]);
    gl.useProgram(program);

    function distance(array, ndx1, ndx2) 
    {
      ndx1 *= 3;
      ndx2 *= 3;

      var dx = array[ndx1 + 0] - array[ndx2 + 0];
      var dy = array[ndx1 + 1] - array[ndx2 + 1];
      var dz = array[ndx1 + 2] - array[ndx2 + 2];

      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // Used this line in the console to generate the positions
    // var sub = 10; for (var ii = 0; ii <= sub; ++ii) { r = (ii & 1) ? 0.5 : 0.9; a = ii * Math.PI * 2 / sub; console.log((Math.cos(a) * r).toFixed(3) + ", " + (Math.sin(a) * r).toFixed(3) + ", "); }

    var positions = [
      0.900, 0.000, 0,
      0.405, 0.294, 0,
      0.278, 0.856, 0,
      -0.155, 0.476, 0,
      -0.728, 0.529, 0,
      -0.500, 0.000, 0,
      -0.728, -0.529, 0,
      -0.155, -0.476, 0,
      0.278, -0.856, 0,
      0.405, -0.294, 0,
      0.900, -0.000, 0,
    ];
        
    var lengthSoFar = [0];  // the length so far starts at 0
    for (var ii = 1; ii < positions.length / 3; ++ii) 
    {
      lengthSoFar.push(lengthSoFar[ii - 1] + distance(positions, ii - 1, ii));
    }

    var vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    var vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lengthSoFar), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);

    // Since uniforms default to '0' and since 
    // the default active texture is '0' we don't
    // have to setup the texture uniform. 
    var pixels = [
        0, 0, 255, 255,
        0, 0, 255, 255,
        0, 0, 255, 255,
        0, 0, 255, 255,
        0, 0, 0, 0,
        0, 0, 0, 0,
        255, 0, 0, 255,
        0, 0, 0, 0,
        0, 0, 0, 0,
        255, 0, 0, 255,
        0, 0, 0, 0,
        0, 0, 0, 0,
    ];

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, pixels.length / 4, 1, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixels));
    gl.texParameteri(
        gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(
        gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.drawArrays(gl.LINE_STRIP, 0, positions.length / 3);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <script id="vshader" type="whatever">
        attribute vec4 a_position;
        attribute float a_lengthSoFar;
        varying float v_lengthSoFar;
        void main() {
          gl_Position = a_position;
          v_lengthSoFar = a_lengthSoFar;
        }    
    </script>
    <script id="fshader" type="whatever">
    precision mediump float;
    varying float v_lengthSoFar;
    uniform sampler2D u_pattern;
    #define NumDashes 6.0
    void main() {
        gl_FragColor = texture2D(
          u_pattern, 
          vec2(fract(v_lengthSoFar * NumDashes)), 0.5);
    }
    </script>
    <canvas id="c" width="300" height="300"></canvas>

<!-- end snippet -->

Note: [Here's an article that might help explain how varyings work][2]

Also note you can't change the thickness of the lines. To do that you need to [draw lines from triangles](https://mattdesl.svbtle.com/drawing-lines-is-hard)

  [1]: http://jsfiddle.net/greggman/7dQu9/
  [2]: http://games.greggman.com/game/webgl-how-it-works/
