Title: FPS-like camera movement with basic matrix transformations (WebGL)
Description:
TOC: qna

# Question:

I have a simple scene in WebGL where i store every transformation (for the camera and the models) in a single model/view matrix and i set them by rotating and moving said matrix. 

What i want is, to being able to rotate the camera around and when i "move forward" to move towards where the camera is pointing.

So far, i have modified [this][1] code to this:

        mat4.identity(mvMatrix);    
        mat4.rotateX(mvMatrix, degToRad(elev), mvMatrix);   
        mat4.rotateY(mvMatrix, degToRad(ang), mvMatrix);   
        mat4.rotateZ(mvMatrix, degToRad(-roll), mvMatrix);  
        mat4.translate(mvMatrix, [-px, -py, -pz], mvMatrix);
since it wasn't working as it was and it kind of works, until you do an extreme rotation (more than 90 degrees).

This is not a deal breaker for what i'm doing, but i want to know. Is this the best i can get without moving away from calculating the camera orientation like this? 

  [1]: https://stackoverflow.com/questions/18463868/webgl-translation-after-rotation-of-the-camera-as-an-fps

# Answer

WebGL cameras generally point down the -Z axis so to move in the direction the camera is facing you just add the camera's Z axis (elements 8, 9, 10) to the position of the camera multiplied by some velocity.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.querySelector("canvas").getContext("webgl");
    const vs = `
    uniform mat4 u_worldViewProjection;
    uniform mat4 u_worldInverseTranspose;

    attribute vec4 position;
    attribute vec3 normal;

    varying vec3 v_normal;

    void main() {
      gl_Position = u_worldViewProjection * position;
      v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec3 v_normal;
    uniform vec3 u_lightDir;
    uniform vec4 u_color;

    void main() {
      vec3 norm = normalize(v_normal);
      float light = dot(u_lightDir, norm) * .5 + .5;
      gl_FragColor = vec4(u_color.rgb * light, u_color.a);
    }
    `;

    const progInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    const projection = m4.identity();
    const camera = m4.identity();
    const view = m4.identity();
    const viewProjection = m4.identity();
    const world = m4.identity();
    const worldViewProjection = m4.identity();
    const worldInverse = m4.identity();
    const worldInverseTranspose = m4.identity();

    const fov = degToRad(90);
    const zNear = 0.1;
    const zFar = 100;

    const lightDir = v3.normalize([1, 2, 3]);

    const keys = {};

    let px = 0;
    let py = 0;
    let pz = 0;
    let elev = 0;
    let ang = 0;
    let roll = 0;
    const speed = 1;
    const turnSpeed = 90;

    let then = 0;
    function render(now) {
      now *= 0.001;  // seconds;
      const deltaTime = now - then;
      then = now;
      
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      
      gl.useProgram(progInfo.program);
      
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      m4.perspective(fov, aspect, zNear, zFar, projection);

      m4.identity(camera);    
      m4.translate(camera, [px, py, pz], camera);
      m4.rotateX(camera, degToRad(elev), camera);   
      m4.rotateY(camera, degToRad(-ang), camera);   
      m4.rotateZ(camera, degToRad(roll), camera);
      
      m4.inverse(camera, view);

      m4.multiply(projection, view, viewProjection);
      
      for (let z = -1; z <= 1; ++z) {
        for (let y = -1; y <= 1; ++y) {
          for (let x = -1; x <= 1; ++x) {
            if (x === 0 && y === 0 && z === 0) {
              continue;
            }
            
            m4.identity(world);
            m4.translate(world, [x * 3, y * 3, z * 3], world);
            
            m4.multiply(viewProjection, world, worldViewProjection);
            m4.inverse(world, worldInverse);
            m4.transpose(worldInverse, worldInverseTranspose);
            
            twgl.setBuffersAndAttributes(gl, progInfo, bufferInfo);
            twgl.setUniforms(progInfo, {
              u_worldViewProjection: worldViewProjection,
              u_worldInverseTranspose: worldInverseTranspose,
              u_color: [(x + 2) / 3, (y + 2) / 3, (z + 2) / 3, 1],
              u_lightDir: lightDir,
            });
            twgl.drawBufferInfo(gl, bufferInfo);
          }
        }
      }
      
      if (keys['87'] || keys['83']) {
        const direction = keys['87'] ? 1 : -1;
        px -= camera[ 8] * deltaTime * speed * direction;
        py -= camera[ 9] * deltaTime * speed * direction;
        pz -= camera[10] * deltaTime * speed * direction;
      }
      
      if (keys['65'] || keys['68']) {
        const direction = keys['65'] ? 1 : -1;
        ang += deltaTime * turnSpeed * direction;
      }

      if (keys['81'] || keys['69']) {
        const direction = keys['81'] ? 1 : -1;
        roll += deltaTime * turnSpeed * direction;
      }

      if (keys['38'] || keys['40']) {
        const direction = keys['38'] ? 1 : -1;
        elev += deltaTime * turnSpeed * direction;
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    window.addEventListener('keydown', (e) => {
      keys[e.keyCode] = true;
      e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      keys[e.keyCode] = false;
      e.preventDefault();
    });

    function degToRad(d) {
      return d * Math.PI / 180;
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }
    pre { position: absolute; left: 1em; top: 0; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>
    <pre>
    A = left
    D = right
    W = forward
    S = down
    Q = roll left
    E = roll right
    UP = look up
    DN = look down
    </pre>

<!-- end snippet -->


