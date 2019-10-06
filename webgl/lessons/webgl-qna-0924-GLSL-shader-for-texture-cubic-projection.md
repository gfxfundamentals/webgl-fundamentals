Title: GLSL shader for texture cubic projection
Description:
TOC: qna

# Question:

I am trying to implement a texture cubic projection inside my WebGL shader, like in the picture below:

[![Cubic projection][1]][1]


What I tried so far:

I am passing the bounding box of my object (the box in the middle of the picture) as follows:

 uniform vec3 u_bbmin;
 uniform vec3 u_bbmax;

... so the eight vertexes of my projection box are:

    vec3 v1 = vec3(u_bbmin.x, u_bbmin.y, u_bbmin.z);
    vec3 v2 = vec3(u_bbmax.x, u_bbmin.y, u_bbmin.z);
    vec3 v3 = vec3(u_bbmin.x, u_bbmax.y, u_bbmin.z);
    ...other combinations
    vec3 v8 = vec3(u_bbmax.x, u_bbmax.y, u_bbmax.z);

At the end, to sample from my texture I need a map in the form of:

    varying vec3 v_modelPos;
    ...
    uniform sampler2D s_texture;
    vec2 tCoords = vec2(0.0);
    
    tCoords.s = s(x,y,z)
    tCoords.t = t(y,y,z)
    
    vec4 color = texture2D(s_texture, tCoords);


I was able to implement spherical and cylindrical projections, but I am stuck now how to get this kind of cubic map, The texture shall stretch to the whole bounding box, aspect ratio doesn't matter.

Maybe I am missing some key points and I need some hints. How should the math for a cubic projection looks like?


  [1]: https://i.stack.imgur.com/p3Iwn.jpg

# Answer

I honestly don't know if this is correct or not but ...

Looking up how cube mapping works there's a table in the OpenGL ES 2.0 spec

>     Major Axis Direction|        Target             |sc |tc |ma |
>     --------------------+---------------------------+---+---+---+
>            +rx          |TEXTURE_CUBE_MAP_POSITIVE_X|−rz|−ry| rx|
>            −rx          |TEXTURE_CUBE_MAP_NEGATIVE_X| rz|−ry| rx|
>            +ry          |TEXTURE_CUBE_MAP_POSITIVE_Y| rx| rz| ry|
>            −ry          |TEXTURE_CUBE_MAP_NEGATIVE_Y| rx|−rz| ry|
>            +rz          |TEXTURE_CUBE_MAP_POSITIVE_Z| rx|−ry| rz|
>            −rz          |TEXTURE_CUBE_MAP_NEGATIVE_Z|−rx|−ry| rz|
>     --------------------+---------------------------+---+---+---+
>
>    Table 3.21: Selection of cube map images based on major axis direction of texture coordinates

Using that I wrote this function

    #define RX 0
    #define RY 1
    #define RZ 2
    #define S 0
    #define T 1
    
    void majorAxisDirection(vec3 normal, inout mat4 uvmat) {
       vec3 absnorm = abs(normal);
       if (absnorm.x > absnorm.y && absnorm.x > absnorm.z) {
         // x major
         if (normal.x >= 0.0) {
           uvmat[RZ][S] = -1.;
           uvmat[RY][T] = -1.;
         } else {
           uvmat[RZ][S] =  1.;
           uvmat[RY][T] = -1.;
         }
       } else if (absnorm.y > absnorm.z) {
         // y major
         if (normal.y >= 0.0) {
           uvmat[RX][S] =  1.;
           uvmat[RZ][T] =  1.;
         } else {
           uvmat[RX][S] =  1.;
           uvmat[RZ][T] = -1.;
         }
       } else {
         // z major
         if (normal.z >= 0.0) {
           uvmat[RX][S] =  1.;
           uvmat[RY][T] = -1.;
         } else {
           uvmat[RX][S] = -1.;
           uvmat[RY][T] = -1.;
         }
       }
    }

You pass in a matrix and it sets it up to move the correct X, Y, or Z to the X and Y columns (to convert to s and t). In other words you pass in normal and it returns s and t.

This would effectively give a unit cube projected on the positive side of the origin. Adding in another matrix we can move and scale that cube. 

If you want it to fit the cube exactly then you need to set the scale, translation and orientation to match the cube.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    /* global document, twgl, requestAnimationFrame */

    const vs = `
    uniform mat4 u_model;
    uniform mat4 u_viewProjection;

    attribute vec4 position;
    attribute vec3 normal;
    attribute vec2 texcoord;

    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_position;

    void main() {
      v_texCoord = texcoord;
      vec4 position = u_model * position;
      gl_Position = u_viewProjection * position;
      v_position = position.xyz;
      v_normal = (u_model * vec4(normal, 0)).xyz;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec3 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;

    uniform mat4 u_cubeProjection;
    uniform sampler2D u_diffuse;

    #define RX 0
    #define RY 1
    #define RZ 2
    #define S 0
    #define T 1

    #if BOX_PROJECTION

    void majorAxisDirection(vec3 normal, inout mat4 uvmat) {
       vec3 absnorm = abs(normal);
       if (absnorm.x > absnorm.y && absnorm.x > absnorm.z) {
         // x major
         if (normal.x >= 0.0) {
           uvmat[RZ][S] = -1.;
           uvmat[RY][T] = -1.;
         } else {
           uvmat[RZ][S] =  1.;
           uvmat[RY][T] = -1.;
         }
       } else if (absnorm.y > absnorm.z) {
         // y major
         if (normal.y >= 0.0) {
           uvmat[RX][S] =  1.;
           uvmat[RZ][T] =  1.;
         } else {
           uvmat[RX][S] =  1.;
           uvmat[RZ][T] = -1.;
         }
       } else {
         // z major
         if (normal.z >= 0.0) {
           uvmat[RX][S] =  1.;
           uvmat[RY][T] = -1.;
         } else {
           uvmat[RX][S] = -1.;
           uvmat[RY][T] = -1.;
         }
       }
    }

    #else  // cube projection

    void majorAxisDirection(vec3 normal, inout mat4 uvmat) {
       vec3 absnorm = abs(normal);
       if (absnorm.x > absnorm.y && absnorm.x > absnorm.z) {
         // x major
         uvmat[RZ][S] =  1.;
         uvmat[RY][T] = -1.;
       } else if (absnorm.y > absnorm.z) {
         uvmat[RX][S] =  1.;
         uvmat[RZ][T] =  1.;
       } else {
         uvmat[RX][S] =  1.;
         uvmat[RY][T] = -1.;
       }
    }

    #endif

    void main() {
      vec3 normal = normalize(v_normal);
      mat4 uvmat = mat4(
        vec4(0, 0, 0, 0),
        vec4(0, 0, 0, 0),
        vec4(0, 0, 0, 0),
        vec4(0, 0, 0, 1));
      majorAxisDirection(normal, uvmat);
      uvmat = mat4(
        abs(uvmat[0]),
        abs(uvmat[1]),
        abs(uvmat[2]),
        abs(uvmat[3]));
      
      vec2 uv = (uvmat * u_cubeProjection * vec4(v_position, 1)).xy;
      
      gl_FragColor = texture2D(u_diffuse, uv);
    }
    `;

    const m4 = twgl.m4;
    const gl = twgl.getWebGLContext(document.getElementById("c"));
    // compile shaders, look up locations
    const cubeProjProgramInfo = twgl.createProgramInfo(gl,
        [vs, '#define BOX_PROJECTION 0\n' + fs]);
    const boxProjProgramInfo = twgl.createProgramInfo(gl, 
        [vs, '#define BOX_PROJECTION 1\n' + fs]);

    let progNdx = 1;
    const programInfos = [
      cubeProjProgramInfo,
      boxProjProgramInfo,
    ];

    // create buffers
    const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);
    const sphereBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 60, 40);

    const ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = 256;
    ctx.canvas.height = 256;
    ctx.fillStyle = `hsl(${360}, 0%, 30%)`;
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; ++y) {
      for (let x = 0; x < 4; x += 2) {
        ctx.fillStyle = `hsl(${(x + y) / 16 * 360}, 100%, 75%)`;
        ctx.fillRect((x + (y & 1)) * 64, y * 64, 64, 64);
      }
    }
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 256, 256);
    ctx.font = "240px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = 'red';
    ctx.fillText("F", 128, 128);

    const texture = twgl.createTexture(gl, {
      src: ctx.canvas,
      wrap: gl.CLAMP_TO_EDGE,
      min: gl.LINEAR,  // no mips
    });

    function addElem(parent, type) {
      const elem = document.createElement(type);
      parent.appendChild(elem);
      return elem;
    }

    function makeRange(parent, obj, prop, min, max, name) {
      const divElem = addElem(parent, 'div');
      const inputElem = addElem(divElem, 'input');
      Object.assign(inputElem, {
        type: 'range',
        min: 0,
        max: 1000,
        value: (obj[prop] - min) / (max - min) * 1000,
      });
      const valueElem = addElem(divElem, 'span');
      valueElem.textContent = obj[prop].toFixed(2);
      const labelElem = addElem(divElem, 'label');
      labelElem.textContent = name;
      
      function update() {
        inputElem.value = (obj[prop] - min) / (max - min) * 1000,
        valueElem.textContent = obj[prop].toFixed(2);
      }
      
      inputElem.addEventListener('input', (e) => {
        obj[prop] = (e.target.value / 1000 * (max - min) + min);
        update();
      });
      
      return update;
    }

    const models = [
      cubeBufferInfo,
      sphereBufferInfo,
      cubeBufferInfo,
    ];
    const rotateSpeeds = [
      1,
      1,
      0,
    ];
    let modelNdx = 0;
    const ui = document.querySelector('#ui');
    const cubeMatrix = m4.translation([0.5, 0.5, 0.5]);
    const updaters = [
      makeRange(ui, cubeMatrix,  0, -2, 2, 'sx'),
      makeRange(ui, cubeMatrix,  5, -2, 2, 'sy'),
      makeRange(ui, cubeMatrix, 10, -2, 2, 'sz'),
      makeRange(ui, cubeMatrix, 12, -2, 2, 'tx'),
      makeRange(ui, cubeMatrix, 13, -2, 2, 'ty'),
      makeRange(ui, cubeMatrix, 14, -2, 2, 'tz'),
    ];
    document.querySelectorAll('input[name=shape]').forEach((elem) => {
      elem.addEventListener('change', (e) => {
        if (e.target.checked) {
          modelNdx = parseInt(e.target.value);
          if (modelNdx == 2) {
            m4.scaling([1/2, 1/2, 1/2], cubeMatrix);
            m4.translate(cubeMatrix, [1, 1, 1], cubeMatrix);
            updaters.forEach(f => f());
          }
        }
      })
    });
    document.querySelectorAll('input[name=proj]').forEach((elem) => {
      elem.addEventListener('change', (e) => {
        if (e.target.checked) {
          progNdx = parseInt(e.target.value);
        }
      })
    });


    const uniforms = {
      u_diffuse: texture,
      u_cubeProjection: cubeMatrix,
    };

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      const programInfo = programInfos[progNdx];
      const bufferInfo = models[modelNdx];

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const fov = 30 * Math.PI / 180;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.5;
      const zFar = 10;
      const projection = m4.perspective(fov, aspect, zNear, zFar);
      const eye = [0, 4, -4];
      const target = [0, 0, 0];
      const up = [0, 1, 0];

      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);
      const model = m4.rotationY(time * rotateSpeeds[modelNdx]);

      uniforms.u_viewProjection = viewProjection;
      uniforms.u_model = model;

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body {
      margin: 0;
      font-family: monospace;
      color: white;
    }
    canvas {
      display: block;
      width: 100vw;
      height: 100vh;
      background: #444;
    }
    #ui {
      position: absolute;
      left: 0;
      top: 0;
    }
    #ui span {
      display: inline-block;
      width: 4em;
      text-align: right;
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <div id="ui">
      <div>
        <input type="radio" name="proj" id="sphere" value="0">
        <label for="sphere">cubic projection</label>
        <input type="radio" name="proj" id="cube" value="1" checked>
        <label for="cube">box projection</label>
      </div> 
      <div>
        <input type="radio" name="shape" id="sphere" value="1">
        <label for="sphere">sphere</label>
        <input type="radio" name="shape" id="cube" value="0" checked>
        <label for="cube">cube</label>
        <input type="radio" name="shape" id="cube" value="2">
        <label for="cube">cube match</label>
      </div> 
    </div>

<!-- end snippet -->


