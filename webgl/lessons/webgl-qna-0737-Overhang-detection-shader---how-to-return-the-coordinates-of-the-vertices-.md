Title: Overhang detection shader - how to return the coordinates of the vertices?
Description:
TOC: qna

# Question:

I'm trying to write a support generation app in browser using three.js, I have tried many approaches and all of them were slow, so now I decided to make the shader compute the overhang position and my program build supports to those points.

The overhang detection shader outputs:
[![overhang detection][1]][1]


  [1]: https://i.stack.imgur.com/ZxRTA.png

Now the problem is I cannot figure out how to return those areas in red to the CPU /main JavaScript app to generate simple supports to those points,
I read somewhere here about a GPU CPU approach involving a FBO but can't understand this, is there any way to get the red areas coordinates back to CPU?

I could also calculate this in the vertex shader to update the position of non overhang vertices to be 0,0,0, but the problem is that the vertex position in three JavaScript doesn't update in that way, if there is some way to get updated vertex positions after vertex shader execution it could be a solution.

Maybe transform feedback? How can I use transform feedback from three.js?

# Answer

You can use other an FBO or transform feedback. With transform feedbackhe only problem is AFAICT  there is no way to discard vertices so like you mentioned the best you can do in that case is write some special value for non-overlapping vertices.

To use an FBO you make a floating point texture and check you can render to it. In WebGL1 that means enabling floating point textures, binding one to a framebuffer and calling checkFramebufferStatus. In WebGL 2 it means checking for and enabling `EXT_color_buffer_float` (and still calling checkFramebufferStatus)

You then make a buffer with just a count [0, 1, 2, 3, 4, 5, 6 etc.] use that to generate a `gl_Position` that will write to the next pixel in the FBO.

    // WebGL2 
    varying uint count; 
    uniform uint2 resolutionOfFBO;

    // compute output pixel
    uint x = count % resolutinOfFBO.x;
    uint y = count / resolutionOfFBO.x;

    // set gl_Position so we'll write to that output pixel
    gl_Position = vec4((vec2(x, y) + .5) / resolutionOfFBO, 0, 1);

Pass the data you want to write in a varying and write that data in the fragment shader. Then render with `POINTS`.

You can then read the data back with `gl.readPixels`

Explaining transform feedback seems a little long for this question but here's a simple example: The input is `[1, 2, 3]` and the output is `[2, 4, 6]`

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function main() {
      const gl = document.createElement("canvas").getContext("webgl2");
      
      const vs = `#version 300 es
        in float in_value;
        out float out_value;
        
        void main() {
           out_value = in_value * 2.;
        }
      `;
      const fs = `#version 300 es
        precision mediump float;
        layout (location = 0) out vec4 dummy;
        void main() {
          dummy = vec4(1);
        }
      `;
      const prog = createProgram(gl, [vs, fs], ["out_value"]);
      const inLoc = gl.getAttribLocation(prog, 'in_value');
      const outLoc = 0;  
      
      const numVaryings = gl.getProgramParameter(prog, gl.TRANSFORM_FEEDBACK_VARYINGS);

      const srcBuffer1 = createBuffer(gl, new Float32Array([1, 2, 3]));
      const srcVAO1 = createVAO(gl, srcBuffer1, inLoc);

      const dstBuffer = createBuffer(gl, Float32Array.BYTES_PER_ELEMENT * 3);
      const srcVAO2 = createVAO(gl, dstBuffer, inLoc);

      const tf = gl.createTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
      gl.useProgram(prog);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, dstBuffer);
      // this binds the default (id = 0) TRANSFORM_FEEBACK buffer
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      // This line is onky because of a bug in Chrome
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

      runFeedback(gl, prog, srcVAO1, tf);  
      checkGLError(gl);
      
      const result = new Float32Array(3);
      gl.bindBuffer(gl.ARRAY_BUFFER, dstBuffer);
      gl.getBufferSubData(gl.ARRAY_BUFFER, 0, result);
      log(result);
    }
    main();

    function runFeedback(gl, prog, srcVAO, tf, dstBufferInfo) {
      gl.enable(gl.RASTERIZER_DISCARD);

      gl.useProgram(prog);
      gl.bindVertexArray(srcVAO);
      
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
      gl.beginTransformFeedback(gl.TRIANGLES);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.endTransformFeedback();
      
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

      gl.disable(gl.RASTERIZER_DISCARD);
    }

    function checkGLError(gl) {
      const err = gl.getError();
      if (err) {
        log("GL ERROR:", err);
      }
    }

    function createShader(gl, shaderSource, shaderType) {
      var shader = gl.createShader(shaderType);
      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);
      var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!compiled) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createProgram(gl, shaderSources, outputs) {
      const shaderTypes = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER];
      const program = gl.createProgram();
      shaderSources.forEach(function(shaderSrc, ndx) {
        gl.attachShader(program, createShader(gl, shaderSrc, shaderTypes[ndx]));
      });
      
      if (outputs) {
        gl.transformFeedbackVaryings(program, outputs, gl.SEPARATE_ATTRIBS);
      }
      gl.linkProgram(program);

      var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!linked) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }
      return program;
    }
     
    function createBuffer(gl, dataOrSize) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, dataOrSize, gl.STATIC_DRAW);
      return buf;
    }

    function createVAO(gl, buf, inLoc) {
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(inLoc);
      gl.vertexAttribPointer(inLoc, 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);  // this is not needed
      gl.bindVertexArray(null);
      return vao;
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(' ');
      document.body.appendChild(elem);
    }



<!-- end snippet -->

The short explanation is with transform feedbacks your output varyings from your vertex shader are written to one or more buffers.

To do that you have to tell your shader program at link time what your outputs are with `gl.transformFeedbackVaryings`. 

Then you create a transform feedback object. A transform feedback object is very similar to a vertex array object except it's for outputs instead of inputs. You specify the outputs by calling `gl.bindBufferBase` for each output just like you'd call `gl.vertexAttribPointer` for each input on vertex array object.

To actually generate the output you probably want to tell WebGL not to run the fragment shader

    gl.enable(gl.RASTERIZER_DISCARD);

Then you bind your transform feedback object, turn on transform feedback and draw

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    gl.beginTransformFeedback(gl.TRIANGLES);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.endTransformFeedback();
 
When you link the program you can choose separate or interleaved attribtes. With separate each attribute can go to a different buffer but there's a limit on how many attributes you can write (min is at least 4). With interleaved all outputs get written but they are interleaved. For example if you were writing both positions and normals then the output would be 

    position0, normal0, position1, normal1, position2, normal2

all to the same buffer.
