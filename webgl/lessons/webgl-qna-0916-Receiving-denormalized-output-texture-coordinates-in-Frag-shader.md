Title: Receiving denormalized output texture coordinates in Frag shader
Description:
TOC: qna

# Question:

**Update**

See rationale at the end of my question below
*****
Using `WebGL2` I can access a texel by its denormalized coordinates (sorry don't the right lingo for this). That means I don't have to scale them down to 0-1 like I do in `texture2D()`.
However the input to the fragment shader is still the `vec2/3` in normalized values.

Is there a way to declare in/out variables in the Vertex and Frag shaders so that I don't have to scale the coordinates?

somewhere in vertex shader:

    ...
    out vec2 TextureCoordinates;

somewhere in frag shader:

    ...
    in vec2 TextureCoordinates;

I would like for `TextureCoordinates` to be `ivec2` and already scaled.

This question and all my other questions on webgl related to general computing using WebGL. We are trying to do tensor (multi-D matrix) operations using WebGL.

We map our data in a few ways to a Texture. The simplest approach we follow is -- assuming we can access our data as a flat array -- to lay it out along the texture's width and go up the texture's height until we're done.

Since our thinking, logic, and calculations are all based on tensor/matrix indices -- inside the fragment shader -- we'd have to map back to/from the X-Y texture coordinates to indices. The intermediate step here is to calculate an offset for a given position of a texel. Then from that offset we can calculate the matrix indices from its strides.

Calculating an offset in webgl 1 for very large textures seems to be taking much longer than webgl2 using the integer coordinates. See below:

**WebGL 1 offset calculation**

      int coordsToOffset(vec2 coords, int width, int height) {
        float s = coords.s * float(width);
        float t = coords.t * float(height);
        int offset = int(t) * width + int(s);
        return offset;
      }
      vec2 offsetToCoords(int offset, int width, int height) {
        int t = offset / width;
        int s = offset - t*width;
        vec2 coords = (vec2(s,t) + vec2(0.5,0.5)) / vec2(width, height);
        return coords;
      }

**WebGL 2 offset calculation in the presence of int coords**

    int coordsToOffset(ivec2 coords, int width) {
        return coords.t * width + coords.s;
    }
    ivec2 offsetToCoords(int offset, int width) {
      int t = offset / width;
      int s = offset - t*width;
      return ivec2(s,t);
    }

It should be clear that for a series of large texture operations we're saving hundreds of thousands of operations just on the offset/coords calculation.

# Answer

It's not clear why you want do what you're trying to do. It would be better to ask something like "I'm trying to draw an image/implement post processing glow/do ray tracing/... and to do that I want to use un-normalized texture coordinates because <reason>" and then we can tell you if your solution is going to work and how to solve it.

In any case, passing `int` or `unsigned int` or `ivec2/3/4` or `uvec2/3/4` as a varying is supported but **not interpolation**. You have to declare them as `flat`.

Still, you can pass un-normalized values as `float` or `vec2/3/4` and the convert to `int`, `ivec2/3/4` in the fragment shader.

The other issue is you'll get no sampling using `texelFetch`, the function that takes texel coordinates instead of normalized texture coordinates. It just returns the exact value of a single pixel. It does not support filtering like the normal `texture` function.

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.querySelector('canvas').getContext('webgl2');
      if (!gl) {
        return alert("need webgl2");
      }
      
      const vs = `
       #version 300 es
       in vec4 position;
       in ivec2 texelcoord;
       
       out vec2 v_texcoord;
       
       void main() {
          v_texcoord = vec2(texelcoord);
          gl_Position = position;
       }
      `;
      
      const fs = `
      #version 300 es
      precision mediump float;
      in vec2 v_texcoord;
      out vec4 outColor;
      uniform sampler2D tex;
      
      void main() {
        outColor = texelFetch(tex, ivec2(v_texcoord), 0);
      }
      `;
      
      // compile shaders, link program, look up locations
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      
      // create buffers via gl.createBuffer, gl.bindBuffer, gl.bufferData)
      const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
        position: {
          numComponents: 2,
          data: [
          -.5, -.5,
           .5, -.5,
            0,  .5,
          ],
        },
        texelcoord: {
          numComponents: 2,
          data: new Int32Array([
            0,  0,
           15,  0,
            8, 15,
          ]),
        }
      });
      
      // make a 16x16 texture
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = 16;
      ctx.canvas.height = 16;
      for (let i = 23; i > 0; --i) {
        ctx.fillStyle = `hsl(${i / 23 * 360 | 0}, 100%, ${i % 2 ? 25 : 75}%)`;
        ctx.beginPath();
        ctx.arc(8, 15, i, 0, Math.PI * 2, false);
        ctx.fill();
      }
      const tex = twgl.createTexture(gl, { src: ctx.canvas });
      
      gl.useProgram(programInfo.program);
      
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      // no need to set uniforms since they default to 0
      // and only one texture which is already on texture unit 0
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    main();

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

So in response to your updated question it's still not clear what you want to do. Why do you want to pass varyings to the fragment shader? Can't you just do whatever math you want in the fragment shader itself?

Example:

    uniform sampler2D tex;
    out float result;

    // some all the values in the texture
    vec4 sum4 = vec4(0);
    ivec2 texDim = textureSize(tex, 0);
    for (int y = 0; y < texDim.y; ++y) {
      for (int x = 0; x < texDim.x; ++x) {
        sum4 += texelFetch(tex, ivec2(x, y), 0);
      }
    }
    result = sum4.x + sum4.y + sum4.z + sum4.w;

Example2

    uniform isampler2D indices;
    uniform sampler2D data;

    out float result;

    // some only values in data pointed to by indices
    vec4 sum4 = vec4(0);
    ivec2 texDim = textureSize(indices, 0);
    for (int y = 0; y < texDim.y; ++y) {
      for (int x = 0; x < texDim.x; ++x) {
        ivec2 index = texelFetch(indices, ivec2(x, y), 0).xy;
        sum4 += texelFetch(tex, index, 0);
      }
    }
    result = sum4.x + sum4.y + sum4.z + sum4.w;

Note that I'm also not an expert in GPGPU but I have an hunch the code above is not the fastest way because I believe parallelization happens based on output. The code above has only 1 output so no parallelization? It would be easy to change so that it takes a block ID, tile ID, area ID as input and computes just the sum for that area. Then you'd write out a larger texture with the sum of each block and finally sum the block sums.

Also, dependant and non-uniform texture reads are a known perf issue. The first example reads the texture in order. That's cache friendly. The second example reads the texture in a random order (specified by indices), that's not cache friendly.


