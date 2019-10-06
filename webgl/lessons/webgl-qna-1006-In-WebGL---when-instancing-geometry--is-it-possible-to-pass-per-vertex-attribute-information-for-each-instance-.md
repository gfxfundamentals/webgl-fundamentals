Title: In WebGL - when instancing geometry, is it possible to pass per-vertex attribute information for each instance?
Description:
TOC: qna

# Question:

I am trying to recreate through raw WebGL [the following three.js example][1] with instanced geometry; though, after testing it looks like I may just have to draw multiple meshes like in the sample but I thought I would ask here first to double check. 

The question now is essentially - is it possible to pass per-vertex data for each instance of the geometry that gets rendered? 

Hopefully that makes sense but if it doesn't - 

 - The geometry I'm rendering has 4 vertices.
 - For each instance of the geometry - I need to assign uv coords to each vertex of each instance of the geometry
 - it seems that setting a stride or offset does not appear to work.

Basically what is happening now is given the current data which looks something like 

    [s1,t1,s2,t2,s3,t3,s4,t4,s1,t1,s2,t2,s3,t3,s4,t4] // enough uvs for 2 instances, each s and t value makes up 1 uv coord for 1 vertex

Instead of data being read and assigned in blocks like this  

          // instance 1            // instance 2
    [[s1,t1,s2,t2,s3,t3,s4,t4], [s1,t1,s2,t2,s3,t3,s4,t4]]
    
    // Each s and t forms 1 uv coord for 1 vertex 

Data appears to be instead being read like this

      [s1,t1,s2,t2,s3,t3,s4,t4,s1,t1,s2,t2,s3,t3,s4,t4]
      // Each s and t pair is assigned to every vertex of each instance

Is it at all possible to get things working like in the second block? If not that's fine but thought I ought to ask.

  [1]: https://threejs.org/examples/?q=video#webgl_materials_video

# Answer

It depends on what you mean by 

>  is it possible to pass per-vertex data for each instance of the geometry that gets rendered?

If you mean via attributes then the answer is no. You can get data per vertex or data per instance but not data per vertex per instance.

But you also get 2 extra inputs, `gl_VertexID` and `gl_InstanceID` (in WebGL2) or you can add your own which you could use to either compute UVs or use to look up data in a texture to effectively achieve your desired result.

For example let's say you have 20x10 cubes. You could do something like

    attribute vec4 position;    // 36 cube positions
    attribute vec2 uv;          // 36 cube UVs
    attribute float instanceId; // 1 per instance

    uniform float cubesAcross;  // set to 20
    uniform float cubesDown;    // set to 10

    varying v_uv;

    void main() {
      float cubeX = mod(instanceId, cubesAcross);
      float cubeY = floor(instanceId / cubesAcross);
      
      v_vu = (vec2(cubeX, cubeY) + uv) / vec2(cubesAcross, cubesDown);
     
      gl_Position = ...whatever you were doing for position before...
    }

example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      const m4 = twgl.m4;
      const gl = document.querySelector("canvas").getContext("webgl");
      const ext = gl.getExtension('ANGLE_instanced_arrays');
      if (!ext) {
        return alert('need ANGLE_instanced_arrays');
      }
      twgl.addExtensionsToContext(gl);
      const vs = `
      attribute vec4 position;
      attribute vec2 texcoord;
      attribute mat4 matrix;
      attribute float instanceId;

      uniform float cubesAcross;  // set to 20
      uniform float cubesDown;    // set to 10

      varying vec2 v_texcoord;

      void main() {
        gl_Position = matrix * position;
        
        float cubeX = mod(instanceId, cubesAcross);
        float cubeY = floor(instanceId / cubesAcross);

        v_texcoord = (vec2(cubeX, cubeY) + texcoord) / vec2(cubesAcross, cubesDown);
      }
      `;

      const fs = `
      precision mediump float;

      varying vec2 v_texcoord;

      void main() {
        gl_FragColor = vec4(v_texcoord, 0, 1);
      }
      `;

      // compile shaders, link, look up locations
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

      const cubesAcross = 20;
      const cubesDown = 10;
      const numCubes = cubesAcross * cubesDown;
      // matrix per instance
      const matrixData = new Float32Array(16 * numCubes);
      const matrices = [];
      const instanceIds = new Float32Array(numCubes);
      for (let i = 0; i < numCubes; ++i) {
        instanceIds[i] = i;
        // make a typedarray view for each matrix
        matrices.push(matrixData.subarray(i * 16, (i + 1) * 16));
      }

      const arrays = {
        position: [
           1,  1, -1, 
           1,  1,  1, 
           1, -1,  1,
           1, -1, -1,
           
          -1,  1,  1,
          -1,  1, -1,
          -1, -1, -1,
          -1, -1,  1, 
          
          -1,  1,  1, 
           1,  1,  1, 
           1,  1, -1,
          -1,  1, -1,
          
          -1, -1, -1,
           1, -1, -1,
           1, -1,  1,
          -1, -1,  1,
          
           1,  1,  1,
          -1,  1,  1,
          -1, -1,  1,
           1, -1,  1,
           
          -1,  1, -1,
           1,  1, -1,
           1, -1, -1,
          -1, -1, -1,
        ],
        texcoord: [
          1, 0,
          0, 0,
          0, 1,
          1, 1,
          
          1, 0,
          0, 0,
          0, 1,
          1, 1,
          
          0, 1,
          1, 1,
          1, 0,
          0, 0,
          
          0, 1,
          1, 1,
          1, 0,
          0, 0,
          
          1, 1,
          0, 1,
          0, 0,
          1, 0,
          
          1, 0,
          0, 0,
          0, 1,
          1, 1,
        ],
        indices: [
           0,  1,  2,  0,  2,  3,
           4,  5,  6,  4,  6,  7,
           8,  9, 10,  8, 10, 11,
          12, 13, 14, 12, 14, 15,
          16, 17, 18, 16, 18, 19,
          20, 21, 22, 20, 22, 23,
        ],
        instanceId: { numComponents: 1, data: instanceIds, divisor: 1 },
        matrix: { numComponents: 16, data: matrices, divisor: 1 },
      };
      // create buffers, upload data (gl.bufferData)
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      function render(time) {
        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fov = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.5;
        const zFar = 100;
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [1, 24, 76];
        const target = [18, 10, 0];
        const up = [0, 1, 0];

        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
        
        // update the instance for each matrix
        const spacing = 2.5 + Math.sin(time) * .5;
        let i = 0;
        for (let y = 0; y < cubesDown; ++y) {
          for (let x = 0; x < cubesAcross; ++x) {
            const matrix = matrices[i++];
            m4.translate(viewProjection, [
              x * spacing,
              y * spacing,
              0,
            ], matrix);
          }
        }

        gl.useProgram(programInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer, ext.vertexAttribDivisorANGLE
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, {
          cubesAcross,
          cubesDown,
        });
        
        // upload instance matrices to buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.matrix.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, matrixData, gl.DYNAMIC_DRAW);

        ext.drawElementsInstancedANGLE(
          gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0,  numCubes);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }

    main();

<!-- language: lang-css -->

    body {
      margin: 0;
    }

    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

If you actually want unique per vertex per instance data then put it in a texture and pass in a vertexId as well. Then use both vertexId and instanceId to compute a texture coordinate

      attribute float instanceId;
      attribute float vertexId;
      
      uniform sampler2D dataTexture;
      uniform vec2 dataTextureSize;

      varying vec2 v_texcoord;

      void main() {

        // each row is for an instance, each texel
        // per vertex. Of course if you want more data
        // per vertex then multiply vertexId by the number of
        // vec4s of data you need. If you need more instances
        // then compute a more complex offset based off instanceId
        vec2 uv = (vec2(vertexId, instanceId) + .5) / dataTextureSize;
        vec4 data = texture2D(dataTexture, uv);

        v_texcoord = data.xy;


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      const m4 = twgl.m4;
      const gl = document.querySelector("canvas").getContext("webgl");
      const ext1 = gl.getExtension('OES_texture_float');
      if (!ext1) {
        return alert('need OES_texture_float');
      }
      const ext = gl.getExtension('ANGLE_instanced_arrays');
      if (!ext) {
        return alert('need ANGLE_instanced_arrays');
      }
      twgl.addExtensionsToContext(gl);
      const vs = `
      attribute vec4 position;
      attribute mat4 matrix;
      attribute float instanceId;
      attribute float vertexId;
      
      uniform sampler2D dataTexture;
      uniform vec2 dataTextureSize;

      varying vec2 v_texcoord;

      void main() {
        gl_Position = matrix * position;

        // each row is for an instance, each texel
        // per vertex. Of course if you want more data
        // per vertex then multiply vertexId by the number of
        // vec4s of data you need. If you need more instances
        // then compute a more complex offset based off instanceId
        vec2 uv = (vec2(vertexId, instanceId) + .5) / dataTextureSize;
        vec4 data = texture2D(dataTexture, uv);

        v_texcoord = data.xy;
      }
      `;

      const fs = `
      precision mediump float;

      varying vec2 v_texcoord;

      void main() {
        gl_FragColor = vec4(v_texcoord, 0, 1);
      }
      `;

      // compile shaders, link, look up locations
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

      const cubesAcross = 20;
      const cubesDown = 10;
      const numCubes = cubesAcross * cubesDown;
      // matrix per instance
      const matrixData = new Float32Array(16 * numCubes);
      const matrices = [];
      const instanceIds = new Float32Array(numCubes);
      for (let i = 0; i < numCubes; ++i) {
        instanceIds[i] = i;
        // make a typedarray view for each matrix
        matrices.push(matrixData.subarray(i * 16, (i + 1) * 16));
      }

      const arrays = {
        position: [
           1,  1, -1, 
           1,  1,  1, 
           1, -1,  1,
           1, -1, -1,
           
          -1,  1,  1,
          -1,  1, -1,
          -1, -1, -1,
          -1, -1,  1, 
          
          -1,  1,  1, 
           1,  1,  1, 
           1,  1, -1,
          -1,  1, -1,
          
          -1, -1, -1,
           1, -1, -1,
           1, -1,  1,
          -1, -1,  1,
          
           1,  1,  1,
          -1,  1,  1,
          -1, -1,  1,
           1, -1,  1,
           
          -1,  1, -1,
           1,  1, -1,
           1, -1, -1,
          -1, -1, -1,
        ],
        vertexId: {
          numComponents: 1,
          data: [
             0,  1,  2,  3,
             4,  5,  6,  7,
             8,  9, 10, 11,
            12, 13, 14, 15,
            16, 17, 18, 19,
            20, 21, 21, 23,
          ],
        },
        indices: [
           0,  1,  2,  0,  2,  3,
           4,  5,  6,  4,  6,  7,
           8,  9, 10,  8, 10, 11,
          12, 13, 14, 12, 14, 15,
          16, 17, 18, 16, 18, 19,
          20, 21, 22, 20, 22, 23,
        ],
        instanceId: { numComponents: 1, data: instanceIds, divisor: 1 },
        matrix: { numComponents: 16, data: matrices, divisor: 1 },
      };
      // create buffers, upload data (gl.bufferData)
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      // put UV data in texture
      const uvs = [];
      for (let y = 0; y < cubesDown; ++y) {
        const v0 = (y    ) / cubesDown;
        const v1 = (y + 1) / cubesDown;
        for (let x = 0; x < cubesAcross; ++x) {
          const u0 = (x    ) / cubesAcross;
          const u1 = (x + 1) / cubesAcross;
          uvs.push(u0, v0, 0, 0, u1, v0, 0, 0, u0, v1, 0, 0, u1, v1, 0, 0);
          uvs.push(u0, v0, 0, 0, u1, v0, 0, 0, u0, v1, 0, 0, u1, v1, 0, 0);
          uvs.push(u0, v0, 0, 0, u1, v0, 0, 0, u0, v1, 0, 0, u1, v1, 0, 0);
          uvs.push(u0, v0, 0, 0, u1, v0, 0, 0, u0, v1, 0, 0, u1, v1, 0, 0);
          uvs.push(u0, v0, 0, 0, u1, v0, 0, 0, u0, v1, 0, 0, u1, v1, 0, 0);
          uvs.push(u0, v0, 0, 0, u1, v0, 0, 0, u0, v1, 0, 0, u1, v1, 0, 0);
        }
      }
      
      const texWidth = 24; // width = 24 vertices * 1 texel per
      const texHeight = numCubes; // height = numInstances
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,  // level
        gl.RGBA,
        texWidth,
        texHeight,
        0,  // border
        gl.RGBA,
        gl.FLOAT,
        new Float32Array(uvs));


      function render(time) {
        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fov = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.5;
        const zFar = 100;
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [1, 24, 76];
        const target = [18, 10, 0];
        const up = [0, 1, 0];

        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
        
        // update the instance for each matrix
        const spacing = 2.5 + Math.sin(time) * .5;
        let i = 0;
        for (let y = 0; y < cubesDown; ++y) {
          for (let x = 0; x < cubesAcross; ++x) {
            const matrix = matrices[i++];
            m4.translate(viewProjection, [
              x * spacing,
              y * spacing,
              0,
            ], matrix);
          }
        }

        gl.useProgram(programInfo.program);
        // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer, ext.vertexAttribDivisorANGLE
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, {
          dataTexture: tex,
          dataTextureSize: [texWidth, texHeight],
        });
        
        // upload instance matrices to buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.matrix.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, matrixData, gl.DYNAMIC_DRAW);

        ext.drawElementsInstancedANGLE(
          gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0,  numCubes);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }

    main();

<!-- language: lang-css -->

    body {
      margin: 0;
    }

    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->


