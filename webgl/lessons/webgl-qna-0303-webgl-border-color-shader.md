Title: webgl border color shader
Description:
TOC: qna

# Question:

How do I write a shader to draw a polygon in solid color and it's border in a different color.

Basically I have a hexagons map in 3d and I need to be able to outline each hexagon with a black border, if user requests so. Would also be nice if I could control border width.

Thanks.

# Answer

Off the top of my head, one way would be to create a your hex with a 7th vertex in the center

       1---2
      /\   /\
     /  \ /  \
    6----0----3
     \  / \  /
      \/   \/
       5---4

Add texture coordinates where point 0 has UV = { 0, 0 } and points 1, 2, 3, 4, 5, 6 have UV coords { 0, 1 }.  

Then have your shader choose a color based on V something like this

vertex shader

    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    ...

    void main() {
      ...
      v_texCoord = a_texCoord; // pass texcoord to fragment shader
    }

fragment shader

    ...
    varying vec2 v_texCoord;
    uniform vec4 u_baseColor;
    uniform vec4 u_borderColor;
    uniform float u_borderThickness;  // 0-1
    ...
    void main() {
      // make a value that's 0 if less than u_borderThickness and 1 if greater
      float mixAmount = step(u_borderThickness, v_texCoord.v);

      // choose the base or border color
      gl_FragCoord = mix(u_baseColor, u_borderColor, mixAmount);
    }

I suppose you don't actually need 2 coordinates, you can just use 1 since U is irrelevant

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl");

    var prg = webglUtils.createProgramFromScripts(gl, ["vs", "fs"]);

    var positionLoc = gl.getAttribLocation(prg, "a_position");
    var vLoc = gl.getAttribLocation(prg, "a_v");
    var baseColorLoc = gl.getUniformLocation(prg, "u_baseColor");
    var borderColorLoc = gl.getUniformLocation(prg, "u_borderColor");
    var borderSizeLoc = gl.getUniformLocation(prg, "u_borderSize");


    var positions = [];
    var vs = []

    for (var ii = 0; ii < 6; ++ii) {
      var angle1 = (ii + 0) * Math.PI * 2 / 6;
      var angle2 = (ii + 1) * Math.PI * 2 / 6;
      positions.push(
        0, 0,
        Math.cos(angle1), Math.sin(angle1),
        Math.cos(angle2), Math.sin(angle2)
      );
      vs.push(0, 1, 1);
    };

    var positionBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);
    gl.bufferData(gl.ARRAY_BUFFER, 
                  new Float32Array(positions),
                  gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, 
                           false, 0, 0); 

    var vBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
    gl.bufferData(gl.ARRAY_BUFFER, 
                  new Float32Array(vs),
                  gl.STATIC_DRAW);
    gl.enableVertexAttribArray(vLoc);
    gl.vertexAttribPointer(vLoc, 1, gl.FLOAT, 
                           false, 0, 0); 


    function render() {
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prg);
      gl.uniform4fv(baseColorLoc, [1, 0, 0, 1]);
      gl.uniform4fv(borderColorLoc, [0, 0, 0, 1]);
      
      var t = Date.now() * 0.001;
      gl.uniform1f(borderSizeLoc, Math.sin(t) * 0.5 + 0.5);
      
      gl.drawArrays(gl.TRIANGLES, 0, 6 * 3);
      
      requestAnimationFrame(render);
    }


    render();

<!-- language: lang-html -->

    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>

    <script id="vs" type="foo">
    attribute vec4 a_position;
    attribute float a_v;

    varying float v_v;

    void main() {
      // PS: In a real WebGL app you'd probably need to multiply a_position by 
      // a matrix at a minimum

      gl_Position = a_position;
      v_v = a_v;
    }
    </script>

    <script id="fs" type="foo">
    precision mediump float;

    varying float v_v;

    uniform float u_borderSize;
    uniform vec4 u_baseColor;
    uniform vec4 u_borderColor;

    void main() {
       float mixAmount = step(u_borderSize, v_v);
       gl_FragColor = mix(u_baseColor, 
                          u_borderColor, 
                          mixAmount);
    }
    </script>

    <canvas id="c" width="256" height="256"></canvas>

<!-- end snippet -->


