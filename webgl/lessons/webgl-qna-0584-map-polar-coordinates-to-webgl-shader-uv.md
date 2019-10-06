Title: map polar coordinates to webgl shader uv
Description:
TOC: qna

# Question:

In my WebGL shader I would like to map the U value of my texture based on the output of a function (atan) whose range is [0,2*PI). But the range of U (as expected by texture2D) is [0,1]. So I'm trying to map an open interval to a closed interval. 

This shows the problem:
[![enter image description here][1]][1]
The horizontal red gradient is the U axis and goes from Red=1 to Red=0 as my atan goes from 0 to 2*PI. But atan treats 2*PI as zero so there is a red band on the right after the gradient has gone black. (There are red bands on the top and bottom too, but that is a similar problem having to do with the V value, which I'm ignoring for the purposes of this question).

See this image using three.js' ability to show the vertices:
[![enter image description here][2]][2]

You can see how the right-most vertices (U=1) are red corresponding again to atan=0 instead of 2*PI.

Any suggestions on how to accomplish this? I can't force atan to return a 2*PI. I don't want to tile the texture. Can I map the U value to an open interval somehow?

I keep thinking there must be an easy solution but have tried every fix I can think of.

Here is my vertex shader:

    void main()
    {
    
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
    
        // convert from uv to polar coords
        vec2 tempuv = uv;
        theta = (1.0-tempuv[1]) * PI;
        phi = PI * 2.0 * tempuv[0];
    
        // convert polar to cartesian. Theta is polar, phi is azimuth.
        x = sin(theta)*cos(phi);
        y = sin(theta)*sin(phi);
        z = cos(theta);
    
        // and convert back again to demonstrate problem.
        // problem: the phi above is [0,2*PI]. this phi is [0,2*PI)
        phi = atan2(y, x);
        if (phi < 0.0) {
            phi = phi + PI*2.0; 
        }
        if (phi > (2.0 * PI)) { // allow 2PI since we gen uv over [0,1]
            phi = phi - 2.0 * PI;
        }
        theta = acos(z);
    
        // now get uv in new chart.
        float newv = 1.0 - theta/PI;
        float newu = phi/(2.0 * PI);
        vec2 newuv = vec2(newu, newv);
        vUv = newuv;
    }

Here is my fragment shader:

    void main() {
        vec2 uv = vUv;
        gl_FragColor = vec4(1.0- uv[0],0.,0.,1.);
    }


  [1]: http://i.stack.imgur.com/NVjs7.png
  [2]: http://i.stack.imgur.com/Oruu0.png

# Answer

One way of looking at the problem is as you mentioned, 1 comes 0 at the edge. But another way of looking at it is if you changed uv to go from 0 to 2 instead of 0 to 1 and you then used `fract(uv)` you'd get the same problem several times over because you're effectively sampling a function and each point can only choose 1 color whereas to map it correctly you'd need some how have each point magically pick 2 colors for the vertices that need to be one color for interpolating to the left and another for interpolating to the right.

Example with `fract(uv * 2.)`

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    #define PI radians(180.)

    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 vUv;

    void main() {
        gl_Position = position;

        // convert from uv to polar coords
        vec2 tempuv = fract(texcoord * 2.);

        float theta = (1.0-tempuv[1]) * PI;
        float phi = PI * 2.0 * tempuv[0];

        // convert polar to cartesian. Theta is polar, phi is azimuth.
        float x = sin(theta)*cos(phi);
        float y = sin(theta)*sin(phi);
        float z = cos(theta);

        // and convert back again to demonstrate problem.
        // problem: the phi above is [0,2*PI]. this phi is [0,2*PI)
        phi = atan(y, x);
        if (phi < 0.0) {
            phi = phi + PI * 2.0; 
        }
        if (phi > (2.0 * PI)) { // allow 2PI since we gen uv over [0,1]
            phi = phi - 2.0 * PI;
        }
        theta = acos(z);

        // now get uv in new chart.
        float newv = 1.0 - theta/PI;
        float newu = phi/(2.0 * PI);
        vec2 newuv = vec2(newu, newv);
        vUv = newuv;
    }
    `;

    var fs = `
    precision mediump float;
    varying vec2 vUv;
    void main() {
        vec2 uv = vUv;
        gl_FragColor = vec4(1.0- uv[0],0.,0.,1.);
    }
    `;

    var gl = document.querySelector("canvas").getContext("webgl");
    var m4 = twgl.m4;
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var bufferInfo = twgl.primitives.createPlaneBufferInfo(
      gl, 2, 2, 20, 20, m4.rotationX(Math.PI * .5));

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.drawBufferInfo(gl, bufferInfo);

<!-- language: lang-css -->

    body { margin: 0 }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Moving the code to the fragment shader effectively solves it.

Example with code moved to fragment shader

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 vUv;

    void main() {
        gl_Position = position;
        vUv = texcoord;
    }
    `;

    var fs = `
    precision mediump float;
    varying vec2 vUv;

    #define PI radians(180.)

    void main() {

        // convert from uv to polar coords
        vec2 tempuv = vUv;

        float theta = (1.0-tempuv[1]) * PI;
        float phi = PI * 2.0 * tempuv[0];

        // convert polar to cartesian. Theta is polar, phi is azimuth.
        float x = sin(theta)*cos(phi);
        float y = sin(theta)*sin(phi);
        float z = cos(theta);

        // and convert back again to demonstrate problem.
        // problem: the phi above is [0,2*PI]. this phi is [0,2*PI)
        phi = atan(y, x);
        if (phi < 0.0) {
            phi = phi + PI * 2.0; 
        }
        if (phi > (2.0 * PI)) { // allow 2PI since we gen uv over [0,1]
            phi = phi - 2.0 * PI;
        }
        theta = acos(z);

        // now get uv in new chart.
        float newv = 1.0 - theta/PI;
        float newu = phi/(2.0 * PI);
        vec2 newuv = vec2(newu, newv);
        gl_FragColor = vec4(1.0- newuv[0],0.,0.,1.);
    }
    `;

    var gl = document.querySelector("canvas").getContext("webgl");
    var m4 = twgl.m4;
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var bufferInfo = twgl.primitives.createPlaneBufferInfo(
      gl, 2, 2, 20, 20, m4.rotationX(Math.PI * .5));

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.drawBufferInfo(gl, bufferInfo);

<!-- language: lang-css -->

    body { margin: 0 }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

Keeping it a vertex shader one solution is just to fudge the numbers so they're between say 0.00005 and 0.99995. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    #define PI radians(180.)

    attribute vec4 position;
    attribute vec2 texcoord;

    varying vec2 vUv;

    void main() {
        gl_Position = position;

        // convert from uv to polar coords
        vec2 tempuv = texcoord * 0.9999 + 0.00005;

        float theta = (1.0-tempuv[1]) * PI;
        float phi = PI * 2.0 * tempuv[0];

        // convert polar to cartesian. Theta is polar, phi is azimuth.
        float x = sin(theta)*cos(phi);
        float y = sin(theta)*sin(phi);
        float z = cos(theta);

        // and convert back again to demonstrate problem.
        // problem: the phi above is [0,2*PI]. this phi is [0,2*PI)
        phi = atan(y, x);
        if (phi < 0.0) {
            phi = phi + PI * 2.0; 
        }
        if (phi > (2.0 * PI)) { // allow 2PI since we gen uv over [0,1]
            phi = phi - 2.0 * PI;
        }
        theta = acos(z);

        // now get uv in new chart.
        float newv = 1.0 - theta/PI;
        float newu = phi/(2.0 * PI);
        vec2 newuv = vec2(newu, newv);
        vUv = newuv;
    }
    `;

    var fs = `
    precision mediump float;
    varying vec2 vUv;
    void main() {
        vec2 uv = vUv;
        gl_FragColor = vec4(1.0- uv[0],0.,0.,1.);
    }
    `;

    var gl = document.querySelector("canvas").getContext("webgl");
    var m4 = twgl.m4;
    var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    var bufferInfo = twgl.primitives.createPlaneBufferInfo(
      gl, 2, 2, 20, 20, m4.rotationX(Math.PI * .5));

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.drawBufferInfo(gl, bufferInfo);

<!-- language: lang-css -->

    body { margin: 0 }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/2.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

This only works though because the texcoords go from 0 to 1. If they went from zero to > 1 (or less than 0) you'd run into the same problem as above that certain vertices need more than 1 color. You'd basically need to use the fragment shader solution

