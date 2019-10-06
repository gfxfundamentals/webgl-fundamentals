Title: Given set of points, how to generate polyhedron in Javascript
Description:
TOC: qna

# Question:

I am doing a WEBGL visualization project in material science. What I am trying to accomplish right now is that, I have a set of 3D coordinates of atoms. They are bonded together. I would like to create a polyhedron for each molecule. 

I noticed that in [Matlab there is a handy function called `alphaShape` which can determine the most similar shape according to your input points and return the best match of polyhedron.](http://www.mathworks.com/help/matlab/ref/alphashape.html)

I tried to solve the problem by using brute force method: I traverse the whole point array and form triangles with every combination of three points. The following problem with that is then how can I detect which faces to get rid of? Cuz some of the triangle faces will go through the center atoms that the peripheral atoms are bonded with.

I will appreciate any suggestion and idea! 
Thanks!

# Answer

There's a library [alpha-shape](https://github.com/mikolalysenko/alpha-shape) that seems to do what you want.

I gave it a set of sphere points and let it generate the triangles. 

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    //var alphaShape = require('alpha-shape')

    var subdivisionsHeight = 12;
    var subdivisionsAxis = 16;
    var longRange = Math.PI * 2;
    var latRange = Math.PI;
    var radius = 4;

    var points = [];
    for (var y = 0; y <= subdivisionsHeight; y++) {
      for (var x = 0; x < subdivisionsAxis; x++) {
        // Generate a vertex based on its spherical coordinates
        var u = x / subdivisionsAxis;
        var v = y / subdivisionsHeight;
        var theta = longRange * u;
        var phi = latRange * v;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        var ux = cosTheta * sinPhi;
        var uy = cosPhi;
        var uz = sinTheta * sinPhi;
        points.push([radius * ux, radius * uy, radius * uz]);
        if (y == 0 || y == subdivisionsHeight) {
          break;
        }
      }
    }

    // var cells = alphaShape(0.1, points)
    // Results from alphaShape

    var cells = [ [ 2, 0, 1 ],
      [ 0, 2, 3 ],
      [ 0, 3, 4 ],
      [ 5, 0, 4 ],
      [ 5, 6, 0 ],
      [ 7, 0, 6 ],
      [ 0, 7, 8 ],
      [ 0, 16, 1 ],
      [ 9, 0, 8 ],
      [ 0, 9, 10 ],
      [ 0, 10, 11 ],
      [ 1, 18, 2 ],
      [ 0, 11, 12 ],
      [ 18, 3, 2 ],
      [ 0, 12, 13 ],
      [ 14, 0, 13 ],
      [ 3, 20, 4 ],
      [ 0, 14, 15 ],
      [ 4, 20, 5 ],
      [ 15, 16, 0 ],
      [ 5, 22, 6 ],
      [ 22, 7, 6 ],
      [ 18, 1, 17 ],
      [ 24, 8, 7 ],
      [ 19, 3, 18 ],
      [ 9, 8, 24 ],
      [ 19, 20, 3 ],
      [ 9, 26, 10 ],
      [ 20, 21, 5 ],
      [ 10, 26, 11 ],
      [ 22, 5, 21 ],
      [ 1, 16, 32 ],
      [ 1, 32, 17 ],
      [ 11, 28, 12 ],
      [ 22, 23, 7 ],
      [ 13, 12, 28 ],
      [ 23, 24, 7 ],
      [ 14, 13, 30 ],
      [ 25, 9, 24 ],
      [ 15, 14, 30 ],
      [ 25, 26, 9 ],
      [ 16, 15, 32 ],
      [ 26, 27, 11 ],
      [ 28, 11, 27 ],
      [ 18, 17, 33 ],
      [ 29, 13, 28 ],
      [ 13, 29, 30 ],
      [ 35, 19, 18 ],
      [ 20, 19, 35 ],
      [ 15, 30, 31 ],
      [ 15, 31, 32 ],
      [ 21, 20, 37 ],
      [ 37, 22, 21 ],
      [ 23, 22, 39 ],
      [ 18, 33, 34 ],
      [ 23, 39, 24 ],
      [ 34, 35, 18 ],
      [ 24, 41, 25 ],
      [ 20, 35, 36 ],
      [ 20, 36, 37 ],
      [ 26, 25, 42 ],
      [ 27, 26, 43 ],
      [ 17, 32, 48 ],
      [ 22, 37, 38 ],
      [ 17, 48, 33 ],
      [ 22, 38, 39 ],
      [ 44, 28, 27 ],
      [ 29, 28, 44 ],
      [ 40, 24, 39 ],
      [ 29, 45, 30 ],
      [ 24, 40, 41 ],
      [ 41, 42, 25 ],
      [ 31, 30, 47 ],
      [ 32, 31, 47 ],
      [ 26, 42, 43 ],
      [ 43, 44, 27 ],
      [ 50, 34, 33 ],
      [ 45, 29, 44 ],
      [ 34, 51, 35 ],
      [ 30, 45, 46 ],
      [ 35, 51, 36 ],
      [ 30, 46, 47 ],
      [ 36, 52, 37 ],
      [ 48, 32, 47 ],
      [ 37, 54, 38 ],
      [ 33, 48, 49 ],
      [ 50, 33, 49 ],
      [ 38, 55, 39 ],
      [ 55, 40, 39 ],
      [ 34, 50, 51 ],
      [ 41, 40, 56 ],
      [ 51, 52, 36 ],
      [ 57, 42, 41 ],
      [ 52, 53, 37 ],
      [ 58, 43, 42 ],
      [ 54, 37, 53 ],
      [ 59, 44, 43 ],
      [ 54, 55, 38 ],
      [ 45, 44, 61 ],
      [ 56, 40, 55 ],
      [ 46, 45, 62 ],
      [ 56, 57, 41 ],
      [ 62, 47, 46 ],
      [ 58, 42, 57 ],
      [ 63, 48, 47 ],
      [ 58, 59, 43 ],
      [ 48, 64, 49 ],
      [ 59, 60, 44 ],
      [ 60, 61, 44 ],
      [ 50, 49, 66 ],
      [ 66, 51, 50 ],
      [ 45, 61, 62 ],
      [ 52, 51, 68 ],
      [ 47, 62, 63 ],
      [ 53, 52, 68 ],
      [ 63, 64, 48 ],
      [ 70, 54, 53 ],
      [ 70, 55, 54 ],
      [ 65, 66, 49 ],
      [ 72, 56, 55 ],
      [ 51, 66, 67 ],
      [ 57, 56, 72 ],
      [ 68, 51, 67 ],
      [ 74, 58, 57 ],
      [ 69, 53, 68 ],
      [ 69, 70, 53 ],
      [ 59, 58, 75 ],
      [ 64, 80, 49 ],
      [ 65, 49, 80 ],
      [ 59, 76, 60 ],
      [ 70, 71, 55 ],
      [ 61, 60, 76 ],
      [ 71, 72, 55 ],
      [ 61, 78, 62 ],
      [ 73, 57, 72 ],
      [ 73, 74, 57 ],
      [ 63, 62, 79 ],
      [ 58, 74, 75 ],
      [ 80, 64, 63 ],
      [ 76, 59, 75 ],
      [ 66, 65, 81 ],
      [ 77, 61, 76 ],
      [ 67, 66, 82 ],
      [ 78, 61, 77 ],
      [ 62, 78, 79 ],
      [ 84, 68, 67 ],
      [ 80, 63, 79 ],
      [ 85, 69, 68 ],
      [ 70, 69, 85 ],
      [ 65, 80, 81 ],
      [ 70, 86, 71 ],
      [ 82, 66, 81 ],
      [ 87, 72, 71 ],
      [ 83, 67, 82 ],
      [ 83, 84, 67 ],
      [ 72, 89, 73 ],
      [ 89, 74, 73 ],
      [ 85, 68, 84 ],
      [ 74, 90, 75 ],
      [ 86, 70, 85 ],
      [ 76, 75, 92 ],
      [ 86, 87, 71 ],
      [ 93, 77, 76 ],
      [ 72, 87, 88 ],
      [ 77, 93, 78 ],
      [ 72, 88, 89 ],
      [ 78, 94, 79 ],
      [ 89, 90, 74 ],
      [ 79, 96, 80 ],
      [ 90, 91, 75 ],
      [ 80, 96, 81 ],
      [ 75, 91, 92 ],
      [ 76, 92, 93 ],
      [ 98, 82, 81 ],
      [ 83, 82, 99 ],
      [ 93, 94, 78 ],
      [ 99, 84, 83 ],
      [ 95, 79, 94 ],
      [ 100, 85, 84 ],
      [ 96, 79, 95 ],
      [ 102, 86, 85 ],
      [ 97, 98, 81 ],
      [ 103, 87, 86 ],
      [ 88, 87, 103 ],
      [ 99, 82, 98 ],
      [ 88, 104, 89 ],
      [ 84, 99, 100 ],
      [ 89, 106, 90 ],
      [ 100, 101, 85 ],
      [ 101, 102, 85 ],
      [ 107, 91, 90 ],
      [ 96, 112, 81 ],
      [ 112, 97, 81 ],
      [ 92, 91, 107 ],
      [ 102, 103, 86 ],
      [ 92, 108, 93 ],
      [ 104, 88, 103 ],
      [ 94, 93, 110 ],
      [ 89, 104, 105 ],
      [ 105, 106, 89 ],
      [ 94, 111, 95 ],
      [ 111, 96, 95 ],
      [ 106, 107, 90 ],
      [ 108, 92, 107 ],
      [ 98, 97, 113 ],
      [ 108, 109, 93 ],
      [ 114, 99, 98 ],
      [ 93, 109, 110 ],
      [ 94, 110, 111 ],
      [ 100, 99, 116 ],
      [ 101, 100, 117 ],
      [ 96, 111, 112 ],
      [ 101, 117, 102 ],
      [ 97, 112, 113 ],
      [ 102, 118, 103 ],
      [ 98, 113, 114 ],
      [ 120, 104, 103 ],
      [ 114, 115, 99 ],
      [ 116, 99, 115 ],
      [ 105, 104, 121 ],
      [ 100, 116, 117 ],
      [ 106, 105, 122 ],
      [ 107, 106, 122 ],
      [ 117, 118, 102 ],
      [ 124, 108, 107 ],
      [ 118, 119, 103 ],
      [ 119, 120, 103 ],
      [ 109, 108, 125 ],
      [ 110, 109, 125 ],
      [ 104, 120, 121 ],
      [ 105, 121, 122 ],
      [ 110, 127, 111 ],
      [ 111, 127, 112 ],
      [ 107, 122, 123 ],
      [ 128, 113, 112 ],
      [ 123, 124, 107 ],
      [ 129, 114, 113 ],
      [ 125, 108, 124 ],
      [ 114, 131, 115 ],
      [ 110, 125, 126 ],
      [ 115, 131, 116 ],
      [ 127, 110, 126 ],
      [ 117, 116, 133 ],
      [ 127, 128, 112 ],
      [ 118, 117, 133 ],
      [ 118, 135, 119 ],
      [ 114, 129, 130 ],
      [ 120, 119, 135 ],
      [ 114, 130, 131 ],
      [ 137, 121, 120 ],
      [ 132, 116, 131 ],
      [ 122, 121, 137 ],
      [ 116, 132, 133 ],
      [ 139, 123, 122 ],
      [ 128, 144, 113 ],
      [ 133, 134, 118 ],
      [ 144, 129, 113 ],
      [ 135, 118, 134 ],
      [ 140, 124, 123 ],
      [ 125, 124, 140 ],
      [ 136, 120, 135 ],
      [ 125, 141, 126 ],
      [ 120, 136, 137 ],
      [ 142, 127, 126 ],
      [ 138, 122, 137 ],
      [ 138, 139, 122 ],
      [ 128, 127, 144 ],
      [ 139, 140, 123 ],
      [ 146, 130, 129 ],
      [ 141, 125, 140 ],
      [ 130, 146, 131 ],
      [ 141, 142, 126 ],
      [ 148, 132, 131 ],
      [ 127, 142, 143 ],
      [ 127, 143, 144 ],
      [ 133, 132, 149 ],
      [ 149, 134, 133 ],
      [ 145, 129, 144 ],
      [ 150, 135, 134 ],
      [ 145, 146, 129 ],
      [ 152, 136, 135 ],
      [ 131, 146, 147 ],
      [ 147, 148, 131 ],
      [ 136, 153, 137 ],
      [ 138, 137, 153 ],
      [ 132, 148, 149 ],
      [ 139, 138, 155 ],
      [ 134, 149, 150 ],
      [ 140, 139, 155 ],
      [ 151, 135, 150 ],
      [ 152, 135, 151 ],
      [ 141, 140, 157 ],
      [ 152, 153, 136 ],
      [ 141, 158, 142 ],
      [ 142, 158, 143 ],
      [ 138, 153, 154 ],
      [ 159, 144, 143 ],
      [ 138, 154, 155 ],
      [ 160, 145, 144 ],
      [ 156, 140, 155 ],
      [ 140, 156, 157 ],
      [ 145, 162, 146 ],
      [ 141, 157, 158 ],
      [ 163, 147, 146 ],
      [ 163, 148, 147 ],
      [ 158, 159, 143 ],
      [ 164, 149, 148 ],
      [ 159, 160, 144 ],
      [ 149, 166, 150 ],
      [ 162, 145, 161 ],
      [ 151, 150, 167 ],
      [ 152, 151, 167 ],
      [ 162, 163, 146 ],
      [ 152, 168, 153 ],
      [ 163, 164, 148 ],
      [ 154, 153, 170 ],
      [ 165, 149, 164 ],
      [ 166, 149, 165 ],
      [ 155, 154, 171 ],
      [ 145, 160, 176 ],
      [ 161, 145, 176 ],
      [ 156, 155, 171 ],
      [ 150, 166, 167 ],
      [ 156, 172, 157 ],
      [ 168, 152, 167 ],
      [ 158, 157, 174 ],
      [ 153, 168, 169 ],
      [ 153, 169, 170 ],
      [ 175, 159, 158 ],
      [ 160, 159, 175 ],
      [ 154, 170, 171 ],
      [ 172, 156, 171 ],
      [ 161, 177, 162 ],
      [ 172, 173, 157 ],
      [ 177, 163, 162 ],
      [ 157, 173, 174 ],
      [ 164, 163, 177 ],
      [ 177, 165, 164 ],
      [ 175, 158, 174 ],
      [ 177, 166, 165 ],
      [ 167, 166, 177 ],
      [ 176, 160, 175 ],
      [ 168, 167, 177 ],
      [ 177, 161, 176 ],
      [ 169, 168, 177 ],
      [ 169, 177, 170 ],
      [ 170, 177, 171 ],
      [ 171, 177, 172 ],
      [ 172, 177, 173 ],
      [ 174, 173, 177 ],
      [ 175, 174, 177 ],
      [ 175, 177, 176 ] ]

    function flatten(array) {
      return array.reduce(function(a, b) {
        return a.concat(b);
      }, []);
    }

    // the cells are triangle (3 points). To draw lines we need 6 A->B, B->C, C->A
    function expandToLines(cells) {
      return flatten(cells.map(function(cell) {
        return [cell[0], cell[1], cell[1], cell[2], cell[2], cell[0]];
      }));
    }

    var vs = `
    attribute vec4 position;
    uniform mat4 u_matrix;
    void main() {
      gl_Position = u_matrix * position;
    }
    `;
    var fs = `
    precision mediump float;

    void main() {
      gl_FragColor = vec4(0, 0, 0, 1);
    }
    `;

    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl");
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var arrays = {
      position: flatten(points),
      indices: expandToLines(cells),
    };
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      var projection = m4.perspective(
          60 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 20);
      var eye = [1, 4, -10];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(projection, view);
      var world = m4.rotateX(m4.rotationY(time), time * 0.7);

      var uniforms = {
        u_matrix: m4.multiply(viewProjection, world),
      };

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0 }
    canvas { width: 100vw; height: 100vh; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <canvas id="c"></canvas>

<!-- end snippet -->

Note that you need to make sure you don't give it any coincident points. Notice the sphere point generation avoids making coincident points.
