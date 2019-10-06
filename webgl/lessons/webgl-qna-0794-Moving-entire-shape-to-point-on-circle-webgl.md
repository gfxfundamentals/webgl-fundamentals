Title: Moving entire shape to point on circle webgl
Description:
TOC: qna

# Question:

I have the following code trying to draw a wreath by putting stars on points on a circle. I  am able to draw one star, but when I try to draw a wreath it only draws one branch around the circle, or right now on one point on the circle. I know there is a problem with how I am nesting the modelViewMatrices I can't think of the proper way to go about doing the transformation. I need to draw the star and then translate the entire star.

       function DrawWreath()
        {
            var radius = 0.5;
            for (var i = 0; i < 1; i++) {
                var theta = i * 30;
                var x = radius * Math.cos(theta);
                var y = radius * Math.sin(theta);
                var t = translate(x, y, 0);
                 if (modelViewMatrix) {
                    modelViewMatrix = mult(modelViewMatrix, t) ;
                 } else {
                    modelViewMatrix = t;
                 }
                modelViewStack.push(modelViewMatrix);
                DrawOneStar();
                modelViewMatrix = modelViewStack.pop();
            }
        
        }
    
    function DrawOneStar()
    {
        // draw the full star
        for (var i=1; i <= 5; i++) {
             r = rotate(72*i, 0, 0, 1);
             if (modelViewMatrix) {
                modelViewMatrix = mult(r, modelViewMatrix) ;
             } else {
                modelViewMatrix = r;
             }
             modelViewMatrix = r;
             DrawOneBranch();
             
        }
    }
    
    function DrawOneBranch()
    {
        var s;
    
        // one branch
        s = scale4(1/16, 1/16, 1); 
        modelViewStack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays( gl.LINE_LOOP, 0, vertices.length);
    
        /*
        modelViewMatrix = modelViewStack.pop();
        //s = scale4(1/8, -1/8, 1);
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays( gl.LINE_STRIP, 0, vertices.length);
        */
    }



# Answer

Lots of issues with the code

* The code in `DrawOneStar` is rotating on the left

        mult(r, modelViewMatrix)    // ???

  Seems like you want this

        mult(modelViewMatrix, r)
  
  just like you did with `translate` and `scale`

* The code in `DrawOneStar` is not saving the matrix

  that means you either want to fix the code so it saves
  the matrix or, you want to rotate a fixed amount. 

  As the code is now it's rotating 72, then rotating 72 + 144, then rotating
  72 + 144 + 216 because each time it's rotating the matrix it previously
  rotated

* The code in `DrawOneBranch` is not popping the matrix

  That line is commented out

* `theta` is using degrees

  Most math libraries use radians so this code is probably not doing
  what you expect

          var theta = i * 30;
          var x = radius * Math.cos(theta);
          var y = radius * Math.sin(theta);

  `Math.sin` and `Math.cos` require radians not degrees.

* The outer loop is only doing one iteration

        for (var i = 0; i < 1; i++) {   // ???

Other suggestions

* use a better math library. Whatever math library requires calling a `flatten` function to prepare the matrices to be usable by WebGL will be slower than one that doesn't. Also a library that takes radians for rotation and field of view means it will match the other built in math functions like `Math.cos` etc...

* Put a matrix in `modelViewMatrix` to start. Then you can remove all the checks for if there is a matrix or not

* When looping and computing a value consider using normalized numbers (numbers that go from 0 to 1) then computing other values based on that. 

  For example the code has `theta = i * 30` in the outer loop and in the next loop there's `rotate(i * 72, ...)` but if you change the number of iterations then you also have to change those numbers to match.

  Instead first compute a value that goes from to 0 to 1 based on the loop. Example

        const numStars = 10;
        for (let i = 0; i < numStars; ++i) {
          const l = i / numStars;   // goes from 0 to 1

  Then use that value to compute the angle;

          const theta = l * 360;  // or l * Math.PI * 2 for radians

   Similarly 

          const numRotations = 5;
          for (let i = 0; i < numRotations; ++i) {
             const l = i / numRotations;  // goes from 0 to 1
             rotate(i * 360, ....

   That way you can change `numStars` and `numRotations` easily and not
   have to change any other code

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function DrawWreath()
        {
            var radius = 0.5;
            for (var i = 0; i < 10; i++) {
                var theta = i / 10 * Math.PI * 2;
                var x = radius * Math.cos(theta);
                var y = radius * Math.sin(theta);
                var t = translate(x, y, 0);
                modelViewStack.push(modelViewMatrix);
                modelViewMatrix = mult(modelViewMatrix, t) ;
                DrawOneStar();
                modelViewMatrix = modelViewStack.pop();
            }

        }

    function DrawOneStar()
    {
        // draw the full star
        for (var i=1; i <= 5; i++) {
             var r = rotate(72, 0, 0, 1);
             modelViewMatrix = mult(modelViewMatrix, r) ;
             DrawOneBranch();

        }
    }

    function DrawOneBranch()
    {
        var s;

        // one branch
        s = scale4(1/16, 1/16, 1); 
        modelViewStack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays( gl.LINE_LOOP, 0, vertices.length);
        

        modelViewMatrix = modelViewStack.pop();
        /*
        //s = scale4(1/8, -1/8, 1);
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays( gl.LINE_STRIP, 0, vertices.length);
        */
    }

    function flatten(m) {
      return m;
    }

    function translate(x, y, z) {
      return m4.translation([x, y, z]);
    }

    function scale4(x, y, z) {
      return m4.scaling([x, y, z]);
    }

    function rotate(a, x, y, z) {
      return m4.axisRotation([x, y, z], a * Math.PI / 180);
    }

    function mult(a, b) {
      return m4.multiply(a, b);
    }

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const modelViewStack = [];
    let modelViewMatrix = m4.identity();

    const vs = `
    attribute vec4 position;
    uniform mat4 u_projectionMatrix;
    uniform mat4 u_modelViewMatrix;
    void main() {
      gl_Position = u_projectionMatrix * u_modelViewMatrix * position;
    }
    `;

    const fs = `
    void main() { gl_FragColor = vec4(1,0,0,1); }
    `;
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [
          0, 1,
          -.33, 0,
          .33, 0,
        ],
      },
    });

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const scale = 1;
    twgl.setUniforms(programInfo, {
      u_projectionMatrix: m4.ortho(
         -aspect / scale, aspect / scale, -1 / scale, 1 / scale, -1, 1),
      u_modelViewMatrix: m4.identity(),
    });
    const vertices = { length: 3, };
    const modelViewMatrixLoc = gl.getUniformLocation(programInfo.program, "u_modelViewMatrix");
    DrawWreath();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

One more thing, rather than manually computing a position on a cirlce you could use the matrix function for that as well, rotate, then translate

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function DrawWreath()
        {
            const radius = 0.5;
            const numStars = 20;
            for (let i = 0; i < numStars; ++i) {
                const l = i / numStars;
                const theta = l * Math.PI * 2;
                const r = rotateInRadians(theta, 0, 0, 1);
                const t = translate(radius, 0, 0);            
                modelViewStack.push(modelViewMatrix);
                modelViewMatrix = mult(modelViewMatrix, r);
                modelViewMatrix = mult(modelViewMatrix, t);
                DrawOneStar();
                modelViewMatrix = modelViewStack.pop();
            }

        }

    function DrawOneStar()
    {
        // draw the full star
        const numParts = 6;
        for (let i = 0; i < numParts; ++i) {
             const l = i / numParts;
             const r = rotateInRadians(l * Math.PI * 2, 0, 0, 1);
             modelViewStack.push(modelViewMatrix);
             modelViewMatrix = mult(modelViewMatrix, r) ;
             DrawOneBranch();
             modelViewMatrix = modelViewStack.pop();
        }
    }

    function DrawOneBranch()
    {
        var s;

        // one branch
        s = scale4(1/16, 1/16, 1); 
        modelViewStack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, s);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays( gl.LINE_LOOP, 0, vertices.length);
        
        modelViewMatrix = modelViewStack.pop();
    }

    function flatten(m) {
      return m;
    }

    function translate(x, y, z) {
      return m4.translation([x, y, z]);
    }

    function scale4(x, y, z) {
      return m4.scaling([x, y, z]);
    }

    function rotate(a, x, y, z) {
      return m4.axisRotation([x, y, z], a * Math.PI / 180);
    }

    function rotateInRadians(a, x, y, z) {
      return m4.axisRotation([x, y, z], a);
    }

    function mult(a, b) {
      return m4.multiply(a, b);
    }

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const modelViewStack = [];
    let modelViewMatrix = m4.identity();

    const vs = `
    attribute vec4 position;
    uniform mat4 u_projectionMatrix;
    uniform mat4 u_modelViewMatrix;
    void main() {
      gl_Position = u_projectionMatrix * u_modelViewMatrix * position;
    }
    `;

    const fs = `
    void main() { gl_FragColor = vec4(1,0,0,1); }
    `;
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [
          0, 1,
          -.33, 0,
          .33, 0,
        ],
      },
    });

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const scale = 1;
    twgl.setUniforms(programInfo, {
      u_projectionMatrix: m4.ortho(
         -aspect / scale, aspect / scale, -1 / scale, 1 / scale, -1, 1),
      u_modelViewMatrix: m4.identity(),
    });
    const vertices = { length: 3, };
    const modelViewMatrixLoc = gl.getUniformLocation(programInfo.program, "u_modelViewMatrix");
    DrawWreath();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


You might find [these articles useful](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html)
