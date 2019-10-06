Title: Make light independent from the view in a Phong model
Description:
TOC: qna

# Question:

I'm trying to implement the Phong shading model, but I come across something quite strange. When I change the viewing position, it looks like the light behaves differently, as if it was dependent from the view. Like, if I'm close to the object I only see the effects of the ambient light, while if I go far away from it I start seeing the diffuse's contribution.

These are my shaders:

```
//Vertex Shader

attribute vec4 vPosition;
attribute vec4 vNormal;
varying vec3 N, L, E;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec4 lightPosition;

void main()
{
    vec3 pos = -(modelViewMatrix * vPosition).xyz;
    vec3 light = lightPosition.xyz;
    L = normalize(light - pos);
    E = -pos;
    N = normalize((modelViewMatrix * vNormal).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}
```

```
//Fragment Shader

uniform vec4 ambientProduct;
uniform vec4 diffuseProduct;
uniform vec4 specularProduct;
uniform float shininess;
varying vec3 N, L, E;

void main()
{
    vec4 fColor;
    vec3 H = normalize(L + E);
    vec4 ambient = ambientProduct;
    float Kd = max(dot(L, N), 0.0);
    vec4 diffuse = Kd * diffuseProduct;
    float Ks = pow(max(dot(N, H), 0.0), shininess);
    vec4 specular = Ks * specularProduct;
    if (dot(L, N) < 0.0) {
        specular = vec4(0.0, 0.0, 0.0, 1.0);
    }
    fColor = ambient + diffuse + specular;
    fColor.a = 1.0;
    gl_FragColor = fColor;
}
```

What am I doing wrong? How can I make the light behave independently from the viewer position?

## Update 1: 

After @Rabbid76's answer I edited the vertex shader by adding these lines (as well as passing the separate model and view matrices but I'll omit that for brevity's sake):

```
    vec3 pos = (modelViewMatrix * vPosition).xyz;
    vec3 light = (viewMatrix * lightPosition).xyz;
```

And I also updated the calculation of the N vector as the previous way of doing it seemed to not actually allow a per-fragment shading:
```
    N = normalize(mat3(modelViewMatrix) * vNormal.xyz);
```

Still, the shade seems to move along with the rotation of the camera. This could be related to the fact that the light is multiplied by the viewMatrix I guess? 

# Answer

A working [snippet](https://stackoverflow.blog/2014/09/16/introducing-runnable-javascript-css-and-html-code-snippets/) in your question is always helpful!

Issues

1. The light and the position need to be in the same space. 

   Those could be world space or view space but they need to be the same space.

   The code had the position `E` in view space but the `lightPosition` in world space

2. You can't multiply a normal by a `modelViewMatrix`

   You need to remove the translation. You also potentially need to deal
   with scaling issues. See [this article](https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-directional.html)

3. The code is computing values in the vertex shader so they will be interpolated as they get passed to the fragment shader. That means they will no longer be unit vectors so you need to re-normalize them.

4. In computing the half vector you need to add their directions

   The code was adding L (the direction from the surface to the light) to the view position of the surface instead of the direction from the surface to the view.

5. In computing a surface to light direction that would be `light - pos` but the code was negating `pos`. Of course you also need `pos` to be negative for the surface to view direction `E`

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('canvas').getContext('webgl');
    const m4 = twgl.m4;

    const vs = `
    attribute vec4 vPosition;
    attribute vec4 vNormal;
    varying vec3 N, L, E;
    uniform mat4 viewMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform vec4 lightPosition;

    void main()
    {
        vec3 pos = (modelViewMatrix * vPosition).xyz;
        vec3 light = (viewMatrix * lightPosition).xyz;
        L = light - pos;
        E = -pos;
        N = mat3(modelViewMatrix) * vNormal.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vPosition;
    }
    `;

    const fs = `
    precision highp float;

    uniform vec4 ambientProduct;
    uniform vec4 diffuseProduct;
    uniform vec4 specularProduct;
    uniform float shininess;
    varying vec3 N, L, E;

    void main()
    {
        vec4 fColor;
        vec3 normal = normalize(N);
        vec3 surfaceToLightDir = normalize(L);
        vec3 surfaceToViewDir = normalize(E);
        vec3 H = normalize(surfaceToLightDir + surfaceToViewDir);
        vec4 ambient = ambientProduct;
        float Kd = max(dot(surfaceToLightDir, normal), 0.0);
        vec4 diffuse = Kd * diffuseProduct;
        float Ks = pow(max(dot(normal, H), 0.0), shininess);
        vec4 specular = Ks * specularProduct;
        if (dot(surfaceToLightDir, normal) < 0.0) {
            specular = vec4(0.0, 0.0, 0.0, 1.0);
        }
        fColor = ambient + diffuse + specular;
        fColor.a = 1.0;
        gl_FragColor = fColor;
    }
    `;

    // compiles shaders, links program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const vertices = twgl.primitives.createSphereVertices(
        2, // radius
        8, // subdivision around
        6, // subdivisions down
    );
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      vPosition: vertices.position,
      vNormal: vertices.normal,
      indices: vertices.indices,
    });

    function render(time) {
      time *= 0.001;  // convert to seconds
      
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      
      gl.useProgram(programInfo.program);

      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      const projectionMatrix = m4.perspective(
          60 * Math.PI / 180,  // field of view
          gl.canvas.clientWidth / gl.canvas.clientHeight,  // aspect
          0.1,  // znear
          100,  // zfar
      );
      
      const eye = [
        Math.sin(time) * 5, 
        3, 
        3 + Math.cos(time) * 5,
      ];
      const target = [0, 2, 3];
      const up = [0, 1, 0];
      const cameraMatrix = m4.lookAt(eye, target, up);
      const viewMatrix = m4.inverse(cameraMatrix);
      
      const worldMatrix = m4.translation([0, 2, 3]);
      
      const modelViewMatrix = m4.multiply(viewMatrix, worldMatrix);

      // calls gl.uniformXXX
      twgl.setUniforms(programInfo, {
        viewMatrix,
        modelViewMatrix,
        projectionMatrix,
        lightPosition: [4, 3, 1, 1],
        ambientProduct: [0, 0, 0, 1], 
        diffuseProduct: [1, 1, 1, 1],
        specularProduct: [1, 1, 1, 1],
        shininess: 50,
      });

      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    canvas { border: 1px solid black }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

For me personally I find short cryptic variable names hard to follow but that's a personal preference.
