Title: How to set Transparency properly in webgl
Description:
TOC: qna

# Question:

I am new to graphics and webgl. i am facing problem in setting proper transparency for the model in webgl 1.0.
Model contains more than one part (geometry).

shader code is

    "if (usetransparency > 0.0) {\n" +
            "gl_FragColor = vec4(( diffuse - 0.2) * diffColor, 1.0); \n" +
            "gl_FragColor.w = transparency;  \n" +
        "}  \n" 

Js code is 

     shader.setUseTransparency(1.0);
     shader.setTransparency(transparencyValue);
     GL.clearColor(0.5, 0.5, 0.5, 0.0);
     GL.enable(GL.DEPTH_TEST);
     GL.depthFunc(GL.LEQUAL)
     GL.depthMask(false);
     GL.enable(GL.BLEND);
     GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);

After rendering each part i will make the depthMask true.

Below is the required rendering image

[![enter image description here][1]][1]


Below is the actual rendering image what i am getting in webgl.

[![enter image description here][2]][2]


i am not using any webgl libraries like threejs.

Please help me in this issue.

  [1]: https://i.stack.imgur.com/8aaJf.jpg
  [2]: https://i.stack.imgur.com/8LspA.jpg

# Answer

For your example it could be as simple as turning off depth testing.

    gl.disable(gl.DEPTH_TEST);

The issue is with the depth test on if something gets drawn in front the depth test will prevent anything in back from being drawn.

Another solution is to sort your objects by z distance from the camera and draw back to front but that's only a partial solution for your case because even drawing a single cube you need to make sure the faces in back get drawn before the faces in front. In that case you'd first have to sort all the objects front to back, then draw each object twice, once with front facing triangles culled, then again with back facing triangles culled. This only works for convex objects through.

Past that you have to start subdividing objects or use other techniques like BDL referenced in his answer.

In your case though since everything is transparent it looks like you can just turn off depth testing all together.

You might want to [use premultiplied alpha](https://developer.nvidia.com/content/alpha-blending-pre-or-not-pre) though


<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    const vs = `
    uniform mat4 u_worldViewProjection;
    uniform vec3 u_lightWorldPos;
    uniform mat4 u_world;
    uniform mat4 u_viewInverse;
    uniform mat4 u_worldInverseTranspose;

    attribute vec4 a_position;
    attribute vec3 a_normal;
    attribute vec2 a_texcoord;

    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;

    void main() {
      v_texCoord = a_texcoord;
      v_position = (u_worldViewProjection * a_position);
      v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
      v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
      gl_Position = v_position;
    }
    `;
    const fs = `
    precision mediump float;

    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;

    uniform vec4 u_lightColor;
    uniform vec4 u_diffuseMult;
    uniform sampler2D u_diffuse;

    void main() {
      vec4 diffuseColor = texture2D(u_diffuse, v_texCoord) * u_diffuseMult;
      vec3 a_normal = normalize(v_normal);
      vec3 surfaceToLight = normalize(v_surfaceToLight);
      float lit = abs(dot(a_normal, surfaceToLight));
      gl_FragColor = vec4(diffuseColor.rgb * lit, diffuseColor.a);
      gl_FragColor.rgb *= gl_FragColor.a;
    }
    `;


    twgl.setDefaults({attribPrefix: "a_"});
    var m4 = twgl.m4;
    var gl = document.querySelector("canvas").getContext("webgl");
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    var shapes = [
      twgl.primitives.createCubeBufferInfo(gl, 2),
      twgl.primitives.createSphereBufferInfo(gl, 1, 24, 12),
      twgl.primitives.createPlaneBufferInfo(gl, 2, 2),
      twgl.primitives.createTruncatedConeBufferInfo(gl, 1, 0, 2, 24, 1),
      twgl.primitives.createCresentBufferInfo(gl, 1, 1, 0.5, 0.1, 24),
      twgl.primitives.createCylinderBufferInfo(gl, 1, 2, 24, 2),
      twgl.primitives.createDiscBufferInfo(gl, 1, 24),
      twgl.primitives.createTorusBufferInfo(gl, 1, 0.4, 24, 12),
    ];

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

      // Shared values
    var lightWorldPosition = [1, 8, -10];
    var lightColor = [1, 1, 1, 0.2];
    var camera = m4.identity();
    var view = m4.identity();
    var viewProjection = m4.identity();

    var tex = twgl.createTexture(gl, {
      min: gl.NEAREST,
      mag: gl.NEAREST,
      src: [
        255, 255, 255, 255,
        192, 192, 192, 255,
        192, 192, 192, 255,
        255, 255, 255, 255,
      ],
        });

        var objects = [];
      var drawObjects = [];
      var numObjects = 100;
      var baseHue = rand(0, 360);
      for (var ii = 0; ii < numObjects; ++ii) {
      var uniforms = {
      u_lightWorldPos: lightWorldPosition,
      u_lightColor: lightColor,
      u_diffuseMult: [rand(.5, 1.), rand(.5, 1), rand(.5, 1), .5],
      u_diffuse: tex,
      u_viewInverse: camera,
      u_world: m4.identity(),
      u_worldInverseTranspose: m4.identity(),
      u_worldViewProjection: m4.identity(),
    };
                                 drawObjects.push({
                                 programInfo: programInfo,
                                 bufferInfo: shapes[ii % shapes.length],
                                 uniforms: uniforms,
                                 });
    objects.push({
      translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
      ySpeed: rand(0.1, 0.3),
      zSpeed: rand(0.1, 0.3),
      uniforms: uniforms,
    });
    }

    function render(time) {
      time *= 0.0001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100);
      var eye = [1, 4, -20];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      m4.lookAt(eye, target, up, camera);
      m4.inverse(camera, view);
      m4.multiply(projection, view, viewProjection);

      objects.forEach(function(obj) {
        var uni = obj.uniforms;
        var world = uni.u_world;
        m4.identity(world);
        m4.rotateY(world, time * obj.ySpeed, world);
        m4.rotateZ(world, time * obj.zSpeed, world);
        m4.translate(world, obj.translation, world);
        m4.rotateX(world, time, world);
        m4.transpose(m4.inverse(world, uni.u_worldInverseTranspose), uni.u_worldInverseTranspose);
        m4.multiply(viewProjection, uni.u_world, uni.u_worldViewProjection);
      });

      twgl.drawObjectList(gl, drawObjects);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->


