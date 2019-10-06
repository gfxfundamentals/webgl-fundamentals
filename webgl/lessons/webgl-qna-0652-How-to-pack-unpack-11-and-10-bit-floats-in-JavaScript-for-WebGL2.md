Title: How to pack/unpack 11 and 10 bit floats in JavaScript for WebGL2
Description:
TOC: qna

# Question:

WebGL2 supports `UNSIGNED_INT_10F_11F_11F_REV` texture type where  floating point values are represented as unsigned 10 and 11 bit floats. How do I create the packed values and how can I unpack them back into floats?


# Answer

Here's some functions

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // Adapted from https://gamedev.stackexchange.com/a/17329/79
    var to11uf = (function() {
      const F11_EXPONENT_BITS = 0x1F
      const F11_EXPONENT_SHIFT = 6
      const F11_EXPONENT_BIAS = 15
      const F11_MANTISSA_BITS = 0x3f
      const F11_MANTISSA_SHIFT = (23 - F11_EXPONENT_SHIFT)
      const F11_MAX_EXPONENT = (F11_EXPONENT_BITS << F11_EXPONENT_SHIFT)

      const floatView = new Float32Array(1);
      const int32View = new Int32Array(floatView.buffer);

      return function(val) {
        floatView[0] = val;
        let f32 = int32View[0];
        let f11 = 0;
        /* Decode IEEE 754 little-endian 32-bit floating-point value */
        if (f32 & 0x80000000) {
          // negative values go to 0
          return 0;
        }
        /* Map exponent to the range [-127,128] */
        let exponent = ((f32 >> 23) & 0xff) - 127;
        let mantissa = f32 & 0x007fffff;
        if (exponent == 128) {
          /* Infinity or NaN */
          f11 = F11_MAX_EXPONENT;
          if (mantissa) {
            f11 |= (mantissa & F11_MANTISSA_BITS);
          }
        } else if (exponent > 15) {
          /* Overflow - flush to Infinity */
          f11 = F11_MAX_EXPONENT;
        } else if (exponent > -15) {
          /* Representable value */
          exponent += F11_EXPONENT_BIAS;
          mantissa >>= F11_MANTISSA_SHIFT;
          f11 = exponent << F11_EXPONENT_SHIFT | mantissa;
        } else {
            f11 = 0;
        }
        return f11;
      }
    }());

    // Adapted from http://gamedev.stackexchange.com/a/17329/79
    var to10uf = (function() {
      const F10_EXPONENT_BITS = 0x1F
      const F10_EXPONENT_SHIFT = 5
      const F10_EXPONENT_BIAS = 15
      const F10_MANTISSA_BITS = 0x1f
      const F10_MANTISSA_SHIFT = (23 - F10_EXPONENT_SHIFT)
      const F10_MAX_EXPONENT = (F10_EXPONENT_BITS << F10_EXPONENT_SHIFT)

      const floatView = new Float32Array(1);
      const int32View = new Int32Array(floatView.buffer);

      return function(val) {
        floatView[0] = val;
        let f32 = int32View[0];
        let f10 = 0;
        /* Decode IEEE 754 little-endian 32-bit floating-point value */
        if (f32 & 0x80000000) {
          // negative values go to 0
          return 0;
        }
        /* Map exponent to the range [-127,128] */
        let exponent = ((f32 >> 23) & 0xff) - 127;
        let mantissa = f32 & 0x007fffff;
        if (exponent == 128) {
          /* Infinity or NaN */
          f10 = F10_MAX_EXPONENT;
          if (mantissa) {
            f10 |= (mantissa & F10_MANTISSA_BITS);
          }
        } else if (exponent > 15) {
          /* Overflow - flush to Infinity */
          f10 = F10_MAX_EXPONENT;
        } else if (exponent > -15) {
          /* Representable value */
          exponent += F10_EXPONENT_BIAS;
          mantissa >>= F10_MANTISSA_SHIFT;
          f10 = exponent << F10_EXPONENT_SHIFT | mantissa;
        } else {
            f10 = 0;
        }
        return f10;
      }
    }());


    // From OpenGL ES 3.0 spec 2.1.3
    function from11uf(v) {
      const e = v >> 6;
      const m = v & 0x3F;
      if (e === 0) {
        if (m === 0) {
          return 0;
        } else {
          return Math.pow(2, -14) * (m / 64);
        }
      } else {
        if (e < 31) {
          return Math.pow(2, e - 15) * (1 + m / 64);
        } else {
          if (m === 0) {
            return 0;  // Inf
          } else {
            return 0;  // Nan
          }
        }
      }
    }

    // From OpenGL ES 3.0 spec 2.1.4
    function from10uf(v) {
      const e = v >> 5;
      const m = v & 0x1F;
      if (e === 0) {
        if (m === 0) {
          return 0;
        } else {
          return Math.pow(2, -14) * (m / 32);
        }
      } else {
        if (e < 31) {
          return Math.pow(2, e - 15) * (1 + m / 32);
        } else {
          if (m === 0) {
            return 0;  // Inf
          } else {
            return 0;  // Nan
          }
        }
      }
    }

    function rgb101111(r, g, b) {
      return (to11uf(r) <<  0) |
             (to11uf(g) << 11) |
             (to10uf(b) << 22);
    }


<!-- end snippet -->

and an example


<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    // Adapted from https://gamedev.stackexchange.com/a/17329/79
    var to11uf = (function() {
      const F11_EXPONENT_BITS = 0x1F
      const F11_EXPONENT_SHIFT = 6
      const F11_EXPONENT_BIAS = 15
      const F11_MANTISSA_BITS = 0x3f
      const F11_MANTISSA_SHIFT = (23 - F11_EXPONENT_SHIFT)
      const F11_MAX_EXPONENT = (F11_EXPONENT_BITS << F11_EXPONENT_SHIFT)

      const floatView = new Float32Array(1);
      const int32View = new Int32Array(floatView.buffer);

      return function(val) {
        floatView[0] = val;
        let f32 = int32View[0];
        let f11 = 0;
        /* Decode IEEE 754 little-endian 32-bit floating-point value */
        if (f32 & 0x80000000) {
          // negative values go to 0
          return 0;
        }
        /* Map exponent to the range [-127,128] */
        let exponent = ((f32 >> 23) & 0xff) - 127;
        let mantissa = f32 & 0x007fffff;
        if (exponent == 128) {
          /* Infinity or NaN */
          f11 = F11_MAX_EXPONENT;
          if (mantissa) {
            f11 |= (mantissa & F11_MANTISSA_BITS);
          }
        } else if (exponent > 15) {
          /* Overflow - flush to Infinity */
          f11 = F11_MAX_EXPONENT;
        } else if (exponent > -15) {
          /* Representable value */
          exponent += F11_EXPONENT_BIAS;
          mantissa >>= F11_MANTISSA_SHIFT;
          f11 = exponent << F11_EXPONENT_SHIFT | mantissa;
        } else {
            f11 = 0;
        }
        return f11;
      }
    }());

    // Adapted from http://gamedev.stackexchange.com/a/17329/79
    var to10uf = (function() {
      const F10_EXPONENT_BITS = 0x1F
      const F10_EXPONENT_SHIFT = 5
      const F10_EXPONENT_BIAS = 15
      const F10_MANTISSA_BITS = 0x1f
      const F10_MANTISSA_SHIFT = (23 - F10_EXPONENT_SHIFT)
      const F10_MAX_EXPONENT = (F10_EXPONENT_BITS << F10_EXPONENT_SHIFT)

      const floatView = new Float32Array(1);
      const int32View = new Int32Array(floatView.buffer);

      return function(val) {
        floatView[0] = val;
        let f32 = int32View[0];
        let f10 = 0;
        /* Decode IEEE 754 little-endian 32-bit floating-point value */
        if (f32 & 0x80000000) {
          // negative values go to 0
          return 0;
        }
        /* Map exponent to the range [-127,128] */
        let exponent = ((f32 >> 23) & 0xff) - 127;
        let mantissa = f32 & 0x007fffff;
        if (exponent == 128) {
          /* Infinity or NaN */
          f10 = F10_MAX_EXPONENT;
          if (mantissa) {
            f10 |= (mantissa & F10_MANTISSA_BITS);
          }
        } else if (exponent > 15) {
          /* Overflow - flush to Infinity */
          f10 = F10_MAX_EXPONENT;
        } else if (exponent > -15) {
          /* Representable value */
          exponent += F10_EXPONENT_BIAS;
          mantissa >>= F10_MANTISSA_SHIFT;
          f10 = exponent << F10_EXPONENT_SHIFT | mantissa;
        } else {
            f10 = 0;
        }
        return f10;
      }
    }());

    function rgb101111(r, g, b) {
      return (to11uf(r) <<  0) |
             (to11uf(g) << 11) |
             (to10uf(b) << 22);
    }

    function main() {
      const m4 = twgl.m4;
      const gl = document.querySelector("canvas").getContext("webgl2");
      if (!gl) {
        alert("your browsers/machine does not appear to support webgl2");
        return;  
      }
      
      const vs = `
         attribute vec4 position;
         attribute vec2 texcoord;

         uniform mat4 u_matrix;

         varying vec2 v_texcoord;

         void main() {
           gl_Position = u_matrix * position;
           v_texcoord = texcoord;
         }
      `;
      const fs = `
         precision mediump float;

         uniform sampler2D u_tex;

         varying vec2 v_texcoord;

         void main() {
           gl_FragColor = texture2D(u_tex, v_texcoord) * vec4(.1, 10, 1, 1);
         }
      `;
      
      const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
      const bufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);
      
      const size = 8;
      const data = new Uint32Array(size * size);
      for (let y = 0; y < size; ++y) {
        for (let x = 0; x < size; ++x) {
          const u = x / (size - 1);
          const v = y / (size - 1);
          data[y * size + x] = rgb101111(u * 10, v * .1, (x + y) % 2);
        }
      }
      
      var tex = twgl.createTexture(gl, {
        internalFormat: gl.R11F_G11F_B10F,
        format: gl.RGB,
        type: gl.UNSIGNED_INT_10F_11F_11F_REV,
        minMag: gl.NEAREST,
        src: data,
      });
      
      function render(time) {
        time *= 0.001;
        
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        gl.enable(gl.DEPTH_TEST);
        
        gl.useProgram(programInfo.program);
        
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var matrix = m4.perspective(Math.PI / 4, aspect, 1, 100);
        matrix = m4.translate(matrix, [0, 0, -3]);
        matrix = m4.rotateY(matrix, time);
        matrix = m4.rotateX(matrix, Math.PI / 10);
        
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, {
          u_matrix: matrix,
          u_tex: tex,
        });
        twgl.drawBufferInfo(gl, bufferInfo);
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }

    main();





<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height:100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <canvas></canvas>  

<!-- end snippet -->


