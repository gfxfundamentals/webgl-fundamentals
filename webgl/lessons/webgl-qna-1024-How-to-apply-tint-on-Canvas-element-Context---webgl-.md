Title: How to apply tint on Canvas element(Context - webgl)
Description:
TOC: qna

# Question:

I want to apply tint on my image which is loaded into canvas using library glfx.js which makes use of webgl.

In the code below I'm making changes to warmth brightness in fragment shader of webgl. Now for tint i need to change the rgba in fragment shader. How exactly I'm supposed to do that!!
Below is my test function whicj performs this action:

    test = (imgID, pro) => {
        const image = new Image();
        image.src = pro.allImageElement[1].currentSrc;
        image.onload = function () {
          const canvas = document.getElementById(imgID);
          /*  canvas.width = image.naturalWidth;
           canvas.height = image.naturalHeight; */
       
         const gl = canvas.getContext('webgl');
       
         gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
         gl.clearColor(1.0, 0.8, 0.1, 1.0);
         gl.clear(gl.COLOR_BUFFER_BIT);
       
         const vertShaderSource = `
           attribute vec2 position;
       
           varying vec2 texCoords;
       
           void main() {
             texCoords = (position + 1.0) / 2.0;
             texCoords.y = 1.0 - texCoords.y;
             gl_Position = vec4(position, 0, 1.0);
           }
         `;
       
         const fragShaderSource = `
           precision highp float;
       
           varying vec2 texCoords;
       
           uniform sampler2D textureSampler;
       
           void main() {
             float warmth = 1.0;
             float brightness = 0.2;
       
             vec4 color = texture2D(textureSampler, texCoords);
       
             color.r += warmth;
             color.b -= warmth;
       
            color.rgb += brightness;
       
             gl_FragColor = color;
           }
         `;
       
         const vertShader = gl.createShader(gl.VERTEX_SHADER);
         const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
       
         gl.shaderSource(vertShader, vertShaderSource);
         gl.shaderSource(fragShader, fragShaderSource);
       
         gl.compileShader(vertShader);
         gl.compileShader(fragShader);
       
         const program = gl.createProgram();
         gl.attachShader(program, vertShader);
         gl.attachShader(program, fragShader);
       
         gl.linkProgram(program);
       
         gl.useProgram(program);
       
         const vertices = new Float32Array([
           -1, -1,
           -1, 1,
           1, 1,
       
           -1, -1,
           1, 1,
           1, -1,
         ]);
       
         const vertexBuffer = gl.createBuffer();
         gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
         gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
       
         const positionLocation = gl.getAttribLocation(program, 'position');
       
         gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
         gl.enableVertexAttribArray(positionLocation);
         const texture = gl.createTexture();
         gl.activeTexture(gl.TEXTURE0);
         gl.bindTexture(gl.TEXTURE_2D, texture);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
         gl.drawArrays(gl.TRIANGLES, 0, 6);
        }   
      }

Can someone help me with this

# Answer

There's 1000s of ways to change the colors so it's hard to pick one. You could just do

    vec3 tint = vec3(1, 0.8, 0.5);  // reddish
 
    color.rgb *= tint;

as one example. Your code has no uniforms. Normally instead of hard coding `warmth` and `brightness` (and `tint`) you'd make them uniforms so you can set them at runtime. If you don't know how to do that you should [read some tutorials on WebGL](https://webglfundamentals.org).

Other ways include [using a color matrix](https://docs.rainmeter.net/tips/colormatrix-guide/) or [a 3D Lookup Table](https://threejsfundamentals.org/threejs/lessons/threejs-post-processing-3dlut.html) or basically any math you can imagine to manipulate the color values.

note: the code you posted doesn't seem to be using any libraries at all. It looks like raw WebGL. In fact minus the first and last lines it should run given an image url

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const image = new Image();
    image.src = 'https://i.imgur.com/CwQSMv9.jpg';
    image.crossOrigin = 'anonymous';
    image.onload = function() {
      const canvas = document.querySelector('canvas');
      /*  canvas.width = image.naturalWidth;
       canvas.height = image.naturalHeight; */

      const gl = canvas.getContext('webgl');

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(1.0, 0.8, 0.1, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const vertShaderSource = `
           attribute vec2 position;

           varying vec2 texCoords;

           void main() {
             texCoords = (position + 1.0) / 2.0;
             texCoords.y = 1.0 - texCoords.y;
             gl_Position = vec4(position, 0, 1.0);
           }
         `;

      const fragShaderSource = `
           precision highp float;

           varying vec2 texCoords;

           uniform sampler2D textureSampler;

           void main() {
             float warmth = 1.0;
             float brightness = 0.2;

             vec4 color = texture2D(textureSampler, texCoords);

             color.r += warmth;
             color.b -= warmth;

            color.rgb += brightness;

             gl_FragColor = color;
           }
         `;

      const vertShader = gl.createShader(gl.VERTEX_SHADER);
      const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

      gl.shaderSource(vertShader, vertShaderSource);
      gl.shaderSource(fragShader, fragShaderSource);

      gl.compileShader(vertShader);
      gl.compileShader(fragShader);

      const program = gl.createProgram();
      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);

      gl.linkProgram(program);

      gl.useProgram(program);

      const vertices = new Float32Array([-1, -1, -1, 1,
        1, 1,

        -1, -1,
        1, 1,
        1, -1,
      ]);

      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'position');

      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionLocation);
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->


