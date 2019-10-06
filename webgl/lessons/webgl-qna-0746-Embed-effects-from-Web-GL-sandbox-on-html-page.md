Title: Embed effects from Web-GL sandbox on html page
Description:
TOC: qna

# Question:

I am looking for a way to display a Web-gl shader from [GLSL Sandbox](http://glslsandbox.com/) as the background to a html page, however there doesn't appear to be an easy embeddable API. How can I do this?

Is it possible to put [this Shader](http://glslsandbox.com/e#40888.0) on a html page? :

    precision highp float;
    
    uniform float time;
    uniform vec2 resolution;
    
    #define TWO_PI 6.283185
    #define NUMBALLS 30.0
    
    float d = -TWO_PI/36.0;
    
    void main( void ) {
     vec2 p = (2.0*gl_FragCoord.xy - resolution)/min(resolution.x, resolution.y); 
     vec3 c = vec3(0);
     for(float i = 0.0; i < NUMBALLS; i++) {
      float t = TWO_PI * i/NUMBALLS + time;
      float x = cos(t);
      float y = sin(3.0 * t + d);
      vec2 q = 0.8*vec2(x, y);
      c += 0.015/distance(p, q) * vec3(0.9 * abs(x), 0, abs(y));
     }
     gl_FragColor = vec4(c, 1.0);
    }

# Answer

[This answer covers canvas as a background](https://stackoverflow.com/a/38473767/128511).

[This answer covers using a glslsandbox shader in three.js](https://stackoverflow.com/questions/35401179/how-to-use-fragment-shader-from-glslsandbox-com).

Otherwise you just need to draw a fullscreen quad with a shader from glslsandbox providing the various uniforms that glslsandbox provides. The original code is [here](https://github.com/mrdoob/glsl-sandbox/tree/master/static)

Here's a snippet for the shader from glslshadertoy

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    const vs = `
    attribute vec4 position;

    void main() {
      gl_Position = position;
    }
    `;

    // From glslsandbox.com
    const fs = `
    precision highp float;

    uniform float time;
    uniform vec2 resolution;

    #define TWO_PI radians(360.0)
    #define NUMBALLS 30.0

    float d = -TWO_PI/36.0;

    void main( void ) {
        vec2 p = (2.0*gl_FragCoord.xy - resolution)/min(resolution.x, resolution.y);    
        vec3 c = vec3(0);
        for(float i = 0.0; i < NUMBALLS; i++) {
            float t = TWO_PI * i/NUMBALLS + time;
            float x = cos(t);
            float y = sin(3.0 * t + d);
            vec2 q = 0.8*vec2(x, y);
            c += 0.015/distance(p, q) * vec3(0.9 * abs(x), 0, abs(y));
        }
        gl_FragColor = vec4(c, 1.0);
    }
    `;

    const gl = document.querySelector("canvas").getContext("webgl");

    // compiles shaders, links program, looks up locations.
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    var arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    var bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      const uniforms = {
        time: time * 0.001,
        resolution: [gl.canvas.width, gl.canvas.height],
      };

      gl.useProgram(programInfo.program);
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      // calls gl.uniform
      twgl.setUniforms(programInfo, uniforms);
      
      // calls gl.drawArrays or gl.drawElements
      twgl.drawBufferInfo(gl, bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { 
      margin: 0; 
      color: white;  
      font-size: 20pt;
    }
    canvas { 
      width: 100vw; 
      height: 100vh; 
      z-index: -1; 
      display: absolute;
      position: fixed;
      top: 0;
      left: 0;
    }
    #content {
      margin: .5em;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <canvas></canvas>
    <div id="content">
    <pre>
    Let's

    make

    something

    long

    enough

    that

    we

    need

    to

    scroll

    to

    show

    that

    this

    works

    as

    a

    background

    even

    if

    the

    content

    is

    longer

    than

    the 

    window

    size
    </pre>
    </div>

<!-- end snippet -->


