Title: WebGL: Simple Texture Rendering Issue ("Drawing to a destination rect smaller than the viewport rect.")
Description:
TOC: qna

# Question:

I am currently trying to render a simple texture with WebGL.
This is basically a port from normal system OpenGL.
It doesn't seem to work and I seriously have no idea what's wrong as it also seems very difficult to debug these thing.

I am getting an error on Firefox though:
"Error: WebGL: drawElements: Drawing to a destination rect smaller than the viewport rect. (This warning will only be given once)"

The viewport / projection matrix / positions seem to be correct so why am I getting that error?

    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <title>Test</title>
      <style>
      .canstyle {
        width: 800px;
        height: 600px;
      }
      </style>
    </head>
    <body>
      <canvas id="canvas0" class="canstyle">
      </canvas>
      <script type='text/javascript'>
      var vertexShaderSrc = `
                precision mediump float;

                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;

                uniform mat3 projectionMatrix;

                varying vec2 vTextureCoord;

                void main() {
                   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                   vTextureCoord = aTextureCoord;
                }
      `;

      var fragmentShaderSrc = `

              precision mediump float;

              varying vec2 vTextureCoord;

              uniform sampler2D uSampler;

              void main() {
                gl_FragColor = texture2D(uSampler, vTextureCoord);
              }
      `;

      var img1 = new Image(); // HTML5 Constructor
      img1.src = 'bunny.png';
      img1.alt = 'alt';
      img1.onload = function() {
        render();
      }

      function render() {
        var canvas = document.getElementById("canvas0");
        var gl = canvas.getContext("webgl", {
          alpha: false,
          depth: false,
          stencil: true,
          premultipliedAlpha: false
        });

        var funcs = Object.getOwnPropertyNames(gl.__proto__).filter(function(p) {
          return typeof gl[p] === 'function';
        });

        function HookFunction(func, callback) {
          return function() {
            var res = func.apply(this, arguments);
            callback(arguments);
            return res;
          };
        }

        var endFrame = false;
        var afterFrame = 8;
        funcs.forEach(function(funcName) {
          gl[funcName] = HookFunction(gl[funcName], function(args) {
            if (endFrame) {
              if (afterFrame == 0) {
                return;
              }
              afterFrame -= 1;
            }
            if (funcName == "drawElements") {
              endFrame = true;
            }
            var KK = [];
            var dumpArr = [];
            for (var item in args) {
              var arg = args[item];
              if (arg === null) {
                KK.push("null");
              } else if (arg instanceof ArrayBuffer || arg instanceof Float32Array || arg instanceof Uint8Array || arg instanceof Uint16Array) {
                dumpArr.push(new Uint8Array(arg.buffer));
              } else {
                KK.push(arg);
              }
            }
            console.log("WebGL Interceptor: ", funcName, "(", KK.join(', '), ")");
            if (dumpArr.length) {
              console.log(dumpArr);
            }

          });
        });

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.STENCIL_TEST);
        gl.enable(gl.BLEND);
        gl.enable(gl.SCISSOR_TEST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.viewport(0, 0, 800, 600);
        gl.scissor(0, 0, 800, 600);

        gl.clearColor(0.06274509803921569, 0.6, 0.7333333333333333, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        var vertexDataCount = 4;
        var vertexByteSize = vertexDataCount * 4;
        var BatchSize = 2000;

        var totalIndices = BatchSize * 6;

        var vertices = new ArrayBuffer(BatchSize * vertexByteSize * 4);
        var indices = new ArrayBuffer(totalIndices * 2);

        var indicesUint16View = new Uint16Array(indices);
        var verticesFloat32View = new Float32Array(vertices);

        var j = 0;
        for (var i = 0; i < totalIndices; i += 6, j += 4) {
          indicesUint16View[i + 0] = j + 0;
          indicesUint16View[i + 1] = j + 1;
          indicesUint16View[i + 2] = j + 2;
          indicesUint16View[i + 3] = j + 0;
          indicesUint16View[i + 4] = j + 2;
          indicesUint16View[i + 5] = j + 3;
        }

        var indexBuffer = gl.createBuffer();
        var vertexBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesUint16View, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, verticesFloat32View, gl.DYNAMIC_DRAW);

        function compileShader(shaderSource, shaderType) {
          var shader = gl.createShader(shaderType);
          gl.shaderSource(shader, shaderSource);
          gl.compileShader(shader);
          var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
          if (!success) {
            throw "could not compile shader:" + gl.getShaderInfoLog(shader);
          }
          return shader;
        }

        function createProgram(vertexShader, fragmentShader) {
          var program = gl.createProgram();
          gl.attachShader(program, vertexShader);
          gl.attachShader(program, fragmentShader);
          gl.linkProgram(program);
          var success = gl.getProgramParameter(program, gl.LINK_STATUS);
          if (!success) {
            throw ("program filed to link:" + gl.getProgramInfoLog(program));
          }
          return program;
        }

        var vertexShad = compileShader(vertexShaderSrc, gl.VERTEX_SHADER);
        var fragShad = compileShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);

        var shaderProg = createProgram(vertexShad, fragShad);
        gl.useProgram(shaderProg);

        var vertLoc = gl.getAttribLocation(shaderProg, "aVertexPosition");
        var texCoordLoc = gl.getAttribLocation(shaderProg, "aTextureCoord");

        gl.enableVertexAttribArray(vertLoc);
        gl.enableVertexAttribArray(texCoordLoc);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        gl.vertexAttribPointer(vertLoc, 2, gl.FLOAT, false, vertexByteSize, 0);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, vertexByteSize, 2 * 4);


        var currIndex = 0;
        verticesFloat32View[currIndex++] = 174; // pos
        verticesFloat32View[currIndex++] = 113; // pos
        verticesFloat32View[currIndex++] = 0; // UV
        verticesFloat32View[currIndex++] = 0; // UV

        verticesFloat32View[currIndex++] = 226; // pos
        verticesFloat32View[currIndex++] = 113; // pos
        verticesFloat32View[currIndex++] = 1; // UV
        verticesFloat32View[currIndex++] = 0; // UV

        verticesFloat32View[currIndex++] = 226; // pos
        verticesFloat32View[currIndex++] = 187; // pos
        verticesFloat32View[currIndex++] = 1; // UV
        verticesFloat32View[currIndex++] = 1; // UV

        verticesFloat32View[currIndex++] = 174; // pos
        verticesFloat32View[currIndex++] = 187; // pos
        verticesFloat32View[currIndex++] = 0; // UV
        verticesFloat32View[currIndex++] = 1; // UV

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, verticesFloat32View);

        // | 2 / Width | 0          | -1
        // | 0         | 2 / Height | -1
        // | 0         | 0          | 1
        var rawProjectionMat = new Float32Array([
          0.00249999994, 0, 0, 0, -0.00333333341, 0, -1, 1, 1
        ]);

        gl.uniformMatrix3fv(gl.getUniformLocation(shaderProg, "projectionMatrix"), false, rawProjectionMat);

        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.activeTexture(gl.TEXTURE0);

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img1);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

      }
      </script>
    </body>
    </html>

EDIT:
I am using the following image:
https://raw.githubusercontent.com/pixijs/examples/gh-pages/_assets/bunny.png

# Answer

I'm just guessing the issue is no where did you set the size of your canvas element's content.

The number of actual pixels in the canvas element defaults to 300x150. you can set that in HTML with 

    <canvas width="800" height="600"></canvas>

or you can set it in JavaScript with

    someCanvasElement.width = 800;
    someCanvasElement.height = 600;

Firefox is warning you that you set the viewport to 800x600 but it's larger than your canvas (300x150) which is very unusual and the warning was to help you notice the issue.

FYI: `gl.viewport` only does 2 things. It sets the conversion from clip space to screen space (or in this case canvas space) and it sets the clipping region for vertices. 'clipping vertices' means it does not clip pixels so drawing a `gl_PointSize = 10.0` point at the edge of the viewport setting will draw outside the viewport setting.

To clip pixels use the scissor test. I see you're setting up a scissor test but since you apparently want to draw to the edge of the canvas you don't need to setup the scissor at all.

