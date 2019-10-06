Title: How to properly repeat texture on .obj model?
Description:
TOC: qna

# Question:

When I load this picture on a sofa model: 

[![f][1]][1]

I am getting this: 

[![sofa][2]][2]

My texture parameters are like this: 

  

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

When I change gl.CLAMP_TO_EDGE to gl.REPEAT, 

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

even this f picture is power of 2, I get the same muddy image.

Is this normal behaviour? I want to see this F repeated on the model. Such as this: 

[![ideal][3]][3]



  [1]: https://i.stack.imgur.com/UWfIG.png
  [2]: https://i.stack.imgur.com/jS0l1.png
  [3]: https://i.stack.imgur.com/ylYAq.png

# Answer

You need to show your .OBJ loading code.

Loading the same file in THREE.js and applying the same texture I get this

[![enter image description here][1]][1]

I used the example at the bottom of [this page](https://threejsfundamentals.org/threejs/lessons/threejs-load-obj.html) and then after loading the model I walked through all the nodes and applied the texture like this

```
        const loader = new THREE.TextureLoader();
        const texture = loader.load('resources/images/f-texture.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        root.traverse((node) => {
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach((m) => {
                m.map = texture;
              });
            } else {
              node.material.map = texture;
            }
          }
        });
````

I also wrote quick my own .OBJ loader

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    const vs = `
      uniform mat4 u_worldViewProjection;

      attribute vec4 position;
      attribute vec2 texcoord;

      varying vec2 v_texCoord;

      void main() {
        v_texCoord = texcoord;
        gl_Position = u_worldViewProjection * position;
      }
    `;
    const fs = `
      precision mediump float;

      varying vec2 v_texCoord;
      uniform sampler2D u_diffuse;

      void main() {
        gl_FragColor = texture2D(u_diffuse, v_texCoord);
      }
    `;


    function loadTextFile(url) {
      return fetch(url).then(req => req.text());
    }

    function addModel(context) {
      if (context.faces) {
        const {faces, modelName, materialName} = context;
        context.models.push({
          faces, modelName, materialName,
        });
        context.faces = undefined;
      }
    }

    function addDataFn(name) {
      return function(context, args) {
        addModel(context);
        const {data} = context;
        if (!data[name]) {
          data[name] = {
            numComponents: args.length,
            data: [],
          };
        }
        data[name].data.push(...args.map(parseFloat));
      };
    }

    function addPropFn(name) {
      return function(context, args) {
        context[name] = args.join(' ');
      };
    }

    function addFace(context, args) {
      if (!context.faces) {
        context.faces = [];
      }
      context.faces.push(args.map((vert) => {
        return vert.split('/').map(v => v.length ? parseInt(v) : undefined);
      }));
    }

    function noop() {
    }

    const objHandlers = {
      mtllib: addPropFn('mtllib'),
      v: addDataFn('position'),
      vn: addDataFn('normal'),
      vt: addDataFn('texcoord'),
      g: addPropFn('modelName'),
      o: addPropFn('modelName'),
      usemtl: addPropFn('materialName'),
      s: noop,
      f: addFace,
    };

    function parseObj(objText) {
      const context = {
        data: {},
        models: [],
      };
      objText.split('\n').forEach((origLine, lineNo) => {
        const noCommentLine = origLine.replace(/#.*/, '');
        const line = noCommentLine.trim();
        if (line === '') {
          return;
        }
        const parts = line.split(/\s+/);
        const code = parts.shift();
        const fn = objHandlers[code];
        if (!fn) {
          console.error('unknown code:', code, 'at line', lineNo + 1, ':', line);
        } else {
          fn(context, parts);
        }
      });
      addModel(context);

      const arrays = {};
      const indices = [];
      let numVerts = 0;
      const vertIds = {};
      const arrayNames = Object.keys(context.data);
      for (const [name, src] of Object.entries(context.data)) {
        arrays[name] = {
          numComponents: src.numComponents,
          data: [],
        };
      }

      // for the f statement
      // f v/vt/vn -> position/texcoord/normal
      const channelNames = [
        'position',
        'texcoord',
        'normal',
      ];

      function addVertex(vertexPartIndices) {
        const parts = [];
        vertexPartIndices.forEach((partNdx, ndx) => {
          if (partNdx !== undefined) {
            parts.push(ndx, partNdx);
          }
        });
        const vId = parts.join(',');
        let vertNdx = vertIds[vId];
        if (vertNdx === undefined) {
          vertNdx = numVerts++;
          vertIds[vId] = vertNdx;
          vertexPartIndices.forEach((partNdx, ndx) => {
            if (partNdx === undefined) {
              return;
            }
            const name = channelNames[ndx];
            const data = context.data[name];
            const start = (partNdx - 1) * data.numComponents;
            const end =  start + data.numComponents;
            if (end > data.data.length) {
              debugger;
            }
            const values = data.data.slice(start, end);
            if (values.length !== 3) {
              debugger;
            }
            arrays[name].data.push(...values);
          });
        }
        return vertNdx;
      }

      for (const model of context.models) {
        for (const face of model.faces) {
          const numVerts = face.length;
          if (numVerts < 3) {
            throw new Error('numVerts for face not at least 3');
          }
          if (numVerts > 4) {
            debugger;
          }
          const vNdx0 = addVertex(face[0]);
          for (let i = 1; i < numVerts - 1; ++i) {
            indices.push(vNdx0);
            indices.push(addVertex(face[i]));
            indices.push(addVertex(face[i + 1]));
          }
        }
      }

      arrays.indices = {
        data: new (indices.length > 65535 ? Uint32Array : Uint16Array)(indices),
      };

      return arrays;
    }

    async function main() {
      const objText = await loadTextFile('models/obj/sofa/ROUND SOFA.obj');
      const arrays = parseObj(objText);

      const m4 = twgl.m4;
      const gl = twgl.getContext(document.querySelector("#c"));
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

      const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      const tex = twgl.createTexture(gl, {
        src: 'images/f-texture.png',
        flipY: true,
      });

      const uniforms = {
        u_diffuse: tex,
      };

      function render(time) {
        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fov = 30 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 1;
        const zFar = 10000;
        const projection = m4.perspective(fov, aspect, zNear, zFar);
        const eye = [500, 2000, -3000];
        const target = [0, 400, 0];
        const up = [0, 1, 0];

        const camera = m4.lookAt(eye, target, up);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
        const world = m4.rotationY(time);

        uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }
    main();

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { display: block; width: 100vw; height: 100vh; }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

Sorry, can't include the model. But, it produced this

[![enter image description here][2]][2]

A completely random guess, looking in the .OBJ file the texture coordinates are 3D

Looking at the file itself I see the texture coordinates are 3D

```
vt -0.7657 0.1621 1.3290
vt -0.7585 0.1439 1.3329
vt 0.2553 0.1439 1.8866
vt 0.2553 0.1621 1.8866
vt 1.2742 0.5898 0.6789
...
```

Instead of the normal 2D. Checking the three.js loading code it appears to ignore the 3rd coordinate. Is it possible you're loading all 3 values for each coordinate but indexing them by 2?


  [1]: https://i.stack.imgur.com/o7sSj.jpg
  [2]: https://i.stack.imgur.com/1SQU7.png
