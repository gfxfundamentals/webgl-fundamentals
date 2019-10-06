Title: Add a background gradients to a foreground with animated geometry?
Description:
TOC: qna

# Question:

**Preface:** There is this inspiring poster I ran across which showcases trending gradients:


**Goal:** I'd like to make a scene where I have animating geometry and a background of one of these gradients.

**Problem:** I've made and [animated geometry][2].  And I've found posts around making [gradients][3]. However, I'm not sure how to combine the two into one scene?

**Question:**  How to create a scene that has a gradient background (using fragment shader?) and some foreground geometry that is in motion?

[![trending gradients][1]][1]

Note: Any of these gradients will do duotone is prob the easiest to create.  I'm going to post this question up now; however, in the mean time I'm gonna try to make a scene with just a duotone gradient; Hopefully someone beats me to the punch!


Here's the starting scene:

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    var gl,
        shaderProgram,
        vertices,
        matrix = mat4.create(),
        vertexCount,
        indexCount,
        q = quat.create(),
        translate =[-3, 0, -10],
        scale = [1,1,1],
        pivot = [0,0,0];
        
        translate2 = [0, 0, -8],
        scale2 = [3,3,3],
        pivot2 = [1,1,1]


    initGL();
    createShaders();
    createVertices();
    draw();

    function initGL() {
      var canvas = document.getElementById("canvas");
      gl = canvas.getContext("webgl");
      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(1, 1, 1, 1);
    }

    function createShaders() {
      var vertexShader = getShader(gl, "shader-vs");
      var fragmentShader = getShader(gl, "shader-fs");

      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);
      gl.useProgram(shaderProgram);
    }

    function createVertices() {
    vertices = [
      [-1, -1, -1,     1, 0, 0, 1],     // 0
      [ 1, -1, -1,     1, 1, 0, 1],     // 1
      [-1,  1, -1,     0, 1, 1, 1],     // 2
      [ 1,  1, -1,     0, 0, 1, 1],     // 3
      [-1,  1,  1,     1, 0.5, 0, 1],   // 4
      [1,  1,  1,      0.5, 1, 1, 1],   // 5
      [-1, -1,  1,     1, 0, 0.5, 1],   // 6
      [1, -1,  1,      0.5, 0, 1, 1],   // 7
    ];

    var normals = [
      [0, 0, 1], [0, 1, 0], [0, 0, -1],
      [0, -1, 0], [-1, 0, 0], [1, 0, 0] ];

    var indices = [
      [0, 1, 2,   1, 2, 3],
      [2, 3, 4,   3, 4, 5],
      [4, 5, 6,   5, 6, 7],
      [6, 7, 0,   7, 0, 1],
      [0, 2, 6,   2, 6, 4],
      [1, 3, 7,   3, 7, 5]
    ];

    var attributes = []
    for(let side=0; side < indices.length; ++side) {
        for(let vi=0; vi < indices[side].length; ++vi) {
            attributes.push(...vertices[indices[side][vi]]);
            attributes.push(...normals[side]);
        }
    }

      vertexCount = attributes.length / 10;

      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attributes), gl.STATIC_DRAW);

      var coords = gl.getAttribLocation(shaderProgram, "coords");
      gl.vertexAttribPointer(coords, 3, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 10, 0);
      gl.enableVertexAttribArray(coords); 

      var colorsLocation = gl.getAttribLocation(shaderProgram, "colors");
      gl.vertexAttribPointer(colorsLocation, 4, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 10, Float32Array.BYTES_PER_ELEMENT * 3);
      gl.enableVertexAttribArray(colorsLocation);

      var normalLocation = gl.getAttribLocation(shaderProgram, "normal");
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 10, Float32Array.BYTES_PER_ELEMENT * 7);
      gl.enableVertexAttribArray(normalLocation);  
      
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      
      var lightColor = gl.getUniformLocation(shaderProgram, "lightColor");
      gl.uniform3f(lightColor, 1, 1, 1);
      
      var lightDirection = gl.getUniformLocation(shaderProgram, "lightDirection");
      gl.uniform3f(lightDirection, 0.5, 0.5, -1);


      var perspectiveMatrix = mat4.create();
      mat4.perspective(perspectiveMatrix, 1, canvas.width / canvas.height, 0.1, 11);
      var perspectiveLoc = gl.getUniformLocation(shaderProgram, "perspectiveMatrix");
      gl.uniformMatrix4fv(perspectiveLoc, false, perspectiveMatrix);

    }

    function draw(timeMs) {
      requestAnimationFrame(draw);

      let interval = timeMs / 3000
      let t = interval - Math.floor(interval); 

      let trans_t = vec3.lerp([], translate, translate2, t);
      let scale_t = vec3.lerp([], scale, scale2, t);
      let pivot_t = vec3.lerp([], pivot, pivot2, t);
      let quat_t = quat.slerp(quat.create(), q, [1,0,1,1], t /2);
      mat4.fromRotationTranslationScaleOrigin(matrix, quat_t, trans_t, scale_t, pivot_t);

      var transformMatrix = gl.getUniformLocation(shaderProgram, "transformMatrix");
      gl.uniformMatrix4fv(transformMatrix, false, matrix);
      gl.clear(gl.COLOR_BUFFER_BIT);

      //gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_BYTE, 0);
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    }


      /*
       * https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
       */
      function getShader(gl, id) {
        var shaderScript, theSource, currentChild, shader;

        shaderScript = document.getElementById(id);

        if (!shaderScript) {
          return null;
        }

        theSource = "";
        currentChild = shaderScript.firstChild;

        while (currentChild) {
          if (currentChild.nodeType == currentChild.TEXT_NODE) {
            theSource += currentChild.textContent;
          }

          currentChild = currentChild.nextSibling;
        }
        if (shaderScript.type == "x-shader/x-fragment") {
          shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
          shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
          // Unknown shader type
          return null;
        }
        gl.shaderSource(shader, theSource);

    // Compile the shader program
        gl.compileShader(shader);

    // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
          return null;
        }

        return shader;
      }

<!-- language: lang-html -->

    <canvas id="canvas" width="600" height="600"></canvas>
    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.3.2/gl-matrix-min.js"></script>

    <script id="shader-vs" type="x-shader/x-vertex">
    attribute vec4 coords;
    uniform mat4 transformMatrix;
    attribute vec3 normal;
    attribute vec4 colors;
    uniform vec3 lightColor;
    uniform vec3 lightDirection;
    varying vec4 varyingColors;
    uniform mat4 perspectiveMatrix;
    void main(void) {
        vec3 norm = normalize(normal);
        vec3 ld = normalize(lightDirection);
        float dotProduct = max(dot(norm, ld), 0.0);
        vec3 vertexColor = lightColor * colors.rgb * dotProduct;
        varyingColors = vec4(vertexColor, 1);
        gl_Position = perspectiveMatrix * transformMatrix  * coords;
    }
    </script>

    <script id="shader-fs" type="x-shader/x-fragment">
    precision mediump float;
    uniform vec4 color;
    varying vec4 varyingColors;
    void main(void) {
      gl_FragColor = varyingColors;
    }
    </script>

<!-- end snippet -->


  [1]: https://i.stack.imgur.com/KNEq0.jpg
  [2]: https://stackoverflow.com/questions/55912327/adding-a-directional-light-to-a-transforming-cube-in-vanilla-wegl
  [3]: https://stackoverflow.com/questions/47376499/creating-a-gradient-color-in-fragment-shader

# Answer

There are many ways.

There are basically 2 ways to draw a background

1. Set the background in CSS/HTML. Example

```
<style>
#c {
  background: url(images/bg.jpg) no-repeat center center; 
  background-size: cover;
}
</style>
<canvas id="c"></canvas>
```

2. Draw something in WebGL

You could draw anything. You could draw an image, draw a skybox, draw a gradient.

What a pro would likely do is just use an image they drew in a drawing program. It's simple and flexible. The drawing program has 1000s of options making it trival for an artist to change the background to anything they want

Drawing an image has been answered

https://stackoverflow.com/questions/48124131/how-can-i-draw-a-fullscreen-background-image-in-webgl-like-sketchfab

As for drawing gradients that's already been answered in many other questions

https://stackoverflow.com/questions/47376499/creating-a-gradient-color-in-fragment-shader

And of course the simplest non-image based gradient is probably just to use vertex colors.

As for drawing both the easiest way is just to draw both

* at init time
  * create shader for drawing geometry
  * create shader for drawing background (if one for geometry can't already do it)
  * create geometry 
  * create geometry for quad for background
  * load any textures you're using

* at render time
  * use program for background
  * set buffers and attributes for background
  * set uniforms and textures for background
  * draw background
  * use program for geometry
  * set buffers and attributes for geometry
  * set uniforms and textures for geometry
  * draw geometry
 
Drawing multiple things in WebGL has also been covered

https://stackoverflow.com/questions/13009328/drawing-many-shapes-in-webgl
