Title: How to do batching without UBOs?
Description:
TOC: qna

# Question:

I'm trying to implement batching for a WebGL renderer which is struggling with lots of small objects due to too many draw calls. What I thought is I'd batch them all by the kind of shader they use, then draw a few at a time, uploading material parameters and the model matrix for each object once in uniforms.

My problem is that the uniform size limits for non-UBO uniforms are extremely low, as in 256 floats low at a minimum. If my material uses, say, 8 floats, and if you factor in the model matrix, I barely have enough uniforms to draw 10 models in a single batch, which isn't really going to be enough.

Is there any hope to make this work without UBOs? Are textures an option? How are people doing batching without WebGL2 UBOs?

More details: I have no skinning or complex animations, I just have some shaders (diffuse, cook-torrance, whatever) and each model has different material settings for each shader, e.g. color, roughness, index of refraction which can be changed dynamically by the user (so it's not realistic to bake them into the vertex array because we have some high poly data, also users can switch shaders and not all shaders have the same number of parameters) as well as material maps obviously. The geometry itself is static and just has a linear transform on each model. For the most part all meshes are different so geometry instancing won't help a whole lot, but I can look at that later.

Thanks

# Answer

I don't know that this is actually faster than lots of draw calls but here is drawing 4 models with a single draw call

It works by adding an id per model. So, for every vertex in model #0 put a 0, for every vertex in model #1 put a 1, etc. 

Then it uses model id to index stuff in a texture. The easiest would be model id chooses the row of a texture and then all the data for that model can be pulled out of that row. 

For WebGL1 

    attribute float modelId;

    ...

    #define TEXTURE_WIDTH ??
    #define COLOR_OFFSET    ((0.0 + 0.5) / TEXTURE_WIDTH)
    #define MATERIAL_OFFSET ((1.0 + 0.5) / TEXTURE_WIDTH)

    float modelOffset = (modelId + .5) / textureHeight;
    vec4 color = texture2D(perModelData, vec2(COLOR_OFFSET, modelOffset));
    vec4 roughnessIndexOfRefaction = texture2D(perModelData, 
                                               vec2(MATERIAL_OFFSET, modelOffset));

etc..

As long as you are not drawing more than `gl.getParameter(gl.MAX_TEXTURE_SIZE)` models it will work. If you have more than that either use more draw calls or change the texture coordinate calculations so there's more than one model per row

In WebGL2 you'd change the code to use `texelFetch` and unsigned integers

    in uint modelId;

    ...

    #define COLOR_OFFSET    0
    #define MATERIAL_OFFSET 1

    vec4 color = texelFetch(perModelData, uvec2(COLOR_OFFSET, modelId));
    vec4 roughnessIndexOfRefaction = texelFetch(perModelData, 
                                                uvec2(MATERIAL_OFFSET, modelId));

example of 4 models drawn with 1 draw call. For each model the model matrix and color are stored in the texture.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.querySelector('canvas').getContext('webgl');
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
      alert('need OES_texture_float');
    }

    const COMMON_STUFF = `
    #define TEXTURE_WIDTH 5.0
    #define MATRIX_ROW_0_OFFSET ((0. + 0.5) / TEXTURE_WIDTH)
    #define MATRIX_ROW_1_OFFSET ((1. + 0.5) / TEXTURE_WIDTH)
    #define MATRIX_ROW_2_OFFSET ((2. + 0.5) / TEXTURE_WIDTH)
    #define MATRIX_ROW_3_OFFSET ((3. + 0.5) / TEXTURE_WIDTH)
    #define COLOR_OFFSET        ((4. + 0.5) / TEXTURE_WIDTH)
    `;

    const vs = `
    attribute vec4 position;
    attribute vec3 normal;
    attribute float modelId;

    uniform float textureHeight;
    uniform sampler2D perModelDataTexture;
    uniform mat4 projection;
    uniform mat4 view;

    varying vec3 v_normal;
    varying float v_modelId;

    ${COMMON_STUFF}

    void main() {
      v_modelId = modelId;  // pass to fragment shader

      float modelOffset = (modelId + 0.5) / textureHeight;

      // note: in WebGL2 better to use texelFetch
      mat4 model = mat4(
        texture2D(perModelDataTexture, vec2(MATRIX_ROW_0_OFFSET, modelOffset)),
        texture2D(perModelDataTexture, vec2(MATRIX_ROW_1_OFFSET, modelOffset)),
        texture2D(perModelDataTexture, vec2(MATRIX_ROW_2_OFFSET, modelOffset)),
        texture2D(perModelDataTexture, vec2(MATRIX_ROW_3_OFFSET, modelOffset)));
      
      gl_Position = projection * view * model * position;
      v_normal = mat3(view) * mat3(model) * normal;
    }
    `;

    const fs = `
    precision highp float;

    varying vec3 v_normal;
    varying float v_modelId;

    uniform float textureHeight;
    uniform sampler2D perModelDataTexture;
    uniform vec3 lightDirection;

    ${COMMON_STUFF}

    void main() {
      float modelOffset = (v_modelId + 0.5) / textureHeight;

      vec4 color = texture2D(perModelDataTexture, vec2(COLOR_OFFSET, modelOffset));
      
      float l = dot(lightDirection, normalize(v_normal)) * .5 + .5;
      
      gl_FragColor = vec4(color.rgb * l, color.a);
    }
    `;

    // compile shader, link, look up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    // make some vertex data
    const modelVerts = [
      twgl.primitives.createSphereVertices(1, 6, 4),
      twgl.primitives.createCubeVertices(1, 1, 1),
      twgl.primitives.createCylinderVertices(1, 1, 10, 1),
      twgl.primitives.createTorusVertices(1, .2, 16, 8),
    ];
    // merge all the vertices into one
    const arrays = twgl.primitives.concatVertices(modelVerts);
    // fill an array so each vertex of each model has a modelId
    const modelIds = new Uint16Array(arrays.position.length / 3);
    let offset = 0;
    modelVerts.forEach((verts, modelId) => {
      const end = offset + verts.position.length / 3;
      while(offset < end) {
        modelIds[offset++] = modelId;
      }
    });
    arrays.modelId = { numComponents: 1, data: modelIds };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    const numModels = modelVerts.length;
    const tex = gl.createTexture();
    const textureWidth = 5; // 4x4 matrix, 4x1 color
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, numModels, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // this data is for the texture, one row per model
    // first 4 pixels are the model matrix, 5 pixel is the color
    const perModelData = new Float32Array(textureWidth * numModels * 4);
    const stride = textureWidth * 4;
    const modelOffset = 0;
    const colorOffset = 16;

    // set the colors at init time
    for (let modelId = 0; modelId < numModels; ++modelId) {
      perModelData.set([r(), r(), r(), 1], modelId * stride + colorOffset);
    }

    function r() {
      return Math.random();
    }

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
      
      const eye = [0, 0, 10];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const camera = m4.lookAt(eye, target, up);
      const view = m4.inverse(camera);

      // set the matrix for each model in the texture data
      const mat = m4.identity();
      for (let modelId = 0; modelId < numModels; ++modelId) {
        const t = time * (modelId + 1) * 0.3;
        m4.identity(mat);
        m4.rotateX(mat, t, mat);
        m4.rotateY(mat, t, mat);
        m4.translate(mat, [0, 0, Math.sin(t * 1.1) * 4], mat);
        m4.rotateZ(mat, t, mat);
        
        perModelData.set(mat, modelId * stride + modelOffset);
      }
      
      // upload the texture data
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, textureWidth, numModels, 
                       gl.RGBA, gl.FLOAT, perModelData);
      
      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
      twgl.setUniforms(programInfo, {
        lightDirection: v3.normalize([1, 2, 3]),
        perModelDataTexture: tex,
        textureHeight: numModels,
        projection,
        view,
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

Here's 2000 models in one draw call

https://jsfiddle.net/greggman/g2tcadho/
