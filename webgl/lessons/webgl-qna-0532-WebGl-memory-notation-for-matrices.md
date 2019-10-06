Title: WebGl memory notation for matrices
Description:
TOC: qna

# Question:

Since webGL derives from openGL the coordinate system should be right handed, but as I'm trying to rotate a model by hand-writing the rotation matrix the visual output is the opposite of what I'd expect.

OpenGL needed matrices written in column-major format, and this is the way i'm handwriting a 90° counter-clockwise rotation matrix (assuming we're using a right handed coordinate system) around the y axis:


    var rot = new glMatrix.ARRAY_TYPE(16);
    //I indexed the array this way to edit those values as if I 
    were editing rows instead of columns
    rot[0]  = 0;
    rot[4]  = 0;
    rot[8]  = -1;
    rot[12] = 0;
    
    rot[1]  = 0;
    rot[5]  = 1;
    rot[9]  = 0;
    rot[13] = 0;
    
    rot[2]  = 1;
    rot[6]  = 0;
    rot[10] = 0;
    rot[14] = 0;
    
    rot[3]  = 0;
    rot[7]  = 0;
    rot[11] = 0;
    rot[15] = 1;
    gl.uniformMatrix4fv(Program.model, false, rot);



I'd expect a 90° ccw rotation around the y axis but i'm getting a cw one instead. The transpose works as expected which means either the math is wrong or that I'm missing something else


# Answer

Storage is orthogonal to how matrices are used. You can store them column major or row major. How they get used in multiplication is unrelated to their storage.

To make that clear I could store the matrix like this

    // storage format 1
    [xaxis-x, xaxis-y, xaxis-z, 0,
     yaxis-x, yaxis-y, yaxis-z, 0,
     zaxis-x, zazis-y, xaxis-z, 0,
     trans-x, trans-y, trans-z, 1]

Or I could store it like this

    // storage format 2
    [xaxis-x, yaxis-x, zaxis-x, trans-x,
     xaxis-y, yaxis-y, zaxis-y, trans-y,
     xaxis-z, yazis-z, zaxis-z, trans-z,
     0, 0, 0, 1]

I can then write all of these functions

    columnMajorMutliplyUsingStorageFormat1(matrix, vector)
    columnMajorMutliplyUsingStorageFormat2(matrix, vector)
    rowMajorMutliplyUsingStorageFormat1(matrix, vector)
    rowMajorMutliplyUsingStorageFormat2(matrix, vector)

You can imagine how those functions would be written. The point is storage format is separate from usage.

In any case pretty much all WebGL and OpenGL programs a matrix almost always takes storage format 1

    // storage format 1
    [xaxis-x, xaxis-y, xaxis-z, 0,
     yaxis-x, yaxis-y, yaxis-z, 0,
     zaxis-x, zazis-y, xaxis-z, 0,
     trans-x, trans-y, trans-z, 1]

You can verify this in OpenGL 1.0. 

    glMatrixMode(GL_MODELVIEW);
    glTranslatef(1.0f, 2.0f, 3.0f);
    float mat[16];
    glGetFloatv(GL_MODELVIEW, &mat[0]);
    printf("%f %f %f %f\n", mat[0], mat[1], mat[2], mat[3]);
    printf("%f %f %f %f\n", mat[4], mat[5], mat[6], mat[7]);
    printf("%f %f %f %f\n", mat[8], mat[9], mat[10], mat[11]);
    printf("%f %f %f %f\n", mat[12], mat[13], mat[14], mat[15]);

Will print something like

    1 0 0 0
    0 1 0 0
    0 0 1 0
    1 2 3 1

In other words if you want to set the translation set elements 12, 13, 14. If you want to set xaxis set elements 0, 1, 2

Here's the typical example with translation in elements 12, 13, 14

The canonical example of usage would be

    gl_Position = worldViewProjectionMatrix * position;

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    "use strict";
    twgl.setDefaults({attribPrefix: "a_"});
    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl")
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    var bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);

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

        var uniforms = {
        u_lightWorldPos: [1, 8, -10],
      u_lightColor: [0.4, 0.8, 0.8, 1],
      u_ambient: [0, 0, 0, 1],
      u_specular: [1, 1, 1, 1],
      u_shininess: 50,
      u_specularFactor: 1,
      u_diffuse: tex,
    };

                                 function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10);
      var eye = [1, 4, -6];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(view, projection);
      var world = m4.rotationY(time);

      uniforms.u_viewInverse = camera;
      uniforms.u_world = world;
      uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
      uniforms.u_worldViewProjection = m4.multiply(world, viewProjection);

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

      <script id="vs" type="notjs">
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
      </script>
      <script id="fs" type="notjs">
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
      </script>
      <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c"></canvas>


<!-- end snippet -->

and here's the opposite example with translation in elements 3, 7, 11

In this case the math in the shader has been changed to

    gl_Position = position * worldViewProjectionMatrix;

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    "use strict";
    twgl.setDefaults({attribPrefix: "a_"});
    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl")
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    var bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 2);

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

        var uniforms = {
        u_lightWorldPos: [1, 8, -10],
      u_lightColor: [0.4, 0.8, 0.8, 1],
      u_ambient: [0, 0, 0, 1],
      u_specular: [1, 1, 1, 1],
      u_shininess: 50,
      u_specularFactor: 1,
      u_diffuse: tex,
    };

                                 function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10);
      var eye = [1, 4, -6];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(view, projection);
      var world = m4.rotationY(time);

      uniforms.u_viewInverse = m4.transpose(camera);
      uniforms.u_world = m4.transpose(world);
      uniforms.u_worldInverseTranspose = m4.transpose(m4.transpose(m4.inverse(world)));
      uniforms.u_worldViewProjection = m4.transpose(m4.multiply(world, viewProjection));

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, uniforms);
      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script id="vs" type="notjs">
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
      v_position = (a_position * u_worldViewProjection);
      v_normal = (vec4(a_normal, 0) * u_worldInverseTranspose).xyz;
      v_surfaceToLight = u_lightWorldPos - (a_position * u_world).xyz;
      v_surfaceToView = (u_viewInverse[3] - (a_position * u_world)).xyz;
      gl_Position = v_position;
    }
      </script>
      <script id="fs" type="notjs">
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
      </script>
      <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c"></canvas>

<!-- end snippet -->


