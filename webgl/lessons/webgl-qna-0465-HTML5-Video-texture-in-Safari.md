Title: HTML5 Video texture in Safari
Description:
TOC: qna

# Question:

Is it possible to use videos as texture for webGL in Safari (I'm not even talking iOS Safari)?? I could not make it work. Here is the most simple code I could come up with to reproduce: https://jsfiddle.net/bmkb6r9h/3/ and it doesn't work [here][1] either.

It fails as soon as the video source is coming from another domain or subdomain with `SecurityError: DOM Exception 18: An attempt was made to break through the security policy of the user agent` when attaching the video texture with `texImage2D`.

Here is my code (sorry it's a bit long, but it's how webGL goes) Also happy to get comment on how to improve the webGL. I've taken code from https://github.com/hawksley/eleVR-Web-Player that is a great intro to 360 video player.

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    // get DOM elements
    videoContainer = document.getElementById('video-container');
    video = document.getElementById('video');
    canvas = document.getElementById('glcanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // load the video, and play on ready
    video.load();
    video.oncanplaythrough = function() {
      video.play();
      drawScene();
    };

    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    // create and attach the shader program to the webGL context
    var attributes, uniforms, program;
    var attachShader = function(params) {
      // compile the shaders from the shaders scripts
      var getShaderByName = function(id) {
        var shaderScript = document.getElementById(id);

        var theSource = "";
        var currentChild = shaderScript.firstChild;

        while(currentChild) {
          if (currentChild.nodeType === 3) {
            theSource += currentChild.textContent;
          }
          currentChild = currentChild.nextSibling;
        }

        var result;
        if (shaderScript.type === "x-shader/x-fragment") {
          result = gl.createShader(gl.FRAGMENT_SHADER);
        } else {
          result = gl.createShader(gl.VERTEX_SHADER);
        }
        gl.shaderSource(result, theSource);
        gl.compileShader(result);

        if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
          alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(result));
          return null;
        }
        return result;
      };

      fragmentShader = getShaderByName(params.fragmentShaderName);
      vertexShader = getShaderByName(params.vertexShaderName);

      program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
      }
      gl.useProgram(program);

      // get the location of attributes and uniforms
      attributes = {};
      for (var i = 0; i < params.attributes.length; i++) {
        var attributeName = params.attributes[i];
        attributes[attributeName] = gl.getAttribLocation(program, attributeName);
        gl.enableVertexAttribArray(attributes[attributeName]);
      }
      uniforms = {};
      for (i = 0; i < params.uniforms.length; i++) {
        var uniformName = params.uniforms[i];
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
        gl.enableVertexAttribArray(attributes[uniformName]);
      }
    };
    attachShader({
      fragmentShaderName: 'shader-fs',
      vertexShaderName: 'shader-vs',
      attributes: ['aVertexPosition'],
      uniforms: ['uSampler'],
    });

    // some webGL initialization
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.disable(gl.DEPTH_TEST);

    positionsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
    var positions = [
      -1.0, -1.0,
      1.0, -1.0,
      1.0,  1.0,
      -1.0,  1.0,
    ];
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

      verticesIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
      var vertexIndices = [
      0,  1,  2,      0,  2,  3,
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
                  new Uint16Array(vertexIndices), gl.STATIC_DRAW);

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // update the texture from the video
    updateTexture = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      // the next line fails in Safari if the video is coming from another domain or subdomain
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB,
                    gl.UNSIGNED_BYTE, video);
      gl.bindTexture(gl.TEXTURE_2D, null);
    };

    // draw stuff in the canvas
    drawScene = function() {
      updateTexture();
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
      gl.vertexAttribPointer(attributes['aVertexPosition'], 2, gl.FLOAT, false, 0, 0);

      // Specify the texture to map onto the faces.
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms['uSampler'], 0);

      // Draw
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      // keep looping
      requestAnimationFrame(drawScene);
    };



<!-- language: lang-html -->



    <!-- Fragmend shader program -->
    <script id="shader-fs" type="x-shader/x-fragment">
    varying mediump vec2 vDirection;
    uniform sampler2D uSampler;
    void main(void) {
      gl_FragColor = texture2D(uSampler, vec2(vDirection.x * 0.5 + 0.5, vDirection.y * 0.5 + 0.5));
    }
    </script>

    <!-- Vertex shader program -->
    <script id="shader-vs" type="x-shader/x-vertex">
    attribute mediump vec2 aVertexPosition;
    varying mediump vec2 vDirection;
    void main(void) {
      gl_Position = vec4(aVertexPosition, 1.0, 1.0) * 2.0;
      vDirection = aVertexPosition;
    }
    </script>

    <div id="video-container" style="width: 100vw; height: 100vh;">
      <canvas id="glcanvas"></canvas>
      <video preload="auto" id="video" loop="true" webkit-playsinline crossOrigin="anonymous" style="    width: 300px; height: 200px;" controls>
        <source src="http://vjs.zencdn.net/v/oceans.mp4" type="video/mp4">
      </video>
    </div>




<!-- end snippet -->

Things work perfectly in Chrome/Firefox.


  [1]: http://krpano.com/ios/bugs/ios8-webgl-video-cors/

# Answer

It's a bug in Safari. Safari does not yet support CORS (cross origin support) for video. See [this webkit bug](https://bugs.webkit.org/show_bug.cgi?id=135379).

[Video does work in WebGL in Safari if the video is from the same origin](http://threejs.org/examples/webgl_materials_video.html).
