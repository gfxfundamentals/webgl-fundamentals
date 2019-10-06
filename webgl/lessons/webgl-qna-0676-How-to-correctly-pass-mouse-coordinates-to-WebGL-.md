Title: How to correctly pass mouse coordinates to WebGL?
Description:
TOC: qna

# Question:

I want to pass canvas mouse coordinates to a function that interactively generates a circle with the mouse's coordinates as its center. Therefore, I'm using the following function to normalize:

 var mousePositionX = (2*ev.clientX/canvas.width) - 1;
 var mousePositionY = (2*ev.clientY/(canvas.height*-1)) + 1;
However, this works fine only for the screen center. When moving the mouse around the cursor is not located in the circle's center any more:
[see the picture here][1]


  [1]: https://i.stack.imgur.com/ltftF.jpg
The farther the mouse cursor removes from the screen center, the more it is dislocated from the circle's center.
Here's some relevant code:

**HTML**

      body {
     border: 0;
     margin: 0;
      }
      /* make the canvas the size of the viewport */
      canvas {
     width: 100vw;
     height: 100vh;
     display: block;
      }
      ...
      <body onLoad="main()">
      <canvas id="glContext"></canvas>
      </body>

**SHADER**

    <script id="vShaderCircle" type="notjs">
     attribute vec4 a_position;
     uniform mat4 u_viewMatrix;
     
     void main(){
      gl_Position = u_viewMatrix * a_position;
     }
    </script>
**JS**

    function main(){
     
     // PREPARING CANVAS AND WEBGL-CONTEXT
     var canvas = document.getElementById("glContext");
     var gl_Original = initWebGL(canvas);
     var gl = WebGLDebugUtils.makeDebugContext(gl_Original);
     
     resize(canvas);
     gl.viewport(0, 0, canvas.width, canvas.height);
     // ----------------------------------
        ...
     // MATRIX SETUP
     var viewMatrix = new Matrix4();
       viewMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
       viewMatrix.lookAt(0, 0, 5, 0, 0, 0, 0, 1, 0);
     // ----------------------------------
     canvas.addEventListener("mousemove", function(){stencilTest(event)});
    
     function stencilTest(ev){
      var mousePositionX = (2*ev.clientX/canvas.width) - 1;
      var mousePositionY = (2*ev.clientY/(canvas.height*(-1))) + 1;
            ...
            ...
            drawCircle(..., mousePositionX, mousePositionY, viewMatrix);
            ...
            drawCube(...);
        }
    }

How can I resolve this?


# Answer

This is actually a [far more complicated issue than it sounds](https://stackoverflow.com/a/35741551/128511). Is your canvas's display size the same as its drawing buffer? Do you have a border on your canvas?

Here's some code that will give you a canvas relative pixel coordinate assuming you don't have a border or any padding on your canvas.

    function getRelativeMousePosition(event, target) {
      target = target || event.target;
      var rect = target.getBoundingClientRect();
    
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }
    
    // assumes target or event.target is canvas
    function getNoPaddingNoBorderCanvasRelativeMousePosition(event, target) {
      target = target || event.target;
      var pos = getRelativeMousePosition(event, target);
    
      pos.x = pos.x * target.width  / target.clientWidth;
      pos.y = pos.y * target.height / target.clientHeight;
    
      return pos;  
    }

To convert that to a WebGL coordinate 

      var pos = getRelativeMousePosition(event, target);
      const x = pos.x / gl.canvas.width  *  2 - 1;
      const y = pos.y / gl.canvas.height * -2 + 1;

Working example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function getRelativeMousePosition(event, target) {
      target = target || event.target;
      var rect = target.getBoundingClientRect();

      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }

    // assumes target or event.target is canvas
    function getNoPaddingNoBorderCanvasRelativeMousePosition(event, target) {
      target = target || event.target;
      var pos = getRelativeMousePosition(event, target);

      pos.x = pos.x * target.width  / target.clientWidth;
      pos.y = pos.y * target.height / target.clientHeight;

      return pos;  
    }

    const vs = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
      gl_PointSize = 20.;
    }
    `;
    const fs = `
    void main() {
      gl_FragColor = vec4(1,0,1,1);
    }
    `;
    const gl = document.querySelector("canvas").getContext("webgl");
    // compiles and links shaders and assigns position to location 
    const program = twgl.createProgramFromSources(gl, [vs, fs]);
    const positionLoc = gl.getAttribLocation(program, "position");

    window.addEventListener('mousemove', e => {

      const pos = getNoPaddingNoBorderCanvasRelativeMousePosition(e, gl.canvas);

      // pos is in pixel coordinates for the canvas.
      // so convert to WebGL clip space coordinates
      const x = pos.x / gl.canvas.width  *  2 - 1;
      const y = pos.y / gl.canvas.height * -2 + 1;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      // only drawing a single point so no need to use a buffer
      gl.vertexAttrib2f(positionLoc, x, y);
      gl.drawArrays(gl.POINTS, 0, 1);
    });



<!-- language: lang-css -->

    canvas { 
      display: block;
      width: 400px;
      height: 100px;
    }
    div {
      display: inline-block;
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <div><canvas></canvas></div>
    <p>move the mouse over the canvas</p>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->

Notice there's no matrices involved. If you're using matrices then you've defined your own space, not WebGL's space which is always clip space. In that case you either need to multiply by the inverse of your matrices and pick whatever Z value you want between -1 and +1. That way when your position is multiplied by the matrices used in your shader it will reverse the position back into the correct webgl clip space coordinates. Or, you need to get rid of your matrices or set them in the identity.

Here's an example, note I don't have/know your math library so you'll have to translate to your's

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    function getRelativeMousePosition(event, target) {
      target = target || event.target;
      var rect = target.getBoundingClientRect();

      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }

    // assumes target or event.target is canvas
    function getNoPaddingNoBorderCanvasRelativeMousePosition(event, target) {
      target = target || event.target;
      var pos = getRelativeMousePosition(event, target);

      pos.x = pos.x * target.width  / target.clientWidth;
      pos.y = pos.y * target.height / target.clientHeight;

      return pos;  
    }

    const vs = `
    attribute vec4 position;
    uniform mat4 matrix;
    void main() {
      gl_Position = matrix * position;
    }
    `;
    const fs = `
    void main() {
      gl_FragColor = vec4(1,0,0,1);
    }
    `;
    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    const bufferInfo = twgl.primitives.createSphereBufferInfo(gl, .5, 12, 8);

    window.addEventListener('mousemove', e => {

      const pos = getNoPaddingNoBorderCanvasRelativeMousePosition(e, gl.canvas);

      // pos is in pixel coordinates for the canvas.
      // so convert to WebGL clip space coordinates
      const x = pos.x / gl.canvas.width  *  2 - 1;
      const y = pos.y / gl.canvas.height * -2 + 1;
      
      // use a projection and view matrix
      const projection = m4.perspective(
         30 * Math.PI / 180, 
         gl.canvas.clientWidth / gl.canvas.clientHeight, 
         1, 
         100);
      const camera = m4.lookAt([0, 0, 15], [0, 0, 0], [0, 1, 0]);
      const view = m4.inverse(camera);
      const viewProjection = m4.multiply(projection, view);
      
      // pick a clipsace Z value between -1 and 1 
      // we'll zNear to zFar and convert back to clip space
      const viewZ = -5;  // 5 units back from the camera
      const clip = m4.transformPoint(projection, [0, 0, viewZ]);
      const z = clip[2];
      
      // compute the world space position needed to put the sphere
      // under the cursor at this clipspace position
      const inverseViewProjection = m4.inverse(viewProjection);
      const worldPos = m4.transformPoint(inverseViewProjection, [x, y, z]);

      // add that world position to our matrix
      const mat = m4.translate(viewProjection, worldPos);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(programInfo.program);
      
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      twgl.setUniforms(programInfo, {
        matrix: mat,
      });
      gl.drawElements(gl.LINES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    });

<!-- language: lang-css -->

    canvas { 
      display: block;
      width: 400px;
      height: 100px;
    }
    div {
      display: inline-block;
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <div><canvas></canvas></div>
    <p>move the mouse over the canvas</p>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->

Also note I deliberately made the canvas's display size not match it's drawing buffer size to show the math works.
