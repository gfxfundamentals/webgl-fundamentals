Title: How to implement textureCube using 6 sampler2D
Description:
TOC: qna

# Question:

Before I used a samplerCube to render the cube

This is my previous fragmentShader code 

    "uniform samplerCube tCubeTgt;",
    "varying vec3 posTgt;",
    "void main() {",
        "vec4 reflectedColorTgt = textureCube( tCubeTgt, vec3( -posTgt.x, posTgt.yz ) );",
        "gl_FragColor = reflectedColorTgt ;",
    "}"

Now I want to use 6 sampler2D to render a cube.

what should I do


# Answer

Why?

In any case looking up how cube mapping works there's a function and table in the OpenGL ES 2.0 spec showing how cube mapping works

[![enter image description here][1]][1]


where sc, tc, and ma come from this table


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

Using that you can make functions that will apply the same logic using 6 2d textures instead of one cubemap

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    /* global document, twgl, requestAnimationFrame */

    const vs = `
    uniform mat4 u_model;
    uniform mat4 u_view;
    uniform mat4 u_projection;
    uniform vec3 u_camera;

    attribute vec4 position;
    attribute vec3 normal;

    varying vec3 v_normal;
    varying vec3 v_eyeToSurface;

    void main() {
      vec4 world = u_model * position;
      gl_Position = u_projection * u_view * world;
      v_eyeToSurface = world.xyz - u_camera;
      v_normal = (u_model * vec4(normal, 0)).xyz;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec3 v_eyeToSurface;
    varying vec3 v_normal;

    uniform sampler2D u_textures[6];

    void cubemap(vec3 r, out float texId, out vec2 st) {
       vec3 uvw;
       vec3 absr = abs(r);
       if (absr.x > absr.y && absr.x > absr.z) {
         // x major
         float negx = step(r.x, 0.0);
         uvw = vec3(r.zy, absr.x) * vec3(mix(-1.0, 1.0, negx), -1, 1);
         texId = negx;
       } else if (absr.y > absr.z) {
         // y major
         float negy = step(r.y, 0.0);
         uvw = vec3(r.xz, absr.y) * vec3(1.0, mix(1.0, -1.0, negy), 1.0);
         texId = 2.0 + negy;
       } else {
         // z major
         float negz = step(r.z, 0.0);
         uvw = vec3(r.xy, absr.z) * vec3(mix(1.0, -1.0, negz), -1, 1);
         texId = 4.0 + negz;
       }
       st = vec2(uvw.xy / uvw.z + 1.) * .5;
    }

    vec4 texCubemap(vec3 uvw) {
      float texId;
      vec2 st;
      cubemap(uvw, texId, st);
      vec4 color = vec4(0);
      for (int i = 0; i < 6; ++i) {
        vec4 side = texture2D(u_textures[i], st);
        float select = step(float(i) - 0.5, texId) * 
                       step(texId, float(i) + .5);
        color = mix(color, side, select);
      }
      return color;
    }

    void main() {
      vec3 normal = normalize(v_normal);
      vec3 eyeToSurface = normalize(v_eyeToSurface);
      gl_FragColor = texCubemap(reflect(eyeToSurface, normal));
    }
    `;

    const m4 = twgl.m4;
    const gl = document.getElementById("c").getContext("webgl");
    // compile shaders, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // create buffers
    const models = [
      twgl.primitives.createSphereBufferInfo(gl, 1, 12, 8),
      twgl.primitives.createCubeBufferInfo(gl, 1.5),
      twgl.primitives.createTorusBufferInfo(gl, .7, .5, 12, 8),
    ];

    const textures = twgl.createTextures(gl, {
      posx: { minMag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE, crossOrigin: "anonymous", src:'https://twgljs.org/examples/images/yokohama/posx.jpg', },
      negx: { minMag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE, crossOrigin: "anonymous", src:'https://twgljs.org/examples/images/yokohama/negx.jpg', },
      posy: { minMag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE, crossOrigin: "anonymous", src:'https://twgljs.org/examples/images/yokohama/posy.jpg', },
      negy: { minMag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE, crossOrigin: "anonymous", src:'https://twgljs.org/examples/images/yokohama/negy.jpg', },
      posz: { minMag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE, crossOrigin: "anonymous", src:'https://twgljs.org/examples/images/yokohama/posz.jpg', },
      negz: { minMag: gl.LINEAR, wrap: gl.CLAMP_TO_EDGE, crossOrigin: "anonymous", src:'https://twgljs.org/examples/images/yokohama/negz.jpg', },
    });

    const uniforms = {
      u_textures: [
        textures.posx,
        textures.negx,
        textures.posy,
        textures.negy,
        textures.posz,
        textures.negz,
      ],
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
      const zNear = 0.5;
      const zFar = 20;
      const projection = m4.perspective(fov, aspect, zNear, zFar);
      
      const eye = [
        Math.sin(time) * 7, 
        Math.sin(time * .5) * 3, 
        Math.cos(time) * 7,
      ];
      const target = [0, 0, 0];
      const up = [0, 1, 0];

      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);

      uniforms.u_camera = eye;
      uniforms.u_projection = projection;
      uniforms.u_view = view;
      
      gl.useProgram(programInfo.program);
      
      models.forEach((bufferInfo, ndx) => {
        let u = ndx / (models.length - 1) * 2 - 1;
        let model = m4.translation([u * (models.length - 1), 0, 0]);
        model = m4.rotateY(model, time * (ndx + 1) * 0.7);
        uniforms.u_model = m4.rotateX(model, time * (ndx + 1) * 0.2);

        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      });

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body {
      margin: 0;
    }
    canvas {
      display: block;
      width: 100vw;
      height: 100vh;
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

But you'll see there's lots of issues. One issue is what to do at the edge. The GPU can filter across edges? We'd have to add something to do that. Also we can't use random access for samplers nor can we conditionally access samplers which means doing it with 6 2d textures instead of one cubemap is going to be much much slower

  [1]: https://i.stack.imgur.com/ulK3R.png
