Title: GLSL vertex shader gl_Position for gl.POINTS with large gl.PointSize
Description:
TOC: qna

# Question:

I'm trying to render a lot of points with large gl_PointSize. Looks vertex shader will automatically discard gl.POINTS rendering if the position is out if[-1, 1]. 

In my case, if the point's position is a little bit out of [-1, 1], part of it still should be shown on the canvas. Any way to let the shader keep rendering point, when position out of [-1, 1]?

Here's the code to draw a point with position a little bit off the canvas. But it is expect to show nearly half of it on canvas.
```
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var positions = [
    -1.0001, -1
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  ....

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  gl.drawArrays(gl.POINTS, 0, 1);
```
In my vertex shader, I have
```
  ....
  gl_PointSize = 32.0;
  ....
```

# Answer

I am unable to repeat your issue. Drawing outside the canvas with POINTS seems to work for me

From [the OpenGL ES 2.0 spec](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf) section 2.13

> If the primitive under consideration is a point, then clipping discards it if it lies outside the near or far clip plane; **otherwise it is passed unchanged**.

Are you seeing different results?

Of course be aware that both WebGL and OpenGL ES 2.0 are only required to support a max point size of 1.0. It looks like [most support at least 60](https://webglstats.com/webgl/parameter/ALIASED_POINT_SIZE_RANGE)


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext('webgl');
    const vs = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
      gl_PointSize = 64.0;
    }
    `;
    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
    `;
    const program = twgl.createProgram(gl, [vs, fs]);
    const positionLoc = gl.getAttribLocation(program, 'position');
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.001, -1.001,
       1.001, -1.001,
      -1.001,  1.001,
       1.001,  1.001,
       0,      0,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    gl.drawArrays(gl.POINTS, 0, 5);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

# Update

According to [this thread](https://github.com/KhronosGroup/WebGL/issues/2888) this is an issue with OpenGL vs OpenGL ES

The OpenGL spec says

> If the primitive under consideration is a point, then clipping passes it unchanged if it lies within the clip volume; otherwise, it is discarded.

It's subtly different from the OpenGL ES spec. Effectively OpenGL clips the points, OpenGL ES does not. Even stranger though is that many OpenGL drivers don't clip like the spec claims they are supposed to.

The short version of that means you can't count on whether or not the points are not clipped in WebGL so you might want to consider drawing your own quads instead. You can make your vertex shader expand the quads by whatever value you're currently using for `gl_PointSize` and either use GPU instancing or manual instancing to draw lots of points. For each POINT position if you're using GPU instancing then there is one position per point just like it is now. If you're using manual instancing then you need to repeat the position for each vertex or add a point Id and put your positions in a texture if you don't want to repeat the positions in the attributes.

Example of using GPU instancing

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');
    const ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) {
      alert('need ANGLE_instanced_arrays');
    }

    const vs = `
      attribute vec4 position;       // center point
      attribute vec2 cornerPosition; // the corners (-0.5 to 0.5)
      
      uniform vec2 resolution;
      
      varying vec3 pointCoord;  // only if you need gl_PointCoord substitute
      
      void main() {
        // do the normal thing (can mult by matrix or whatever here
        gl_Position = position; 

        float pointSize = 64.0;
        
        // -- point emulation
        
        gl_Position.xy += cornerPosition * (pointSize * 2.0 - 1.0) / 
                          resolution * gl_Position.w;
        
        // only if you need gl_PointCoord substitute
        pointCoord = vec3(cornerPosition * 0.5, gl_Position.z);
      }
    `;

    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
    `;

    const programInfo = twgl.createProgram(gl, [vs, fs]);

    const program = twgl.createProgram(gl, [vs, fs]);
    const positionLoc = gl.getAttribLocation(program, 'position');
    const cornerPositionLoc = gl.getAttribLocation(program, 'cornerPosition');
    const resolutionLoc = gl.getUniformLocation(program, 'resolution');

    {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.001, -1.001,
         1.001, -1.001,
        -1.001,  1.001,
         1.001,  1.001,
         0,      0,
      ]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      ext.vertexAttribDivisorANGLE(positionLoc, 1);
    }

    {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.5, -0.5,
         0.5, -0.5,
        -0.5,  0.5,
        
        -0.5,  0.5,
         0.5, -0.5,
         0.5,  0.5,
      ]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(cornerPositionLoc);
      gl.vertexAttribPointer(cornerPositionLoc, 2, gl.FLOAT, false, 0, 0);
    }

    gl.useProgram(program);
    gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);
    ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, 5);  // 5 points, 6 verts per point

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

You should see this create the same image as above. It has the advantage that it is not subject to the point size limit and works around the driver bugs. Test on your own hardware and see if it solves your issue.

Just remember if you're not using vertex array object then you probably need to reset the attribute divisor back to zero before trying to render something else.

      ext.vertexAttribDivisorANGLE(positionLoc, 0);

One more example just to test

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector('canvas').getContext('webgl');
    const ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) {
      alert('need ANGLE_instanced_arrays');
    }

    const vs = `
      attribute vec4 position;       // center point
      attribute vec2 cornerPosition; // the corners (-0.5 to 0.5)
      
      uniform vec2 resolution;
      uniform mat4 matrix;
      
      varying vec3 pointCoord;  // only if you need gl_PointCoord substitute
      
      void main() {
        // do the normal thing (can mult by matrix or whatever here
        gl_Position = matrix * position; 

        float pointSize = 20.0 / gl_Position.w;
        
        // -- point emulation
        
        gl_Position.xy += cornerPosition * (pointSize * 2.0 - 1.0) / 
                          resolution * gl_Position.w;
        
        // only if you need gl_PointCoord substitute
        pointCoord = vec3(cornerPosition * 0.5, gl_Position.z);
      }
    `;

    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
    `;

    const programInfo = twgl.createProgram(gl, [vs, fs]);

    const program = twgl.createProgram(gl, [vs, fs]);
    const positionLoc = gl.getAttribLocation(program, 'position');
    const cornerPositionLoc = gl.getAttribLocation(program, 'cornerPosition');
    const resolutionLoc = gl.getUniformLocation(program, 'resolution');
    const matrixLoc = gl.getUniformLocation(program, 'matrix');
    const numPoints = 100;

    {
      // adapted from http://stackoverflow.com/a/26127012/128511

      function fibonacciSphere(samples, i) {
        const rnd = 1.;
        const offset = 2. / samples;
        const increment = Math.PI * (3. - Math.sqrt(5.));

        //  for i in range(samples):
        const y = ((i * offset) - 1.) + (offset / 2.);
        const r = Math.sqrt(1. - Math.pow(y ,2.));

        const phi = (i + rnd % samples) * increment;

        const x = Math.cos(phi) * r;
        const z = Math.sin(phi) * r;

        return [x, y, z];
      }
      
      const positions = [];
      for (let i = 0; i < numPoints; ++i) {
        positions.push(...fibonacciSphere(numPoints, i));
      }

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
      ext.vertexAttribDivisorANGLE(positionLoc, 1);
    }

    {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -0.5, -0.5,
         0.5, -0.5,
        -0.5,  0.5,
        
        -0.5,  0.5,
         0.5, -0.5,
         0.5,  0.5,
      ]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(cornerPositionLoc);
      gl.vertexAttribPointer(cornerPositionLoc, 2, gl.FLOAT, false, 0, 0);
    }

    function render(ms) {
      const secs = ms * 0.001;
      
      const mat = m4.perspective(
          60 * Math.PI / 180,
          gl.canvas.clientWidth / gl.canvas.clientHeight,
          0.1,
          100);
      m4.translate(mat, [0, 0, -2.11 + Math.sin(secs)], mat);
      m4.rotateX(mat, secs, mat);
      m4.rotateY(mat, secs * 0.93, mat);
      
      gl.useProgram(program);
      gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);
      gl.uniformMatrix4fv(matrixLoc, false, mat);
      
      // 6 verts per point
      ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, numPoints);  
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


