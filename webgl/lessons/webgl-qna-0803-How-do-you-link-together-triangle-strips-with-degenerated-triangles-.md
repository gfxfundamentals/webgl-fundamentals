Title: How do you link together triangle strips with degenerated triangles?
Description:
TOC: qna

# Question:


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var gl;
    var canvas;
    var shaderProgram;
    var triangleVertexBuffer;
    var triangleVertexColorBuffer;
    var stripElementBuffer;
    var stripVertexBuffer;

    //Declare new variables here


    function createGLContext(canvas) {
      var names = ["webgl", "experimental-webgl"];
      var context = null;
      for (var i=0; i < names.length; i++) {
        try {
          context = canvas.getContext(names[i]);
        } catch(e) {}
        if (context) {
          break;
        }
      }

      if (context) {
        context.viewportWidth = canvas.width;
        context.viewportHeight = canvas.height;
      } else {
        alert("Failed to create WebGL context!");
      }
      return context;
    }

    function loadShaderFromDOM(id) {
      var shaderScript = document.getElementById(id);
      if (!shaderScript) {
        return null;
      }
      var shaderSource = "";
      var currentChild = shaderScript.firstChild;
      while (currentChild) {
        if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
          shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
      }

      var shader;

      if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
        return null;
      }

      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    }

    function setupShaders() {
      vertexShader = loadShaderFromDOM("shader-vs");
      fragmentShader = loadShaderFromDOM("shader-fs");
      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
      }

      gl.useProgram(shaderProgram);

      shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
      gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
      // For the triangle we want to use per-vertex color so
      // the vertexColorAttribute, aVertexColor, in the vertex shader
      // is enabled.
      // You must enable this attribute here or in draw method before the
      //triangle is drawn
      gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    }

    function setupBuffers() {
      triangleVertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);
      var triangleVertices = [
        0.0,  0.5, 0.0,
          -0.5, -0.5, 0.0,
              0.5, -0.5, 0.0
        ];

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
      triangleVertexBuffer.itemSize = 3;
      triangleVertexBuffer.numberOfItems = 3;

      // Triangle vertex colours
      triangleVertexColorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
      var colors = [
                1.0, 0.0, 0.0, 1.0, //v0
                0.0, 1.0, 0.0, 1.0, //v1
                0.0, 0.0, 1.0, 1.0  //v2
            ];

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      triangleVertexColorBuffer.itemSize = 4;
      triangleVertexColorBuffer.numberOfItems = 3;


      // Add new items: the followings are newly added items

      //hexagon vertices
      hexagonVertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, hexagonVertexBuffer);
      var hexagonVertices = [
            -0.3,  0.6,  0.0, //v0
            -0.4,  0.8,  0.0, //v1
            -0.6,  0.8,  0.0, //v2
            -0.7,  0.6,  0.0, //v3
            -0.6,  0.4,  0.0, //v4
            -0.4,  0.4,  0.0, //v5
            -0.3,  0.6,  0.0, //v6
           ];

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hexagonVertices), gl.STATIC_DRAW);
      hexagonVertexBuffer.itemSize = 3;
      hexagonVertexBuffer.numberOfItems = 7;


      //Triangle strip vertices.
      stripVertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, stripVertexBuffer);
      var stripVertices = [
            -0.5,  0.2,  0.0, //v0
            -0.4,  0.0,  0.0, //v1
            -0.3,  0.2,  0.0, //v2
            -0.2,  0.0,  0.0, //v3
            -0.1,  0.2,  0.0, //v4
             0.0,  0.0,  0.0, //v5
             0.1,  0.2,  0.0, //v6
             0.2,  0.0,  0.0, //v7
             0.3,  0.2,  0.0, //v8
             0.4,  0.0,  0.0, //v9
             0.5,  0.2,  0.0, //v10

             // Second strip
            -0.5, -0.3,  0.0, //v11
            -0.4, -0.5,  0.0, //v12
            -0.3, -0.3,  0.0, //v13
            -0.2, -0.5,  0.0, //v14
            -0.1, -0.3,  0.0, //v15
             0.0, -0.5,  0.0, //v16
             0.1, -0.3,  0.0, //v17
             0.2, -0.5,  0.0, //v18
             0.3, -0.3,  0.0, //v19
             0.4, -0.5,  0.0, //v20
             0.5, -0.3,  0.0  //v21
      ];

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stripVertices), gl.STATIC_DRAW);
      stripVertexBuffer.itemSize = 3;
      stripVertexBuffer.numberOfItems = 22;

      // Strip vertex indices
      stripElementBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stripElementBuffer);

      var indices = [
        0.0,  0.5, 0.0,
          -0.5, -0.5, 0.0,
              0.5, -0.5, 0.0
    // put correct indices here. Use degenerated triangles to link the
       // strips together
    ];

      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      stripElementBuffer.numberOfItems = 25;
    }

    function draw() {
      gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Draw triangle. No change is made to the last week's code here
      // For the triangle we want to use per-vertex color so
      // the vertexColorAttribute, aVertexColor, in the vertex shader
      // is enabled
      // gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

      // Make vertex buffer "triangleVertexBuffer" the current buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBuffer);

      // Link the current buffer to the attribute "aVertexPosition" in
      // the vertex shader
      gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

      // Make color buffer "triangleVertexColorBuffer" the current buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
      // Link the current buffer to the attribute "aVertexColor" in
      // the vertex shader
      gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, triangleVertexBuffer.numberOfItems);
      
      gl.drawElements(gl.TRIANGLE_STRIP, 0, stripVertexBuffer.numberOfItems, 25);



      // Draw the newly added items



      }

    function startup() {
      canvas = document.getElementById("myGLCanvas");
      gl = createGLContext(canvas);
      setupShaders();
      setupBuffers();
      gl.clearColor(1.0, 1.0, 1.0, 1.0);

      draw();
    }

    startup();


<!-- language: lang-html -->

    <script id="shader-vs" type="x-shader/x-vertex">
      attribute vec3 aVertexPosition;
      attribute vec4 aVertexColor;
      varying vec4 vColor;

      void main() {
        vColor = aVertexColor;
        gl_Position = vec4(aVertexPosition, 1.0);
      }
    </script>

    <script id="shader-fs" type="x-shader/x-fragment">
      precision mediump float;
      varying vec4 vColor;

      void main() {
        gl_FragColor = vColor;
      }
    </script>

    <canvas id="myGLCanvas" width="250" height="250"></canvas>


<!-- end snippet -->

Hey guys. New to WEBGL, trying to draw the triangle strip but no clue on how to approach this. 

what I know:

- When drawing with `gl.TRIANGLE_STRIP` mode, the order of the vertex coordinates or indices in the buffer is important.
- Instead of specifying triangles by the programmer, WebGL constructs triangles automatically. 
- It reads vertex coordinate buffer or index buffer and use them in the following order to construct triangles:

# Answer

these 2 lines in the code don't make any sense

    gl.drawArrays(gl.TRIANGLES, 0, triangleVertexBuffer.numberOfItems);
  
    gl.drawElements(gl.TRIANGLE_STRIP, 0, stripVertexBuffer.numberOfItems, 25);

It generally makes no sense to call draw twice without changing something in between since to draw 2 things requires setting up different data.

Further, the 2nd line is just plain wrong

    gl.drawElements(gl.TRIANGLE_STRIP, 0, stripVertexBuffer.numberOfItems, 25);

If you had opened your JavaScript Console you would have seen an error something like

[![javascript console][1]][1]

There are several issues

*  The code is passing a bad value to the `type` parameter of `gl.drawElements`

   Type parameter to `gl.drawElements` is the type of data in the current `ELEMENT_ARRAY_BUFFER`. 

*  The 2nd parameter is the count.

*  It's passing the number of vertices (`stripVertexBuffer.numberOfItems`) not the number of indices (`stripElementBuffer.numberOfItems`)

It should be something like this

    {
      const primitive = gl.TRIANGLE_STRIP;
      const count = stripElementBuffer.numberOfItems;
      const offset = 0;
      const indexType = gl.UNSIGNED_SHORT;

      gl.drawElements(primitive, count, indexType, offset);
    }

Fixing that though isn't enough because the code does not actually put indices in the index buffer. That code 

      // Strip vertex indices
      stripElementBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stripElementBuffer);
    
      var indices = [
        0.0,  0.5, 0.0,
          -0.5, -0.5, 0.0,
              0.5, -0.5, 0.0
    // put correct indices here. Use degenerated triangles to link the
       // strips together
    ];
    
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      stripElementBuffer.numberOfItems = 25;
    

also makes no sense. Indices are unsigned integer values from 0 to N where N is the one less than the number of vertices bound to the attributes. Further only 9 values are put in but the code sets `stripElementBuffer.numberOfItems` to 25 .. ?

Then, on top of all of that the code is not setting up the attributes for using the strip vertices.

To draw multiple things in WebGL works like this

    for each thing you want to draw
       gl.useProgram(theProgramYouWantToDrawWith);

       // setup attributes
       for each attribute
         gl.bindBuffer(gl.ARRAY_BUFFER, bufferWithDataForAttribute);
         gl.enableVertexAttribArray(attribLocation);
         gl.vertexAttribPointer(attribLocation, ... how to get data out of buffer ...)

       // if using indices setup the ELEMENT_ARRAY_BUFFER
       gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferWithIndices);

       // setup textures
       for each texture you're going to draw with
         gl.activeTexture(gl.TEXTURE0 + unit);
         gl.bindTexture(gl.TEXTURE_??, someTexture);

       // setup uniforms
       for each uniform
         gl.uniformXXX(...)

       // draw
       gl.drawXXX (either gl.drawArrays or gl.drawElements)

Before you can even attempt degenerate triangle strips you need to fix your code to follow that pattern. Also [here's some other tutorials you might find helpful](https://webglfundamentals.org)


  [1]: https://i.stack.imgur.com/GQkt8.png


