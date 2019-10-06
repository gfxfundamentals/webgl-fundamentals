Title: Conway's game of life in 3D FPS problems
Description:
TOC: qna

# Question:

I am trying to implement [conway's game of life][1] in 3D. Basically, I am experimenting it with an extra dimension.

I am instantiating a list of cubes at the start of the game and give each one of them an index that's going to be associated with a logic object where I call [twgl.drawObjectList][2] if it's alive, else I will skip it within a function that I am using requestAnimationFrame on.

**The problem is** that the FPS drops below 1 when I make a 50*50*50 (125000 cubes) game. Is this normal? Am I doing the correct approach?

Edit: 

    function newGame (xDimV, yDimV, zDimV, gameSelected = false) {
    // No game to load
    if (!gameSelected) {
        xDim = xDimV;
        yDim = yDimV;
        zDim = zDimV;
    } else {
        xDim = gameSelected[0][0].length;
        yDim = gameSelected[0].length;
        zDim = gameSelected.length;
    }
    myGame = Object.create(game);
    myGame.consutructor(xDim , yDim , zDim, gameSelected);
    objects = [];
    for (var z = 0; z < zDim; z++) {
        for (var y = 0; y < yDim; y++){
            for (var x = 0; x < xDim; x++){
            
                var uniforms = {
                    u_colorMult: chroma.hsv(emod(baseHue + rand(0, 120), 360), rand(0.5,
                                        1), rand(0.5, 1)).gl(),
                    u_world: m4.identity(),
                    u_worldInverseTranspose: m4.identity(),
                    u_worldViewProjection: m4.identity(),
                };

                var drawObjects = [];
                drawObjects.push({
                    programInfo: programInfo,
                    bufferInfo: cubeBufferInfo,
                    uniforms: uniforms,
                });

                objects.push({
                    translation: [(x*scale)-xDim*scale/2, (z*scale), (y*scale)-yDim*scale/2],
                    scale: scale,
                    uniforms: uniforms,
                    bufferInfo: cubeBufferInfo,
                    programInfo: programInfo,
                    drawObject: drawObjects,
                    index: [z, y, x],
                });
            }
        }
    }
    requestAnimationFrame(render);
    }

    var then = 0;
    function render(time) {
    time *= 0.001;
    var elapsed = time - then;
    then = time;

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(255, 255, 0, 0.1);
    var fovy = 30 * Math.PI / 180;
    var projection = m4.perspective(fovy, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10000);

    var eye = [cameraX, cameraY, cameraZ];
    var target = [cameraX, cameraY, 10];
    var up = [0, 1, 0];

    var camera = m4.lookAt(eye, target, up);
    var view = m4.inverse(camera);
    var viewProjection = m4.multiply(projection, view);
    viewProjection =  m4.rotateX(viewProjection, phi);
    viewProjection = m4.rotateY(viewProjection, theta);
    targetTimer -= elapsed;
    
    objects.forEach(function(obj) {
        var uni = obj.uniforms;
        var world = uni.u_world;
        m4.identity(world);
        m4.translate(world, obj.translation, world);
        m4.scale(world, [obj.scale, obj.scale, obj.scale], world);
        m4.transpose(m4.inverse(world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose);
        m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);

        if (myGame.life[obj.index[0]][obj.index[1]][obj.index[2]] === 1) {
            twgl.drawObjectList(gl, obj.drawObject);
        }
    });
    if (targetTimer <= 0 && !paused) {
        targetTimer = targetChangeInterval / speed;
        myGame.nextGen();
        setGameStatus();
        myGame.resetStatus();
    }
    requestAnimationFrame(render);
    }

Thanks in advance.


  [1]: https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life
  [2]: https://pastebin.com/yvsgBtaA

# Answer

125k cubes is quite a lot. Typical AAA games generally make 1000 to 5000 draw calls total. There are breakdowns on the web of various game engines and how many draw calls they take the generate a frame.

Here's [a talk with several methods](https://www.youtube.com/watch?v=rfQ8rKGTVlg). It includes putting all the cubes in one giant mesh and moving them around in JavaScript so they're is effectively one draw call.

If it was me I'd do that and I'd make a texture with one pixel per cube. So for 125k cubes that texture would be like 356x356 though I'd probably choose something more fitting the cube size like 500x300 (since each face slice is 50x50). For each vertex of each cube I'd have an attribute with a UV pointing to a specific pixel in that texture. In other words for the first vertices of the first cube there would be an attribute that UVs that repeats 36 times, in a new UVs for the 2nd cube that repeats 36 times, 

     attribute vec2 cubeUV;

Then I can use the cubeUV to lookup a pixel in the texture whether or not the cube should be on or off

     attribute vec2 cubeUV;
     uniform sampler2D lifeTexture;     

     void main() {
       float cubeOn = texture2D(lifeTexture, cubeUV).r;
     }


I could clip out the cube pretty easily with

       if (cubeOn < 0.5) {
         gl_Position = vec4(2, 2, 2, 1);  // outside clip space
         return;
       }

       // otherwise do the calcs for a cube

In this case the cubes don't need to move so all JavaScript has to do each frame is compute life in some `Uint8Array` and then call 

    gl.bindTexture(gl.TEXTURE_2D, lifeTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, width, height, 0,
                  gl.LUMINANCE, gl.UNSIGNED_BYTE, lifeStatusUint8Array);

every frame and make one draw call.

Note: You can effectively see examples of this type of shader [here](https://www.vertexshaderart.com/art/Q4dpCbhvWMYfDz5Nb) except that that shdaer is not looking at a texture with *life* running in it, instead it's looking at a texture with 4 seconds of audio data in it. It's also generating the `cubeId` from `vertexId` and generating the cube vertices and normals from `vertexId`.  That would make it slower than putting that data in attributes but it is an example of positioning or drawing cubes based on data coming from a texture.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    attribute vec4 position;
    attribute vec3 normal;
    attribute vec2 cubeUV;

    uniform mat4 u_matrix;
    uniform sampler2D u_lifeTex;

    varying vec3 v_normal;

    void main() {
      float on = texture2D(u_lifeTex, cubeUV).r;
      if (on < .5) {
         gl_Position = vec4(20, 20, 20, 1);
         return;
      }
      gl_Position = u_matrix * position;  
      v_normal = normal;
    }
    `;

    const fs = `
    precision mediump float;

    varying vec3 v_normal;

    void main() {
      gl_FragColor = vec4(v_normal * .5 + .5, 1);
    }
    `;

    const oneFace = [
      [ -1, -1, ],
      [  1, -1, ],
      [ -1,  1, ],
      [ -1,  1, ],
      [  1, -1, ],
      [  1,  1, ],
    ];

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");

    // compiles shaders, links program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const cubeSize = 50;
    const texBuf = makeCubeTexBuffer(gl, cubeSize);
    const tex = twgl.createTexture(gl, {
      src: texBuf.buffer,
      width: texBuf.width,
      format: gl.LUMINANCE,
      wrap: gl.CLAMP_TO_EDGE,
      minMag: gl.NEAREST,
    });

    const arrays = makeCubes(cubeSize, texBuf);
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
      time *= 0.001; // seconds
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
      //gl.enable(gl.CULL_FACE);
      
      const fov = Math.PI * .25;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = .01;
      const zFar  = 1000;
      const projection = m4.perspective(fov, aspect, zNear, zFar);
      
      const radius = cubeSize * 2.5;
      const speed = time * .1;
      const position = [
         Math.sin(speed) * radius, 
         Math.sin(speed * .7) * radius * .7, 
         Math.cos(speed) * radius,
      ];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const camera = m4.lookAt(position, target, up);
      
      const view = m4.inverse(camera);
      
      const mat = m4.multiply(projection, view);

      // do life
      // (well, randomly turn on/off cubes)
      for (let i = 0; i < 100; ++i) {
         texBuf.buffer[Math.random() * texBuf.buffer.length | 0] = Math.random() > .5 ? 255 : 0;
      }
      
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, texBuf.width, texBuf.height,
                    0, gl.LUMINANCE, gl.UNSIGNED_BYTE, texBuf.buffer);
      
      gl.useProgram(programInfo.program)

      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      twgl.setUniforms(programInfo, {
        u_matrix: mat,
        u_lifeTex: tex,
      });

      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // generate cubes
    function makeCube(vertOffset, off, uv, arrays) {
      const positions = arrays.position;
      const normals = arrays.normal;
      const cubeUV = arrays.cubeUV;
      
      for (let f = 0; f < 6; ++f) {
        const axis = f / 2 | 0;    
        const sign = f % 2 ? -1 : 1;
        const major = (axis + 1) % 3;
        const minor = (axis + 2) % 3;

        for (let i = 0; i < 6; ++i) {
          const offset2 = vertOffset * 2;
          const offset3 = vertOffset * 3;
          positions[offset3 + axis ] = off[axis]  + sign;
          positions[offset3 + major] = off[major] + oneFace[i][0];
          positions[offset3 + minor] = off[minor] + oneFace[i][1];
          normals[offset3 + axis ] = sign;
          normals[offset3 + major] = 0;
          normals[offset3 + minor] = 0;
          
          cubeUV[offset2 + 0] = uv[0]; 
          cubeUV[offset2 + 1] = uv[1]; 
          ++vertOffset;
        }
      }
      return vertOffset;
    }

    function makeCubes(size, texBuf) {
      const numCubes = size * size * size;
      const numVertsPerCube = 36;
      const numVerts = numCubes * numVertsPerCube;
      const slicesAcross = texBuf.width / size | 0;
      const arrays = {
        position: new Float32Array(numVerts * 3),
        normal: new Float32Array(numVerts * 3),
        cubeUV: new Float32Array(numVerts * 2),
      };
      
      let spacing = size * 1.2;
      let vertOffset = 0;
      for (let z = 0; z < size; ++z) {
        const zoff = (z / (size - 1) * 2 - 1) * spacing;
        for (let y = 0; y < size; ++y) {
          const yoff = (y / (size - 1) * 2 - 1) * spacing;
          for (let x = 0; x < size; ++x) {
            const xoff = (x / (size - 1) * 2 - 1) * spacing;
            const sx = z % slicesAcross;
            const sy = z / slicesAcross | 0;
            const uv = [
              (sx * size + x + 0.5) / texBuf.width, 
              (sy * size + y + 0.5) / texBuf.height,
            ];
            vertOffset = makeCube(vertOffset, [xoff, yoff, zoff], uv, arrays);
          }
        }
      }
      arrays.cubeUV = {
        numComponents: 2,
        data: arrays.cubeUV,
      };
      return arrays;
    }

    function makeCubeTexBuffer(gl, cubeSize) {
      const numCubes = cubeSize * cubeSize * cubeSize;
      const maxTextureSize = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048);
      const maxSlicesAcross = maxTextureSize / cubeSize | 0;
      const slicesAcross = Math.min(cubeSize, maxSlicesAcross);
      const slicesDown = Math.ceil(cubeSize / slicesAcross);
      const width = slicesAcross * cubeSize;
      const height = slicesDown * cubeSize;
      const buffer = new Uint8Array(width * height);
      return {
        buffer: buffer,
        slicesAcross: slicesAcross,
        slicesDown: slicesDown,
        width: width,
        height: height,
      };
    }


<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas> 

<!-- end snippet -->

hoiested from the comments below, using a big merged mesh appears to be 1.3x faster than using instanced drawing. Here's 3 samples

1. [big mesh using texture uvs](https://jsfiddle.net/greggman/r3v7kqv7/) (same as above)
2. [instanced using texture uvs](https://jsfiddle.net/greggman/zxL7tg63/) (less data, same shader)
3. [instanced no texture](https://jsfiddle.net/greggman/thskx0x2/) (no texture, life data is in buffer/attribute)

For me, on my machine #1 can do 60x60x60 cubes (216000) at 60fps whereas both #2 and #3 only get 56x56x56 cubes (175616) at 60fps. Of course other GPUs/system/browsers might be different.
