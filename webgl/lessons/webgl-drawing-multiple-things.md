Title: WebGL - Drawing Multiple Things
Description: How to draw multiple different kinds of things in WebGL
TOC: Drawing Multiple Things


This article is a continuation of [previous WebGL
articles](webgl-fundamentals.html).  If you haven't read them I suggest
you start there.

One of the most common questions after first getting something up in WebGL
is how do I draw multiple things.

The first thing to realize is that with few exceptions, WebGL is like
having a function someone wrote where instead of passing lots of
parameters to the function you instead have a single function that draws
stuff and 70+ functions that set up the state for that one function.  So
for example imagine you had a function that draws a circle.  You could
program it like this

    function drawCircle(centerX, centerY, radius, color) { ... }

Or you could code it like this

    var centerX;
    var centerY;
    var radius;
    var color;

    function setCenter(x, y) {
       centerX = x;
       centerY = y;
    }

    function setRadius(r) {
       radius = r;
    }

    function setColor(c) {
       color = c;
    }

    function drawCircle() {
       ...
    }

WebGL works this second way.  Functions like `gl.createBuffer`,
`gl.bufferData`, `gl.createTexture`, and `gl.texImage2D` let you upload
buffer (vertex) and texture (color, etc..) data to WebGL.
`gl.createProgram`, `gl.createShader`, `gl.compileShader`, and
`gl.linkProgram` let you create your GLSL shaders.  Nearly all the rest of
the functions of WebGL are setting up these global variables or *state*
that is used when `gl.drawArrays` or `gl.drawElements` is finally called.

Knowing this a typical WebGL program basically follows this structure

At Init time

*   create all shaders and programs and look up locations
*   create buffers and upload vertex data
*   create textures and upload texture data

At Render Time

*   clear and set the viewport and other global state
    (enable depth testing, turn on culling, etc..)
*   For each thing you want to draw
    *   call `gl.useProgram` for the program needed to draw.
    *   setup attributes for the thing you want to draw
        *   for each attribute call `gl.bindBuffer`,
            `gl.vertexAttribPointer`, `gl.enableVertexAttribArray`
    *   setup uniforms for the thing you want to draw
        *   call `gl.uniformXXX` for each uniform
        *   call `gl.activeTexture` and `gl.bindTexture` to assign
            textures to texture units.
    *   call `gl.drawArrays` or `gl.drawElements`

That's basically it.  It's up to you how to organize your code to
accomplish that task.

Some things like uploading texture data (and maybe even vertex data) might
happen asynchronously because you need to wait for them to download over
the net.

Let's make a simple app to draw 3 things. A cube, a sphere, and a cone.

I'm not going to go into the details of how to compute cube, sphere, and
cone data.  Let's just assume we have functions to create them and they
return [bufferInfo objects as described in the previous
article](webgl-less-code-more-fun.html).

So here's the code.  Our shader is the same one simple shader from our
[perspective example](webgl-3d-perspective.html) except we've added a
`u_colorMult` to multiply the vertex colors by.

    // Passed in from the vertex shader.
    varying vec4 v_color;

    uniform vec4 u_colorMult;

    void main() {
       gl_FragColor = v_color * u_colorMult;
    }


At init time

    // Our uniforms for each thing we want to draw
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var cubeUniforms = {
      u_colorMult: [1, 0.5, 0.5, 1],
      u_matrix: m4.identity(),
    };
    var coneUniforms = {
      u_colorMult: [0.5, 0.5, 1, 1],
      u_matrix: m4.identity(),
    };

    // The translation for each object.
    var sphereTranslation = [  0, 0, 0];
    var cubeTranslation   = [-40, 0, 0];
    var coneTranslation   = [ 40, 0, 0];

At draw time

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // ------ Draw the sphere --------

    gl.useProgram(programInfo.program);

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    // Set the uniforms we just computed
    webglUtils.setUniforms(programInfo, sphereUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, sphereBufferInfo.numElements);

    // ------ Draw the cube --------

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    // Set the uniforms we just computed
    webglUtils.setUniforms(programInfo, cubeUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements);

    // ------ Draw the cone --------

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, coneBufferInfo);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

    // Set the uniforms we just computed
    webglUtils.setUniforms(programInfo, coneUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, coneBufferInfo.numElements);

And here's that

{{{example url="../webgl-multiple-objects-manual.html" }}}

One thing to notice is since we only have a single shader program we only
called `gl.useProgram` once.  If we had different shader programs you'd
need to call `gl.useProgram` before um...  using each program.

This is another place where it's a good idea to simplify.  There are
effectively 3 main things to combine.

1.  A shader program (and its uniform and attribute info/setters)
2.  The buffer and attributes for the thing you want to draw
3.  The uniforms needed to draw that thing with the given shader.

So, a simple simplification would be to make an array of things to draw
and in that array put the 3 things together

    var objectsToDraw = [
      {
        programInfo: programInfo,
        bufferInfo: sphereBufferInfo,
        uniforms: sphereUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
        uniforms: cubeUniforms,
      },
      {
        programInfo: programInfo,
        bufferInfo: coneBufferInfo,
        uniforms: coneUniforms,
      },
    ];

At draw time we still need to update the matrices

    var sphereXRotation =  time;
    var sphereYRotation =  time;
    var cubeXRotation   = -time;
    var cubeYRotation   =  time;
    var coneXRotation   =  time;
    var coneYRotation   = -time;

    // Compute the matrices for each object.
    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        sphereTranslation,
        sphereXRotation,
        sphereYRotation);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    coneUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        coneTranslation,
        coneXRotation,
        coneYRotation);

But the drawing code is now just a simple loop

    // ------ Draw the objects --------

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;

      gl.useProgram(programInfo.program);

      // Setup all the needed attributes.
      webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // Set the uniforms.
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });


And this is arguably the main rendering loop of most 3D engines in
existence.  Somewhere some code or codes decide what goes into the list of
`objectsToDraw` but that's basically it.

{{{example url="../webgl-multiple-objects-list.html" }}}

There are a few basic optimizations.  If the program we're about to draw
with is the same as the previous program we drew with then there's no need
to call `gl.useProgram`.  Similarly if we're drawing with the same
shape/geometry/vertices we previously drew with there's no need to set
those up again.

So, a very simple optimization might look like this

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function(object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;
      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);

        // We have to rebind buffers when changing programs because we
        // only bind buffers the program uses. So if 2 programs use the same
        // bufferInfo but the 1st one uses only positions then when
        // we switch to the 2nd one some of the attributes will not be on.
        bindBuffers = true;
      }

      // Setup all the needed attributes.
      if (bindBuffers || bufferInfo != lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // Set the uniforms.
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

This time let's draw a lot more objects. Instead of just 3 like before let's make
the list of things to draw larger

    // put the shapes in an array so it's easy to pick them at random
    var shapes = [
      sphereBufferInfo,
      cubeBufferInfo,
      coneBufferInfo,
    ];

    // make 2 lists of objects, one of stuff to draw, one to manipulate.
    var objectsToDraw = [];
    var objects = [];

    // Uniforms for each object.
    var numObjects = 200;
    for (var ii = 0; ii < numObjects; ++ii) {
      // pick a shape
      var bufferInfo = shapes[rand(0, shapes.length) | 0];

      // make an object.
      var object = {
        uniforms: {
          u_colorMult: [rand(0, 1), rand(0, 1), rand(0, 1), 1],
          u_matrix: m4.identity(),
        },
        translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
        xRotationSpeed: rand(0.8, 1.2),
        yRotationSpeed: rand(0.8, 1.2),
      };
      objects.push(object);

      // Add it to the list of things to draw.
      objectsToDraw.push({
        programInfo: programInfo,
        bufferInfo: bufferInfo,
        uniforms: object.uniforms,
      });
    }

At render time

    // Compute the matrices for each object.
    objects.forEach(function(object) {
      object.uniforms.u_matrix = computeMatrix(
          viewMatrix,
          projectionMatrix,
          object.translation,
          object.xRotationSpeed * time,
          object.yRotationSpeed * time);
    });

Then draw the objects using the loop above.

{{{example url="../webgl-multiple-objects-list-optimized.html" }}}

You could also sort the list by `programInfo` and/or `bufferInfo` so that
the optimization kicks in more often.  Most game engines do this.
Unfortunately it's not that simple.  If everything you're drawing is
opaque and then you can just sort.  But, as soon you need to draw
semi-transparent things you'll need to draw them in a specific order.
Most 3D engines handle this by having 2 or more lists of objects to draw.
One list for opaque things.  Another list for transparent things.  The
opaque list is sorted by program and geometry.  The transparent list is
sorted by depth.  There might also be separate lists for other things like
overlays or post processing effects.

<a href="../webgl-multiple-objects-list-optimized-sorted.html"
target="_blank">Here's a sorted example</a>.  On my machine I get ~31fps
unsorted and ~37 sorted.  That's nearly a 20% increase.  But, it's worst
case vs best case and most programs would be doing a lot more so it's
arguably not worth thinking about for all but the most special cases.

It's important to notice that you can't draw just any geometry with just
any shader.  For example a shader that requires normals will not function
with geometry that has no normals.  Similarly a shader that requires
textures will not work without textures.

This is one of the many reasons it's great to choose a 3D Library like
[Three.js](https://threejs.org) because it handles all of this for you.
You create some geometry, you tell three.js how you want it rendered and
it generates shaders at runtime to handle the things you need.  Pretty
much all 3D engines do this from Unity3D to Unreal to Source to Crytek.
Some generate them offline but the important thing to realize is they
*generate* shaders.

Of course the reason you're reading these articles is you want to know
what's going on deep down.  That's great and it's fun to write everything
yourself.  It's just important to be aware [WebGL is super low
level](webgl-2d-vs-3d-library.html) so there's a ton of work for you to do
if you want to do it yourself and that often includes writing a shader
generator since different features often require different shaders.

You'll notice I didn't put `computeMatrix` inside the loop.  That's
because rendering should arguably be separated from computing matrices.
It's common to compute matrices from a [scene graph and we'll go over that
in another article](webgl-scene-graph.html).

Now that we have a framework for drawing multiple objects [lets draw some
text](webgl-text-html.html).


