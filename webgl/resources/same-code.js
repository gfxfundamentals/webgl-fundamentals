/* Licensed under a BSD license. See license.html for license */
"use strict";

var vertexShaderSource = [
  "uniform mat4 u_worldViewProjection;",
  "uniform vec3 u_lightWorldPos;",
  "uniform mat4 u_world;",
  "uniform mat4 u_viewInverse;",
  "uniform mat4 u_worldInverseTranspose;",
  "",
  "attribute vec4 a_position;",
  "attribute vec3 a_normal;",
  "attribute vec2 a_texcoord;",
  "",
  "varying vec4 v_position;",
  "varying vec2 v_texCoord;",
  "varying vec3 v_normal;",
  "varying vec3 v_surfaceToLight;",
  "varying vec3 v_surfaceToView;",
  "",
  "void main() {",
  "  v_texCoord = a_texcoord;",
  "  v_position = (u_worldViewProjection * a_position);",
  "  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;",
  "  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;",
  "  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;",
  "  gl_Position = v_position;",
  "}",
].join("\n");

var fragmentShaderSource = [
  "precision mediump float;",
  "",
  "varying vec4 v_position;",
  "varying vec2 v_texCoord;",
  "varying vec3 v_normal;",
  "varying vec3 v_surfaceToLight;",
  "varying vec3 v_surfaceToView;",
  "",
  "uniform vec4 u_lightColor;",
  "uniform vec4 u_ambient;",
  "uniform sampler2D u_diffuse;",
  "uniform vec4 u_specular;",
  "uniform float u_shininess;",
  "uniform float u_specularFactor;",
  "",
  "vec4 lit(float l ,float h, float m) {",
  "  return vec4(1.0,",
  "              max(l, 0.0),",
  "              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,",
  "              1.0);",
  "}",
  "",
  "void main() {",
  "  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);",
  "  vec3 a_normal = normalize(v_normal);",
  "  vec3 surfaceToLight = normalize(v_surfaceToLight);",
  "  vec3 surfaceToView = normalize(v_surfaceToView);",
  "  vec3 halfVector = normalize(surfaceToLight + surfaceToView);",
  "  vec4 litR = lit(dot(a_normal, surfaceToLight),",
  "                    dot(a_normal, halfVector), u_shininess);",
  "  vec4 outColor = vec4((",
  "  u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +",
  "                u_specular * litR.z * u_specularFactor)).rgb,",
  "      diffuseColor.a);",
  "  gl_FragColor = outColor;",
  "}",
].join("\n");

function main() {
  // Get A WebGL context

  // Here we do this one 1 of 2 ways like many WebGL libraries. Either
  // we have a canvas on the page. Or else we have container and we
  // insert a canvas inside that container.
  // If we don't find a container we use the body of the document.
  var container = document.getElementById("canvas") || document.body;
  var isCanvas = (container instanceof HTMLCanvasElement);
  var canvas = isCanvas ? container : document.createElement("canvas");
  var gl = setupWebGL(canvas);
  if (!gl) {
    return;
  }

  if (!isCanvas) {
    container.appendChild(canvas);
  }

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  var buffers = window.primitives.createSphereBuffers(gl, 10, 48, 24);

  // setup GLSL program
  var program = createProgramFromSources(gl, [vertexShaderSource, fragmentShaderSource]);
  var uniformSetters = createUniformSetters(gl, program);
  var attribSetters  = createAttributeSetters(gl, program);

  var attribs = {
    a_position: { buffer: buffers.position, numComponents: 3, },
    a_normal:   { buffer: buffers.normal,   numComponents: 3, },
    a_texcoord: { buffer: buffers.texcoord, numComponents: 2, },
  };

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var cameraAngleRadians = degToRad(0);
  var fieldOfViewRadians = degToRad(40);
  var cameraHeight = 40;

  var uniformsThatAreTheSameForAllObjects = {
    u_lightWorldPos:         [-50, 30, 100],
    u_viewInverse:           makeIdentity(),
    u_lightColor:            [1, 1, 1, 1],
  };

  var uniformsThatAreComputedForEachObject = {
    u_worldViewProjection:   makeIdentity(),
    u_world:                 makeIdentity(),
    u_worldInverseTranspose: makeIdentity(),
  };

  var makeRandomTexture = function(gl, w, h) {
    var numPixels = w * h;
    var pixels = new Uint8Array(numPixels * 4);
    var strong = 4;randInt(3);
    for (var p = 0; p < numPixels; ++p) {
      var off = p * 4;
      pixels[off + 0] = rand(128, 256);
      pixels[off + 1] = rand(128, 256);
      pixels[off + 2] = rand(128, 256);
      pixels[off + 3] = 255;
    }
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.generateMipmap(gl.TEXTURE_2D);
    return texture;
  };

  var rand = function(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  };

  var randInt = function(range) {
    return Math.floor(Math.random() * range);
  };

  var textures = [];
  var numTextures = 3;
  for (var ii = 0; ii < numTextures; ++ii) {
    var texture = makeRandomTexture(gl, 4, 4);
    textures.push(texture);
  }

  var objects = [];
  var numObjects = 300;
  for (var ii = 0; ii < numObjects; ++ii) {
    objects.push({
      radius: rand(150),
      xRotation: rand(Math.PI * 2),
      yRotation: rand(Math.PI),
      materialUniforms: {
        u_ambient:               [rand(0.2), rand(0.2), rand(0.2), 1],
        u_diffuse:               textures[randInt(textures.length)],
        u_specular:              [1, 1, 1, 1],
        u_shininess:             rand(500),
        u_specularFactor:        rand(1),
      },
    });
  }

  drawScene();

  // Draw the scene.
  function drawScene() {
    resizeCanvasToDisplaySize(canvas);

    // Set the viewport to match the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = canvas.clientWidth / canvas.clientHeight;
    var projectionMatrix =
        makePerspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = makeLookAt(cameraPosition, target, up, uniformsThatAreTheSameForAllObjects.u_viewInverse);

    // Make a view matrix from the camera matrix.
    var viewMatrix = makeInverse(cameraMatrix);

    gl.useProgram(program);
    // Setup all the needed attributes.
    setAttributes(attribSetters, attribs);

    // Bind the indices.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Set the uniforms that are the same for all objects.
    setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);

    // Draw objects
    var time = Date.now() * 0.0001;
    objects.forEach(function(object) {

      // Compute a position for this object based on the time.
      var xRotationMatrix = makeXRotation(object.xRotation * time);
      var yRotationMatrix = makeYRotation(object.yRotation * time);
      var translationMatrix = makeTranslation(0, 0, object.radius);
      var matrix = matrixMultiply(xRotationMatrix, yRotationMatrix);
      var worldMatrix = matrixMultiply(translationMatrix, matrix,
          uniformsThatAreComputedForEachObject.u_world);

      // Multiply the matrices.
      var matrix = matrixMultiply(worldMatrix, viewMatrix);
      matrixMultiply(matrix, projectionMatrix, uniformsThatAreComputedForEachObject.u_worldViewProjection);
      makeTranspose(makeInverse(worldMatrix), uniformsThatAreComputedForEachObject.u_worldInverseTranspose);

      // Set the uniforms we just computed
      setUniforms(uniformSetters, uniformsThatAreComputedForEachObject);

      // Set the uniforms that are specific to the this object.
      setUniforms(uniformSetters, object.materialUniforms);

      // Draw the geometry.
      gl.drawElements(gl.TRIANGLES, buffers.numElements, gl.UNSIGNED_SHORT, 0);
    });

    requestAnimationFrame(drawScene);
  }
}

// Check if we're running in jQuery
if (window.$) {
  window.$(function(){
    main();
  });
} else {
  window.addEventListener('load', main);
}



