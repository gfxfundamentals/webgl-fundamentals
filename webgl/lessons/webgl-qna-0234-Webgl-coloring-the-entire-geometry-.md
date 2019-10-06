Title: Webgl coloring the entire geometry?
Description:
TOC: qna

# Question:

I am using triangles(using vertices and face position) to draw the graphics.I am storing color information for each vertex and applying colors accordingly. But the problem is all the geometries in my scene are of single color(say cone=red, cylinder=blue). SO, storing color for each vertex is apparently of no use to me.

Is their any other approach by which coloring can be done in webgl apart from storing color information of each vertices in the scene. Maybe something like coloring the entire geometry(say a cone).

# Answer

It's clear from your question you might not really understand WebGL yet? You might want to check out [these tutorials](http://webglfundamentals.org).

WebGL uses shaders, those shaders use whatever inputs you define and output whatever you tell them to output. That means WebGL doesn't require vertex colors. Vertex colors are something you decide on when you write your shaders. If you don't want to use vertex colors, don't write a shader that references vertex colors.

That said there if you have a shader that happens to use vertex colors you can easily provide the shader with a constant color. Let's assume you have shaders like this that just use vertex colors.

vertex shader:

    attribute vec4 a_position; 
    attribute vec4 a_color;     // vertex colors

    varying vec4 v_color;       // so we can pass the colors to the fragment shader

    uniform mat4 u_matrix;

    void main() {
       gl_Position = u_matrix * a_position;
       v_color = a_color;
    }

fragment shader:

    precision mediump float;

    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }

Now, all you have to do to use a constant color is turn off the attribute for `a_color` and set a constant value with `gl.vertexAttrib4f` like this

    // at init time
    var a_colorLocation = gl.getAttribLocation(program, "a_color";

    // at draw time
    gl.disableVertexAttribArray(a_colorLocation);    // turn off the attribute
    gl.vertexAttrib4f(a_colorLocation, r, g, b, a);  // supply a constant color

Note that turning off attribute 0 will slow down WebGL on desktops because if differences between OpenGL and OpenGL ES. It's possible `a_colorLocation` is attribute 0. To avoid this problem bind your attribute locations BEFORE you link your program. Specifically since you'll always use a position (which is called "a_position" in the example above) just bind that to location 0 like this

    ..compile shaders..
    ..attach shaders to program..

    // Must happen before you call linkProgram
    gl.bindAttribLocation(program, 0, "a_position");

    gl.linkProgram(program);

    ...check for errors, etc...

This will force the attribute for "a_position" to be attribute 0 so you'll always enable it. 

Here's a sample


<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      var canvas = document.getElementById("c");
      var gl = canvas.getContext("webgl");
      if (!gl) {
          alert("no WebGL");
          return;
      }

      // NOTE:! This function binds attribute locations
      // based on the indices of the second array
      var program = twgl.createProgramFromScripts(
          gl, 
          ["vshader", "fshader"], 
          ["a_position", "a_color"]);  // a_position will get location 0
                                       // a_color will get location 1

      var a_positionLoc = 0;
      var a_colorLoc = 1;
      var u_matrixLoc = gl.getUniformLocation(program, "u_matrix");

      gl.useProgram(program);

      var verts = [
            1,  1,  
           -1,  1,  
           -1, -1, 
            1,  1, 
           -1, -1, 
            1, -1,  
      ];

      var colors = [
        255, 0, 0, 255,
        0, 255, 0, 255,
        0, 0, 255, 255,

        255, 255, 0, 255,
        0, 255, 255, 255,
        255, 0, 255, 255,
      ];    

      var positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(a_positionLoc);
      gl.vertexAttribPointer(a_positionLoc, 2, gl.FLOAT, false, 0, 0);

      var colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(colors), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(a_colorLoc);
      gl.vertexAttribPointer(a_colorLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);

      // Draw in the bottom right corner
      gl.uniformMatrix4fv(
          u_matrixLoc,
          false,
          [0.5, 0, 0, 0,
           0, 0.5, 0, 0,
           0, 0, 1, 0,
           -0.5, -0.5, 0, 1]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);


      // Now turn off the a_color attribute and supply a solid color

      gl.disableVertexAttribArray(a_colorLoc);
      var r = 0.5;
      var g = 1;
      var b = 0.5;
      var a = 1;
      gl.vertexAttrib4f(a_colorLoc, r, g, b, a); // greenish

      // Draw in the top left corner
      gl.uniformMatrix4fv(
          u_matrixLoc,
          false,
          [0.5, 0, 0, 0,
           0, 0.5, 0, 0,
           0, 0, 1, 0,
           0.5, 0.5, 0, 1]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    main();

<!-- language: lang-css -->

    canvas { border: 1px solid black; }


<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <script id="vshader" type="whatever">
        attribute vec4 a_position;
        attribute vec4 a_color;
        
        varying vec4 v_color;
        
        uniform mat4 u_matrix;
        
        void main() {
            gl_Position = u_matrix * a_position;
            v_color = a_color;
        }    
    </script>
    <script id="fshader" type="whatever">
    precision mediump float;
    varying vec4 v_color;
    void main() {
        gl_FragColor = v_color;
    }
    </script>
    <canvas id="c" width="300" height="300"></canvas>

<!-- end snippet -->


