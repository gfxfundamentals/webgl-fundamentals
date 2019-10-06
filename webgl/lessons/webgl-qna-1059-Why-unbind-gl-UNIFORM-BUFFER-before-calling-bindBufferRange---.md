Title: Why unbind gl.UNIFORM_BUFFER before calling bindBufferRange()?
Description:
TOC: qna

# Question:

From looking at some different examples in the wild, it seems that uploading data to a buffer, for use as a uniform buffer, does the following sequence:

1. bindBuffer()
2. bufferData()
3. bindBuffer() - with null, i.e. "unbinding"
4. bindBufferRange()

What is the purpose of step 3?

# Answer

You don’t need to do it in that order. 

Simplest example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    const vs = `#version 300 es
    void main() {
      gl_PointSize = 128.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;
    const fs = `#version 300 es
    precision mediump float;

    uniform Color {
      vec4 u_color;
    };

    out vec4 outColor;

    void main() {
      outColor = u_color;
    }
    `;

    const gl = document.querySelector('canvas').getContext('webgl2');
    if (!gl) alert('need webgl2');
    const program = twgl.createProgram(gl, [vs, fs]);

    const color = new Float32Array([1, 0.5, 0.7, 1]);
    const buffer = gl.createBuffer();

    // there's only 1 so I believe it's safe to guess index 0
    const uniformBlockIndex = 0;
    const uniformBlockBinding = 0;
    gl.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);


    // at render time
    gl.useProgram(program);

    // for each block
    {
      const uniformBlockBufferOffset = 0;
      const uniformBlockBufferOffsetByteLength = 16;  // 4 floats
      gl.bindBufferRange(gl.UNIFORM_BUFFER, uniformBlockBinding, buffer, uniformBlockBufferOffset, uniformBlockBufferOffsetByteLength);

      // set the data
      gl.bufferData(gl.UNIFORM_BUFFER, color, gl.DYNAMIC_DRAW);
    }


    gl.drawArrays(gl.POINTS, 0, 1);

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->


If you’d like to see a complex example you can dig through [this example](https://twgljs.org/examples/uniform-buffer-objects.html). It queries all the data about uniform buffers when the program is created. How many there are, what their names are, which uniforms they use, what the types of those uniforms are. This happens when you call `twgl.createProgramInfo` which you can [look inside](https://github.com/greggman/twgl.js/blob/a90ce8ef2083fd6185fa30cc8972aafc28cc68d7/src/programs.js#L1577) and see that info is created in [`createUniformBlockSpecFromProgram`](https://github.com/greggman/twgl.js/blob/a90ce8ef2083fd6185fa30cc8972aafc28cc68d7/src/programs.js#L1014)

Then later, using the block spec, you can create a typedarray with premade views into that array for all the uniforms by calling [`twgl.createUniformBlockInfo`](https://github.com/greggman/twgl.js/blob/a90ce8ef2083fd6185fa30cc8972aafc28cc68d7/src/programs.js#L1145)

    const ubi = twgl.createUniformBlockInfo(...)

You could set the uniform values in the typedarray through the views directly using

    ubi.uniforms.nameOfUniform.set(newValue)

but that would be brittle since blocks may get optimized out while debugging so instead you can use the less brittle

    twgl.setBlockUniforms(ubi, {nameOfUniform: newValue});

When you actually want the data in the typedarray to get uploaded to the GPU you call

    twgl.setUniformBlock(...);

Which both binds the uniform block to its assigned binding AND uploads the data to the GPU.

If you just want to bind an existing block (no need to upload new data) then

    twgl.bindUniformBlock(gl, programInfo, ubi);

The pattern though is as you see in the example

1. bindBufferRange
2. bufferData

bindBufferRange already binds the buffer so we can just use that binding to upload the data.

Test (non twgl)

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    'use strict';

    const vs = `#version 300 es
    void main() {
      gl_PointSize = 128.0;
      gl_Position = vec4(0, 0, 0, 1);
    }
    `;
    const fs = `#version 300 es
    precision mediump float;

    uniform Color1 {
      vec4 u_color1;
    };
    uniform Color2 {
      vec4 u_color2;
    };

    out vec4 outColor;

    void main() {
      outColor = u_color1 + u_color2;
    }
    `;

    const gl = document.querySelector('canvas').getContext('webgl2');
    if (!gl) alert('need webgl2');
    const program = twgl.createProgram(gl, [vs, fs]);

    const color1 = new Float32Array([1, 0, 0, 1]);
    const buffer1 = gl.createBuffer();
    const color2 = new Float32Array([0, 0, 1, 1]);
    const buffer2 = gl.createBuffer();

    // there's only 2 and they are the same format so we don't really
    // care which is which to see the results.
    const uniformBlockIndex = 0;
    const uniformBlockBinding = 0;
    gl.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);
    gl.uniformBlockBinding(program, uniformBlockIndex + 1, uniformBlockBinding + 1);


    // at render time
    gl.useProgram(program);

    {
      const uniformBlockBufferOffset = 0;
      const uniformBlockBufferOffsetByteLength = 16;  // 4 floats
      gl.bindBufferRange(gl.UNIFORM_BUFFER, uniformBlockBinding, buffer1, uniformBlockBufferOffset, uniformBlockBufferOffsetByteLength);

      // set the data
      gl.bufferData(gl.UNIFORM_BUFFER, color1, gl.DYNAMIC_DRAW);
      
      
      gl.bindBufferRange(gl.UNIFORM_BUFFER, uniformBlockBinding + 1, buffer2, uniformBlockBufferOffset, uniformBlockBufferOffsetByteLength);

      // set the data
      gl.bufferData(gl.UNIFORM_BUFFER, color2, gl.DYNAMIC_DRAW);
    }


    gl.drawArrays(gl.POINTS, 0, 1);

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/4.x/twgl-full.min.js"></script>

<!-- end snippet -->

The example above shows `bindBufferRange` does 2 things. 

1. it binds the buffer to the `UNIFORM_BUFFER` bind point
2. it binds a portion of the buffer to the uniform buffer index.

We know it worked because the result is purple. If it didn’t work it would either be red or blue

From the OpenGL ES 3.0 spec section 2.10.1.1 in relation to `bindBufferRange`

> Each target represents an indexed array of buffer object binding points, **as well
as a single general binding point that can be used by other buffer object manipulation functions**
