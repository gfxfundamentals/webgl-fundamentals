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

  varying vec4 v_position;
  varying vec2 v_texCoord;
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  void main() {
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
  varying vec3 v_normal;
  varying vec3 v_surfaceToLight;
  varying vec3 v_surfaceToView;

  uniform vec4 u_lightColor;
  uniform vec4 u_ambient;
  uniform vec4 u_diffuse;
  uniform vec4 u_specular;
  uniform float u_shininess;
  uniform float u_specularFactor;
  uniform vec4 u_fogColor;
  uniform float u_fogNear;
  uniform float u_fogFar;

  vec4 lit(float l ,float h, float m) {
    return vec4(1.0,
                l,
                (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
                1.0);
  }

  void main() {
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    float fogFactor = smoothstep(u_fogNear, u_fogFar, depth);
    vec4 diffuseColor = u_diffuse;
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
    gl_FragColor = mix(outColor, u_fogColor, fogFactor);
  }
`;

function main() {
  // Get A WebGL context

  // Here we do this one 1 of 2 ways like many WebGL libraries. Either
  // we have a canvas on the page. Or else we have container and we
  // insert a canvas inside that container.
  // If we don't find a container we use the body of the document.
  var container = document.querySelector("#canvas") || document.body;
  var isCanvas = (container instanceof HTMLCanvasElement);
  var canvas = isCanvas ? container : document.createElement("canvas");
  var gl = canvas.getContext("webgl", { alpha: false });
  if (!gl) {
    return;
  }

  if (!isCanvas) {
    container.appendChild(canvas);
  }

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  var bufferInfo = window.primitives.createCubeBufferInfo(gl, 8);

  // setup GLSL program
  var programInfo = webglUtils.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var cameraAngleRadians = degToRad(0);
  var fieldOfViewRadians = degToRad(40);
  var cameraHeight = 40;
  var zNear = 1;
  var zFar  = 150;

  var uniformsThatAreTheSameForAllObjects = {
    u_lightWorldPos:         [-50, 30, 100],
    u_viewInverse:           m4.identity(),
    u_lightColor:            [1, 1, 1, 1],
    u_fogColor:              [0, 0, 1, 1],
    u_fogNear:               zNear + (zFar - zNear) * 0.33,
    u_fogFar:                zFar,
  };

  var uniformsThatAreComputedForEachObject = {
    u_worldViewProjection:   m4.identity(),
    u_world:                 m4.identity(),
    u_worldInverseTranspose: m4.identity(),
  };

  var materialUniforms = {
    u_ambient:               [0, 1, 1, 0],
    u_diffuse:               [1, 1, 1, 1],
    u_specular:              [1, 1, 1, 1],
    u_shininess:             400,
    u_specularFactor:        1,
  };

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    webglUtils.resizeCanvasToDisplaySize(canvas);

    time *= 0.001;  // convert to seconds

    // Set the viewport to match the canvas
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clearColor( 0, 0, 1, 1 );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 150);

    // Compute the camera's matrix using look at.
    var orbitRadius = 100;
    var orbitTime = 1 + time * 0.05;
    var cameraPosition = [Math.cos(orbitTime) * orbitRadius, Math.sin(orbitTime * 1.123) * orbitRadius, Math.sin(orbitTime) * orbitRadius];
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
    var num = 4;
    var spread = 20;
    for (var zz = -num; zz <= num; ++zz) {
      for (var yy = -num; yy <= num; ++yy) {
        for (var xx = -num; xx <= num; ++xx) {
          var worldMatrix = m4.translation(xx * spread, yy * spread, zz * spread);

          // Multiply the matrices.
          m4.multiply(
              viewProjectionMatrix, worldMatrix,
              uniformsThatAreComputedForEachObject.u_worldViewProjection);
          var matrix = m4.multiply(viewMatrix, worldMatrix);
          m4.transpose(m4.inverse(worldMatrix), uniformsThatAreComputedForEachObject.u_worldInverseTranspose);

          // Set the uniforms we just computed
          webglUtils.setUniforms(programInfo, uniformsThatAreComputedForEachObject);

          // Set a color for this object.
          materialUniforms.u_diffuse[0] = 1; xx / num * 0.5 + 0.5;
          materialUniforms.u_diffuse[1] = 1; yy / num * 0.5 + 0.5;
          materialUniforms.u_diffuse[2] = 1; zz / num * 0.5 + 0.5;

          // Set the uniforms that are specific to the this object.
          webglUtils.setUniforms(programInfo, materialUniforms);

          // Draw the geometry.
          gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
        }
      }
    }

    requestAnimationFrame(drawScene);
  }
}

// Check if we're running in jQuery
if (window.$) {
  window.$(function(){
    main();
  });
} else {
  main();
}



