Title: WebGL draw perspective view volume
Description:
TOC: qna

# Question:

I'm trying to calculate the 8 (4+4) vertices of a view volume's plane : near and far.

![view volume][1]

I need this vertices to draw, in webGL, the view volume of a camera.


  [1]: https://i.stack.imgur.com/dKVTY.jpg

So far I managed to calculate them by using trigonometry from each perspective but somehow the result does not seem accurate when I draw the vertices.
I reached this equations for vertices so far:

y = sqrt(hypotenuse^2 - plane^2)

x = sqrt(hypotenuse^2 - plane^2)

z = plane (near or far)

Can anyone help? Thank you in advance.


# Answer

you can just project a standard cube through an inverse projection matrix.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");

    const vs = `
    attribute vec4 position;
    uniform mat4 u_worldViewProjection;
    void main() {
      gl_Position = u_worldViewProjection * position;
    }
    `;

    const fs = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(1, 0, 0, 1);
    }
    `;


    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const arrays = {
       position: [
          -1,  1, -1,
           1,  1, -1,
           1, -1, -1,
          -1, -1, -1,

          -1,  1,  1,
           1,  1,  1,
           1, -1,  1,
          -1, -1,  1,
      ],
      indices: [
          0, 1, 1, 2, 2, 3, 3, 0,
          4, 5, 5, 6, 6, 7, 7, 4,
          0, 4, 1, 5, 2, 6, 3, 7,
      ],
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      let projectionToViewWith;
      {  
        const fov = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.5;
        const zFar = 100;
        projectionToViewWith = m4.perspective(fov, aspect, zNear, zFar); 
      }
      let projectionToBeViewed;
      {
        const fov = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 2;
        const zFar = 10;
        projectionToBeViewed = m4.perspective(fov, aspect, zNear, zFar); 
      }
      const inverseProjectionToBeViewed = m4.inverse(projectionToBeViewed);
      
      const radius = 20;
      const eye = [Math.sin(time) * radius, 4, Math.cos(time) * radius];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);

      const viewProjection = m4.multiply(projectionToViewWith, view);
      
      const worldViewProjection = m4.multiply(
          viewProjection,
          inverseProjectionToBeViewed);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      twgl.setUniforms(programInfo, {
        u_worldViewProjection: worldViewProjection,
      });
      twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

To get the points of the 8 corners you just have to do a reverse projection. The projection matrix takes the space of the frustum that is fovy tall, fovy * aspect wide, starting at -zNear and ending at -zFar and converting that space to -1 <-> +1 box after the perspective divide.

To go backward and compute the points of that box we just project a -1 to +1 box through the inverse projection matrix and do the perpective divide again (which is exactly what's happening in the example above, we're just doing it all in the GPU)

So, we pull it out of the GPU and do it in JavaScript

    [
      [-1,  1, -1],
      [ 1,  1, -1],
      [ 1, -1, -1],
      [-1, -1, -1],

      [-1,  1,  1],
      [ 1,  1,  1],
      [ 1, -1,  1],
      [-1, -1,  1],
    ].forEach((point) => {
      console.log(m4.transformPoint(inverseProjectionMatrix, point));
    });

Here's an example. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");

    const vs = `
    attribute vec4 position;
    uniform mat4 u_worldViewProjection;
    void main() {
      gl_Position = u_worldViewProjection * position;
      gl_PointSize = 10.;
    }
    `;

    const fs = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
    `;


    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const positions = [
        -1,  1, -1,
         1,  1, -1,
         1, -1, -1,
        -1, -1, -1,

        -1,  1,  1,
         1,  1,  1,
         1, -1,  1,
        -1, -1,  1,
    ];
    const arrays = {
       position: positions,
       indices: [
          0, 1, 1, 2, 2, 3, 3, 0,
          4, 5, 5, 6, 6, 7, 7, 4,
          0, 4, 1, 5, 2, 6, 3, 7,
      ],
    };
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      let projectionToViewWith;
      {  
        const fov = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.5;
        const zFar = 100;
        projectionToViewWith = m4.perspective(fov, aspect, zNear, zFar); 
      }
      let projectionToBeViewed;
      {
        const fov = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 2;
        const zFar = 10;
        projectionToBeViewed = m4.perspective(fov, aspect, zNear, zFar); 
      }
      const inverseProjectionToBeViewed = m4.inverse(projectionToBeViewed);
      
      const radius = 20;
      const eye = [Math.sin(time) * radius, 4, Math.cos(time) * radius];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);

      const viewProjection = m4.multiply(projectionToViewWith, view);
      
      const worldViewProjection = m4.multiply(
          viewProjection,
          inverseProjectionToBeViewed);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      twgl.setUniforms(programInfo, {
        u_worldViewProjection: worldViewProjection,
        u_color: [1, 0, 0, 1],
      });
      twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);
      
      // just because I'm lazy let's draw each point one at a time
      // note: since in our case the frustum is not moving we
      // could have computed these at init time. 
      const positionLoc = programInfo.attribSetters.position.location;
      gl.disableVertexAttribArray(positionLoc);

      for (let i = 0; i < positions.length; i += 3) {
        const point = positions.slice(i, i + 3);
        const worldPosition = m4.transformPoint(
            inverseProjectionToBeViewed, point);
        gl.vertexAttrib3f(positionLoc, ...worldPosition);
        twgl.setUniforms(programInfo, {
          u_color: [0, 1, 0, 1],
          u_worldViewProjection: viewProjection,
        });
        gl.drawArrays(gl.POINT, 0, 1);
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Mention in a comment you wanted to show the view frustum of a camera in one canvas in another canvas.

That's effectively what's happening above except the camera in canvasWhosFrustumWeWantToRender is not moving. Instead it's just sitting at the origin looking down the -Z axis with +Y up. To allow the frustum to move to show where it is relative to teh camera just need to add in the camera matrix

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const ext = gl.getExtension("OES_standard_derivatives");

    const vs = `
    attribute vec4 position;
    uniform mat4 u_worldViewProjection;
    varying vec3 v_position;
    void main() {
      gl_Position = u_worldViewProjection * position;
      v_position = position.xyz;  // for fake lighting
    }
    `;

    const fs = `
    #extension GL_OES_standard_derivatives : enable
    precision mediump float;
    varying vec3 v_position;
    uniform vec4 u_color;
    void main() {
      vec3 fdx = dFdx(v_position);
      vec3 fdy = dFdy(v_position);

      vec3 n = normalize(cross(fdx,fdy)); 
      float l = dot(n, normalize(vec3(1,2,-3))) * .5 + .5;  
      gl_FragColor = u_color;
      gl_FragColor.rgb *= l;
    }
    `;


    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const arrays = {
       position: [
          -1,  1, -1,
           1,  1, -1,
           1, -1, -1,
          -1, -1, -1,

          -1,  1,  1,
           1,  1,  1,
           1, -1,  1,
          -1, -1,  1,
      ],
      indices: [
          0, 1, 1, 2, 2, 3, 3, 0,
          4, 5, 5, 6, 6, 7, 7, 4,
          0, 4, 1, 5, 2, 6, 3, 7,
      ],
    };
    const concat = twgl.primitives.concatVertices;
    const reorient = twgl.primitives.reorientVertices;
    const wireCubeBufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
    const solidCubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);
    const cameraBufferInfo = twgl.createBufferInfoFromArrays(gl,
      concat([
         reorient(twgl.primitives.createCubeVertices(2), 
                  m4.translation([0, 0, 1])),
         reorient(twgl.primitives.createTruncatedConeVertices(0, 1, 2, 12, 1),
                  m4.rotationX(Math.PI * -.5)),
      ])
    );

    const black = [0, 0, 0, 1];
    const blue = [0, 0, 1, 1];

    function drawScene(viewProjection, clearColor) {
      gl.clearColor(...clearColor);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const numCubes = 10;
      for (let i = 0; i < numCubes; ++i) {
        const u = i / numCubes;
        let mat = m4.rotationY(u * Math.PI * 2);
        mat = m4.translate(mat, [0, 0, 10]);
        mat = m4.scale(mat, [1, 1 + u * 23 % 1, 1]);
        mat = m4.translate(mat, [0, .5, 0]);
        mat = m4.multiply(viewProjection, mat);
        drawModel(solidCubeBufferInfo, mat, [u, u * 3 % 1, u * 7 % 1,1]);
      }
    }

    function drawModel(bufferInfo, worldViewProjection, color, mode) {
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, {
        u_worldViewProjection: worldViewProjection,
        u_color: color,
      });
      twgl.drawBufferInfo(gl, bufferInfo, mode);  
    }

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      const width = gl.canvas.width;
      const height = gl.canvas.height;
      const halfWidth = width / 2;
      gl.viewport(0, 0, width, height);

      gl.disable(gl.SCISSOR_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      let projectionToViewWith;  // the projection on the right
      {  
        const fov = 60 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / 2 / gl.canvas.clientHeight;
        const zNear = 0.5;
        const zFar = 100;
        projectionToViewWith = m4.perspective(fov, aspect, zNear, zFar); 
      }
      let projectionToBeViewed;  // the projeciton on the left
      {
        const fov = 60 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / 2 / gl.canvas.clientHeight;
        const zNear = 1.5;
        const zFar = 15;
        projectionToBeViewed = m4.perspective(fov, aspect, zNear, zFar); 
      }
      const inverseProjectionToBeViewed = m4.inverse(projectionToBeViewed);
      
      let cameraViewingScene;  // camera for right view
      {
        const t1 = 0;
        const radius = 30;
        const eye = [Math.sin(t1) * radius, 4, Math.cos(t1) * radius];
        const target = [0, 0, 0];
        const up = [0, 1, 0];
        cameraViewingScene = m4.lookAt(eye, target, up);
      }
      
      let cameraInScene;  // camera for left view
      {
        const t1 = time;
        const t2 = time + .4;
        const r1 = 10 + Math.sin(t1);
        const r2 = 10 + Math.sin(t2) * 2;
        const eye = [Math.sin(t1) * r1, 0 + Math.sin(t1) * 4, Math.cos(t1) * r1];
        const target = [Math.sin(t2) * r2, 1 + Math.sin(t2), Math.cos(t2) * r2];
        const up = [0, 1, 0];
        cameraInScene = m4.lookAt(eye, target, up);
      }

      // there's only one shader program so just set it once
      gl.useProgram(programInfo.program);
      
      // draw only on left half of canvas
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(0, 0, halfWidth, height);
      gl.viewport(0, 0, halfWidth, height);
      
      // draw the scene on the left using the camera inside the scene
      {
         const view = m4.inverse(cameraInScene);
         const viewProjection = m4.multiply(projectionToBeViewed, view);
         drawScene(viewProjection, [.9, 1, .9, 1]);
      }
      
      // draw only on right half of canvas
      gl.scissor(halfWidth, 0, halfWidth, height);
      gl.viewport(halfWidth, 0, halfWidth, height);
      
      // draw the same scene on the right using the camera outside the scene
      {
        const view = m4.inverse(cameraViewingScene);
        const viewProjection = m4.multiply(projectionToViewWith, view);
        drawScene(viewProjection, [.9, 1, 1, 1]);
      
        // draw the in scene camera's frustum
        {
          const world = m4.multiply(cameraInScene, inverseProjectionToBeViewed);
          const worldViewProjection = m4.multiply(viewProjection, world);
          drawModel(wireCubeBufferInfo, worldViewProjection, black, gl.LINES);
        }
        
        // draw the in scene camera's camera model
        {
           const worldViewProjection = m4.multiply(viewProjection, cameraInScene);
           drawModel(cameraBufferInfo, worldViewProjection, blue);
        }
      }  

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


