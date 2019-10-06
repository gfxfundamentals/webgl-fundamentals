Title: Webgl / Javascript : canvas texture content copy to another context texture object
Description:
TOC: qna

# Question:

I'm trying to copy the content (display of an image) of my first webgl context to a texture from another webgl context.
I'm using texImage2D function with a canvas element as a source, getting no errors, but it renders nothing but black.
I don't know what I'm missing, so any kind of help is greatly appreciated.
I'm looking at a webgl1 solution, and using Chrome.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var canvas1;
    var texture1;
    var image;
    var shaderProgram;
    var vertex_buffer;
    var texture_buffer;
    var aVertLocation;
    var aTexLocation;
    var vertices = [];
    var texCoords = [];

    var gl;
    var gl2;
    var canvas2;
    var texture2;
    var shaderProgram2;
    var vertex_buffer2;
    var texture_buffer2;
    var index_Buffer2;
    var aVertLocation2;
    var aTexLocation2;
    var vertices2 = [];
    var texCoords2 = [];

    indices = [0, 1, 2, 0, 2, 3];
    vertices = [-1, -1, 1, -1, 1, 1, -1, 1];
    texCoords = [0, 0, 1, 0, 1, 1, 0, 1];

    function initApp()
    {
      initWebGL();
      
      image = new Image();
      image.onload = function(){
        render();
        render2();
      }
      image.crossOrigin = '';
      image.src = 'https://i.imgur.com/ZKMnXce.png';
    }

    function initWebGL()
    {

      canvas1 = document.getElementById('glCanvas1');
      gl = canvas1.getContext('webgl');

      /*====================== Shaders =======================*/

      // Vertex shader source code
      var vertCode =
        'attribute vec2 coordinates;' +
        'attribute vec2 aTexCoord;' +
        'varying highp vec2 vTexCoord;' +
        'void main(void) {' +
          'gl_Position = vec4(coordinates,1.0,1.0);' +
          'vTexCoord = aTexCoord;' +
        '}';
      var vertShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertShader, vertCode);
      gl.compileShader(vertShader);

      //fragment shader source code
      var fragCode =
        'uniform sampler2D texture;' +
        'varying highp vec2 vTexCoord;' +
        'void main(void) {' +
          ' gl_FragColor = texture2D(texture, vTexCoord);' +
        '}';
      var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragShader, fragCode);
      gl.compileShader(fragShader);

      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertShader);
      gl.attachShader(shaderProgram, fragShader);
      gl.deleteShader( vertShader );
      gl.deleteShader( fragShader );
      gl.linkProgram(shaderProgram);
      gl.useProgram(shaderProgram);

      aVertLocation = gl.getAttribLocation(shaderProgram, "coordinates");
      aTexLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");

      vertex_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
      gl.enableVertexAttribArray(aVertLocation);
      gl.vertexAttribPointer(aVertLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      texture_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texture_buffer);
      gl.enableVertexAttribArray(aTexLocation);
      gl.vertexAttribPointer(aTexLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      index_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

      texture1 = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture1);
      gl.uniform1i( gl.getUniformLocation( shaderProgram, 'texture' ), 0 );
      gl.bindTexture(gl.TEXTURE_2D, null);


      //==========================================================//

      canvas2 = document.getElementById('glCanvas2');
      gl2 = canvas2.getContext('webgl');
      var vertShader2 = gl2.createShader(gl2.VERTEX_SHADER);
      var fragShader2 = gl2.createShader(gl2.FRAGMENT_SHADER);
      gl2.shaderSource(vertShader2, vertCode);
      gl2.shaderSource(fragShader2, fragCode);
      gl2.compileShader(vertShader2);
      gl2.compileShader(fragShader2);

      shaderProgram2 = gl2.createProgram();
      gl2.attachShader(shaderProgram2, vertShader2);
      gl2.attachShader(shaderProgram2, fragShader2);
      gl2.deleteShader( vertShader2 );
      gl2.deleteShader( fragShader2 );
      gl2.linkProgram(shaderProgram2);
      gl2.useProgram(shaderProgram2);

      aVertLocation2 = gl2.getAttribLocation(shaderProgram2, "coordinates");
      aTexLocation2 = gl2.getAttribLocation(shaderProgram2, "aTexCoord");

      vertex_buffer2 = gl2.createBuffer();
      gl2.bindBuffer(gl2.ARRAY_BUFFER, vertex_buffer2);
      gl2.enableVertexAttribArray(aVertLocation2);
      gl2.vertexAttribPointer(aVertLocation2, 2, gl2.BYTE, false, 0, 0);
      gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(vertices), gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, null);

      texture_buffer2 = gl2.createBuffer();
      gl2.bindBuffer(gl2.ARRAY_BUFFER, texture_buffer2);
      gl2.enableVertexAttribArray(aTexLocation2);
      gl2.vertexAttribPointer(aTexLocation, 2, gl2.BYTE, false, 0, 0);
      gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(texCoords), gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, null);

      index_buffer2 = gl2.createBuffer();
      gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, index_buffer2);
      gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, null);

      texture2 = gl2.createTexture();
      gl2.bindTexture(gl2.TEXTURE_2D, texture2);
      gl2.uniform1i( gl2.getUniformLocation( shaderProgram2, 'texture' ), 0 );
      gl2.bindTexture(gl2.TEXTURE_2D, null); 
    }

    function updateTexture()
    {
      gl.bindTexture(gl.TEXTURE_2D, texture1);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }  

    function render()
    {
      if ( !shaderProgram ) return;
      updateTexture();
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
      gl.bindTexture(gl.TEXTURE_2D, texture1);
      gl.enableVertexAttribArray(aVertLocation);
      gl.enableVertexAttribArray(aTexLocation);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer)
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(aVertLocation);
      gl.disableVertexAttribArray(aTexLocation);

    }

    function updateTexture2()
    {
      gl2.bindTexture(gl2.TEXTURE_2D, texture2);
      gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE, canvas1);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
      gl2.generateMipmap(gl2.TEXTURE_2D);  
      gl2.bindTexture(gl2.TEXTURE_2D, null);
    }  

    function render2()
    {
      if ( !shaderProgram2 ) return;
      updateTexture2();
      gl2.clearColor(0.0, 0.0, 0.0, 1.0);
      gl2.clear( gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT );
      gl2.bindTexture(gl2.TEXTURE_2D, texture2);
      gl2.enableVertexAttribArray(aVertLocation2);
      gl2.enableVertexAttribArray(aTexLocation2);
      gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, index_buffer2);
      gl2.drawElements(gl2.TRIANGLES, 6, gl2.UNSIGNED_SHORT,0);
      gl2.disableVertexAttribArray(aVertLocation2);
      gl2.disableVertexAttribArray(aTexLocation2);
    }

    document.addEventListener('DOMContentLoaded', initApp);


<!-- language: lang-html -->

    <canvas id="glCanvas1" width="128" height="128" ></canvas>
    <canvas id="glCanvas2" width="128" height="128" ></canvas>


<!-- end snippet -->

Thanks in advance :)


# Answer

The copy is working just fine. What's not working is your code 

Here's what I did to find the bug

* First moved the code to snippet so I could actually run it. Please use snippets in the future.

* Next I used an image from imgur. Because that image is on another domain I needed to set `crossOrigin`. Fortunately imgur supports CORS allowing WebGL to use the image. If it was me I wouldn't have used an image because that part is not important. A single colored pixel would show the issue just as well and remove the need for a image

* Now that the code is running and the bug shown the first thing to do was to change this line in `updateTexture2`

        gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE, canvas1);

   to just use the same image

        gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE, image);
 
   The second canvas was still black showing the issue had nothing to with copying a canvas.

* So, next I edited the fragment shader to this

          gl_FragColor = vec4(1,0,0,1);

   the second canvas was still black. This showed the issue had nothing to do with textures at all. The code was not drawing anything visible the second canvas.

* So, looking at stuff related to the vertex shader the bug was these 2 lines

        gl2.vertexAttribPointer(aVertLocation2, 2, gl2.BYTE, false, 0, 0);

        ...

        gl2.vertexAttribPointer(aTexLocation, 2, gl2.BYTE, false, 0, 0);

   needed to be `gl.FLOAT` not `gl.BYTE`

Some other random comments.

*  I used multi line template literals for the shaders

*  There's no reason to call `gl.generateMips` if your filtering is set not to use mips

*  This code has no meaning

        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.uniform1i( gl.getUniformLocation( shaderProgram, 'texture' ), 0 );
        gl.bindTexture(gl.TEXTURE_2D, null);

   There's no reason to bind the texture here. `gl.uniform1i` just sets an integer value to the uniform `shaderProgram`. It does not record anything about the texture itself so just

        gl.uniform1i( gl.getUniformLocation( shaderProgram, 'texture' ), 0 );

   Without the the `bindTexture` calls would be fine. On top of that uniforms default to 0 so you don't really need the `gl.uniform1i` call. On the other hand maybe you had that their to set it to something other than 0 later. 

Finally because WebGL can not share resources across canvases (at least as of July 2017), then, depending on what you're making you might want to consider using a single canvas. [See the last solution in this answer](https://stackoverflow.com/a/33180165/128511)

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var canvas1;
    var texture1;
    var image;
    var shaderProgram;
    var vertex_buffer;
    var texture_buffer;
    var aVertLocation;
    var aTexLocation;
    var vertices = [];
    var texCoords = [];

    var gl;
    var gl2;
    var canvas2;
    var texture2;
    var shaderProgram2;
    var vertex_buffer2;
    var texture_buffer2;
    var index_Buffer2;
    var aVertLocation2;
    var aTexLocation2;
    var vertices2 = [];
    var texCoords2 = [];

    indices = [0, 1, 2, 0, 2, 3];
    vertices = [-1, -1, 1, -1, 1, 1, -1, 1];
    texCoords = [0, 0, 1, 0, 1, 1, 0, 1];

    function initApp()
    {
      initWebGL();
      
      image = new Image();
      image.onload = function(){
        render();
        render2();
      }
      image.crossOrigin = '';
      image.src = 'https://i.imgur.com/ZKMnXce.png';
    }

    function initWebGL()
    {

      canvas1 = document.getElementById('glCanvas1');
      gl = canvas1.getContext('webgl');

      /*====================== Shaders =======================*/

      // Vertex shader source code
      var vertCode = `
        attribute vec2 coordinates;
        attribute vec2 aTexCoord;
        varying highp vec2 vTexCoord;
        void main(void) {
          gl_Position = vec4(coordinates,1.0,1.0);
          vTexCoord = aTexCoord;
        }
      `;
      var vertShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertShader, vertCode);
      gl.compileShader(vertShader);

      //fragment shader source code
      var fragCode = `
        precision mediump float;
        uniform sampler2D texture;
        varying highp vec2 vTexCoord;
        void main(void) {
           gl_FragColor = texture2D(texture, vTexCoord);
        }
      `;
      var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragShader, fragCode);
      gl.compileShader(fragShader);

      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertShader);
      gl.attachShader(shaderProgram, fragShader);
      gl.deleteShader( vertShader );
      gl.deleteShader( fragShader );
      gl.linkProgram(shaderProgram);
      gl.useProgram(shaderProgram);

      aVertLocation = gl.getAttribLocation(shaderProgram, "coordinates");
      aTexLocation = gl.getAttribLocation(shaderProgram, "aTexCoord");

      vertex_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
      gl.enableVertexAttribArray(aVertLocation);
      gl.vertexAttribPointer(aVertLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      texture_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texture_buffer);
      gl.enableVertexAttribArray(aTexLocation);
      gl.vertexAttribPointer(aTexLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      index_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

      texture1 = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture1);
      gl.uniform1i( gl.getUniformLocation( shaderProgram, 'texture' ), 0 );
      gl.bindTexture(gl.TEXTURE_2D, null);


      //==========================================================//

      canvas2 = document.getElementById('glCanvas2');
      gl2 = canvas2.getContext('webgl');
      var vertShader2 = gl2.createShader(gl2.VERTEX_SHADER);
      var fragShader2 = gl2.createShader(gl2.FRAGMENT_SHADER);
      gl2.shaderSource(vertShader2, vertCode);
      gl2.shaderSource(fragShader2, fragCode);
      gl2.compileShader(vertShader2);
      gl2.compileShader(fragShader2);

      shaderProgram2 = gl2.createProgram();
      gl2.attachShader(shaderProgram2, vertShader2);
      gl2.attachShader(shaderProgram2, fragShader2);
      gl2.deleteShader( vertShader2 );
      gl2.deleteShader( fragShader2 );
      gl2.linkProgram(shaderProgram2);
      gl2.useProgram(shaderProgram2);

      aVertLocation2 = gl2.getAttribLocation(shaderProgram2, "coordinates");
      aTexLocation2 = gl2.getAttribLocation(shaderProgram2, "aTexCoord");

      vertex_buffer2 = gl2.createBuffer();
      gl2.bindBuffer(gl2.ARRAY_BUFFER, vertex_buffer2);
      gl2.enableVertexAttribArray(aVertLocation2);
      gl2.vertexAttribPointer(aVertLocation2, 2, gl2.FLOAT, false, 0, 0);
      gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(vertices), gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, null);

      texture_buffer2 = gl2.createBuffer();
      gl2.bindBuffer(gl2.ARRAY_BUFFER, texture_buffer2);
      gl2.enableVertexAttribArray(aTexLocation2);
      gl2.vertexAttribPointer(aTexLocation, 2, gl2.FLOAT, false, 0, 0);
      gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array(texCoords), gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.ARRAY_BUFFER, null);

      index_buffer2 = gl2.createBuffer();
      gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, index_buffer2);
      gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, null);

      texture2 = gl2.createTexture();
      gl2.bindTexture(gl2.TEXTURE_2D, texture2);
      gl2.uniform1i( gl2.getUniformLocation( shaderProgram2, 'texture' ), 0 );
      gl2.bindTexture(gl2.TEXTURE_2D, null); 
    }

    function updateTexture()
    {
      gl.bindTexture(gl.TEXTURE_2D, texture1);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }  

    function render()
    {
      if ( !shaderProgram ) return;
      updateTexture();
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
      gl.bindTexture(gl.TEXTURE_2D, texture1);
      gl.enableVertexAttribArray(aVertLocation);
      gl.enableVertexAttribArray(aTexLocation);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer)
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      gl.disableVertexAttribArray(aVertLocation);
      gl.disableVertexAttribArray(aTexLocation);

    }

    function updateTexture2()
    {
      gl2.bindTexture(gl2.TEXTURE_2D, texture2);
      gl2.texImage2D(gl2.TEXTURE_2D, 0, gl2.RGBA, gl2.RGBA, gl2.UNSIGNED_BYTE, canvas1);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.LINEAR);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.LINEAR);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE);
      gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE);
      gl2.generateMipmap(gl2.TEXTURE_2D);  
      gl2.bindTexture(gl2.TEXTURE_2D, null);
    }  

    function render2()
    {
      if ( !shaderProgram2 ) return;
      updateTexture2();
      gl2.clearColor(0.0, 0.0, 0.0, 1.0);
      gl2.clear( gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT );
      gl2.bindTexture(gl2.TEXTURE_2D, texture2);
      gl2.enableVertexAttribArray(aVertLocation2);
      gl2.enableVertexAttribArray(aTexLocation2);
      gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, index_buffer2);
      gl2.drawElements(gl2.TRIANGLES, 6, gl2.UNSIGNED_SHORT,0);
      gl2.disableVertexAttribArray(aVertLocation2);
      gl2.disableVertexAttribArray(aTexLocation2);
    }

    document.addEventListener('DOMContentLoaded', initApp);

<!-- language: lang-html -->

    <canvas id="glCanvas1" width="128" height="128" ></canvas>
    <canvas id="glCanvas2" width="128" height="128" ></canvas>

<!-- end snippet -->


