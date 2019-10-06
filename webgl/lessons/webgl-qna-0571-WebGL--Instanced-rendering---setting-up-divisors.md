Title: WebGL; Instanced rendering - setting up divisors
Description:
TOC: qna

# Question:

I'm trying to draw a lot of cubes in webgl using instanced rendering (`ANGLE_instanced_arrays`).

However I can't seem to wrap my head around how to setup the divisors. I have the following buffers;

36 vertices (6 faces made from 2 triangles using 3 vertices each).
6 colors per cube (1 for each face).
1 translate per cube.

To reuse the vertices for each cube; I've set it's divisor to 0.
For color I've set the divisor to 2 (i.e. use same color for two triangles - a face)).
For translate I've set the divisor to 12 (i.e. same translate for 6 faces * 2 triangles per face).

For rendering I'm calling
```
ext_angle.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 36, num_cubes);
```

This however does not seem to render my cubes. 

Using translate divisor 1 does but the colors are way off then, with cubes being a single solid color.

I'm thinking it's because my instances are now the full cube, but if I limit the `count` (i.e. vertices per instance), I do not seem to get all the way through the vertices buffer, effectively I'm just rendering one triangle per cube then.

How would I go about rendering a lot of cubes like this; with varying colored faces?



# Answer

Instancing works like this:

Eventually you are going to call

    ext.drawArraysInstancedANGLE(mode, first, numVertices, numInstances);

So let's say you're drawing instances of a cube. One cube has 36 vertices (6 per face * 6 faces). So

    numVertices = 36

And lets say you want to draw 100 cubes so

    numInstances = 100

Let's say you have a vertex shader like this

Let's say you have the following shader

    attribute vec4 position;
    
    uniform mat4 matrix;
    
    void main() {
      gl_Position = matrix * position;
    }

If you did nothing else and just called

    var mode = gl.TRIANGLES;
    var first = 0;
    var numVertices = 36
    var numInstances = 100

    ext.drawArraysInstancedANGLE(mode, first, numVertices, numInstances);

It would just draw the same cube in the same exact place 100 times

Next up you want to give each cube a different translation so you update your shader to this
    
    attribute vec4 position;
    attribute vec3 translation;
    
    uniform mat4 matrix;
    
    void main() {
      gl_Position = matrix * (position + vec4(translation, 0));
    }

You now make a buffer and put one translation per cube then you setup the attribute like normal

    gl.vertexAttribPointer(translationLocation, 3, gl.FLOAT, false, 0, 0)

But you also set a divisor

    ext.vertexAttribDivisorANGLE(translationLocation, 1);

That 1 says '*only advance to the next value in the translation buffer once per instance*'

Now you want have a different color per face per cube and you only want one color per face in the data (you don't want to repeat colors). **There is no setting that would to that**  Since your `numVertices = 36` you can only choose to advance every vertex (divisor = 0) or once every multiple of 36 vertices (ie, numVertices).

So you say, what if instance faces instead of cubes? Well now you've got the opposite problem. Put one color per face. `numVertices = 6`, `numInstances = 600` (100 cubes * 6 faces per cube). You set color's divisor to 1 to advance the color once per face. You can set translation divisor to 6 to advance the translation only once every 6 faces (every 6 instances). But now you no longer have a cube you only have a single face. In other words you're going to draw 600 faces all facing the same way, every 6 of them translated to the same spot.

To get a cube back you'd have to add something to orient the face instances in 6 direction. 

Ok, you fill a buffer with 6 orientations. That won't work. You can't set divisor to anything that will use those 6 orientations advance only once every face but then resetting after 6 faces for the next cube. There's only 1 divisor setting. Setting it to 6 to repeat per face or 36 to repeat per cube but you want advance per face **and** reset back per cube. No such option exists. 

What you can do is draw it with 6 draw calls, one per face direction. In other words you're going to draw all the left faces, then all the right faces, the all the top faces, etc...

To do that we make just 1 face, 1 translation per cube, 1 color per face per cube. We set the divisor on the translation and the color to 1. 

Then we draw 6 times, one for each face direction. The difference between each draw is we pass in an orientation for the face and we change the attribute offset for the color attribute and set it's stride to 6 * 4 floats (6 * 4 * 4).


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;
    attribute vec3 translation;
    attribute vec4 color;

    uniform mat4 viewProjectionMatrix;
    uniform mat4 localMatrix;

    varying vec4 v_color;

    void main() {
      vec4 localPosition = localMatrix * position + vec4(translation, 0);
      gl_Position = viewProjectionMatrix * localPosition;
      v_color = color;
    }
    `;

    var fs = `
    precision mediump float;

    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }
    `;

    var m4 = twgl.m4;
    var gl = document.querySelector("canvas").getContext("webgl");
    var ext = gl.getExtension("ANGLE_instanced_arrays");
    if (!ext) {
      alert("need ANGLE_instanced_arrays");
    }
    var program = twgl.createProgramFromSources(gl, [vs, fs]);

    var positionLocation = gl.getAttribLocation(program, "position");
    var translationLocation = gl.getAttribLocation(program, "translation");
    var colorLocation = gl.getAttribLocation(program, "color");

    var localMatrixLocation = gl.getUniformLocation(program, "localMatrix");
    var viewProjectionMatrixLocation = gl.getUniformLocation(
        program, 
        "viewProjectionMatrix");

    function r(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    }

    function rp() {
      return r(-20, 20);
    }

    // make translations and colors, colors are separated by face
    var numCubes = 1000;
    var colors = [];
    var translations = [];

    for (var cube = 0; cube < numCubes; ++cube) {
      translations.push(rp(), rp(), rp());

      // pick a random color;
      var color = [r(1), r(1), r(1), 1];

      // now pick 4 similar colors for the faces of the cube
      // that way we can tell if the colors are correctly assigned
      // to each cube's faces.
      var channel = r(3) | 0;  // pick a channel 0 - 2 to randomly modify
      for (var face = 0; face < 6; ++face) {
        color[channel] = r(.7, 1);
        colors.push.apply(colors, color);
      }
    }

    var buffers = twgl.createBuffersFromArrays(gl, {
      position: [  // one face
        -1, -1, -1,
        -1,  1, -1,
         1, -1, -1,
         1, -1, -1,
        -1,  1, -1,
         1,  1, -1,
      ],
      color: colors, 
      translation: translations,
    });

    var faceMatrices = [
      m4.identity(),
      m4.rotationX(Math.PI /  2),
      m4.rotationX(Math.PI / -2),
      m4.rotationY(Math.PI /  2),
      m4.rotationY(Math.PI / -2),
      m4.rotationY(Math.PI),
    ];

    function render(time) {
      time *= 0.001;

      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      
      gl.enable(gl.DEPTH_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.translation);
      gl.enableVertexAttribArray(translationLocation);
      gl.vertexAttribPointer(translationLocation, 3, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
      gl.enableVertexAttribArray(colorLocation);
      
      ext.vertexAttribDivisorANGLE(positionLocation, 0);
      ext.vertexAttribDivisorANGLE(translationLocation, 1);
      ext.vertexAttribDivisorANGLE(colorLocation, 1);

      gl.useProgram(program);
      
      var fov = 60;
      var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      var projection = m4.perspective(fov * Math.PI / 180, aspect, 0.5, 100);
      
      var radius = 30;
      var eye = [
        Math.cos(time) * radius, 
        Math.sin(time * 0.3) * radius, 
        Math.sin(time) * radius,
      ];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(projection, view); 
      
      gl.uniformMatrix4fv(viewProjectionMatrixLocation, false, viewProjection);

      // 6 faces * 4 floats per color * 4 bytes per float
      var stride = 6 * 4 * 4;  
      var numVertices = 6; 
      faceMatrices.forEach(function(faceMatrix, ndx) {
        var offset = ndx * 4 * 4;  // 4 floats per color * 4 floats
        gl.vertexAttribPointer(
           colorLocation, 4, gl.FLOAT, false, stride, offset);
        gl.uniformMatrix4fv(localMatrixLocation, false, faceMatrix);
        ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, numVertices, numCubes);
      });
      
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



