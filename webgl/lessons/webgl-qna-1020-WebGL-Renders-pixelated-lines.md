Title: WebGL Renders pixelated lines
Description:
TOC: qna

# Question:

Im trying to render simple shapes ( circles, rectangles and triangles , however, they become very pixelated when WebGL Renders them.

Shader code:

    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec2 a_position;

    uniform vec2 u_resolution;
  
    void main() {
     // convert the rectangle points from pixels to 0.0 to 1.0
     vec2 zeroToOne = a_position / u_resolution;
  
     // convert from 0->1 to 0->2
     vec2 zeroToTwo = zeroToOne * 2.0;
  
     // convert from 0->2 to -1->+1 (clipspace)
     vec2 clipSpace = zeroToTwo - 1.0;
  
     gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
    </script>
    <!-- fragment shader -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
  
    uniform vec4 u_color;
  
    void main() {
       gl_FragColor = u_color;
    }
    </script>

Here is my code for rendering the circle:

    

    var WebGLRenderer = (function () {

      function WebGLRenderer() {
        this.canvas = document.getElementById('canvas')
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
        if (!this.gl) {
          throw Error('Your browser does not support WebGL')
          return
        }

        // Programs
        this.rectangleProgram = webglUtils.createProgramFromScripts(this.gl, ['2d-vertex-shader', '2d-fragment-shader'])

        // Locations
        this.rectanglePoisitionLocation = this.gl.getAttribLocation(this.rectangleProgram, 'a_position')

        // Uniforms
        this.rectangleResolutionLocation = this.gl.getUniformLocation(this.rectangleProgram, 'u_resolution')
        this.rectangleColorLocation = this.gl.getUniformLocation(this.rectangleProgram, 'u_color')

        // this.positionBuffer = this.gl.createBuffer()
        this.rectanglePositionBuffer = this.gl.createBuffer()
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)

        requestAnimationFrame(this.render.bind(this))
      }


      WebGLRenderer.prototype.clearCanvas = function (color) {
        var rgba = color.getColor()
        this.gl.clearColor(...rgba)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)
      }

      WebGLRenderer.prototype.drawCircle = function (x, y, radius, color) {
        // Render circle
        // For now user rectangleProgram
        this.gl.useProgram(this.rectangleProgram)
        this.gl.enableVertexAttribArray(this.rectanglePoisitionLocation)
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
        this.circleBuffer = this.gl.createBuffer()
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectanglePositionBuffer)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.circleBuffer)

        // Setup circle
        var circleVertices = [x, y]
        var numFans = 360
        var anglePerFan = (2 * Math.PI) / numFans
        for (var i = 0; i <= numFans; i++) {
          var angle = anglePerFan * (i + 1)
          var angledX = x + Math.cos(angle) * radius
          var angledY = y + Math.sin(angle) * radius
          circleVertices.push(angledX, angledY)
          // circleVertices.push()
        }
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(circleVertices), this.gl.DYNAMIC_DRAW)
        // this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW)

        var size = 2
        var type = this.gl.FLOAT
        var normalize = false
        var stride = 0
        var offset = 0
        this.gl.vertexAttribPointer(this.rectanglePoisitionLocation, size, type, normalize, stride, offset)

        this.gl.uniform2f(this.rectangleResolutionLocation, this.gl.canvas.width, this.gl.canvas.height)

        // Color
        var colorArray = color.getColor()
        this.gl.uniform4fv(this.rectangleColorLocation, colorArray)

        // Draw rectangle
        var primitiveType = this.gl.TRIANGLE_FAN
        // var primitiveType = this.gl.POINTS
        var offset = 0
        var count = circleVertices.length / size
        // var count = positions.length / size
        this.gl.drawArrays(primitiveType, offset, count)
      }

      WebGLRenderer.prototype.render = function (time) {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)

        var delta = Math.sin(time / 1000) * 10
        this.clearCanvas(new Color(0, 0, 0, 255))
        var rectangleColor = new Color(0, 65, 255, 255)
        var width = 50
        var height = 50
        var circleColor = new Color(0, 167, 255, 255)
        this.drawCircle(10, 10, 10, circleColor)

        requestAnimationFrame(this.render.bind(this))
      }
      return WebGLRenderer
    })()


    function Color(r, g, b, a) {
      this.r = r
      this.g = g
      this.b = b
      this.a = a
      this.getColor = function () {
        return [r / 255, g / 255, b / 255, a / 255]
      }
    }

    var renderer = new WebGLRenderer()


Results: blurry circle (everything I render with WebGL is blurry)

See fiddle for results: https://jsfiddle.net/xLwmngav/1/


Expected results: a smooth round circle

Any help is appreciated. Thank you in advance.

# Answer

As is pointed out in [this article](https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html) canvases have 2 sizes, their resolution (how many pixels are in them) and the size they are displayed. 

Generally you want the resolution to match or exceed the size the canvas is displayed. The best way to do that is to to check, just before rendering, if the canvas's resolution matches the size it's displayed and if it's not to resize it with a function like this

```
  function resize(canvas) {
    // Lookup the size the browser is displaying the canvas.
    const desiredWidth  = canvas.clientWidth;
    const desiredHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    if (canvas.width  !== desiredWidth ||
        canvas.height !== desiredHeight) {

      // Make the canvas the same size
      canvas.width  = desiredWidth;
      canvas.height = desiredHeight;
    }
  }
```

And use it like this

```
function render() {
  resize(canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  ... draw here ...

  ...
```

example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function resize(canvas) {
      // Lookup the size the browser is displaying the canvas.
      const desiredWidth  = canvas.clientWidth;
      const desiredHeight = canvas.clientHeight;

      // Check if the canvas is not the same size.
      if (canvas.width  !== desiredWidth ||
          canvas.height !== desiredHeight) {

        // Make the canvas the same size
        canvas.width  = desiredWidth;
        canvas.height = desiredHeight;
      }
    }

    var WebGLRenderer = (function () {

      function WebGLRenderer() {
        this.canvas = document.getElementById('canvas')
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')
        if (!this.gl) {
          throw Error('Your browser does not support WebGL')
          return
        }

        // Programs
        this.rectangleProgram = webglUtils.createProgramFromScripts(this.gl, ['2d-vertex-shader', '2d-fragment-shader'])

        // Locations
        this.rectanglePoisitionLocation = this.gl.getAttribLocation(this.rectangleProgram, 'a_position')

        // Uniforms
        this.rectangleResolutionLocation = this.gl.getUniformLocation(this.rectangleProgram, 'u_resolution')
        this.rectangleColorLocation = this.gl.getUniformLocation(this.rectangleProgram, 'u_color')

        // this.positionBuffer = this.gl.createBuffer()
        this.rectanglePositionBuffer = this.gl.createBuffer()
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)

        requestAnimationFrame(this.render.bind(this))
      }


      WebGLRenderer.prototype.clearCanvas = function (color) {
        var rgba = color.getColor()
        this.gl.clearColor(...rgba)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT)
      }

      WebGLRenderer.prototype.drawCircle = function (x, y, radius, color) {
        // Render circle
        // For now user rectangleProgram
        this.gl.useProgram(this.rectangleProgram)
        this.gl.enableVertexAttribArray(this.rectanglePoisitionLocation)
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
        this.circleBuffer = this.gl.createBuffer()
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectanglePositionBuffer)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.circleBuffer)

        // Setup circle
        var circleVertices = [x, y]
        var numFans = 360
        var anglePerFan = (2 * Math.PI) / numFans
        for (var i = 0; i <= numFans; i++) {
          var angle = anglePerFan * (i + 1)
          var angledX = x + Math.cos(angle) * radius
          var angledY = y + Math.sin(angle) * radius
          circleVertices.push(angledX, angledY)
          // circleVertices.push()
        }
        /*var circleVertices = [
          x, y,
          15, 18,
          5, 18,
          0, 10,
          4, 1,
          14, 1,
          20, 9,
          15, 18
        ]*/
        // three 2d points
        // TODO: Research static draw
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(circleVertices), this.gl.DYNAMIC_DRAW)
        // this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW)

        var size = 2
        var type = this.gl.FLOAT
        var normalize = false
        var stride = 0
        var offset = 0
        this.gl.vertexAttribPointer(this.rectanglePoisitionLocation, size, type, normalize, stride, offset)

        this.gl.uniform2f(this.rectangleResolutionLocation, this.gl.canvas.width, this.gl.canvas.height)

        // Color
        var colorArray = color.getColor()
        this.gl.uniform4fv(this.rectangleColorLocation, colorArray)

        // Draw rectangle
        var primitiveType = this.gl.TRIANGLE_FAN
        // var primitiveType = this.gl.POINTS
        var offset = 0
        var count = circleVertices.length / size
        // var count = positions.length / size
        this.gl.drawArrays(primitiveType, offset, count)
      }

      WebGLRenderer.prototype.render = function (time) {
        resize(this.gl.canvas);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)

        var delta = Math.sin(time / 1000) * 10
        this.clearCanvas(new Color(0, 0, 0, 255))
        var rectangleColor = new Color(0, 65, 255, 255)
        var width = 50
        var height = 50
        var circleColor = new Color(0, 167, 255, 255)
        this.drawCircle(10, 10, 10, circleColor)

        requestAnimationFrame(this.render.bind(this))
      }
      return WebGLRenderer
    })()


    function Color(r, g, b, a) {
      this.r = r
      this.g = g
      this.b = b
      this.a = a
      this.getColor = function () {
        return [r / 255, g / 255, b / 255, a / 255]
      }
    }

    var renderer = new WebGLRenderer()

    window.WebGLRenderer = WebGLRenderer

<!-- language: lang-css -->

    body {
      margin: 0;
    }

    #canvas {
      display: block;  /* prevents scrollbar */
      width: 100vw;
      height: 100vh;
    }

<!-- language: lang-html -->

    <canvas id="canvas"></canvas>
      <!-- vertex shader -->
      <script id="2d-vertex-shader" type="x-shader/x-vertex">
      attribute vec2 a_position;
      
      uniform vec2 u_resolution;
      
      void main() {
         // convert the rectangle points from pixels to 0.0 to 1.0
         vec2 zeroToOne = a_position / u_resolution;
      
         // convert from 0->1 to 0->2
         vec2 zeroToTwo = zeroToOne * 2.0;
      
         // convert from 0->2 to -1->+1 (clipspace)
         vec2 clipSpace = zeroToTwo - 1.0;
      
         gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
      </script>
      <!-- fragment shader -->
      <script id="2d-fragment-shader" type="x-shader/x-fragment">
      precision mediump float;
      
      uniform vec4 u_color;
      
      void main() {
         gl_FragColor = u_color;
      }
      </script>
      <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
      <script src="https://webglfundamentals.org/webgl/resources/m3.js"></script>

<!-- end snippet -->


