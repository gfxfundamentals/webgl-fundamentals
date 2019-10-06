Title: How to map different textures to different faces of a cube in WebGL?
Description:
TOC: qna

# Question:

I have the following cube coordinates:

    var vertices = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
    
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
    
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
    
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
    
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
    
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
    ];
    
And these are the texture coordinates: 
    
    var textureCoordinates = [
        // Front
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,

        // Back
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,

        // Top
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,

        // Bottom
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,

        // Right
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,

        // Left
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0
    ];

Right now, via the code below, it loads only one texture image.

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

I got this code sample from [MDN web docs][1] and I was wondering what modifications I should do so that each cube face can be set a different texture. I have read about changing the active texture but I do not know how to do it so that it does not affect the whole cube. I am new to WebGL and I hope someone can help me understand this.


  [1]: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL

# Answer

The arguably best way to put different images on a cube is to put all the images into one texture and use UV coordinates to select a different part of the textures for each face of the cube.

[See example on this page with lots of explanation](http://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)

Or here

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    "use strict";
    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl");
    // compiles shader, links and looks up locations
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
      texcoord: [
     // select the bottom left image
        0   , 0  ,
        0   , 0.5,
        0.25, 0.5,
        0.25, 0  ,
        // select the bottom middle image
        0.25, 0  ,
        0.5 , 0  ,
        0.5 , 0.5,
        0.25, 0.5,
        // select to bottom right image
        0.5 , 0  ,
        0.5 , 0.5,
        0.75, 0.5,
        0.75, 0  ,
        // select the top left image
        0   , 0.5,
        0.25, 0.5,
        0.25, 1  ,
        0   , 1  ,
        // select the top middle image
        0.25, 0.5,
        0.25, 1  ,
        0.5 , 1  ,
        0.5 , 0.5,
        // select the top right image
        0.5 , 0.5,
        0.75, 0.5,
        0.75, 1  ,  
        0.5 , 1  ,
      ],
      indices:  [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    var tex = twgl.createTexture(gl, {
      src: "https://webglfundamentals.org/webgl/resources/noodles.jpg",
      crossOrigin: "",
    });

    var uniforms = {
      u_texture: tex,
    };

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10);
      var eye = [1, 4, -6];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(view, projection);
      var world = m4.rotationY(time);

      uniforms.u_worldViewProjection = m4.multiply(world, viewProjection);

      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
      twgl.setUniforms(programInfo, uniforms);
      // calls gl.drawArray or gl.drawElements
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0px; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 v_texCoord;

    void main() {
      v_texCoord = texcoord;
      gl_Position = u_worldViewProjection * position;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_texCoord;

    uniform sampler2D u_texture;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
      </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c"></canvas>

<!-- end snippet -->

There are many reasons why it's arguably the best way. As a simple example of why this is the way if you actually made a shader that uses 6 textures you'd need a different shader for a pyramid (3-4 faces) and another for an icosahedron (12 faces) and yet another for a dodecahedron (20 faces) whereas if you put the images in one texture it just works with the same shader.

Even if you want to load the 6 images separately it would arguably be best to make a 2d canvas, use `drawImage` to copy all 6 images into that canvas and then copy that canvas to a single texture.


<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    "use strict";
    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl");
    // compiles shader, links and looks up locations
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1],
      texcoord: [
     // select the bottom left image
        0   , 0  ,
        0   , 0.5,
        0.25, 0.5,
        0.25, 0  ,
        // select the bottom middle image
        0.25, 0  ,
        0.5 , 0  ,
        0.5 , 0.5,
        0.25, 0.5,
        // select to bottom right image
        0.5 , 0  ,
        0.5 , 0.5,
        0.75, 0.5,
        0.75, 0  ,
        // select the top left image
        0   , 0.5,
        0.25, 0.5,
        0.25, 1  ,
        0   , 1  ,
        // select the top middle image
        0.25, 0.5,
        0.25, 1  ,
        0.5 , 1  ,
        0.5 , 0.5,
        // select the top right image
        0.5 , 0.5,
        0.75, 0.5,
        0.75, 1  ,  
        0.5 , 1  ,
      ],
      indices:  [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);


    var ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = 512;
    ctx.canvas.height = 256;
    ctx.fillRect(0, 0, 512, 256);  // black to start

    var tex = gl.createTexture();
    uploadCanvasToTexture();

    [
      "https://i.imgur.com/weklTat.gif",
      "https://i.imgur.com/6AvnLa3.jpg",
      "https://i.imgur.com/HkzeCU2.jpg",
      "https://i.imgur.com/D9HVm6n.png",
      "https://i.imgur.com/7MlmkJr.jpg",
      "https://i.imgur.com/v38pV.jpg",
    ].forEach(function(url, ndx) {
      var img = new Image();
      img.onload = function() {
        addFaceToCanvasAndUploadToTexture(img, ndx);
      };
      img.crossOrigin = "";
      img.src = url;
    });
      
    function addFaceToCanvasAndUploadToTexture(img, ndx) {
      var x = ndx % 3;
      var y = ndx / 3 | 0;
      ctx.drawImage(img, 0, 0, img.width, img.height, x * 128, y * 128, 128, 128);
      uploadCanvasToTexture();
    }
      
    function uploadCanvasToTexture() {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, ctx.canvas);
      gl.generateMipmap(gl.TEXTURE_2D);
    }    
        
    var uniforms = {
      u_texture: tex,
    };

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10);
      var eye = [1, 4, -6];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(view, projection);
      var world = m4.rotationY(time);

      uniforms.u_worldViewProjection = m4.multiply(world, viewProjection);

      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
      twgl.setUniforms(programInfo, uniforms);
      // calls gl.drawArray or gl.drawElements
      twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0px; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 v_texCoord;

    void main() {
      v_texCoord = texcoord;
      gl_Position = u_worldViewProjection * position;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_texCoord;

    uniform sampler2D u_texture;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
      </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c"></canvas>

<!-- end snippet -->


If you really need the resolution for each face then the 2nd most common way would be to  make 6 planes and just position them so they form a cube. Put a single texture on each plane. Draw with 6 draw calls, one for each plane.



<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    "use strict";
    var m4 = twgl.m4;
    var gl = document.getElementById("c").getContext("webgl");
    // compiles shader, links and looks up locations
    var programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

    var arrays = {
      position: [
        -1, -1, 0,
         1, -1, 0,
        -1,  1, 0,
         1,  1, 0,
      ],
      texcoord: [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
      ],
      indices:  [
        0, 1, 2, 2, 1, 3,
      ],
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
        
    // calls gl.createTexture, gl.bindTexture, gl.texImage2D, gl.texParameteri
    var textures = twgl.createTextures(gl, {
      face0: { src:"https://i.imgur.com/weklTat.gif", crossOrigin: "", },
      face1: { src:"https://i.imgur.com/6AvnLa3.jpg", crossOrigin: "", },
      face2: { src:"https://i.imgur.com/HkzeCU2.jpg", crossOrigin: "", },
      face3: { src:"https://i.imgur.com/D9HVm6n.png", crossOrigin: "", },
      face4: { src:"https://i.imgur.com/7MlmkJr.jpg", crossOrigin: "", },
      face5: { src:"https://i.imgur.com/v38pV.jpg", crossOrigin: "", },
    });
        
    var models = [
      { tex: textures.face0, local: m4.translate(m4.rotationY(Math.PI * 0.0), [0, 0, 1]), },
      { tex: textures.face1, local: m4.translate(m4.rotationY(Math.PI * 0.5), [0, 0, 1]), }, 
      { tex: textures.face2, local: m4.translate(m4.rotationY(Math.PI * 1.0), [0, 0, 1]), }, 
      { tex: textures.face3, local: m4.translate(m4.rotationY(Math.PI * 1.5), [0, 0, 1]), }, 
      { tex: textures.face4, local: m4.translate(m4.rotationX(Math.PI * 0.5), [0, 0, 1]), }, 
      { tex: textures.face5, local: m4.translate(m4.rotationX(Math.PI * 1.5), [0, 0, 1]), }, 
    ];

    var uniforms = {
    };

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var projection = m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, 10);
      var eye = [1, 4, -6];
      var target = [0, 0, 0];
      var up = [0, 1, 0];

      var camera = m4.lookAt(eye, target, up);
      var view = m4.inverse(camera);
      var viewProjection = m4.multiply(view, projection);

      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      models.forEach(function(model) {
        var world = m4.rotationY(time);
        m4.multiply(model.local, world, world);
        uniforms.u_texture = model.tex;
        uniforms.u_worldViewProjection = m4.multiply(world, viewProjection);

        // calls gl.uniformXXX, gl.activeTexture, gl.bindTexture
        twgl.setUniforms(programInfo, uniforms);
        // calls gl.drawArray or gl.drawElements
        twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);
      });

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { margin: 0px; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script id="vs" type="notjs">
    uniform mat4 u_worldViewProjection;

    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 v_texCoord;

    void main() {
      v_texCoord = texcoord;
      gl_Position = u_worldViewProjection * position;
    }
      </script>
      <script id="fs" type="notjs">
    precision mediump float;

    varying vec2 v_texCoord;

    uniform sampler2D u_texture;
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
      </script>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>
    <canvas id="c"></canvas>

<!-- end snippet -->


