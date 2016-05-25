"use strict";

require([
    './resources/primitives',
    './resources/webgl-3d-math',
    './resources/webgl-utils',
  ], function main(primitives, math3d, webglUtils) {

  // Get A WebGL context
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  var useSorted = false;
  var sortElem = document.getElementById("sort");
  sortElem.addEventListener('change', function(e) {
    useSorted = e.target.checked;
  });

  var stats = new Stats();
  stats.setMode(1);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  document.getElementById("container").appendChild(stats.domElement);

  var createFlattenedVertices = function(gl, vertices) {
    return webglUtils.createBufferInfoFromArrays(
        gl,
        primitives.makeRandomVertexColors(
            primitives.deindexVertices(vertices),
            {
              vertsPerColor: 6,
              rand: function(ndx, channel) {
                return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
              }
            })
      );
  };

  var sphereBufferInfo = createFlattenedVertices(gl, primitives.createSphereVertices(10, 12, 6));
  var cubeBufferInfo   = createFlattenedVertices(gl, primitives.createCubeVertices(20));
  var coneBufferInfo   = createFlattenedVertices(gl, primitives.createTruncatedConeVertices(10, 0, 20, 12, 1, true, false));

  // setup GLSL program
  var programInfo = webglUtils.createProgramInfo(gl, ["3d-vertex-shader", "3d-fragment-shader"]);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var cameraAngleRadians = degToRad(0);
  var fieldOfViewRadians = degToRad(60);
  var cameraHeight = 50;

  var shapes = [
    sphereBufferInfo,
    cubeBufferInfo,
    coneBufferInfo,
  ];

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  // give an id to each shape so we can sort them
  shapes.forEach(function(shape, ndx) {
     shape.id = ndx;
  });

  // give an id to each programInfo so we can sort them
  programInfo.id = 1;

  var objectsToDraw = [];
  var objects = [];

  // Uniforms for each object.
  var numObjects = 2000;
  for (var ii = 0; ii < numObjects; ++ii) {
    var object = {
      uniforms: {
        u_colorMult: [Math.random(), Math.random(), Math.random(), 1],
        u_matrix: math3d.makeIdentity(),
      },
      translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
      xRotationSpeed: rand(0.8, 1.2),
      yRotationSpeed: rand(0.8, 1.2),
    };
    objects.push(object);
    objectsToDraw.push({
      programInfo: programInfo,
      bufferInfo: shapes[ii % shapes.length],
      uniforms: object.uniforms,
    });
  }

  function sortByBufferInfoThenProgramInfo(a, b) {
    var diff = a.bufferInfo.id - b.bufferInfo.id;
    if (diff) {
      return diff;
    }
    return a.programInfo.id - b.programInfo.id;
  }

  var sortedObjectsToDraw = objectsToDraw.slice().sort(sortByBufferInfoThenProgramInfo);

  function computeMatrix(viewMatrix, projectionMatrix, translation, xRotation, yRotation) {
    var xRotationMatrix = math3d.makeXRotation(xRotation);
    var yRotationMatrix = math3d.makeYRotation(yRotation);
    var translationMatrix = math3d.makeTranslation(
        translation[0],
        translation[1],
        translation[2]);
    var matrix = math3d.makeIdentity();
    matrix = math3d.matrixMultiply(matrix, xRotationMatrix);
    matrix = math3d.matrixMultiply(matrix, yRotationMatrix);
    var worldMatrix = math3d.matrixMultiply(matrix, translationMatrix);
    matrix = math3d.matrixMultiply(worldMatrix, viewMatrix);
    return math3d.matrixMultiply(matrix, projectionMatrix);
  }

  function drawObjects(objectsToDraw) {
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
        // bufferInfo but the 1st one uses only positions the when the
        // we switch to the 2nd one some of the attributes will not be on.
        bindBuffers = true;
      }

      // Setup all the needed attributes.
      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo.attribSetters, bufferInfo);
      }

      // Set the uniforms.
      webglUtils.setUniforms(programInfo.uniformSetters, object.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });
  }

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time *= 0.0005;

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = canvas.clientWidth / canvas.clientHeight;
    var projectionMatrix =
        math3d.makePerspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = math3d.makeLookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = math3d.makeInverse(cameraMatrix);

    // Compute the matrices for each object.
    objects.forEach(function(object) {
      object.uniforms.u_matrix = computeMatrix(
          viewMatrix,
          projectionMatrix,
          object.translation,
          object.xRotationSpeed * time,
          object.yRotationSpeed * time);
    });

    // ------ Draw the objects --------
    drawObjects(useSorted ? sortedObjectsToDraw : objectsToDraw);

    stats.update();

    requestAnimationFrame(drawScene);
  }
});



