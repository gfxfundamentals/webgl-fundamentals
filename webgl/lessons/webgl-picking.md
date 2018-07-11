Title: WebGL Picking
Description: How to pick in WebGL

Pick from objects
Pick from using 1 pixel (scissor)
Pick using frustum (point to other article)

Drawing 120k * 64 things means every single pixel of a 2700x2700 could be covered. In other words you're probably trying to display too much data? It's also a very large number of things and likely to be slow.

In any case drawing and picking via WebGL is relatively easy. You draw your scene using whatever techniques you want. Then, separately, when the user clicks the mouse (or always under the mouse) you draw the entire scene again to an offscreen framebuffer giving every selectable thing a different color. Given there are 32bits of color by default (8bits red, 8bits green, 8bits blue, 8bits alpha) can count 2^32-1 things. Of course with other buffer formats you could count even higher or draw to multiple buffers but storing the data for 2^32 things is probably the larger limit.

In any case here's an example. This one makes 1000 cubes (just used cubes because this sample already existed). You can consider each cube one of of your "series" with 8 points although the code is actually drawing 24 points per cube. (set `primType = gl.TRIANGLES`) to see the cubes. It put all the cubes in the same buffer so that a single draw call draws all the cubes. This makes it much faster than if we draw each cube with a separate draw call.

The important part is making a series ID per series. In the code below all points of one cube have the same ID.

The code draws the scene twice. Once with each cube's color, again with each cube's ID into an offscreen texture (as a framebuffer attachment). To know which cube is under the mouse we look up the pixel under the mouse, convert its color back into an ID and update that cube's vertex colors to highlight it.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext("webgl");
    const m4 = twgl.m4;
    const v3 = twgl.v3;
    // const primType = gl.TRIANGLES;
    const primType = gl.POINTS;

    const renderVS = `
    attribute vec4 position;
    attribute vec4 color;

    uniform mat4 u_projection;
    uniform mat4 u_modelView;

    varying vec4 v_color;

    void main() {
      gl_PointSize = 10.0;
      gl_Position = u_projection * u_modelView * position;
      v_color = color;
    }
    `;

    const renderFS = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
    `;

    const idVS = `
    attribute vec4 position;
    attribute vec4 id;

    uniform mat4 u_projection;
    uniform mat4 u_modelView;

    varying vec4 v_id;
    void main() {
      gl_PointSize = 10.0;
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
        u_projection: projection,
        u_modelView: modelView,  // drawing at origin so model is identity
      });

      gl.drawArrays(primType, 0, bufferInfo.numElements);
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

The code above uses an offscreen framebuffer the same size as the canvas but it uses the scissor test to only draw a single pixel (the one under the mouse). It would still run without the scissor test it would just be slower.

We could also make it work using just a single pixel offscreen framebuffer and using projection math so things work out.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext("webgl");
    const m4 = twgl.m4;
    const v3 = twgl.v3;
    // const primType = gl.TRIANGLES;
    const primType = gl.POINTS;

    const renderVS = `
    attribute vec4 position;
    attribute vec4 color;

    uniform mat4 u_projection;
    uniform mat4 u_modelView;

    varying vec4 v_color;

    void main() {
      gl_PointSize = 10.0;
      gl_Position = u_projection * u_modelView * position;
      v_color = color;
    }
    `;

    const renderFS = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
      gl_FragColor = v_color;
    }
    `;

    const idVS = `
    attribute vec4 position;
    attribute vec4 id;

    uniform mat4 u_projection;
    uniform mat4 u_modelView;

    varying vec4 v_id;
    void main() {
      gl_PointSize = 10.0;
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

    // creates an 1x1 pixel RGBA/UNSIGNED_BYTE texture
    // and a depth renderbuffer and attaches them
    // to a framebuffer.
    const fbi = twgl.createFramebufferInfo(gl, [
      { format: gl.RGBA, type: gl.UNSIGNED_BYTE, minMag: gl.NEAREST, wrap: gl.CLAMP_TO_EDGE, },
      { format: gl.DEPTH_STENCIL, },
    ], 1, 1);

    // current mouse position in canvas relative coords
    let mousePos = {x: 0, y: 0};
    let lastHighlightedCubeId = 0;
    let highlightedCubeId = 0;
    let frameCount = 0;

    function getIdAtPixel(x, y, projectionInfo, view, time) {
      // calls gl.bindFramebuffer and gl.viewport
      twgl.bindFramebufferInfo(gl, fbi);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      drawCubes(idProgramInfo, projectionInfo, {
        totalWidth: gl.canvas.width,
        totalHeight: gl.canvas.height,
        partWidth: 1,
        partHeight: 1,
        partX: x,
        partY: y,
      }, view, time);

      const idPixel = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, idPixel);
      // convert from RGBA back into ID.
      const id = (idPixel[0] <<  0) +
                 (idPixel[1] <<  8) +
                 (idPixel[2] << 16) +
                 (idPixel[3] << 24);
      return id;
    }

    function drawCubes(programInfo, projectionInfo, partInfo, modelView, time) {

      const projection = projectionForPart(projectionInfo, partInfo);

      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // calls gl.uniformXXX
      twgl.setUniforms(programInfo, {
        u_projection: projection,
        u_modelView: modelView,  // drawing at origin so model is identity
      });

      gl.drawArrays(primType, 0, bufferInfo.numElements);
    }

    function projectionForPart(projectionInfo, partInfo) {
      const {fov, zNear, zFar} = projectionInfo;
      const {
        totalWidth,
        totalHeight,
        partX,
        partY,
        partWidth,
        partHeight,
      } = partInfo;

      const aspect = totalWidth / totalHeight;

      // corners at zNear for total image
      const zNearTotalTop = Math.tan(fov) * 0.5 * zNear;
      const zNearTotalBottom = -zNearTotalTop;
      const zNearTotalLeft = zNearTotalBottom * aspect;
      const zNearTotalRight = zNearTotalTop * aspect;

      // width, height at zNear for total image
      const zNearTotalWidth = zNearTotalRight - zNearTotalLeft;
      const zNearTotalHeight = zNearTotalTop - zNearTotalBottom;

      const zNearPartLeft = zNearTotalLeft + partX * zNearTotalWidth / totalWidth;   const zNearPartRight = zNearTotalLeft + (partX + partWidth) * zNearTotalWidth / totalWidth;
      const zNearPartBottom = zNearTotalBottom + partY * zNearTotalHeight / totalHeight;
      const zNearPartTop = zNearTotalBottom + (partY + partHeight) * zNearTotalHeight / totalHeight;

      return m4.frustum(zNearPartLeft, zNearPartRight, zNearPartBottom, zNearPartTop, zNear, zFar);
    }

    function render(time) {
      time *= 0.001;
      ++frameCount;

      twgl.resizeCanvasToDisplaySize(gl.canvas);

      const projectionInfo = {
        fov: Math.PI * .35,
        zNear: 0.1,
        zFar: 1000,
      };

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
        highlightedCubeId = getIdAtPixel(x, y, projectionInfo, view, time);
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

      drawCubes(renderProgramInfo, projectionInfo, {
        totalWidth: gl.canvas.width,
        totalHeight: gl.canvas.height,
        partWidth: gl.canvas.width,
        partHeight: gl.canvas.height,
        partX: 0,
        partY: 0,
      }, view, time);

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

note that drawing `POINTS` in WebGL is generally slower than drawing 2 `TRIANGLES` of the same size. If I set the number of cubes to 100k and set primType to `TRIANGLES` it draws 100k cubes. On my integrated GPU the snippet window it runs at about 10-20fps. Of course with that many cubes it's impossible to pick one. If I set the radius to 250 I can at least see the picking is still working.

