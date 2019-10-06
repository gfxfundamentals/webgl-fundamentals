Title: How do you convert to half floats in JavaScript?
Description:
TOC: qna

# Question:

I want to be able to use the `OES_texture_half_float` extension in WebGL and provide my own data but there's no `Float16Array` in JavaScript. So how do I generate half float data?

# Answer

I adapted these 2 functions to JavaScript. They seem to work

1. [From here](https://gamedev.stackexchange.com/a/17410/79)

        var toHalf = (function() {

          var floatView = new Float32Array(1);
          var int32View = new Int32Array(floatView.buffer);

          /* This method is faster than the OpenEXR implementation (very often
           * used, eg. in Ogre), with the additional benefit of rounding, inspired
           * by James Tursa?s half-precision code. */
          return function toHalf(val) {

            floatView[0] = val;
            var x = int32View[0];

            var bits = (x >> 16) & 0x8000; /* Get the sign */
            var m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
            var e = (x >> 23) & 0xff; /* Using int is faster here */

            /* If zero, or denormal, or exponent underflows too much for a denormal
             * half, return signed zero. */
            if (e < 103) {
              return bits;
            }

            /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
            if (e > 142) {
              bits |= 0x7c00;
              /* If exponent was 0xff and one mantissa bit was set, it means NaN,
                   * not Inf, so make sure we set one mantissa bit too. */
              bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
              return bits;
            }

            /* If exponent underflows but not too much, return a denormal */
            if (e < 113) {
              m |= 0x0800;
              /* Extra rounding may overflow and set mantissa to 0 and exponent
               * to 1, which is OK. */
              bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
              return bits;
            }

            bits |= ((e - 112) << 10) | (m >> 1);
            /* Extra rounding. An overflow will set mantissa to 0 and increment
             * the exponent, which is OK. */
            bits += m & 1;
            return bits;
          };

        }());

2. [From here](https://stackoverflow.com/a/6162687/128511)

        var toHalf = (function() {

          var floatView = new Float32Array(1);
          var int32View = new Int32Array(floatView.buffer);

          return function toHalf( fval ) {
            floatView[0] = fval;
            var fbits = int32View[0];
            var sign  = (fbits >> 16) & 0x8000;          // sign only
            var val   = ( fbits & 0x7fffffff ) + 0x1000; // rounded value

            if( val >= 0x47800000 ) {             // might be or become NaN/Inf
              if( ( fbits & 0x7fffffff ) >= 0x47800000 ) {
                                                  // is or must become NaN/Inf
                if( val < 0x7f800000 ) {          // was value but too large
                  return sign | 0x7c00;           // make it +/-Inf
                }
                return sign | 0x7c00 |            // remains +/-Inf or NaN
                    ( fbits & 0x007fffff ) >> 13; // keep NaN (and Inf) bits
              }
              return sign | 0x7bff;               // unrounded not quite Inf
            }
            if( val >= 0x38800000 ) {             // remains normalized value
              return sign | val - 0x38000000 >> 13; // exp - 127 + 15
            }
            if( val < 0x33000000 )  {             // too small for subnormal
              return sign;                        // becomes +/-0
            }
            val = ( fbits & 0x7fffffff ) >> 23;   // tmp exp for subnormal calc
            return sign | ( ( fbits & 0x7fffff | 0x800000 ) // add subnormal bit
                 + ( 0x800000 >>> val - 102 )     // round depending on cut off
                 >> 126 - val );                  // div by 2^(1-(exp-127+15)) and >> 13 | exp=0
          };
        }());

Example usage

    var tex = new Uint16Array(4);
    tex[0] = toHalf(0.5);
    tex[1] = toHalf(1);
    tex[2] = toHalf(123);
    tex[3] = toHalf(-13);

Here's an example using the first one with WebGL

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var toHalf = (function() {

      var floatView = new Float32Array(1);
      var int32View = new Int32Array(floatView.buffer);

      /* This method is faster than the OpenEXR implementation (very often
       * used, eg. in Ogre), with the additional benefit of rounding, inspired
       * by James Tursa?s half-precision code. */
      return function toHalf(val) {

        floatView[0] = val;
        var x = int32View[0];

        var bits = (x >> 16) & 0x8000; /* Get the sign */
        var m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
        var e = (x >> 23) & 0xff; /* Using int is faster here */

        /* If zero, or denormal, or exponent underflows too much for a denormal
         * half, return signed zero. */
        if (e < 103) {
          return bits;
        }

        /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
        if (e > 142) {
          bits |= 0x7c00;
          /* If exponent was 0xff and one mantissa bit was set, it means NaN,
                       * not Inf, so make sure we set one mantissa bit too. */
          bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
          return bits;
        }

        /* If exponent underflows but not too much, return a denormal */
        if (e < 113) {
          m |= 0x0800;
          /* Extra rounding may overflow and set mantissa to 0 and exponent
           * to 1, which is OK. */
          bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
          return bits;
        }

        bits |= ((e - 112) << 10) | (m >> 1);
        /* Extra rounding. An overflow will set mantissa to 0 and increment
         * the exponent, which is OK. */
        bits += m & 1;
        return bits;
      };

    }());

    (function() {
      twgl.setAttributePrefix("a_");
      var m4 = twgl.m4;
      var gl = document.getElementById("c").getContext("webgl");
      var ext =  gl.getExtension("OES_texture_half_float");
      if (!ext) {
        alert("no support for OES_texture_half_float on this device");
        return;
      }
      var onePointProgramInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

      var shapes = [
        twgl.primitives.createCubeBufferInfo(gl, 2),
      ];

      function rand(min, max) {
        if (max === undefined) {
          max = min;
          min = 0;
        }
        return min + Math.random() * (max - min);
      }

      // Shared values
      var baseHue = rand(360);
      var lightWorldPosition = [1, 8, -10];
      var lightColor = [1, 1, 1, 1];
      var camera = m4.identity();
      var view = m4.identity();
      var viewProjection = m4.identity();

      var halfFloatData = new Uint16Array(4);

      // will divide by 400 in shader to prove it works.
      halfFloatData[0] = toHalf(100);  
      halfFloatData[1] = toHalf(200);
      halfFloatData[2] = toHalf(300);
      halfFloatData[3] = toHalf(400);

      var textures = twgl.createTextures(gl, {
        // A 2x2 pixel texture from a JavaScript array
        checker: {
          // Note: You need OES_texture_half_float_linear to use anything other than NEAREST
          mag: gl.NEAREST,
          min: gl.NEAREST,
          format: gl.LUMINANCE,
          type: ext.HALF_FLOAT_OES,
          src: halfFloatData,
        },
      });

      var objects = [];
      var drawObjects = [];
      var numObjects = 100;
      for (var ii = 0; ii < numObjects; ++ii) {
        var uniforms;
        var programInfo;
        var shape;
        shape = shapes[ii % shapes.length];
        programInfo = onePointProgramInfo;
        uniforms = {
          u_diffuse: textures.checker,
          u_worldViewProjection: m4.identity(),
        };
        drawObjects.push({
          programInfo: programInfo,
          bufferInfo: shape,
          uniforms: uniforms,
        });
        objects.push({
          translation: [rand(-10, 10), rand(-10, 10), rand(-10, 10)],
          ySpeed: rand(0.1, 0.3),
          zSpeed: rand(0.1, 0.3),
          uniforms: uniforms,
        });
      }

      function render(time) {
        time *= 0.001;
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.2, 0.3, 0.8, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var radius = 20;
        var orbitSpeed = time * 0.1;
        var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 100);
        var eye = [Math.cos(orbitSpeed) * radius, 4, Math.sin(orbitSpeed) * radius];
        var target = [0, 0, 0];
        var up = [0, 1, 0];

        m4.lookAt(eye, target, up, camera);
        m4.inverse(camera, view);
        m4.multiply(projection, view, viewProjection);

        objects.forEach(function(obj) {
          var uni = obj.uniforms;
          var world = m4.identity(world);
          m4.rotateY(world, time * obj.ySpeed, world);
          m4.rotateZ(world, time * obj.zSpeed, world);
          m4.translate(world, obj.translation, world);
          m4.rotateX(world, time, world);
          m4.multiply(viewProjection, world, uni.u_worldViewProjection);
        });

        twgl.drawObjectList(gl, drawObjects);

        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);
    }());

<!-- language: lang-css -->

    body {
      margin: 0;
      font-family: monospace;
    }
    canvas {
      width: 100vw;
      height: 100vh;
      display: block;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas id="c"></canvas>
    <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;

    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    varying vec4 v_position;
    varying vec2 v_texCoord;

    void main() {
      v_texCoord = a_texcoord;
      gl_Position = u_worldViewProjection * a_position;
    }
    </script>
    <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_texCoord;
    uniform sampler2D u_diffuse;

    void main() {
      gl_FragColor = texture2D(u_diffuse, v_texCoord) / vec4(400.0, 400.0, 400.0, 1.0);
    }
    </script>

<!-- end snippet -->

---

Note that while this works if you're uploading image textures it's probably better to do this conversion offline. You can then store them as binary and download with XMLHttpRequest. You can compress them with gzip (about the same as png) and as long as your server sends the correct headers telling the browser the file has been gzipped it should be decompressed automatically for you.
