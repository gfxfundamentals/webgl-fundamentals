Title: How to render individual pixels for one layer of a 3DTexture in a framebuffer?
Description:
TOC: qna

# Question:

I have a 4x4x4 3DTexture which I am initializing and showing correctly to color my 4x4x4 grid of vertices (see attached red grid with one white pixel - 0,0,0).

[![enter image description here][1]][1]

However when I render the 4 layers in a framebuffer (all four at one time using gl.COLOR_ATTACHMENT0 --> gl.COLOR_ATTACHMENT3, only four of the sixteen pixels on a layer are successfully rendered by my fragment shader (to be turned green).

[![enter image description here][2]][2]  

When I only do one layer, with gl.COLOR_ATTACHMENT0, the same 4 pixels show up correctly altered for the 1 layer, and the other 3 layers stay with the original color unchanged.  When I change the gl.viewport(0, 0, size, size) (size = 4 in this example), to something else like the whole screen, or different sizes than 4, then different pixels are written, but never more than 4.  My goal is to individually specify all 16 pixels of each layer precisely.  I'm using colors for now, as a learning experience, but the texture is really for position and velocity information for each vertex for a physics simulation. I'm assuming (faulty assumption?) with 64 points/vertices, that I'm running the vertex shader and the fragment shader 64 times each, coloring one pixel each invocation.

I've removed all but the vital code from the shaders.  I've left the javascript unaltered.  I suspect my problem is initializing and passing the array of vertex positions incorrectly.  

    //Set x,y position coordinates to be used to extract data from one plane of our data cube
    //remember, z we handle as a 1 layer of our cube which is composed of a stack of x-y planes. 
    const oneLayerVertices = new Float32Array(size * size * 2);
    count = 0; 
    for (var j = 0; j < (size); j++) {
     for (var i = 0; i < (size); i++) {
      oneLayerVertices[count] = i;
      count++;
       
      oneLayerVertices[count] = j;
      count++;
    
      //oneLayerVertices[count] = 0;
      //count++;
       
      //oneLayerVertices[count] = 0;
      //count++;
       
     }
    }
    
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
       position: {
          numComponents: 2,
          data: oneLayerVertices,
       },
    });

And then I'm using the bufferInfo as follows:


    gl.useProgram(computeProgramInfo.program);
       twgl.setBuffersAndAttributes(gl, computeProgramInfo, bufferInfo);
       
       gl.viewport(0, 0, size, size); //remember size = 4
       
       outFramebuffers.forEach((fb, ndx) => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
          gl.drawBuffers([
             gl.COLOR_ATTACHMENT0,
             gl.COLOR_ATTACHMENT1,
             gl.COLOR_ATTACHMENT2,
             gl.COLOR_ATTACHMENT3
          ]);
    
          const baseLayerTexCoord = (ndx * numLayersPerFramebuffer);
          console.log("My baseLayerTexCoord is "+baseLayerTexCoord);
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
             u_position: inPos,      
             u_velocity: inVel,      
             loopCounter: loopCounter,   
             
             numLayersPerFramebuffer: numLayersPerFramebuffer
          });
          gl.drawArrays(gl.POINTS, 0, (16));
       });

   

VERTEX SHADER: 
calc_vertex:

    const compute_vs = `#version 300 es
      precision highp float;
      in vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

FRAGMENT SHADER:
calc_fragment:

    const compute_fs = `#version 300 es
    precision highp float;
    
    out vec4 ourOutput[4];
    
    void main() {
       ourOutput[0] = vec4(0,1,0,1);
       ourOutput[1] = vec4(0,1,0,1);
       ourOutput[2] = vec4(0,1,0,1);
       ourOutput[3] = vec4(0,1,0,1);
    }
    `;


  [1]: https://i.stack.imgur.com/LpARC.png
  [2]: https://i.stack.imgur.com/HA3F2.png

# Answer

I’m not sure what you’re trying to do and what you think the positions will do.

You have 2 options for GPU simulation in WebGL2

1. use transform feedback.

   In this case you pass in attributes and generate data in buffers. Effectively you have in attributes and out attributes and generally you only run the vertex shader. To put it another way your varyings, the output of your vertex shader, get written to a buffer. So you have at least 2 sets of buffers, currentState, and nextState and your vertex shader reads attributes from currentState and writes them to nextState

   There is an example of writing to buffers via transform feedback [here](https://twgljs.org/examples/transform-feedback.html) though that example only uses transform feedback at the start to fill buffers once.

2. use textures attached to framebuffers

   in this case, similarly you have 2 textures, currentState, and nextState, You set nextState to be your render target and read from currentState to generate next state.

   the difficulty is that you can only render to textures by outputting primitives in the vertex shader. If currentState and nextState are 2D textures that’s trival. Just output a -1.0 to +1.0 quad from the vertex shader and all pixels in `nextState` will be rendered to. 

   If you’re using a 3D texture then same thing except you can only render to 4 layers at a time (well, `gl.getParameter(gl.MAX_DRAW_BUFFERS)`). so you’d have to do something like

    ```
    for(let layer = 0; layer < numLayers; layer += 4) {
       // setup framebuffer to use these 4 layers
       gl.drawXXX(...) // draw to 4 layers)
    }
    ```

  or better 

    ```
    // at init time
    const fbs = [];
    for(let layer = 0; layer < numLayers; layer += 4) {
       fbs.push(createFramebufferForThese4Layers(layer);
    }

    // at draw time
    fbs.forEach((fb, ndx) => {;
       gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
       gl.drawXXX(...) // draw to 4 layers)
    });
    ```

   I’m guessing multiple draw calls is slower than one draw call so another solution is to instead treat a 2D texture as a 3D array and calculate texture coordinates appropriately.

I don’t know which is better. If you’re simulating particles and they only need to look at their own currentState then transform feedback is easier. If need each particle to be able to look at the state of other particles, in other words you need random access to all the data, then your only option is to store the data in textures.

As for positions I don't understand your code. Positions define a primitives, either `POINTS`, `LINES`, or `TRIANGLES` so how does passing integer X, Y values into our vertex shader help you define `POINTS`, `LINES` or `TRIANGLES`?

It looks like you're trying to use `POINTS` in which case you need to set `gl_PointSize` to the size of the point you want to draw (1.0) and you need to convert those positions into clip space

```
gl_Position = vec4((position.xy + 0.5) / resolution, 0, 1);
```

where `resolution` is the size of the texture.

But doing it this way will be slow. Much better to just draw a full size (-1 to +1) clip space quad. For every pixel in the destination the fragment shader will be called. `gl_FragCoord.xy` will be the location of the center of the pixel currently being rendered so first pixel in bottom left corner `gl_FragCoord.xy` will be (0.5, 0.5). The pixel to the right of that will be (1.5, 0.5). The pixel to the right of that will be (2.5, 0.5). You can use that value to calculate how to access `currentState`. Assuming 1x1 mapping the easiest way would be

    int n = numberOfLayerThatsAttachedToCOLOR_ATTACHMENT0;
    vec4 currentStateValueForLayerN = texelFetch(
        currentStateTexture, ivec3(gl_FragCoord.xy, n + 0), 0);
    vec4 currentStateValueForLayerNPlus1 = texelFetch(
        currentStateTexture, ivec3(gl_FragCoord.xy, n + 1), 0);
    vec4 currentStateValueForLayerNPlus2 = texelFetch(
        currentStateTexture, ivec3(gl_FragCoord.xy, n + 2), 0);
    ...

    vec4 nextStateForLayerN = computeNextStateFromCurrentState(currentStateValueForLayerN);
    vec4 nextStateForLayerNPlus1 = computeNextStateFromCurrentState(currentStateValueForLayerNPlus1);
    vec4 nextStateForLayerNPlus2 = computeNextStateFromCurrentState(currentStateValueForLayerNPlus2);
    ...

    outColor[0] = nextStateForLayerN;
    outColor[1] = nextStateForLayerNPlus1;
    outColor[2] = nextStateForLayerNPlus1;
    ...

I don’t know if you needed this but just to test here’s a simple example that renders a different color to every pixel of a 4x4x4 texture and then displays them.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const pointVS = `
    #version 300 es

    uniform int size;
    uniform highp sampler3D tex;
    out vec4 v_color;

    void main() {
      int x = gl_VertexID % size;
      int y = (gl_VertexID / size) % size;
      int z = gl_VertexID / (size * size);
      
      v_color = texelFetch(tex, ivec3(x, y, z), 0);
      
      gl_PointSize = 8.0;
      
      vec3 normPos = vec3(x, y, z) / float(size); 
      gl_Position = vec4(
         mix(-0.9, 0.6, normPos.x) + mix(0.0,  0.3, normPos.y),
         mix(-0.6, 0.9, normPos.z) + mix(0.0, -0.3, normPos.y),
         0,
         1);
    }
    `;

    const pointFS = `
    #version 300 es
    precision highp float;

    in vec4 v_color;
    out vec4 outColor;

    void main() {
      outColor = v_color;
    }
    `;

    const rtVS = `
    #version 300 es
    in vec4 position;
    void main() {
      gl_Position = position;
    }
    `;

    const rtFS = `
    #version 300 es
    precision highp float;

    uniform vec2 resolution;
    out vec4 outColor[4];

    void main() {
      vec2 xy = gl_FragCoord.xy / resolution;
      outColor[0] = vec4(1, 0, xy.x, 1);
      outColor[1] = vec4(0.5, xy.yx, 1);
      outColor[2] = vec4(xy, 0, 1);
      outColor[3] = vec4(1, vec2(1) - xy, 1);
    }
    `;

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert('need webgl2');
      }
      
      const pointProgramInfo = twgl.createProgramInfo(gl, [pointVS, pointFS]);
      const rtProgramInfo = twgl.createProgramInfo(gl, [rtVS, rtFS]);
      
      const size = 4;
      const numPoints = size * size * size;
      const tex = twgl.createTexture(gl, {
        target: gl.TEXTURE_3D,
        width: size,
        height: size,
        depth: size,
      });
      
      const clipspaceFullSizeQuadBufferInfo = twgl.createBufferInfoFromArrays(gl, {
        position: {
          data: [
            -1, -1,
             1, -1,
            -1,  1,
            
            -1,  1,
             1, -1,
             1,  1,
          ],
          numComponents: 2,
        },
      });
      
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      for (let i = 0; i < 4; ++i) {
        gl.framebufferTextureLayer(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0 + i,
            tex,
            0, // mip level
            i, // layer
        );
      }
      
      gl.drawBuffers([
         gl.COLOR_ATTACHMENT0,
         gl.COLOR_ATTACHMENT1,
         gl.COLOR_ATTACHMENT2,
         gl.COLOR_ATTACHMENT3,
      ]);

      gl.viewport(0, 0, size, size);
      gl.useProgram(rtProgramInfo.program);
      twgl.setBuffersAndAttributes(
          gl,
          rtProgramInfo,
          clipspaceFullSizeQuadBufferInfo);
      twgl.setUniforms(rtProgramInfo, {
        resolution: [size, size],
      });
      twgl.drawBufferInfo(gl, clipspaceFullSizeQuadBufferInfo);
      
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.drawBuffers([
         gl.BACK,
      ]);
      
      gl.useProgram(pointProgramInfo.program);
      twgl.setUniforms(pointProgramInfo, {
        tex,
        size,
      });
      gl.drawArrays(gl.POINTS, 0, numPoints);
    }
    main();

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->


