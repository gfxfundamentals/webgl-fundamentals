Title: WebGL Optimization - Merged Geometry
Description: How to merge geometry for speed

# Picking:

The easiest way to pick is to render every cube/point in solid color (no shading) to an offscreen texture (attached to a framebuffer). Each cube gets a unique color. For example the first cube might get R = 1, G = 0, B = 0, the 2nd cube is R = 2, G 0, B = 1. The 256th cube is R = 0, G = 1. The 257th cube is R = 1, G = 1. etc.

After rendering you compute the corresponding pixel for the mouse, read that single pixel with `gl.readPixels`. Based on it's color you know which point/cube you picked.

Even better, compute the pixel under the mouse and just render that pixel. The simplest way would be to turn on the scissor test but that would still waste a texture and renderbuffer worth of pixels. The super efficient way would be to use a projection that just covers a single pixel and render to a single pixel texture/rendebuffer.

#Fake Instance Rendering / Merged Geometry

To make each point/cube move you'd add an attribute `height` or something like that and you'd have a buffer with either 1 height per cube per vertex or one id per cube and use that id to reference data in a texture. Then you only need one height per cube instead of the same height repeated for each vertex of the cube but at the expense of doing a texture lookup). You update those heights in the buffer and call `gl.bufferData` or `gl.bufferSubData` to update that buffer every frame with the appropriate heights for each point/cube.

In your shader you use `height` to adjust the cube.

For example of all the cubes were on a xz plane and you wanted them to move up of the plane then something like

    attribute vec4 position;
    attribute float height;

    ...

    void main() {
       vec4 newPosition = position + vec4(0, height, 0, 0);

       ... do whatever math you would have done with position but with newPosition instead ...


If you wanted them to scale taller then

    attribute vec4 position;
    attribute float height;

    ...

    void main() {
       vec4 newPosition = position + vec4(0, height * position.y, 0, 0);

       ... do whatever math you would have done with position but with newPosition instead ...

Assuming the cubes' bottom was at Z = 0 on the XY plain then the bottom vertices would stay at 0 since 0 * height is 0 and the top vertices would move up stretching the cubes.

If you have a sphere then you kind of know the position of each vertex is some distance from the center so

    attribute vec4 position;
    attribute float height;

    ...

    void main() {
       vec4 newPosition = position + vec4(normalize(position.xyz) * height, 0);

       ... do whatever math you would have done with position but with newPosition instead ...

Note that this would actually slightly flare each cube since each of the points is at a slightly different place from the center. If you didn't want to flare the cube you'd need to pass in another attribute with the normal for each cube and use that * height. If you're just doing points like in the example you linked to then it should just work, no need for a `normal` attribute.

Not sure any of that is helping. [These samples](http://webglsamples.org/google-io/2011/index.html) and the attached talk tries to cover a few things related to animating merged geometry.

For animating you can update `height` every frame for every cube that needs to be animated. You can also update its colors in another buffer. OR, you can also potentially just use a time stamp per cube/point and pass in the time to the shader. A simple example might be

    attribute vec4 position;
    attribute float height;
    attribute float timeStamp;  // the time this cube/point started animating
    uniform float time;         // the current time

    ...

    void main() {
       float animTime = clamp((time - timeStamp) / duration, 0, 1);
       float animHeight = (1 - animTime) * height;
       vec4 newPosition = position + vec4(normalize(position.xyz) * animHeight, 0);

       ... do whatever math you would have done with position but with newPosition instead ...

Now when you want the cube/point to animate you set its correpsonding `timeStamp` to the current time. When rendering you pass in the current time. As the time progressing the animTime will go from 0 to 1 and height math will go back to 0.

You can see a complex of example of stuff like this [here](https://www.khronos.org/registry/webgl/sdk/demos/google/particles/index.html). All of the particles in this example are stateless. The only thing changing every frame is `time` and all animation is computed from data in attributes using the time. Pressing `t` will show a particle trail, that particle trail uses a timestamp per particle.

Here's one example putting the 2 things together using cubes

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext("webgl");
    const m4 = twgl.m4;
    const v3 = twgl.v3;

    const renderVS = `
    attribute vec4 position;
    attribute vec4 color;
    attribute vec3 normal;
    attribute float timeStamp;

    uniform float u_duration;
    uniform float u_time;
    uniform float u_height;
    uniform mat4 u_projection;
    uniform mat4 u_modelView;

    varying vec4 v_color;
    varying vec3 v_normal;

    void main() {
      float animTime = clamp((u_time - timeStamp) / u_duration, 0., 1.);
      float animHeight = (1. - animTime) * u_height;
      vec4 newPosition = position + vec4(normalize(position.xyz) * animHeight, 0);

      gl_Position = u_projection * u_modelView * newPosition;
      v_color = color;
      v_normal = (u_modelView * vec4(normal, 0)).xyz;
    }
    `;

    const renderFS = `
    precision mediump float;
    varying vec4 v_color;
    varying vec3 v_normal;
    uniform vec3 u_lightDir;
    void main() {
      float light = dot(u_lightDir, normalize(v_normal)) * .5 + .5;
      gl_FragColor = vec4(v_color.rgb * light, v_color.a);
    }
    `;

    const idVS = `
    attribute vec4 position;
    attribute vec4 id;
    attribute float timeStamp;

    uniform float u_duration;
    uniform float u_time;
    uniform float u_height;
    uniform mat4 u_projection;
    uniform mat4 u_modelView;

    varying vec4 v_id;
    void main() {
      float animTime = clamp((u_time - timeStamp) / u_duration, 0., 1.);
      float animHeight = (1. - animTime) * u_height;
      vec4 newPosition = position + vec4(normalize(position.xyz) * animHeight, 0);

      gl_Position = u_projection * u_modelView * position;
      v_id = id;  // pass the id to the fragment shader
    }
    `;

    const idFS = `
    precision mediump float;
    varying vec4 v_id;
    void main() {
      gl_FragColor = v_id;
    }
    `;

    // creates shaders, programs, looks up attribute and uniform locations
    const renderProgramInfo = twgl.createProgramInfo(gl, [renderVS, renderFS]);
    const idProgramInfo = twgl.createProgramInfo(gl, [idVS, idFS]);

    // create one set of geometry with a bunch of cubes
    // for each cube give it random color (so every vertex
    // that cube will have the same color) and give it an id (so
    // every vertex for that cube will have the same id)
    const numCubes = 1000;
    const positions = [];
    const normals = [];
    const colors = [];
    const timeStamps = [];
    const ids = [];
    // Save the color of each cube so we can restore it after highlighting
    const cubeColors = [];
    const radius = 25;

    // adapted from http://stackoverflow.com/a/26127012/128511
    // used to space the cubes around the sphere
    function fibonacciSphere(samples, i) {
      const rnd = 1.;
      const offset = 2. / samples;
      const increment = Math.PI * (3. - Math.sqrt(5.));

      //  for i in range(samples):
      const y = ((i * offset) - 1.) + (offset / 2.);
      const r = Math.sqrt(1. - Math.pow(y ,2.));

      const phi = ((i + rnd) % samples) * increment;

      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;

      return [x, y, z];
    }

    const addCubeVertexData = (function() {
      const CUBE_FACE_INDICES = [
        [3, 7, 5, 1],  // right
        [6, 2, 0, 4],  // left
        [6, 7, 3, 2],  // ??
        [0, 1, 5, 4],  // ??
        [7, 6, 4, 5],  // front
        [2, 3, 1, 0],  // back
      ];

      const cornerVertices = [
        [-1, -1, -1],
        [+1, -1, -1],
        [-1, +1, -1],
        [+1, +1, -1],
        [-1, -1, +1],
        [+1, -1, +1],
        [-1, +1, +1],
        [+1, +1, +1],
      ];

      const faceNormals = [
        [+1, +0, +0],
        [-1, +0, +0],
        [+0, +1, +0],
        [+0, -1, +0],
        [+0, +0, +1],
        [+0, +0, -1],
      ];

      const quadIndices = [0, 1, 2, 0, 2, 3];

      return function addCubeVertexData(id, matrix, color) {
        for (let f = 0; f < 6; ++f) {
          const faceIndices = CUBE_FACE_INDICES[f];
          for (let v = 0; v < 6; ++v) {
            const ndx = faceIndices[quadIndices[v]];
            const position = cornerVertices[ndx];
            const normal = faceNormals[f];

            positions.push(...m4.transformPoint(matrix, position));
            normals.push(...m4.transformDirection(matrix, normal));
            colors.push(color);
            ids.push(id);
            timeStamps.push(-1000);
          }
        }
      };
    }());

    for (let i = 0; i < numCubes; ++i) {
      const direction = fibonacciSphere(numCubes, i);
      const cubePosition = v3.mulScalar(direction, radius);
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const matrix = m4.lookAt(cubePosition, target, up);
      const color = (Math.random() * 0xFFFFFF | 0) + 0xFF000000;
      cubeColors.push(color);
      addCubeVertexData(i + 1, matrix, color);
    }

    const colorData = new Uint32Array(colors);
    const cubeColorsAsUint32 = new Uint32Array(cubeColors);
    const timeStampData = new Float32Array(timeStamps);

    // pass color as Uint32. Example 0x0000FFFF; // blue with alpha 0
    function setCubeColor(id, color) {
      // we know each cube uses 36 vertices. If each model was different
      // we need to save the offset and number of vertices for each model
      const numVertices = 36;
      const offset = (id - 1) * numVertices;
      colorData.fill(color, offset, offset + numVertices);
    }

    function setCubeTimestamp(id, timeStamp) {
      const numVertices = 36;
      const offset = (id - 1) * numVertices;
      timeStampData.fill(timeStamp, offset, offset + numVertices);
    }

    // calls gl.createBuffer, gl.bufferData
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: positions,
      normal: normals,
      color: new Uint8Array(colorData.buffer),
      // the colors are stored as 32bit unsigned ints
      // but we want them as 4 channel 8bit RGBA values
      id: {
        numComponents: 4,
        data: new Uint8Array((new Uint32Array(ids)).buffer),
      },
      timeStamp: {
        numComponents: 1,
        data: timeStampData,
      },
    });

    const lightDir = v3.normalize([3, 5, 10]);

    // creates an RGBA/UNSIGNED_BYTE texture
    // and a depth renderbuffer and attaches them
    // to a framebuffer.
    const fbi = twgl.createFramebufferInfo(gl);

    // current mouse position in canvas relative coords
    let mousePos = {x: 0, y: 0};
    let lastHighlightedCubeId = 0;
    let highlightedCubeId = 0;
    let frameCount = 0;

    function getIdAtPixel(x, y, projection, view, time) {
      // calls gl.bindFramebuffer and gl.viewport
      twgl.bindFramebufferInfo(gl, fbi);

      // no reason to render 100000s of pixels when
      // we're only going to read one
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x, y, 1, 1);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      drawCubes(idProgramInfo, projection, view, time);

      gl.disable(gl.SCISSOR_TEST);

      const idPixel = new Uint8Array(4);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, idPixel);
      // convert from RGBA back into ID.
      const id = (idPixel[0] <<  0) +
                 (idPixel[1] <<  8) +
                 (idPixel[2] << 16) +
                 (idPixel[3] << 24);
      return id;
    }

    function drawCubes(programInfo, projection, modelView, time) {
      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // calls gl.uniformXXX
      twgl.setUniforms(programInfo, {
        u_duration: .25,  // quarter of a second
        u_height: 2.,
        u_time: time,
        u_lightDir: lightDir,
        u_projection: projection,
        u_modelView: modelView,  // drawing at origin so model is identity
      });

      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    }


    function render(time) {
      time *= 0.001;
      ++frameCount;

      if (twgl.resizeCanvasToDisplaySize(gl.canvas)) {
        // resizes the texture and depth renderbuffer to
        // match the new size of the canvas.
        twgl.resizeFramebufferInfo(gl, fbi);
      }

      const fov = Math.PI * .35;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const zNear = 0.1;
      const zFar = 1000;
      const projection = m4.perspective(fov, aspect, zNear, zFar);

      const radius = 45;
      const angle = time * .2;
      const eye = [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);

      if (lastHighlightedCubeId > 0) {
        // restore the last highlighted cube's color
        setCubeColor(
          lastHighlightedCubeId,
          cubeColorsAsUint32[lastHighlightedCubeId]);
        lastHighlightedCubeId = -1;
      }

      {
        const x = mousePos.x;
        const y = gl.canvas.height - mousePos.y - 1;
        highlightedCubeId = getIdAtPixel(x, y, projection, view, time);
      }

      if (highlightedCubeId > 0) {
        const color = (frameCount & 0x2) ? 0xFF0000FF : 0xFFFFFFFF;
        setCubeColor(highlightedCubeId, color);
        setCubeTimestamp(highlightedCubeId, time);
        lastHighlightedCubeId = highlightedCubeId;
      }

      highlightedCubeId = Math.random() * numCubes | 0;

      // NOTE: We could use `gl.bufferSubData` and just upload
      // the portion that changed.

      // upload cube color data.
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.color.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.DYNAMIC_DRAW);
      // upload the timestamp
      gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.attribs.timeStamp.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, timeStampData, gl.DYNAMIC_DRAW);

      // calls gl.bindFramebuffer and gl.viewport
      twgl.bindFramebufferInfo(gl, null);

      gl.enable(gl.DEPTH_TEST);

      drawCubes(renderProgramInfo, projection, view, time);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function getRelativeMousePosition(event, target) {
      target = target || event.target;
      const rect = target.getBoundingClientRect();

      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }

    // assumes target or event.target is canvas
    function getNoPaddingNoBorderCanvasRelativeMousePosition(event, target) {
      target = target || event.target;
      const pos = getRelativeMousePosition(event, target);

      pos.x = pos.x * target.width  / target.clientWidth;
      pos.y = pos.y * target.height / target.clientHeight;

      return pos;
    }

    gl.canvas.addEventListener('mousemove', (event, target) => {
      mousePos = getRelativeMousePosition(event, target);
    });

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

It's up to you to figure out some math/code for however you want to animate. For example you could store a unit cube/point and a normal and compute the cube's orientation in the shader where as in this code the orientation is computed when the vertices are made.

You could also pass the highlight color into the shader and just use the timestamp to decide whether to use the cube's original color or the highlight. That would be no need to upload new colors.

If you want the cube to do some fancier animation then use `animTime` or something like it as input into a function that computes a fancier animation. If you want the animation to be data based then use `animTime` to look up data from a row of a texture. In that row you could store colors (if you wanted to animate over specific colors). Or positions & orientations (if you wanted the cube to go to a specific place). You can see an example of lerping in a shader between 2 positions [here]((http://webglsamples.org/google-io/2011/lots-of-objects-google.html)) where one position is stored in an attribute and the other position is computed in a function.

Really the sky's the limit. It's really up to you.
