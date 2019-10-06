Title: cannot ever figure out how to do texture jobs in twgl
Description:
TOC: qna

# Question:

This is the code I have for vs/fs and a simple cube that I want to put on to my canvas. some of the part is omitted for the sake of lengthiness.

    <script id="cube-vs" type="notjs">
        precision highhp float;
        attribute vec3 vpos;
        attribute vec3 vnormal;
        attribute vec2 vtex;
        varying vec3 fColor;
        varying vec3 fNormal;
        varying vec2 fTexCoord;
        
        uniform mat4 view;
        uniform mat4 proj;
        uniform mat4 model;
        uniform vec3 lightdir;
        uniform vec3 cubecolor;
        
        void main(void) {
            gl_Position = proj * view * model * vec4(vpos, 1.0);
            vec4 normal = normalize(model * vec4(vnormal,0.0));
            float diffuse = .2 + abs(dot(normal, vec4(lightdir,0.0)));
            fColor = (cubecolor * diffuse);
            fTexCoord = vtex;
        }
    </script>
    <script id="cube-fs" type="notjs">

        precision highhp float;
        
        varying vec3 fColor;
        varying vec3 fNormal;
        varying vec2 fTexCoord;

        uniform sampler2D texSampler;
        
        void main(void) {
            vec4 texColor = texture2d(texSampler, fTexCoord);
            gl_FragColor = vec4(fColor*texColor.xyz,1.0);
        }
    </script>




the cube

    ...

        Cube.prototype.init = function(drawingState) {
            var gl=drawingState.gl;
            // create the shaders once - for all cubes
            if (!shaderProgram) {
                shaderProgram = twgl.createProgramInfo(gl, ["tree-vs", "tree-fs"]);
            }
            if (!buffers) {
                var arrays = {
                    vpos : { numComponents: 3, data: [...] },
                    vnormal : {numComponents:3, data: [...]},
                    vtex : {numComponents:2, data: [
                        1,0,0,0,0,1,1,1,
                        1,0,0,0,0,1,1,1,
                        1,0,0,0,0,1,1,1,
                        1,0,0,0,0,1,1,1,
                        1,0,0,0,0,1,1,1,
                        1,0,0,0,0,1,1,1,
                    ]},
                    indices : {[...]}
                    };
                buffers = twgl.createBufferInfoFromArrays(gl,arrays);
            }
            if (!texture) {
                texture = twgl.createTexture(gl, {src:textures/tree.jpg});
            }    
        };
        Cube.prototype.draw = function(drawingState) {
            var modelM = twgl.m4.scaling([this.size*1.4,this.size*1.4,this.size*1.4]);
            twgl.m4.setTranslation(modelM,this.position,modelM);
            var gl = drawingState.gl;
            gl.useProgram(shaderProgram.program);
            twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
            twgl.setUniforms(shaderProgram,{
                view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
                cubecolor:this.color, model: modelM, texSampler: texture);
            twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
        };



the cube worked fine without texture
but when I tried to put texture on, it never works
I tried almost everything and I still can't figure out how to put texture on.
so, how can i put texture on?


any hints would be very much appreciated.


*********edit
I have managed to successfully upload the texture coordinates and uniforms
but the image does not show up and the cube is colored light blue.
any suggestions would be very much appreciated.



# Answer

It would be nice if you could provide a working example instead of just parts of the code. There's several typos in the code above. For example in the `setUniforms` part there's no closing `}`. In the `createTexture` part there's no quotes on the url. You spelled `highp` as `highhp` and `texture2D` as `texture2d`. I assume if you say it's running though without textures those are just transcription errors because if not you should see very clear errors in the JavaScript console.

It's not clear what's wrong but when debugging WebGL the first I'd do is check the JavaScript console. Are there any messages about un-renderable textures?

No? Then the next thing i'd do is change the fragment shader to a solid color

    <script id="cube-fs" type="notjs">
    
        precision highhp float;
    
        varying vec3 fColor;
        varying vec3 fNormal;
        varying vec2 fTexCoord;
    
        uniform sampler2D texSampler;
    
        void main(void) {
            vec4 texColor = texture2d(texSampler, fTexCoord);
            gl_FragColor = vec4(fColor*texColor.xyz,1.0);
    gl_FragColor = vec4(1,0,0,1);  // -------ADDED-------------------------
        }
    </script>

If you see your cube then yes, the issue is related to the texture. If not the issue is somewhere else.

Let's assume you see a red cube. Ok, next thing is to check the texture coordinates. I'd change the fragment shader to this

    <script id="cube-fs" type="notjs">
    
        precision highhp float;
    
        varying vec3 fColor;
        varying vec3 fNormal;
        varying vec2 fTexCoord;
    
        uniform sampler2D texSampler;
    
        void main(void) {
            vec4 texColor = texture2d(texSampler, fTexCoord);
            gl_FragColor = vec4(fColor*texColor.xyz,1.0);
    gl_FragColor = vec4(fTexCoord,0,1);  // -------CHANGED-------------------------
        }
    </script>

You should see the cube now with red->green shading. If not you've got bad texture coordinates.

If that looks correct the next thing I might try is put the shader back the way it was originally then check if the variable `texture` is actually set.

There's a bunch of ways I could check this.

1.  Use the [WebGL Inspector](https://benvanik.github.io/WebGL-Inspector/)

2.  Use the standard JavaScript debugger. Put a breakpoint on the `setUniforms` part. Inspect the variables

3.  Do something like this

        var uniforms = {
            view:drawingState.view, 
            proj:drawingState.proj, 
            lightdir:drawingState.sunDirection,
            cubecolor:this.color, 
            model: modelM, 
            texSampler: texture,
        };
        window.u = uniforms;
        twgl.setUniforms(shaderProgram, uniforms);

    Now open the JavaScript console and type `u.texSampler`. It should print something like 

        WebGLTexture {}

    If it doesn't then probably `texture` is not the variable you think it is

One other question is are you rendering constantly using requestAnimationFrame as in

    function render() {
      // draw stuff like maybe call someCube.draw(drawingState)
      ...
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

I ask because textures are loaded asynchronously so if you are only rendering once then you won't see any textures because they have not yet been loaded.

You have a few options.

1. Render constantly (like the example above)

   twgl will default to a 1x1 pixel texture so rendering should work. Then the image is finally loaded it will update the texture

2. Wait for the texture to load.

   If you don't want to render until the texture is ready then you can add a callback to `twgl.createTexture` and it will call you back when the texture is ready.
 
The other thing to do is to start with a working sample

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var m4 = twgl.m4;                                              // <!------------ ADDED
    var v3 = twgl.v3;                                              // <!------------ ADDED

    // not sure why these are globals?!???!
    var shaderProgram;                                             // <!------------ ADDED
    var texture;                                                   // <!------------ ADDED
    var buffers;                                                   // <!------------ ADDED
    var canvas = document.querySelector("canvas");                 // <!------------ ADDED
    var drawingState = {                                           // <!------------ ADDED
      gl: canvas.getContext("webgl"),                              // <!------------ ADDED
      view: m4.inverse(m4.lookAt([3,3,6], [0, 0, 0], [0, 1, 0])),  // <!------------ ADDED
      proj: m4.perspective(                                        // <!------------ ADDED
        Math.PI * 0.3,                                             // <!------------ ADDED
        canvas.clientWidth / canvas.clientHeight,                  // <!------------ ADDED
        0.1, 10),                                                  // <!------------ ADDED
      sunDirection: v3.normalize([2,3,-2]),                        // <!------------ ADDED
    };                                                             // <!------------ ADDED


    function Cube() {            // <!-------------------------------------- ADDED
      this.size = 1;             // <!-------------------------------------- ADDED
      this.position = [0, 0, 0]; // <!-------------------------------------- ADDED 
      this.color = [1, 1, 1];    // <!-------------------------------------- ADDED
    }                            // <!-------------------------------------- ADDED

    Cube.prototype.init = function(drawingState) {
      var gl=drawingState.gl;
      // create the shaders once - for all cubes
      if (!shaderProgram) {
        shaderProgram = twgl.createProgramInfo(gl, ["cube-vs", "cube-fs"]);  // <!---- CHANGED
      }
      if (!buffers) {
        var arrays = {
          vpos: { numComponents: 3, data: [1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1], },
          vnormal:  { numComponents: 3, data:  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1], },
          vtex: { numComponents: 2, data: [1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1], },
          indices:  [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23],
        };
        buffers = twgl.createBufferInfoFromArrays(gl,arrays);
      }
      if (!texture) {
        texture = twgl.createTexture(gl, {
          src: "https://farm6.staticflickr.com/5795/21506301808_efb27ed699_q_d.jpg",
          crossOrigin: "", // <!--------- not needed if on same server which "texture/tree.jpg" is
        });
      }    
    };

    Cube.prototype.draw = function(drawingState) {
      var modelM = twgl.m4.scaling([this.size*1.4,this.size*1.4,this.size*1.4]);
      twgl.m4.setTranslation(modelM,this.position,modelM);
      var gl = drawingState.gl;
      gl.useProgram(shaderProgram.program);
      twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
      twgl.setUniforms(shaderProgram,{
        view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
        cubecolor:this.color, model: modelM, texSampler: texture});
      twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };

    var cube = new Cube();               // <!------------ ADDED
    cube.init(drawingState);             // <!------------ ADDED

    function render() {                  // <!------------ ADDED
      var gl = drawingState.gl           // <!------------ ADDED
      gl.enable(gl.DEPTH_TEST);          // <!------------ ADDED
      cube.draw(drawingState);           // <!------------ ADDED
      requestAnimationFrame(render);     // <!------------ ADDED
    }                                    // <!------------ ADDED
    requestAnimationFrame(render);       // <!------------ ADDED

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script id="cube-vs" type="notjs">
        //precision highp float;    <!---------------- CHANGED
        attribute vec3 vpos;
        attribute vec3 vnormal;
        attribute vec2 vtex;
        varying vec3 fColor;
        varying vec3 fNormal;
        varying vec2 fTexCoord;

        uniform mat4 view;
        uniform mat4 proj;
        uniform mat4 model;
        uniform vec3 lightdir;
        uniform vec3 cubecolor;

        void main(void) {
            gl_Position = proj * view * model * vec4(vpos, 1.0);
            vec4 normal = normalize(model * vec4(vnormal,0.0));
            float diffuse = .2 + abs(dot(normal, vec4(lightdir,0.0)));
            fColor = (cubecolor * diffuse);
            fTexCoord = vtex;
        }
    </script>
    <script id="cube-fs" type="notjs">

        precision highp float;  // <!--------- CHANGED (should probably use mediump though)

        varying vec3 fColor;
        varying vec3 fNormal;
        varying vec2 fTexCoord;

        uniform sampler2D texSampler;

        void main(void) {
            vec4 texColor = texture2D(texSampler, fTexCoord);  // < !-------- CHANGED
            gl_FragColor = vec4(fColor*texColor.xyz,1.0);
        }
    </script>
    <canvas></canvas>
    <script src="https://twgljs.org/dist/twgl-full.min.js"></script>

<!-- end snippet -->

One more question, are you running a webserver? WebGL requires a web server to read textures. Note, running a web server is trival. [A really good one is here](https://github.com/cortesi/devd/). Just [download the version for your OS](https://github.com/cortesi/devd/releases) then

    path/to/devd-download/devd path/to/project

Then go to `http://localhost:8000/nameOfYourHtmlFile.html`

I'm assuming this was not the issue because if it was you'd have seen a clear error in the JavaScript console about not being able to load the texture but you haven't mentioned errors in the JavaScript console
