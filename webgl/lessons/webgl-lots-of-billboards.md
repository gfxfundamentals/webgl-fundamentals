The first question is, does it matter?

If you're making less than 1000, maybe even 2000, draw calls it probably doesn't matter. Being easy to use is more important than most other solutions.

If you really need lots of quads then there's a bunch of solutions. One is to put N quads into a single buffer. [See this presentation](https://www.youtube.com/watch?v=rfQ8rKGTVlg). Then put position, rotation, and scale either into other buffers or into a texture and compute the matrices inside your shader.

In other words, for a textured quad people usually put vertex position and texcoords in buffers ordered like this

    p0, p1, p2, p3, p4, p5,   // buffer for positions for 1 quad
    t0, t1, t2, t3, t4, t5,   // buffer for texcoord for 1 quad

Instead you'd do this

    p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, ...  // positions for N quads
    t0, t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, ...  // texcoords for N quads

p0 - p5 are just unit quad values, p6 - p11 are the same values, p12 - p17 are again the same values. t0 - t5 are unit texcoord values, t6 - t11 are the same texcoord values. etc.

Then you add more buffers. Let's imagine all we want is world position and scale. So we add 2 more buffers


    s0, s0, s0, s0, s0, s0, s1, s1, s1, s1, s1, s1, s2, ...  // scales for N quads
    w0, w0, w0, w0, w0, w0, w1, w1, w1, w1, w1, w1, w2, ...  // world positions for N quads

Notice how the scale repeats 6 times, once for each vertex of the first quad. Then it repeats again 6 times for the next quad, etc.. The same with world position. That's so all 6 vertices of a single quad share the same world position and same scale.

Now in the shader we can use those like this

    attribute vec3 position;
    attribute vec2 texcoord;
    attribute vec3 worldPosition;
    attribute vec3 scale;

    uniform mat4 view;    // inverse of camera
    uniform mat4 camera;  // inverse of view
    uniform mat4 projection;

    varying vec2 v_texcoord;

    void main() {
       // Assuming we want billboards (quads that always face the camera)
       vec3 localPosition = (camera * vec4(position * scale, 0)).xyz;
       
       // make quad points at the worldPosition
       vec3 worldPos = worldPosition + localPosition;

       gl_Position = projection * view * vec4(worldPos, 1);

       v_texcoord = texcoord; // pass on texcoord to fragment shader
    }

Now the anytime we want to set the position of a quad we need to set the 6 world positions (one for each of the 6 vertices) in the corresponding buffer.

Generally you can update all the world positions, then make 1 call to `gl.bufferData` to upload all of them.

Here's 100k quads

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    attribute vec3 position;
    attribute vec2 texcoord;
    attribute vec3 worldPosition;
    attribute vec2 scale;

    uniform mat4 view;    // inverse of camera
    uniform mat4 camera;  // inverse of view
    uniform mat4 projection;

    varying vec2 v_texcoord;

    void main() {
       // Assuming we want billboards (quads that always face the camera)
       vec3 localPosition = (camera * vec4(position * vec3(scale, 1), 0)).xyz;

       // make quad points at the worldPosition
       vec3 worldPos = worldPosition + localPosition;

       gl_Position = projection * view * vec4(worldPos, 1);

       v_texcoord = texcoord; // pass on texcoord to fragment shader
    }
    `;

    const fs = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D texture;
    void main() {
      gl_FragColor = texture2D(texture, v_texcoord);
    }
    `;

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");

    // compiles and links shaders and looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const numQuads = 100000;
    const positions = new Float32Array(numQuads * 6 * 2);
    const texcoords = new Float32Array(numQuads * 6 * 2);
    const worldPositions = new Float32Array(numQuads * 6 * 3);
    const basePositions = new Float32Array(numQuads * 3); // for JS
    const scales = new Float32Array(numQuads * 6 * 2);
    const unitQuadPositions = [
       -.5, -.5, 
        .5, -.5,
       -.5,  .5,
       -.5,  .5,
        .5, -.5,
        .5,  .5,
    ];
    const unitQuadTexcoords = [
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
    ];

    for (var i = 0; i < numQuads; ++i) {
      const off3 = i * 6 * 3;
      const off2 = i * 6 * 2;
      
      positions.set(unitQuadPositions, off2);
      texcoords.set(unitQuadTexcoords, off2);
      const worldPos = [rand(-100, 100), rand(-100, 100), rand(-100, 100)];
      const scale = [rand(1, 2), rand(1, 2)];
      basePositions.set(worldPos, i * 3);
      for (var j = 0; j < 6; ++j) {
        worldPositions.set(worldPos, off3 + j * 3);
        scales.set(scale, off2 + j * 2);
      }
    }

    const tex = twgl.createTexture(gl, {
      src: "http://i.imgur.com/weklTat.gif",
      crossOrigin: "",
      flipY: true,
    });

    // calls gl.createBuffer, gl.bufferData
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: positions, },
      texcoord: { numComponents: 2, data: texcoords, },
      worldPosition: { numComponents: 3, data: worldPositions, },
      scale: { numComponents: 2, data: scales, },
    });

    function render(time) {
       time *= 0.001; // seconds
       
       twgl.resizeCanvasToDisplaySize(gl.canvas);
       
       gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       gl.enable(gl.DEPTH_TEST);
       
       gl.useProgram(programInfo.program);
       
       // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
       twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
       
       const fov = Math.PI * .25;
       const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
       const zNear = .1;
       const zFar = 200;
       const projection = m4.perspective(fov, aspect, zNear, zFar);
       
       const radius = 100;
       const tm = time * .1
       const eye = [Math.sin(tm) * radius, Math.sin(tm * .9) * radius, Math.cos(tm) * radius];
       const target = [0, 0, 0];
       const up = [0, 1, 0];
       const camera = m4.lookAt(eye, target, up);
       const view = m4.inverse(camera);
       
       // calls gl.uniformXXX
       twgl.setUniforms(programInfo, { 
         texture: tex,
         view: view,
         camera: camera,
         projection: projection,
       });
       
       // update all the worldPositions
       for (var i = 0; i < numQuads; ++i) {
         const src = i * 3;
         const dst = i * 6 * 3;
         for (var j = 0; j < 6; ++j) {
           const off = dst + j * 3;
           worldPositions[off + 0] = basePositions[src + 0] + Math.sin(time + i) * 10;
           worldPositions[off + 1] = basePositions[src + 1] + Math.cos(time + i) * 10;
           worldPositions[off + 2] = basePositions[src + 2];
         }
       }
       
       // upload them to the GPU
       gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.worldPosition.buffer);
       gl.bufferData(gl.ARRAY_BUFFER, worldPositions, gl.DYNAMIC_DRAW);
       
       // calls gl.drawXXX
       twgl.drawBufferInfo(gl, bufferInfo);
       
       requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function rand(min, max) {
      if (max === undefined) {
         max = min;
         min = 0;
      }
      return Math.random() * (max - min) + min;
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas />

<!-- end snippet -->

You can reduce the number of repeated vertices from 6 to 1 by using the [ANGLE_instance_arrays](https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays/) extension. Unfortunately it doesn't appear to be any faster than making manual draw calls 1 at a time on many GPUs. Internally the driver might just be making individual draw calls for you so it's not really avoiding the calls where as repeating the values *IS* usually much faster.

You can also reduce the amount of data from 6 to 1 by storing the world positions and scale in a texture. In that case instead of the 2 extra buffers you add one extra buffer with just a repeated id

    // id buffer
    0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3 ....

The id repeats 6 times, once for each of the 6 vertices of each quad.

You then use that id to compute a texture coordinate to lookup world position and scale.

    attribute float id;
    ...

    uniform sampler2D worldPositionTexture;  // texture with world positions
    uniform vec2 textureSize;               // pass in the texture size
   
    ...

      // compute the texel that contains our world position
      vec2 texel = vec2(
         mod(id, textureSize.x),
         floor(id / textureSize.x));

      // compute the UV coordinate to access that texel
      vec2 uv = (texel + .5) / textureSize;

      vec3 worldPosition = texture2D(worldPositionTexture, uv).xyz;

Now you need to put your world positions in a texture, you probably want a floating point texture to make it easy. You can do similar things for scale etc and either store each in a separate texture or all in the same texture changing your uv calculation appropriately.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const vs = `
    attribute vec3 position;
    attribute vec2 texcoord;
    attribute float id;

    uniform sampler2D worldPositionTexture;  
    uniform sampler2D scaleTexture;          
    uniform vec2 textureSize;  // texture are same size so only one size needed
    uniform mat4 view;    // inverse of camera
    uniform mat4 camera;  // inverse of view
    uniform mat4 projection;

    varying vec2 v_texcoord;

    void main() {
      // compute the texel that contains our world position
      vec2 texel = vec2(
         mod(id, textureSize.x),
         floor(id / textureSize.x));

      // compute the UV coordinate to access that texel
      vec2 uv = (texel + .5) / textureSize;

      vec3 worldPosition = texture2D(worldPositionTexture, uv).xyz;
      vec2 scale = texture2D(scaleTexture, uv).xy;

      // Assuming we want billboards (quads that always face the camera)
      vec3 localPosition = (camera * vec4(position * vec3(scale, 1), 0)).xyz;

      // make quad points at the worldPosition
      vec3 worldPos = worldPosition + localPosition;

      gl_Position = projection * view * vec4(worldPos, 1);

      v_texcoord = texcoord; // pass on texcoord to fragment shader
    }
    `;

    const fs = `
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D texture;
    void main() {
      gl_FragColor = texture2D(texture, v_texcoord);
    }
    `;

    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const ext = gl.getExtension("OES_texture_float");
    if (!ext) {
      alert("Doh! requires OES_texture_float extension");
    }
    if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 2) {
      alert("Doh! need at least 2 vertex texture image units");
    }

    // compiles and links shaders and looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const numQuads = 50000;
    const positions = new Float32Array(numQuads * 6 * 2);
    const texcoords = new Float32Array(numQuads * 6 * 2);
    const ids = new Float32Array(numQuads * 6);
    const basePositions = new Float32Array(numQuads * 3); // for JS
    // we need to pad these because textures have to rectangles
    const size = roundUpToNearest(numQuads * 4, 1024 * 4)
    const worldPositions = new Float32Array(size);
    const scales = new Float32Array(size);
    const unitQuadPositions = [
       -.5, -.5, 
        .5, -.5,
       -.5,  .5,
       -.5,  .5,
        .5, -.5,
        .5,  .5,
    ];
    const unitQuadTexcoords = [
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
    ];

    for (var i = 0; i < numQuads; ++i) {
      const off2 = i * 6 * 2;
      const off4 = i * 4;
      
      // you could even put these in a texture OR you can even generate
      // them inside the shader based on the id. See vertexshaderart.com for
      // examples of generating positions in the shader based on id
      positions.set(unitQuadPositions, off2);
      texcoords.set(unitQuadTexcoords, off2);
      ids.set([i, i, i, i, i, i], i * 6);

      const worldPos = [rand(-100, 100), rand(-100, 100), rand(-100, 100)];
      const scale = [rand(1, 2), rand(1, 2)];
      basePositions.set(worldPos, i * 3);
        
      for (var j = 0; j < 6; ++j) {  
        worldPositions.set(worldPos, off4 + j * 4);    
        scales.set(scale, off4 + j * 4);
      }
    }

    const tex = twgl.createTexture(gl, {
      src: "http://i.imgur.com/weklTat.gif",
      crossOrigin: "",
      flipY: true,
    });

    const worldPositionTex = twgl.createTexture(gl, {
      type: gl.FLOAT,
      src: worldPositions,
      width: 1024,
      minMag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
    });

    const scaleTex = twgl.createTexture(gl, {
      type: gl.FLOAT,
      src: scales,
      width: 1024,
      minMag: gl.NEAREST,
      wrap: gl.CLAMP_TO_EDGE,
    });

    // calls gl.createBuffer, gl.bufferData
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: { numComponents: 2, data: positions, },
      texcoord: { numComponents: 2, data: texcoords, },
      id: { numComponents: 1, data: ids, },
    });

    function render(time) {
       time *= 0.001; // seconds
       
       twgl.resizeCanvasToDisplaySize(gl.canvas);
       
       gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       gl.enable(gl.DEPTH_TEST);
       
       gl.useProgram(programInfo.program);
       
       // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
       twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
       
       const fov = Math.PI * .25;
       const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
       const zNear = .1;
       const zFar = 200;
       const projection = m4.perspective(fov, aspect, zNear, zFar);
       
       const radius = 100;
       const tm = time * .1
       const eye = [Math.sin(tm) * radius, Math.sin(tm * .9) * radius, Math.cos(tm) * radius];
       const target = [0, 0, 0];
       const up = [0, 1, 0];
       const camera = m4.lookAt(eye, target, up);
       const view = m4.inverse(camera);
       
       // update all the worldPositions
       for (var i = 0; i < numQuads; ++i) {
         const src = i * 3;
         const dst = i * 3;
         worldPositions[dst + 0] = basePositions[src + 0] + Math.sin(time + i) * 10;
         worldPositions[dst + 1] = basePositions[src + 1] + Math.cos(time + i) * 10;
         worldPositions[dst + 2] = basePositions[src + 2];
       }
       
       // upload them to the GPU
       const width = 1024;
       const height = worldPositions.length / width / 4;
       gl.bindTexture(gl.TEXTURE_2D, worldPositionTex);
       gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, worldPositions); 
       
       // calls gl.uniformXXX, gl.activeTeture, gl.bindTexture
       twgl.setUniforms(programInfo, { 
         texture: tex,
         scaleTexture: scaleTex,
         worldPositionTexture: worldPositionTex,
         textureSize: [width, height],
         view: view,
         camera: camera,
         projection: projection,
       });
       
       // calls gl.drawXXX
       twgl.drawBufferInfo(gl, bufferInfo);
       
       requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function rand(min, max) {
      if (max === undefined) {
         max = min;
         min = 0;
      }
      return Math.random() * (max - min) + min;
    }

    function roundUpToNearest(v, round) {
      return ((v + round - 1) / round | 0) * round;
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas />

<!-- end snippet -->

Note that at least on my machine doing it through a texture is slower than doing it through buffers so while it's less work for JavaScript (only one worldPosition to update per quad) it's apparently more work for the GPU (at least on my machine). The buffer version runs at 60fps for me with 100k quads whereas the texture version ran at about 40fps with 100k quads. I lowered it to 50k but of course those numbers are for my machine. Other machines will very.

Techniques like this will allow you to have way more quads but it comes at the expense of flexibility. You can only manipulate them in ways you provided in your shader. For example if you want to be able to scale from different origins (center, top-left, bottom-right, etc) you'd need to add yet another piece of data or set the positions. If you wanted to rotate you'd need to add rotation data, etc...

You could even pass in whole matrices per quad but then you'd be uploading 16 floats per quad. It still might be faster though since you're already doing that when calling `gl.uniformMatrix4fv` but you'd be doing just 2 calls, `gl.bufferData` or `gl.texImage2D` to upload the new matrices and then `gl.drawXXX` to draw.

Yet another issue is you mentioned textures. If you're using a different texture per quad then you need to figure out how to convert them to a texture atlas (all the images in one texture) in which case your UV coordinates would not repeat as they do above. 
