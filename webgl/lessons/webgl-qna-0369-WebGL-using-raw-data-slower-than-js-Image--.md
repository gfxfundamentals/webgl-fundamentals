Title: WebGL using raw data slower than js Image()
Description:
TOC: qna

# Question:

We are writing a web client to stream video, one type of stream uses a proprietary library, so we cannot use current plugins or HTML tags that support standard urls.
I have several years experience with OpenGL, so I decided to try out WebGL for rendering raw data frames.

Rendering using a js Image() that loads png files is extremely fast.  But rendering with raw RGBA data is extremely slow.

I am putting the raw data in a Uint8Array() and using the gl.texImage2D() that accepts width height, while the PNG rendering uses the gl.texImage2D() version that accepts an Image and no width height.

I would have assumed the raw data would be faster since it doesn't have to load and decode the png file, but it seems backwards.

My background is largely C++ and have a fair amount of experience with desktop OpenGL.  HTML5 and javascript are still fairly new to me.

Why is WebGL rendering the Image() (1024x1024) much much quicker, and even a small image of raw data (32x32) much much slower?  Is there a way to speed this up?  I am running this on the newest version of Firefox.

Edit:
The problem was actually passing data from the plugin to javascript.  I was profiling using Date.getTime(), but apparently that is not a good way since the time before and after creating an array and getting data from the plugin was the same.  I've switched to getting data from a local HTTP server which has shown great performance improvement when getting and rendering raw data.

# Answer

Hmm, let's test

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl");
    var work = document.getElementById("w");
    var fps = document.getElementById("f");

    var imageData = new Uint8Array(canvas.width * canvas.height * 4);

    var program = webglUtils.createProgramFromScripts(
        gl, ["vshader", "fshader"], ["a_position"]);
    gl.useProgram(program);

    var verts = [
          1,  1,  
         -1,  1,  
         -1, -1,  
          1,  1,  
         -1, -1,  
          1, -1,  
    ];
    var vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    var adjust = 1;
    var workAmount = adjust;
    var oneFrame = 1 / 50;  // shoot for 50fps since timing is poor
    var then = Date.now() * 0.001;
    var frameCount = 0;
    var maxIndex = canvas.width * canvas.height;

    function doStuff() {
        var now = Date.now() * 0.001;
        var deltaTime = now - then;
        then = now;
        ++frameCount;
        
        if (deltaTime < oneFrame) {
            workAmount += adjust;
        } else {
            workAmount = Math.max(workAmount - adjust, adjust);
        }
        
        fps.innerHTML = (1 / deltaTime).toFixed(1);
        work.innerHTML = workAmount;
        
        var color = (frameCount & 1) ? 255 : 128;
        for (var i = 0; i < workAmount; ++i) {
            var index = (Math.random() * maxIndex | 0) * 4;
            imageData[index + 0] = color;
            imageData[index + 1] = color;
            imageData[index + 2] = color;
            imageData[index + 3] = 255;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, 
                         gl.RGBA, gl.UNSIGNED_BYTE, imageData);    
        }
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(doStuff);
    }
    doStuff();

<!-- language: lang-css -->

    body, document {
        font-family: monospace;
    }
    #c {
        width: 128px;
        height: 128px;
        border: 1px solid red;
    }
    #outer {
      position: relative;   
    }
    #info {
      position: absolute;
      left: 10px;
      top: 10px;
      background-color: white;
      padding: 0.5em;
    }

<!-- language: lang-html -->

    <div id="outer">
        <canvas id="c" width="1024" height="1024"></canvas>
        <div id="info">
          <div>fps : <span id="f"></span></div>
          <div>work: <span id="w"></span></div>
        </div>
    </div>

    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>
    <script id="vshader" type="whatever">
        attribute vec4 a_position;
        varying vec2 v_texcoord;

        void main() {
          gl_Position = a_position;
          v_texcoord = a_position.xy * 0.5 + 0.5;
        }    
    </script>
    <script id="fshader" type="whatever">
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_sampler;
    void main() {
        gl_FragColor = texture2D(u_sampler, v_texcoord);
    }
    </script>

<!-- end snippet -->

On my 2014 MBP I get about 20 1024x1024 RGBA/UNSIGNED_BYTE uploads a frame at 50fps on Chrome and about the same on Firefox

What do you get? Are you sure your bottleneck is the texture uploads and not something else?
