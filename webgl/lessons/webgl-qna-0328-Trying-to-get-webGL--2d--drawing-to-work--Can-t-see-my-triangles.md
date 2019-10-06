Title: Trying to get webGL (2d) drawing to work. Can't see my triangles
Description:
TOC: qna

# Question:

I'm trying to draw a simple quad via webgl. Here is some data:

vertex data: (2 floats per vertex)
0: 0  
1: 0  
2: 1  
3: 0  
4: 1  
5: 1  
6: 0  
7: 1  

tex coords: (doesnt really matter)
0: -1  
1: 1  
2: 1  
3: 1    
4: 1  
5: -1  
6: -1  
7: -1  

Indices:
0: 3  
1: 0  
2: 1  
3: 3  
4: 1  
5: 2  

Shaders:  

    <script id="shader-fs" type="x-shader/x-fragment">
        varying highp vec2 vTextureCoord;
        uniform highp vec3 uColor;
        uniform sampler2D uSampler;
        uniform int uSamplerCount;

        void main(void) {
        highp vec4 texColor =vec4(uColor, 1.0);
        if(uSamplerCount > 0)
            texColor = texture2D(uSampler, vTextureCoord);

        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); //just white for now
        }
    </script>

    <!-- Vertex shader program -->
    <script id="shader-vs" type="x-shader/x-vertex">
        attribute highp vec2 aVertexPosition;
        attribute highp vec2 aTextureCoord;

        uniform highp vec2 uPosition;
        uniform highp float uZLayer;

        varying highp vec2 vTextureCoord;

        void main(void) {
        gl_Position = vec4(uPosition + aVertexPosition, uZLayer, 1.0);
        vTextureCoord = aTextureCoord;
        }
    </script>

To me this seems all right. Now here I'm binding the buffers:

    $p.UpdateBuffers = function ConvexSprite_UpdateBuffers() {
        this.gl.bindBuffer(34962 /* WebGLRenderingContext.ARRAY_BUFFER */, this.bVertexPositions);
        this.gl.bufferData(34962 /* WebGLRenderingContext.ARRAY_BUFFER */, this.rotatedPoints, 35044 /* WebGLRenderingContext.STATIC_DRAW */);

        // string s = rotatedPoints.join(",");
        // System.Console.WriteLine("Vertices: " + s);
        this.gl.bindBuffer(34962 /* WebGLRenderingContext.ARRAY_BUFFER */, this.bTextureCoords);
        this.gl.bufferData(34962 /* WebGLRenderingContext.ARRAY_BUFFER */, this.texCoords, 35044 /* WebGLRenderingContext.STATIC_DRAW */);
        //System.Console.WriteLine("Texcoords: " + texCoords.join(","));
        this.gl.bindBuffer(34963 /* WebGLRenderingContext.ELEMENT_ARRAY_BUFFER */, this.bIndices);
        this.gl.bufferData(34963 /* WebGLRenderingContext.ELEMENT_ARRAY_BUFFER */, this.triangles, 35044 /* WebGLRenderingContext.STATIC_DRAW */);
    };


And this is how I'm drawing:

    private void DrawScene()
        {
            gl.viewport(0, 0, (int)canvas.width, (int)canvas.height);
            gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
            testSprite.Draw(aVertexPosition, aTextureCoord, uColor, uPosition, uZLayer, uSampler, uSamplerCount);
        }

draw function:    

    public void Draw(uint aVertexPosition, uint aTextureCoord,
            WebGLUniformLocation uColor, WebGLUniformLocation uPosition, WebGLUniformLocation uZLayer, WebGLUniformLocation uSampler, WebGLUniformLocation uSamplerCount)
        {
           
            //position
            gl.uniform2f(uPosition, this.position.x, this.position.y);
            gl.uniform1f(uZLayer, this.position.z);
            gl.uniform3f(uColor, 1f, 0.5f, 0.5f);
            gl.uniform1i(uSamplerCount, 0);

            //vertex data
            gl.bindBuffer(GL.ARRAY_BUFFER, bVertexPositions);
            gl.vertexAttribPointer(aVertexPosition, 2, GL.FLOAT, false, 0, 0);
            
            gl.bindBuffer(GL.ARRAY_BUFFER, bTextureCoords);
            gl.vertexAttribPointer(aTextureCoord, 2, GL.FLOAT, false, 0, 0);

            gl.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, bIndices);

            //texture
           // gl.activeTexture(GL.TEXTURE0);
           // gl.bindTexture(GL.TEXTURE_2D, texture);
           // gl.uniform1i(uSampler, 0);

            //draw
            gl.drawElements(GL.TRIANGLES, triangles.length, GL.UNSIGNED_SHORT, 0);
        }


Unfortunately all I'm getting is a black screen. The triangles are ccw, and in the 0-1 position range. Shouldn't this draw something to the screen ? What am I forgetting here ?

# Answer

What values are `this.position.x` and `this.position.y`? Given you have a 0,1 quad the best you're going to be able to do with this shader and those vertex coordinates is draw a quad on 1/4th of the canvas. The values you need to output have to be in clipspace (-1 <-> +1).

To convert from pixels to clipspace

    clipX = pixelX / gl.canvas.width  * 2 - 1
    clipY = pixelY / gl.canvas.height * 2 - 1

for width and height in clipspace from pixels

    clipWidth  = pixelWidth  / gl.canvas.width  * 2
    clipHeight = pixelHeight / gl.canvas.height * 2

The first thing I do when debugging a WebGL program that is not drawing is change the fragment shader to the simplest thing possible

      gl_FragColor = vec4(1,0,0,1); return;

If I see red where I expect it I know the issue is in the fragcoord. If I don't I know the issue is somewhere else.

Next I might use the [WebGL Inspector](http://benvanik.github.io/WebGL-Inspector/) to see what values I'm passing in the uniforms. For example if `this.position.x` or `this.position.y` is greater than 1 or less than -2 then nothing is going to appear because your quad is 0 to 1 so `0 + 1` = 1 which means your quad will be off the right side or top side of the canvas. `1 + -2 = -1` in which case the quad will be off the left or bottom side of the canvas. 

Some other things. You set it draw in white `gl_FragColor = vec4(1,1,1,1);` but the default webpage color is white and the default clear color is `0,0,0,0` (transparent black) which means unless you either (a) made a canvas with no alpha (b) set the clear color somewhere not show or (c) set the CSS for the page or the canvas to a different color you're not going to see anything.

Here's some code that draws quads at pixel locations

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    "use strict";

    window.onload = function() {
      // Get A WebGL context
      var canvas = document.getElementById("c");
      var gl = canvas.getContext("webgl");
      if (!gl) {
        return;
      }

      // setup GLSL program
      var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
      gl.useProgram(program);

      // look up where the vertex data needs to go.
      var positionLocation = gl.getAttribLocation(program, "a_position"); 
      
      // look up uniform locations
      var u_matrixLoc = gl.getUniformLocation(program, "u_matrix");
      var u_colorLoc = gl.getUniformLocation(program, "u_color");

      // provide texture coordinates for the rectangle.
      var positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0.0,  0.0,
          1.0,  0.0,
          0.0,  1.0,
          0.0,  1.0,
          1.0,  0.0,
          1.0,  1.0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      function rand(min, max) {
        return min + Math.random() * (max - min) | 0;
      }

      for (var ii = 0; ii < 300; ++ii) {
        var dstX = rand(0, gl.canvas.width - 20);
        var dstY = rand(0, gl.canvas.height - 20);
        var dstWidth = rand(10, 30);
        var dstHeight = rand(10, 30);

        // convert dst pixel coords to clipspace coords      
        var clipX = dstX / gl.canvas.width  *  2 - 1;
        var clipY = dstY / gl.canvas.height * -2 + 1;
        var clipWidth = dstWidth  / gl.canvas.width  *  2;
        var clipHeight = dstHeight / gl.canvas.height * -2;

        // build a matrix that will stretch our
        // unit quad to our desired size and location
        gl.uniformMatrix3fv(u_matrixLoc, false, [
            clipWidth, 0, 0,
            0, clipHeight, 0,
            clipX, clipY, 1,
          ]);
          
        gl.uniform4f(u_colorLoc, Math.random(), Math.random(), Math.random(), 1);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

<!-- language: lang-css -->

    canvas { 
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <script src="//webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
    <canvas id="c"></canvas>  
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform mat3 u_matrix;

    void main() {

       gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    // our texture
    uniform vec4 u_color;

    void main() {
       gl_FragColor = u_color;
    }
    </script>

<!-- end snippet -->

If you don't get the matrix math [here's an article that explains it](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html).

One other suggestion, instead of a conditional on `uSamplerCount` you might consider just

    gl_FragColor = uColor * texture2D(uSampler, vTextureCoord);

Then make a 1 pixel white texture

    whiteTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, whiteTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Float32Array([255,255,255,255]));

Now whenever you want to draw with a solid color then

    gl.bindTexture(gl.TEXTURE_2D, whiteTex);
    gl.uniform4f(uColorLocation, r, g, b, a);

Whenever you want to draw with a texture

    gl.bindTexture(gl.TEXTURE_2D, someTexture);
    gl.uniform4f(uColorLocation, 1, 1, 1, 1);


