Title: webgl trying to draw a triangle
Description:
TOC: qna

# Question:

I have been trying to draw a triangle but it is not showing up on the canvas

here is my draw function code: 
        
    function draw() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)gl.clear(gl.COLOR_BUFFER_BIT)       
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                    buffer.itemSize, gl.FLOAT, false, 0, 0); 
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute)
          
            //Draw the triangle
        gl.drawArrays(gl.TRIANGLES, 0, buffer.numberOfItems)
    }

here is the whole work:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vertexShaderText = [
      'attribute vec3 vertexPos;',
      '',
      'void main() {',
      '  gl_Position = vec4(vertexPos, 1.0);',
      '}'
    ].join('\n')

    const fragmentShaderText = [
      'precision mediump float;',
      '',
      'void main() {',
      '  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);',
      '}'
    ].join('\n')

    let gl, shaderProgram, buffer

    function startup() {
      const canvas = document.getElementById('myCanvas')
      gl = canvas.getContext('webgl')

      initShader()
      initBuffer()

      gl.clearColor(0.0, 0.0, 0.0, 1.0)

      draw()
    }

    function initShader() {

      // VERTEX SHADER
      let vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vertexShader, vertexShaderText)
      gl.compileShader(vertexShader)

      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert('vertex', gl.getShaderInfoLog(vertexShader))
        return
      }

      let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(fragmentShader, fragmentShaderText)
      gl.compileShader(fragmentShader)

      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert('fragment', gl.getShaderInfoLog(fragmentShader))
        return
      }


      shaderProgram = gl.createProgram()

      gl.attachShader(shaderProgram, vertexShader)
      gl.attachShader(shaderProgram, fragmentShader)

      gl.linkProgram(shaderProgram)

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Failed to setup shaders')
      }

      gl.useProgram(shaderProgram)

      shaderProgram.vertextPositionAttribute = gl.getAttribLocation(shaderProgram, 'vertexPos')
      //gl.enableVertexAttribArray(shaderProgram.vertextPositionAttribute)

    }

    function initBuffer() {
      buffer = gl.createBuffer()

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

      const triangleVertices = [
        0.0, 0, 5, 0.0, -0.5, -0.5, 0.0,
        0.5, -0.5, 0.0
      ]

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW)

      buffer.itemSize = 3
      buffer.numberOfItems = 3
      console.log(shaderProgram)
    }

    function draw() {
      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight) 
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
        buffer.itemSize, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute)  
      //Draw the triangle
      gl.drawArrays(gl.TRIANGLES, 0, buffer.numberOfItems)
    }

    startup()

<!-- language: lang-html -->

    <canvas id="myCanvas" width="500" height="500"></canvas>

<!-- end snippet -->



# Answer

Some issues

### There is no such thing as `gl.viewportWidth` and `gl.viewportHeight`

Use `gl.canvas.width` and `gl.canvas.height`.

There's a site out there that teaches using `gl.viewportWidth` and `gl.viewportHeight`. It is arguably an anti-pattern. Those variables are not part of WebGL. They are user variables being added by the example onto the WebGL context. There is absolutely zero reason to do that as they will always have to be manually updated and the actual width and height are always available.

### Typo in `triangleVertices`

The second comma below should be a period

bad

     const triangleVertices = [
        0.0, 0, 5, 0.0, -0.5, -0.5, 0.0,  
        0.5, -0.5, 0.0
      ]

good

     const triangleVertices = [
        0.0, 0.5, 0.0, -0.5, -0.5, 0.0,  
        0.5, -0.5, 0.0
      ]

With that it runs but here's another typo

`vertextPositionAttribute` should be `vertexPositionAttribute`

      shaderProgram.vertextPositionAttribute = gl.getAttribLocation(shaderProgram, 'vertexPos')
      //gl.enableVertexAttribArray(shaderProgram.vertextPositionAttribute)

That said here's a bunch of suggestions.

* Use multiline template literals for shaders

Instead of

    const vertexShaderText = [
      'attribute vec3 vertexPos;',
      '',
      'void main() {',
      '  gl_Position = vec4(vertexPos, 1.0);',
      '}'
    ].join('\n')

do this

    const vertexShaderText = `
      attribute vec3 vertexPos;
      
      void main() {
        gl_Position = vec4(vertexPos, 1.0);
      }
    `;

So much easier! Use backticks instead of quotes for multi-line strings

* Make `initShader` return a shader rather than assign a global

It's not common to have a single shader in WebGL so it's much more useful to have a function that creates shaders

* Don't call `gl.useProgram` in `initShader`

Again it's not common to have a single shader. Calling `gl.useProgram` generally belongs in `draw`

* Don't add attributes to browser objects, especially WebGL objects

  bad

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'vertexPos');

  good (one of many ways)

        const shaderProgramInfo = {}
        shaderProgramInfo.program = initShader(...)
        shaderProgramInfo.vertexPositionAttribute =
            gl.getAttribLocation(shaderProgramInfo.program, 'vertexPos');

  This is because if initShader fails (for example the context is lost) your `gl.createProgram` will be null and trying to assign a property to null will cause your page to fail. The same issue with buffer

  bad

         const buffer = gl.createBuffer();
         ...
         buffer.itemSize = 3
         buffer.numberOfItems = 3
        
  good (one of many ways)

         const bufferInfo = {
           buffer: gl.createBuffer(),
         }
         ...
         bufferInfo.itemSize = 3
         bufferInfo.numberOfItems = 3

* Call `gl.bindBuffer` before calling `gl.vertexAttribPointer`

  Your code works because there is only one buffer. If there are 2 buffers it would likely stop working because `gl.vertexAttribPointer` references the currently bound buffer

* Consider Reading better tutorials.

I'd recommend https://webglfundamentals.org


<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const vertexShaderText = `
      attribute vec3 vertexPos;
      
      void main() {
        gl_Position = vec4(vertexPos, 1.0);
      }
    `;

    const fragmentShaderText = `
      precision mediump float;
      
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    `;

    let gl, shaderProgramInfo, bufferInfo

    function startup() {
      const canvas = document.getElementById('myCanvas')
      gl = canvas.getContext('webgl')

      shaderProgramInfo = {
        program: initShader(gl, vertexShaderText, fragmentShaderText),
      };
      shaderProgramInfo.vertexPositionAttribute = gl.getAttribLocation(shaderProgramInfo.program, 'vertexPos');

      bufferInfo = initBuffer()

      gl.clearColor(0.0, 0.0, 0.0, 1.0)

      draw()
    }

    function initShader(gl, vertexShaderText, fragmentShaderText) {

      // VERTEX SHADER
      let vertexShader = gl.createShader(gl.VERTEX_SHADER)
      gl.shaderSource(vertexShader, vertexShaderText)
      gl.compileShader(vertexShader)

      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert('vertex', gl.getShaderInfoLog(vertexShader))
        return
      }

      let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
      gl.shaderSource(fragmentShader, fragmentShaderText)
      gl.compileShader(fragmentShader)

      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert('fragment', gl.getShaderInfoLog(fragmentShader))
        return
      }

      const shaderProgram = gl.createProgram()

      gl.attachShader(shaderProgram, vertexShader)
      gl.attachShader(shaderProgram, fragmentShader)

      gl.linkProgram(shaderProgram)

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Failed to setup shaders')
      }

      return shaderProgram;
    }

    function initBuffer() {
      buffer = gl.createBuffer()

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

      const triangleVertices = [
        0.0, 0.5, 0.0, -0.5, -0.5, 0.0,
        0.5, -0.5, 0.0
      ]

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW)

      return {
        buffer,
        itemSize: 3,
        numberOfItems: 3,
      };
    }

    function draw() {
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); 
      gl.clear(gl.COLOR_BUFFER_BIT)

      gl.useProgram(shaderProgramInfo.program)

      gl.bindBuffer(gl.ARRAY_BUFFER, bufferInfo.buffer);
      gl.vertexAttribPointer(shaderProgramInfo.vertexPositionAttribute,
        bufferInfo.itemSize, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(shaderProgramInfo.vertexPositionAttribute)  
      //Draw the triangle
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numberOfItems)
    }

    startup()

<!-- language: lang-html -->

    <canvas id="myCanvas" width="500" height="500"></canvas>

<!-- end snippet -->



