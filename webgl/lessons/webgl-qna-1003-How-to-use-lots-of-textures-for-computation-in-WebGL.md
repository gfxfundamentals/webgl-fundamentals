Title: How to use lots of textures for computation in WebGL
Description:
TOC: qna

# Question:

Just focusing on the uniforms/attributes/varyings for a single vertex/fragment shader pair, I'm wondering how you might model the following system using [textures](https://webglfundamentals.org/webgl/lessons/webgl-2-textures.html). Focusing on 2D.

- position: The current object's [position](https://bl.ocks.org/pbeshai/dbed2fdac94b44d3b4573624a37fa9db).
- translation: The objects proposed [next position](https://gamedevacademy.org/how-to-simulate-a-fluid-on-gpu-using-webgl/) based on some CPU calculations up front.
- velocity: The objects velocity.
- rotation: The objects next rotation.
- forces (like gravity or collision): The object's summed forces acting on it in each direction.
- temperature: The object's temperature.
- mass/density: The object's mass/density.
- curvature: Moving along a predefined curve (like easing).

At first I wanted to do this:

    attribute vec3 a_position;
    attribute vec3 a_translation;
    attribute vec3 a_velocity;
    attribute vec3 a_rotation;
    attribute vec3 a_force;
    attribute vec3 a_temperature;
    attribute vec3 a_material; // mass and density
    attribute vec4 a_color;
    attribute vec4 a_curvature;

But that might run into the problem of [too many attributes](https://stackoverflow.com/questions/26682631/webgl-shaders-maximum-number-of-varying-variables).

So then I remember about [using textures](https://gamedev.stackexchange.com/questions/168967/how-to-use-2d-textures-in-opengl-webgl-for-physics/168977#168977) for this. Without going into too much detail, I'm just wondering how you might structure the uniforms/attributes/varyings to accomplish this.

    attribute vec2 a_position_uv;
    attribute vec2 a_translation_uv;
    attribute vec2 a_velocity_uv;
    attribute vec2 a_rotation_uv;
    attribute vec2 a_force_uv;
    attribute vec2 a_temperature_uv;
    attribute vec2 a_material_uv;
    attribute vec2 a_color_uv;
    attribute vec2 a_curvature_uv;

If we did that, where the attributes all referenced texture coordinates, then the texture could store `vec4` data perhaps, and so we might avoid the too-many-attributes problem.

But I'm not sure now how to define the textures for both shaders. Wondering if it's just like this:

    uniform sampler2D u_position_texture;
    uniform sampler2D u_translation_texture;
    uniform sampler2D u_velocity_texture;
    uniform sampler2D u_rotation_texture;
    uniform sampler2D u_force_texture;
    uniform sampler2D u_temperature_texture;
    uniform sampler2D u_material_texture;
    uniform sampler2D u_color_texture;
    uniform sampler2D u_curvature_texture;

Then in `main` in the vertex shader, we can use the textures however to calculate the position.

    void main() {
      vec4 position = texture2D(u_position_texture, a_position_uv);
      vec4 translation = texture2D(u_translation_texture, a_translation_uv);
      // ...
      gl_Position = position * ...
    }

In this way we don't need any `varyings` in the vertex shader for passing through the color necessarily, unless we want to use the result of our calculations in the fragment shader. But I can figure that part out. For now I just would like to know if it's possible to structure the shaders like this, so the final vertex shader would be:

    attribute vec2 a_position_uv;
    attribute vec2 a_translation_uv;
    attribute vec2 a_velocity_uv;
    attribute vec2 a_rotation_uv;
    attribute vec2 a_force_uv;
    attribute vec2 a_temperature_uv;
    attribute vec2 a_material_uv;
    attribute vec2 a_color_uv;
    attribute vec2 a_curvature_uv;

    uniform sampler2D u_position_texture;
    uniform sampler2D u_translation_texture;
    uniform sampler2D u_velocity_texture;
    uniform sampler2D u_rotation_texture;
    uniform sampler2D u_force_texture;
    uniform sampler2D u_temperature_texture;
    uniform sampler2D u_material_texture;
    uniform sampler2D u_color_texture;
    uniform sampler2D u_curvature_texture;

    void main() {
      vec4 position = texture2D(u_position_texture, a_position_uv);
      vec4 translation = texture2D(u_translation_texture, a_translation_uv);
      // ...
      gl_Position = position * ...
    }

And the final fragment shader might be along the lines of:

    uniform sampler2D u_position_texture;
    uniform sampler2D u_translation_texture;
    uniform sampler2D u_velocity_texture;
    uniform sampler2D u_rotation_texture;
    uniform sampler2D u_force_texture;
    uniform sampler2D u_temperature_texture;
    uniform sampler2D u_material_texture;
    uniform sampler2D u_color_texture;
    uniform sampler2D u_curvature_texture;

    varying vec2 v_foo
    varying vec2 v_bar

    void main() {
      // ...
      gl_Color = position * ... * v_foo * v_bar
    }


# Answer

LJ's answer is arguably the right thing to do but if you want to store data in textures all you need is an index per vertex

    attribute float index;

You then compute UV coords from that

    uniform vec2 textureSize;  // size of texture

    float numVec4sPerElement = 8.;
    float elementsPerRow = floor(textureSize.x / numVec4sPerElement);
    float tx = mod(index, elementsPerRow) * numVec4sPerElement;
    float ty = floor(index / elementsPerRow);
    vec2 baseTexel = vec2(tx, ty) + 0.5;

Now you can pull out the data. (note: assuming it's a float texture)

    vec4 position    = texture2D(dataTexture, baseTexel / textureSize);
    vec4 translation = texture2D(dataTexture, (baseTexel + vec2(1,0)) / textureSize);
    vec4 velocity    = texture2D(dataTexture, (baseTexel + vec2(2,0)) / textureSize);
    vec4 rotation    = texture2D(dataTexture, (baseTexel + vec2(3,0)) / textureSize);
    vec4 forces      = texture2D(dataTexture, (baseTexel + vec2(4,0)) / textureSize);

etc...

Of course you might interleave the data more. Like say position above is vec4 maybe position.w is gravity, translation.w is mass, etc...

You then put the data in a texture

```
position0, translation0, velocity0, rotation0, forces0, .... 
position1, translation1, velocity1, rotation1, forces1, .... 
position2, translation2, velocity2, rotation2, forces2, .... 
position2, translation3, velocity3, rotation3, forces3, .... 
```

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.querySelector('canvas').getContext('webgl');
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
      alert('need OES_texture_float');
    }


    const vs = `
    attribute float index;

    uniform vec2 textureSize;
    uniform sampler2D dataTexture;

    uniform mat4 modelView;
    uniform mat4 projection;

    varying vec3 v_normal;
    varying vec4 v_color;

    void main() {
      float numVec4sPerElement = 3.;  // position, normal, color
      float elementsPerRow = floor(textureSize.x / numVec4sPerElement);
      float tx = mod(index, elementsPerRow) * numVec4sPerElement;
      float ty = floor(index / elementsPerRow);
      vec2 baseTexel = vec2(tx, ty) + 0.5;

      // Now you can pull out the data.

      vec3 position = texture2D(dataTexture, baseTexel / textureSize).xyz;
      vec3 normal   = texture2D(dataTexture, (baseTexel + vec2(1,0)) / textureSize).xyz;
      vec4 color    = texture2D(dataTexture, (baseTexel + vec2(2,0)) / textureSize);

      gl_Position = projection * modelView * vec4(position, 1);

      v_color = color;
      v_normal = normal;
    }
    `;

    const fs = `
    precision highp float;

    varying vec3 v_normal;
    varying vec4 v_color;

    uniform vec3 lightDirection;

    void main() {
      float light = dot(lightDirection, normalize(v_normal)) * .5 + .5;
      gl_FragColor = vec4(v_color.rgb * light, v_color.a);
    }
    `;

    // compile shader, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make some vertex data
    const radius = 1;
    const thickness = .3;
    const radialSubdivisions = 20;
    const bodySubdivisions = 12;
    const verts = twgl.primitives.createTorusVertices(
        radius, thickness, radialSubdivisions, bodySubdivisions);
    /*
      verts is now an object like this
      
      {
        position: float32ArrayOfPositions,
        normal: float32ArrayOfNormals,
        indices: uint16ArrayOfIndices,
      }
    */

    // covert the vertex data to a texture
    const numElements = verts.position.length / 3;
    const vec4sPerElement = 3;  // position, normal, color
    const maxTextureWidth = 2048;  // you could query this
    const elementsPerRow = maxTextureWidth / vec4sPerElement | 0;
    const textureWidth = elementsPerRow * vec4sPerElement;
    const textureHeight = (numElements + elementsPerRow - 1) /
                          elementsPerRow | 0;

    const data = new Float32Array(textureWidth * textureHeight * 4);
    for (let i = 0; i < numElements; ++i) {
      const dstOffset = i * vec4sPerElement * 4;
      const posOffset = i * 3;
      const nrmOffset = i * 3;
      data[dstOffset + 0] = verts.position[posOffset + 0];
      data[dstOffset + 1] = verts.position[posOffset + 1];
      data[dstOffset + 2] = verts.position[posOffset + 2];
      
      data[dstOffset + 4] = verts.normal[nrmOffset + 0];
      data[dstOffset + 5] = verts.normal[nrmOffset + 1];
      data[dstOffset + 6] = verts.normal[nrmOffset + 2];  
      
      // color, just make it up
      data[dstOffset +  8] = 1;
      data[dstOffset +  9] = (i / numElements * 2) % 1;
      data[dstOffset + 10] = (i / numElements * 4) % 1;
      data[dstOffset + 11] = 1;
    }

    // use indices as `index`
    const arrays = {
      index: { numComponents: 1, data: new Float32Array(verts.indices), },
    };

    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, textureHeight, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    function render(time) {
      time *= 0.001;  // seconds
      
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);

      const fov = Math.PI * 0.25;
      const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      const near = 0.1;
      const far = 20;
      const projection = m4.perspective(fov, aspect, near, far);
      
      const eye = [0, 0, 3];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);

      // set the matrix for each model in the texture data
      const modelView = m4.rotateY(view, time);
      m4.rotateX(modelView, time * .2, modelView);
      
      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, {
        lightDirection: v3.normalize([1, 2, 3]),
        textureSize: [textureWidth, textureHeight],
        projection: projection,
        modelView: modelView,
      });  
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Be aware that pulling data out of textures is slower than getting them from attributes. How much slower probably depends on the GPU. Still, it may be faster than whatever alternative you're considering.

You might also be interested in using textures for batching draw calls. effectively storing things that are traditionally uniforms in a texture.

https://stackoverflow.com/a/54720138/128511
