Title: Rendering to texture and attribute location
Description:
TOC: qna

# Question:

I am using webgl and what I want to do is first render to a texture, then use that texture to render on screen, and I encounter a problem with an attribute in the first step render.

I will try to explain in a few words what I am trying to do. First I want to use a fragment shader to render to a texture something that uses an attribute, then use that texture to render to screen, and repeat the steps for the next frame. But when I try to render with the framebuffer bound that attribute (pos) has invalid values, I mean, no value at all. 

I wrote a little demo that shows my problem:

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var canvas = document.getElementById("c");
    var gl = getWebGLContext(canvas); 

    var program_init, program_pers, tex, fb;

    function init() {
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
     gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(0);
        
        tex = gl.createTexture();
        fb = gl.createFramebuffer();

        program_init = createProgramFromScripts(gl, ["vshader-init", "fshader-init"], ["pos"]);
        program_pers = createProgramFromScripts(gl, ["vshader-pers", "fshader-pers"], ["a_position"]);
    }

    function renderToTexture(gl, time) {
     gl.useProgram(program_init);
     
     var timeLocation = gl.getUniformLocation(program_init, 'time');
     gl.uniform1f(timeLocation, time);

     gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

     gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

     gl.drawArrays(gl.TRIANGLES, 0, 6);
        
     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    function renderToScreen(gl) {
     gl.useProgram(program_pers);
     gl.drawArrays(gl.TRIANGLES, 0, 6);
    }; 

    init();
    requestAnimationFrame(function(){
     renderToTexture(gl, arguments[0]);
     renderToScreen(gl);
     
     requestAnimationFrame( arguments.callee );
    });

<!-- language: lang-css -->

    canvas { border: 1px solid black; }
    body { background-color: darkslategrey }

<!-- language: lang-html -->

    <script src="http://greggman.github.com/webgl-fundamentals/webgl/resources/webgl-utils.js"></script>

    <script id="vshader-init" type="vs/shader">
    attribute vec4 pos;
    varying vec2 uv;

    void main() {
     gl_Position = pos;
     uv = pos.xy * .5 + .5;
    }    
    </script>
    <script id="fshader-init" type="fs/shader">
    precision mediump float;
    varying vec2 uv;

    uniform float time;

    void main() {
     float t = floor(time / 1000.);
     vec3 color;
     color.x = sin(t*uv.x);
     color.y = tan(t*uv.y);
     color.z = cos(t);
     
        gl_FragColor = vec4(color, 1.);
    }
    </script>

    <script id="vshader-pers" type="vs/shader">
    attribute vec4 a_position;
    varying vec2 v_texcoord;

    void main() {
     gl_Position = a_position;
     v_texcoord = a_position.xy * .5 + .5;
    }    
    </script>
    <script id="fshader-pers" type="fs/sahder">
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_sampler;
    void main() {
     gl_FragColor = texture2D(u_sampler, v_texcoord);
    }
    </script>

    <body>
     <canvas id="c" width="400" height="400"></canvas>
    </body>

<!-- end snippet -->

If I comment the line 38,39 from the javascript code (the binding of the frameBuffer) and line 54 (the rendering to screen code, that runs a different program) we can see that it renders corectly and the name "pos" is given the right values.

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var canvas = document.getElementById("c");
    var gl = getWebGLContext(canvas); 

    var program_init, program_pers, tex, fb;

    function init() {
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
     gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(0);
        
        tex = gl.createTexture();
        fb = gl.createFramebuffer();

        program_init = createProgramFromScripts(gl, ["vshader-init", "fshader-init"], ["pos"]);
        program_pers = createProgramFromScripts(gl, ["vshader-pers", "fshader-pers"], ["a_position"]);
    }

    function renderToTexture(gl, time) {
     gl.useProgram(program_init);
     
     var timeLocation = gl.getUniformLocation(program_init, 'time');
     gl.uniform1f(timeLocation, time);

     gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

     //gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
     //gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

     gl.drawArrays(gl.TRIANGLES, 0, 6);
        
     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    function renderToScreen(gl) {
     gl.useProgram(program_pers);
     gl.drawArrays(gl.TRIANGLES, 0, 6);
    }; 

    init();
    requestAnimationFrame(function(){
     renderToTexture(gl, arguments[0]);
     //renderToScreen(gl);
     
     requestAnimationFrame( arguments.callee );
    });

<!-- language: lang-css -->

    canvas { border: 1px solid black; }
    body { background-color: darkslategrey }

<!-- language: lang-html -->

    <script src="http://greggman.github.com/webgl-fundamentals/webgl/resources/webgl-utils.js"></script>

    <script id="vshader-init" type="vs/shader">
    attribute vec4 pos;
    varying vec2 uv;

    void main() {
     gl_Position = pos;
     uv = pos.xy * .5 + .5;
    }    
    </script>
    <script id="fshader-init" type="fs/shader">
    precision mediump float;
    varying vec2 uv;

    uniform float time;

    void main() {
     float t = floor(time / 1000.);
     vec3 color;
     color.x = sin(t*uv.x);
     color.y = tan(t*uv.y);
     color.z = cos(t);
     
        gl_FragColor = vec4(color, 1.);
    }
    </script>

    <script id="vshader-pers" type="vs/shader">
    attribute vec4 a_position;
    varying vec2 v_texcoord;

    void main() {
     gl_Position = a_position;
     v_texcoord = a_position.xy * .5 + .5;
    }    
    </script>
    <script id="fshader-pers" type="fs/shader">
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_sampler;
    void main() {
     gl_FragColor = texture2D(u_sampler, v_texcoord);
    }
    </script>

    <body>
     <canvas id="c" width="400" height="400"></canvas>
    </body>

<!-- end snippet -->

I do not know much about how it is supposed to work and I am a bit into the dark. I am sure I'm missing something important, but I can't find anywhere what. Any help will be appreciated.

# Answer

Your framebuffer texture is 1x1 pixels big. What do you expect to see? You're rendering a single pixel.

Also note that unless your framebuffer is the same size as the canvas you'll want to call `gl.viewport` and set it to the size of the thing you rendering after each call to `gl.bindFramebuffer`

You probably also want to not create the texture every frame. Here's your code with those things changed.

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var canvas = document.getElementById("c");
    var gl = canvas.getContext("webgl"); 

    var program_init, program_pers, tex, fb;
    var fbWidth = 400;
    var fbHeight = 300;

    function init() {
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
     gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(0);
        
        tex = gl.createTexture();
        fb = gl.createFramebuffer();

        program_init = webglUtils.createProgramFromScripts(gl, ["vshader-init", "fshader-init"], ["pos"]);
        program_pers = webglUtils.createProgramFromScripts(gl, ["vshader-pers", "fshader-pers"], ["a_position"]);
      
       gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbWidth, fbHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        // make non power-of-2 texture renderable
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

     gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    }

    function renderToTexture(gl, time) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.viewport(0, 0, fbWidth, fbHeight);
      
        gl.useProgram(program_init);
     
     var timeLocation = gl.getUniformLocation(program_init, 'time');
     gl.uniform1f(timeLocation, time);

     gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    function renderToScreen(gl) {    
     gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
     gl.useProgram(program_pers);
     gl.drawArrays(gl.TRIANGLES, 0, 6);
    }; 

    init();
    requestAnimationFrame(function(){
     renderToTexture(gl, arguments[0]);
     renderToScreen(gl);
     
     requestAnimationFrame( arguments.callee );
    });

<!-- language: lang-css -->

    canvas { border: 1px solid black; }
    body { background-color: darkslategrey }

<!-- language: lang-html -->

    <script src="https://webglfundamentals.org/webgl/resources/webgl-utils.js"></script>

    <script id="vshader-init" type="vs/shader">
    attribute vec4 pos;
    varying vec2 uv;

    void main() {
     gl_Position = pos;
     uv = pos.xy * .5 + .5;
    }    
    </script>
    <script id="fshader-init" type="fs/shader">
    precision mediump float;
    varying vec2 uv;

    uniform float time;

    void main() {
     float t = floor(time / 1000.);
     vec3 color;
     color.x = sin(t*uv.x);
     color.y = tan(t*uv.y);
     color.z = cos(t);
     
        gl_FragColor = vec4(color, 1.);
    }
    </script>

    <script id="vshader-pers" type="vs/shader">
    attribute vec4 a_position;
    varying vec2 v_texcoord;

    void main() {
     gl_Position = a_position;
     v_texcoord = a_position.xy * .5 + .5;
    }    
    </script>
    <script id="fshader-pers" type="fs/sahder">
    precision mediump float;
    varying vec2 v_texcoord;
    uniform sampler2D u_sampler;
    void main() {
     gl_FragColor = texture2D(u_sampler, v_texcoord);
    }
    </script>

    <body>
     <canvas id="c" width="400" height="400"></canvas>
    </body>

<!-- end snippet -->


