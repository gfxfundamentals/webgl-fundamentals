/* Licensed under a BSD license. See license.html for license */
"use strict";

var vertexShaderSource = `
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
  varying vec3 v_surfaceToView;

  void main() {
    v_texCoord = a_texcoord;
    v_position = (u_worldViewProjection * a_position);
    v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
    v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
    v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
    gl_Position = v_position;
  }
`;

var fragmentShaderSource = `
  precision mediump float;

  varying vec4 v_position;
  varying vec2 v_texCoord;
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  uniform vec4 u_lightColor;
  uniform vec4 u_ambient;
  uniform sampler2D u_diffuse;
  uniform vec4 u_specular;
  uniform float u_shininess;
  uniform float u_specularFactor;

  vec4 lit(float l ,float h, float m) {
    return vec4(1.0,
                max(l, 0.0),
                (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                1.0);
  }

  void main() {
    vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
    vec3 a_normal = normalize(v_normal);
    vec3 surfaceToLight = normalize(v_surfaceToLight);
    vec3 surfaceToView = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLight + surfaceToView);
    vec4 litR = lit(dot(a_normal, surfaceToLight),
                      dot(a_normal, halfVector), u_shininess);
    vec4 outColor = vec4((
    u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                  u_specular * litR.z * u_specularFactor)).rgb,
        diffuseColor.a);
    gl_FragColor = outColor;
  }
`;


/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param {number} h The hue
 * @param {number} s The saturation
 * @param {number} v The value
 * @return {number[]} The RGB representation
 */
var hsvToRgb = function(h, s, v) {
  var r;
  var g;
  var b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch(i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return [r, g, b, 1];
};

function main() {
  // Get A WebGL context

  // Here we do this one 1 of 2 ways like many WebGL libraries. Either
  // we have a canvas on the page. Or else we have container and we
  // insert a canvas inside that container.
  // If we don't find a container we use the body of the document.
  var container = document.querySelector("#canvas") || document.body;
  var isCanvas = (container instanceof HTMLCanvasElement);
  var canvas = isCanvas ? container : document.createElement("canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  if (!isCanvas) {
    container.appendChild(canvas);
  }

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  var bufferInfo = window.primitives.createSphereBufferInfo(gl, 5, 48, 24);

  // setup GLSL program
  var programInfo = webglUtils.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var cameraAngleRadians = degToRad(0);
  var fieldOfViewRadians = degToRad(40);
  var cameraHeight = 40;

  var uniformsThatAreTheSameForAllObjects = {
    u_lightWorldPos:         [-50, 30, 100],
    u_viewInverse:           m4.identity(),
    u_lightColor:            [1, 1, 1, 1],
  };

  var uniformsThatAreComputedForEachObject = {
    u_worldViewProjection:   m4.identity(),
    u_world:                 m4.identity(),
    u_worldInverseTranspose: m4.identity(),
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
      speed: 0.25,
      radius: 60,
      radius2: 10,
      xRotation: ii / (numObjects / 40) * Math.PI * 2,
      yRotation: ii / (numObjects / 1) * Math.PI * 2,
      materialUniforms: {
        u_ambient:               hsvToRgb(ii / numObjects, 1, 1),
        u_diffuse:               textures[ii % textures.length],
        u_specular:              [1, 1, 1, 1],
        u_shininess:             10 + ii / (numObjects / 4) * 200,
        u_specularFactor:        1,
      },
    });
  }

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time *= 0.001;  // convert to seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Set the viewport to match the canvas
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = canvas.clientWidth / canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up, uniformsThatAreTheSameForAllObjects.u_viewInverse);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    gl.useProgram(programInfo.program);

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // Set the uniforms that are the same for all objects.
    webglUtils.setUniforms(programInfo, uniformsThatAreTheSameForAllObjects);

    // Draw objects
    objects.forEach(function(object) {

      // Compute a position for this object based on the time.
      var matrix = m4.identity(uniformsThatAreComputedForEachObject.u_world)
      matrix = m4.translate(matrix, 0, 0, object.radius2, matrix);
      matrix = m4.xRotate(matrix, object.xRotation + object.speed * time, matrix);
      matrix = m4.yRotate(matrix, object.yRotation + object.speed * time, matrix);
      var worldMatrix = m4.translate(matrix, 0, 0, object.radius, matrix);

      // Multiply the matrices.
      m4.multiply(viewProjectionMatrix, worldMatrix, uniformsThatAreComputedForEachObject.u_worldViewProjection);
      m4.transpose(m4.inverse(worldMatrix), uniformsThatAreComputedForEachObject.u_worldInverseTranspose);

      // Set the uniforms we just computed
      webglUtils.setUniforms(programInfo, uniformsThatAreComputedForEachObject);

      // Set the uniforms that are specific to the this object.
      webglUtils.setUniforms(programInfo, object.materialUniforms);

      // Draw the geometry.
      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
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



