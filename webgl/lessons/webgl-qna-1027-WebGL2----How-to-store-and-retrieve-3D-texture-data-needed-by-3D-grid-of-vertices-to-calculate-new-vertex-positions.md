Title: WebGL2 -- How to store and retrieve 3D texture data needed by 3D grid of vertices to calculate new vertex positions
Description:
TOC: qna

# Question:

3D Physics simulation needs access to neighbor vertices' positions and attributes in shader to calculate a vertex's new position. 2D version works but am having trouble porting solution to 3D. Flip-Flopping two 3D textures seems right, inputting sets of x,y and z coordinates for one texture, and getting vec4s which contains position-velocity-acceleration data of neighboring points to use to calculate new positions and velocities for each vertex. The 2D version uses 1 draw call with a framebuffer to save all the generated gl_FragColors to a sampler2D.  I want to use a framebuffer to do the same with a sampler3D.  But it looks like using a framebuffer in 3D, I need to write one+ layer at a time of a 2nd 3D texture, until all layers have been saved. I'm confused about mapping vertex grid to relative x,y,z coordinates of texture and how to save this to layers individually. In 2D version the gl_FragColor written to the framebuffer maps directly to the 2D x-y coordinate system of the canvas, with each pixel being a vertex. but I'm not understanding how to make sure the gl_FragColor which contains position-velocity data for a 3D vertex is written to the texture such that it keeps mapping correctly to the 3D vertices.

This works for 2D in a fragment shader:
      

    vec2 onePixel = vec2(1.0, 1.0)/u_textureSize;
    vec4 currentState = texture2D(u_image, v_texCoord);
    float fTotal = 0.0;
    for (int i=-1;i<=1;i+=2){
        for (int j=-1;j<=1;j+=2){
            if (i == 0 && j == 0) continue;
            vec2 neighborCoord = v_texCoord + vec2(onePixel.x*float(i), onePixel.y*float(j));
    
            vec4 neighborState;
            if (neighborCoord.x < 0.0 || neighborCoord.y < 0.0 || neighborCoord.x >= 1.0 || neighborCoord.y >= 1.0){
                neighborState = vec4(0.0,0.0,0.0,1.0);
            } else {
                neighborState = texture2D(u_image, neighborCoord);
            }
    
            float deltaP =  neighborState.r - currentState.r;
            float deltaV = neighborState.g - currentState.g;
    
            fTotal += u_kSpring*deltaP + u_dSpring*deltaV;
        }
    }
    
    float acceleration = fTotal/u_mass;
    float velocity = acceleration*u_dt + currentState.g;
    float position = velocity*u_dt + currentState.r;
    gl_FragColor = vec4(position,velocity,acceleration,1);

This is what I have attempted in 3D in a fragment shader:#version 300 es
   

    vec3 onePixel = vec3(1.0, 1.0, 1.0)/u_textureSize;
    vec4 currentState = texture(u_image, v_texCoord);
    float fTotal = 0.0;
    for (int i=-1; i<=1; i++){
        for (int j=-1; j<=1; j++){
            for (int k=-1; k<=1; k++){
            if (i == 0 && j == 0 && k == 0) continue;
               vec3 neighborCoord = v_texCoord + vec3(onePixel.x*float(i), onePixel.y*float(j), onePixel.z*float(k));
               vec4 neighborState;
        
               if (neighborCoord.x < 0.0 || neighborCoord.y < 0.0 || neighborCoord.z < 0.0 || neighborCoord.x >= 1.0 || neighborCoord.y >= 1.0 || neighborCoord.z >= 1.0){
                   neighborState = vec4(0.0,0.0,0.0,1.0);
               } else {
                   neighborState = texture(u_image, neighborCoord);
               }
               float deltaP =  neighborState.r - currentState.r;  //Distance from neighbor
               float springDeltaLength =  (deltaP - u_springOrigLength[counter]);
                    
               //Add the force on our point of interest from the current neighbor point.  We'll be adding up to 26 of these together.
               fTotal += u_kSpring[counter]*springDeltaLength;
      }
     }
    }
        
    float acceleration = fTotal/u_mass;
    float velocity = acceleration*u_dt + currentState.g;
    float position = velocity*u_dt + currentState.r;
    gl_FragColor = vec4(position,velocity,acceleration,1);

After I wrote that, I kept reading and found that a framebuffer doesn't access all layers of a sampler3D for writing at the same time. I need to somehow process 1 - 4 layers at a time.  I'm both unsure of how to do that, as well as make sure the gl_FragColor goes to the right pixel on the right layer.

I found this answer on SO:
https://stackoverflow.com/questions/49423476/render-to-3d-texture-webgl2
It demonstrates writing to multiple layers at a time in a framebuffer, but I'm not seeing how to equate this with the fragment shader, from one draw call, automatically running 1,000,000 times (100 x 100 x 100 ... (length x width x height)), each time populating the right pixel in a sampler3D with the position-velocity-acceleration data, which I can then flip-flop to use for the next iteration. 

I have no results yet.  I'm hoping to make a first sampler3D programatically, use it to generate new vertex data which is saved in a second sampler3D, and then switch textures and repeat.

# Answer

WebGL is destination based. That means it does 1 operation for each result it wants to write to the destination. The only kinds of destinations you can set are points (squares of pixels), lines, and triangles in a 2D plane. That means writing to a 3D texture will require handling each plane separately. At best you might be able to do N planes separately on where N is 4 to 8 by setting up multiple attachments to a framebuffer up to the maximum allowed attachments

So I'm assuming you understand how to render to 100 layers 1 at a time. At init time either make 100 framebuffers and attach different layer to each one. OR, at render time update a single framebuffer with a different attachment. Knowing how much validation happens I'd choose making 100 framebuffers

So

```
const framebuffers = [];
for (let layer = 0; layer < numLayers; ++layer) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, texture, 
    0, layer);
  framebuffers.push(fb);
}
```

now at render time render to each layer

```
framebuffers.forEach((fb, layer) => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  // pass in the layer number to the shader it can use for calculations
  gl.uniform1f(layerLocation, layer);
  ....
  gl.drawXXX(...);
});
```

WebGL1 does not support 3D textures so we know you're using WebGL2 since you mentioned using `sampler3D`.

In WebGL2 you generally use `#version 300 es` at the top of your shaders to signify you want to use the more modern GLSL ES 3.00.

Drawing to multiple layers requires first figuring out how many layers you want to render to. WebGL2 supports a minimum of 4 at once so we could just assume 4 layers. To do that you'd attach 4 layers to each framebuffer

```
const layersPerFramebuffer = 4;
const framebuffers = [];
for (let baseLayer = 0; baseLayer < numLayers; baseLayer += layersPerFramebuffer) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  for (let layer = 0; layer < layersPerFramebuffer; ++layer) {
    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + layer, texture, 0, baseLayer + layer);
  }
  framebuffers.push(fb);
}
```

GLSL ES 3.0 shaders do not use `gl_FragCoord` they use a user defined output so we'd declare an array output

```
out vec4 ourOutput[4];
```

and then use that just like you were previously using `gl_FragColor` except add an index. Below we're processing 4 layers. We're only passing in a vec2 for `v_texCoord` and computing the 3rd coordinate based on `baseLayerTexCoord`, something we pass in each draw call.

```
varying vec2 v_texCoord;
uniform float baseLayerTexCoord;

vec4 results[4];
vec3 onePixel = vec3(1.0, 1.0, 1.0)/u_textureSize;
const int numLayers = 4;
for (int layer = 0; layer < numLayers; ++layer) {
    vec3 baseTexCoord = vec3(v_texCoord, baseLayerTexCoord + onePixel * float(layer));
    vec4 currentState = texture(u_image, baseTexCoord);
    float fTotal = 0.0;
    for (int i=-1; i<=1; i++){
        for (int j=-1; j<=1; j++){
            for (int k=-1; k<=1; k++){
               if (i == 0 && j == 0 && k == 0) continue;
               vec3 neighborCoord = baseTexCoord + vec3(onePixel.x*float(i), onePixel.y*float(j), onePixel.z*float(k));
               vec4 neighborState;

               if (neighborCoord.x < 0.0 || neighborCoord.y < 0.0 || neighborCoord.z < 0.0 || neighborCoord.x >= 1.0 || neighborCoord.y >= 1.0 || neighborCoord.z >= 1.0){
                   neighborState = vec4(0.0,0.0,0.0,1.0);
               } else {
                   neighborState = texture(u_image, neighborCoord);
               }
               float deltaP =  neighborState.r - currentState.r;  //Distance from neighbor
               float springDeltaLength =  (deltaP - u_springOrigLength[counter]);

               //Add the force on our point of interest from the current neighbor point.  We'll be adding up to 26 of these together.
               fTotal += u_kSpring[counter]*springDeltaLength;
            }
        }
    }

    float acceleration = fTotal/u_mass;
    float velocity = acceleration*u_dt + currentState.g;
    float position = velocity*u_dt + currentState.r;
    results[layer] = vec4(position,velocity,acceleration,1);
}
ourOutput[0] = results[0];
ourOutput[1] = results[1];
ourOutput[2] = results[2];
ourOutput[3] = results[3];
```

The last thing to do is we need to call `gl.drawBuffers` to tell WebGL2 where to store the outputs. Since we're doing 4 layers at a time we'd use

```
gl.drawBuffers([
  gl.COLOR_ATTACHMENT0,
  gl.COLOR_ATTACHMENT1,
  gl.COLOR_ATTACHMENT2,
  gl.COLOR_ATTACHMENT3,
]);
framebuffers.forEach((fb, ndx) => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.uniform1f(baseLayerTexCoordLocation, (ndx * layersPerFramebuffer + 0.5) / numLayers);
  ....
  gl.drawXXX(...);
});
```

Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (!ext) {
        return alert('need EXT_color_buffer_float');
      }
      
      const vs = `#version 300 es
      in vec4 position;
      out vec2 v_texCoord;
      void main() {
        gl_Position = position;
        // position will be a quad -1 to +1 so we
        // can use that for our texcoords
        v_texCoord = position.xy * 0.5 + 0.5;
      }
      `;
      
      const fs = `#version 300 es
    precision highp float;
    in vec2 v_texCoord;
    uniform float baseLayerTexCoord;
    uniform highp sampler3D u_image;
    uniform mat3 u_kernel[3];

    out vec4 ourOutput[4];

    void main() {
      vec3 textureSize = vec3(textureSize(u_image, 0));
      vec3 onePixel = vec3(1.0, 1.0, 1.0)/textureSize;
      const int numLayers = 4;
      vec4 results[4];
      for (int layer = 0; layer < numLayers; ++layer) {
          vec3 baseTexCoord = vec3(v_texCoord, baseLayerTexCoord + onePixel * float(layer));
          float fTotal = 0.0;
          vec4 color;
          for (int i=-1; i<=1; i++){
              for (int j=-1; j<=1; j++){
                  for (int k=-1; k<=1; k++){
                     vec3 neighborCoord = baseTexCoord + vec3(onePixel.x*float(i), onePixel.y*float(j), onePixel.z*float(k));
                     color += u_kernel[k + 1][j + 1][i + 1] * texture(u_image, neighborCoord);
                  }
              }
          }

          results[layer] = color;
      }
      ourOutput[0] = results[0];
      ourOutput[1] = results[1];
      ourOutput[2] = results[2];
      ourOutput[3] = results[3];
    }
      `;
      const vs2 = `#version 300 es
      uniform vec4 position;
      uniform float size;
      void main() {
        gl_Position = position;
        gl_PointSize = size;
      }
      `;
      const fs2 = `#version 300 es
      precision highp float;
      uniform highp sampler3D u_image;
      uniform float slice;
      out vec4 outColor;
      void main() {
        outColor = texture(u_image, vec3(gl_PointCoord.xy, slice));
      }
      `;
      
      const computeProgramInfo = twgl.createProgramInfo(gl, [vs, fs]);
      const drawProgramInfo = twgl.createProgramInfo(gl, [vs2, fs2]);
      
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
        position: {
          numComponents: 2,
          data: [
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
          ],
        },
      });

      function create3DTexture(gl, size) {
        const tex = gl.createTexture();
        const data = new Float32Array(size * size * size * 4);
        for (let i = 0; i < data.length; i += 4) {
          data[i + 0] = i % 100 / 100;
          data[i + 1] = i % 10000 / 10000;
          data[i + 2] = i % 100000 / 100000;
          data[i + 3] = 1;
        }
        gl.bindTexture(gl.TEXTURE_3D, tex);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA32F, size, size, size, 0, gl.RGBA, gl.FLOAT, data);

        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return tex;
      }

      const size = 100;
      let inTex = create3DTexture(gl, size);
      let outTex = create3DTexture(gl, size);
      const numLayers = size;
      const layersPerFramebuffer = 4;
      
      function makeFramebufferSet(gl, tex) {
        const framebuffers = [];
        for (let baseLayer = 0; baseLayer < numLayers; baseLayer += layersPerFramebuffer) {
          const fb = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
          for (let layer = 0; layer < layersPerFramebuffer; ++layer) {
            gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + layer, tex, 0, baseLayer + layer);
          }
          framebuffers.push(fb);
        }
        return framebuffers;
      };
      
      let inFramebuffers = makeFramebufferSet(gl, inTex);
      let outFramebuffers = makeFramebufferSet(gl, outTex);

      function render() {
        gl.viewport(0, 0, size, size);
        gl.useProgram(computeProgramInfo.program);
        twgl.setBuffersAndAttributes(gl, computeProgramInfo, bufferInfo);

        outFramebuffers.forEach((fb, ndx) => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
          gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
            gl.COLOR_ATTACHMENT3,
          ]);

          const baseLayerTexCoord = (ndx * layersPerFramebuffer + 0.5) / numLayers;
          twgl.setUniforms(computeProgramInfo, {
            baseLayerTexCoord,
            u_kernel: [
              0, 0, 0,
              0, 0, 0,
              0, 0, 0,

              0, 0, 1,
              0, 0, 0,
              0, 0, 0,

              0, 0, 0,
              0, 0, 0,
              0, 0, 0,
            ],
            u_image: inTex,      
          });

          gl.drawArrays(gl.TRIANGLES, 0, 6);
        });

        {
          const t = inFramebuffers;
          inFramebuffers = outFramebuffers;
          outFramebuffers = t;
        }

        {
          const t = inTex;
          inTex = outTex;
          outTex = t;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.drawBuffers([gl.BACK]);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(drawProgramInfo.program);

        const slices = 10.0;
        const sliceSize = 25.0
        for (let slice = 0; slice < slices; ++slice) {
          const sliceZTexCoord = (slice / slices * size + 0.5) / size;
          twgl.setUniforms(drawProgramInfo, {
            position: [
              ((slice * (sliceSize + 1) + sliceSize * .5) / gl.canvas.width * 2) - 1,
              0,
              0,
              1,
            ],
            slice: sliceZTexCoord,
            size: sliceSize,
          });
          gl.drawArrays(gl.POINTS, 0, 1);
        }
        
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }

    main();


    function glEnumToString(gl, v) {
      const hits = [];
      for (const key in gl) {
        if (gl[key] === v) {
          hits.push(key);
        }
      }
      return hits.length ? hits.join(' | ') : `0x${v.toString(16)}`;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Some other things to note: In GLSL ES 3.00 you don't need to pass in a texture size as you can query the texture size with the function `textureSize`. It returns an `ivec2` or `ivec3` depending on the type of texture.

You can also use `texelFetch` instead of `texture`. `texelFetch` takes an integer texel coordinate and a mip level so for example `vec4 color = texelFetch(some3DTexture, ivec3(12, 23, 45), 0);` gets the texel at x = 12, y = 23, z = 45 from mip level 0.  That means you don't need to do the math about 'onePixel` you have in your code if you find it easier to work with pixels instead of normalized texture coordinates.
