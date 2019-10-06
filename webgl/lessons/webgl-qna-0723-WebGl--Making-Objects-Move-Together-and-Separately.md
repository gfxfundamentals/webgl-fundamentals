Title: WebGl: Making Objects Move Together and Separately
Description:
TOC: qna

# Question:

I am trying to make a robot that uses sliders that rotates the body all together and body parts move together and separately, i.e. moving the upper arm moves the entire arm and rotating the body rotates every body part. But I also want the body parts to move separately such as the head moves and the lower arm moves by itself. 

My problem is that not all of my objects are showing up, just the first 3 objects and I feel like that has something to do with the use of theta for the sliders. Also when I move the head, the arm moves as well. I understand it has something to do with the model view matrix and that every transformation I make will keep applying to the rest, but when I try to use pop() and push() it makes the object disappear or freeze and can't be moved. Can someone point me in the right direction? I included most of my code but not all the variables.

    var theta = [0,0,0];

    function scale4(a, b, c) {
      var result = mat4();
      result[0][0] = a;
      result[1][1] = b;
      result[2][2] = c;
      return result;
    }
     
    window.onload = function init()
    {
      var canvas = document.getElementById( "webgl-robot" );

      gl = WebGLUtils.setupWebGL( canvas );
      if ( !gl ) { alert( "WebGL isn't available" ); }
 
   gl.viewport( 0, 0, canvas.width, canvas.height );
      gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
      gl.enable( gl.DEPTH_TEST ); 

      program = initShaders( gl, "vertex-shader", "fragment-shader" ); 
      gl.useProgram( program);
    
      colorCube();
    
      program = initShaders( gl, "vertex-shader", "fragment-shader" );    
      gl.useProgram( program );
    
    
      var vBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW );
    
      var vPosition = gl.getAttribLocation( program, "vPosition" );
      gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vPosition );

      var cBuffer = gl.createBuffer();
      gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
      gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW );

      var vColor = gl.getAttribLocation( program, "vColor" );
      gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
      gl.enableVertexAttribArray( vColor );
    
      modelView = gl.getUniformLocation( program, "modelView" );
      projection = gl.getUniformLocation( program, "projection" );
    
      document.getElementById("slider1").onchange = function() {
        theta[0] = event.srcElement.value;
      };
      document.getElementById("slider2").onchange = function() {
         theta[1] = event.srcElement.value;
      };
      document.getElementById("slider3").onchange = function() {
         theta[2] =  event.srcElement.value;
      };
      document.getElementById("slider4").onchange = function() {
         theta[3] = event.srcElement.value;
      };
      document.getElementById("slider5").onchange = function() {
         theta[4] = event.srcElement.value;
      };
    
      modelView2 = gl.getUniformLocation( program, "modelView" );
      projection2 = gl.getUniformLocation( program, "projection" );
      
      modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix");
      projection = gl.getUniformLocation( program, "projection" );
    
      projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
      gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  
      false, flatten(projectionMatrix) );
    
      render();
    }

    function base() {
       var s = scale4(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
       var instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
       var t = mult(modelViewMatrix, instanceMatrix);
       gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t) );
       gl.drawArrays( gl.TRIANGLES, 0, 36 );
    }

    function head() {
       var s = scale4(HEAD_WIDTH, HEAD_HEIGHT, HEAD_WIDTH);
       var instanceMatrix = mult(translate( 0.0, 0.5 * HEAD_HEIGHT, 0.0 ),s);    
       var t = mult(modelViewMatrix, instanceMatrix);
       gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
       gl.drawArrays( gl.TRIANGLES, 0, 36 );
    }

    function leftUpperArm()
    {
       var s = scale4(LEFT_UPPER_WIDTH, LEFT_UPPER_HEIGHT, LEFT_UPPER_WIDTH);
       var instanceMatrix = mult( translate( 0.0, 0.5 * LEFT_UPPER_HEIGHT, 0.0 ), 
       s);
       var t = mult(modelViewMatrix, instanceMatrix);
       gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
       gl.drawArrays( gl.TRIANGLES, 0, 36 );
    }
       
    function leftLowerArm()
    {
       var s = scale4(LEFT_LOWER_WIDTH, LEFT_LOWER_HEIGHT, LEFT_LOWER_WIDTH);
       var instanceMatrix = mult( translate( 0.0, 0.5 * LEFT_LOWER_HEIGHT, 0.0 ), 
        s);
       var t = mult(modelViewMatrix, instanceMatrix);
       gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
       gl.drawArrays( gl.TRIANGLES, 0, 36 );
    }
     
    function rightUpperArm()
    {
       var s = scale4(RIGHT_UPPER_WIDTH, RIGHT_UPPER_HEIGHT, RIGHT_UPPER_WIDTH);
       var instanceMatrix = mult( translate( -9.3, 0.5 * RIGHT_UPPER_HEIGHT, 0.0 
       ), s);
       var t = mult(modelViewMatrix, instanceMatrix);
       gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t) );
       gl.drawArrays( gl.TRIANGLES, 0, 36 );
    }
 
    function render() {

      gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
      modelViewMatrix = rotate(theta[Base], 0, 1, 0 );
      base();
    
      modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0)); 
      modelViewMatrix = mult(modelViewMatrix, rotate(theta[Head], 0, 0, 1 ));
      head();
 
      modelViewMatrix  = mult(modelViewMatrix, translate(1.3, -0.7, 0.0));
      modelViewMatrix  = mult(modelViewMatrix, rotate(theta[LeftUpper], 1, 0, 0) 
      );
      leftUpperArm();
    
      modelViewMatrix = mult(modelViewMatrix, translate(0.0, LEFT_UPPER_HEIGHT, 
      0.0));   
      modelViewMatrix = mult(modelViewMatrix, rotate(theta[LeftLower], 0, 0, 1 ));
      leftLowerArm();
    
      modelViewMatrix  = mult(modelViewMatrix, translate(5.3, -0.7, 0.0));
      modelViewMatrix  = mult(modelViewMatrix, rotate(theta[RightUpper], 1, 0, 0) 
      );
      rightUpperArm();

      requestAnimFrame(render);
    }

# Answer

The normal way to make/move/animate something like that (a hierarchical model) is to use a [scenegraph](https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html) and/or a [matrix stack](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrix-stack.html).

Using a matrix stack you start at the root (could be the waist, could be a point between the feet) then you walk through the tree of the character, multiplying matrices

     root
       waist
         left thigh
           left lower leg
              left foot
         right thigh
           right lower leg
              right foot
       stomach
         chest
           left upper arm
              left forearm
                 left hand
           right upper arm
              right forearm
                 right hand
           neck
             head
               left eye
               right eye

At each point in the tree you save the current model matrix (push it on the stack), then pass that down to the children to add their orientation to.

This way if you move/rotate the chest, everything deeper in the tree of parts (arms, neck, head) automatically move/rotate with it.

You can see in the sample below using a matrix stack. Only the chest is animated but because of the matrix stack the arms and the head move with the chest.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const m4 = twgl.m4;
    const v3 = twgl.v3;
    const gl = document.querySelector("canvas").getContext("webgl");

    const vs = `
    attribute vec4 position;
    attribute vec3 normal;

    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_model;

    varying vec3 v_normal;

    void main() {
       gl_Position = u_projection * u_view * u_model * position;
       v_normal = mat3(u_model) * normal; // better to use inverse-transpose-model
    }
    `

    const fs = `
    precision mediump float;

    varying vec3 v_normal;

    uniform vec3 u_lightDir;
    uniform vec3 u_color;

    void main() {
      float light = dot(normalize(v_normal), u_lightDir) * .5 + .5;
      gl_FragColor = vec4(u_color * light, 1);
    }
    `;

    // compiles shaders, links program, looks up attributes
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData
    const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl, 1);

    const stack = [];

    const color = [1, .5, .3];
    const lightDir = v3.normalize([1, 5, 10]);
     
    function render(time) {
       time *= 0.001;
       
       twgl.resizeCanvasToDisplaySize(gl.canvas);
       gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
       
       gl.enable(gl.DEPTH_TEST);
       gl.enable(gl.CULL_FACE);
       
       gl.useProgram(programInfo.program);
       
       const fov = Math.PI * .25;
       const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
       const zNear = 0.01;
       const zFar = 100;
       const projection = m4.perspective(fov, aspect, zNear, zFar);
       
       const cameraPosition = [1, 4, 10]
       const target = [0, 3, 0];
       const up = [0, 1, 0];
       const camera = m4.lookAt(cameraPosition, target, up);
       
       const view = m4.inverse(camera);
       
       // make base position of robot
       let m = m4.translation([0, 0, 0]);
       pushMatrix(m);
       {
          // move up to waist
          m = m4.translate(m, [0, 3, 0]);
          drawCube(projection, view, m);
          
          pushMatrix(m);
          {
             // move to left thigh
             m = m4.translate(m, [1.1, -.5, 0]);
             drawCube(projection, view, m);
             
             pushMatrix(m);
             {
               // move to left foot
               m = m4.translate(m, [0, -1.1, 0]);
               drawCube(projection, view, m);
             }
             m = popMatrix(m);
          }
          m = popMatrix(m);
          
          pushMatrix(m);
          {
             // move to right thigh
             m = m4.translate(m, [-1.1, -.5, 0]);
             drawCube(projection, view, m);
             
             pushMatrix(m);
             {
               // move to right foot
               m = m4.translate(m, [0, -1.1, 0]);
               drawCube(projection, view, m);
             }
             m = popMatrix(m);
          }
          m = popMatrix(m);
          
          pushMatrix(m);
          {
            // move to chest
            m = m4.translate(m, [0, 1.1, 0]);
            m = m4.rotateY(m, Math.sin(time) * .6);
            drawCube(projection, view, m);

            pushMatrix(m);
            {
              // move to left arm
              m = m4.translate(m, [-1.1, 0, 0]);
              drawCube(projection, view, m);
            }
            m = popMatrix(m);
          
            pushMatrix(m);
            {
              // move to right arm
              m = m4.translate(m, [1.1, 0, 0]);
              drawCube(projection, view, m);
            }
            m = popMatrix(m);
            
            pushMatrix(m);
            {
              // move to head
              m = m4.translate(m, [0, 1.1, 0]);
              drawCube(projection, view, m);
            }
            m = popMatrix(m);
         }
         m = popMatrix(m);
       }
       m = popMatrix();

       requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function pushMatrix(m) {
      stack.push(m);
    }

    function popMatrix() {
      return stack.pop();
    }

    function drawCube(projection, view, model) {
      // there is no reason to call these each time since we're always
      // using the same cube but a real robot would probably
      // have different parts for each section: 
      //   leg, arm, left hand, right foot...
      
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
       twgl.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);
       
       // calls gl.uniformXXX
       twgl.setUniforms(programInfo, {
          u_color: color,
          u_lightDir: lightDir,
          u_projection: projection,
          u_view: view,
          u_model: model,
       });
       
       // calls gl.drawArrays or gl.drawElements
       twgl.drawBufferInfo(gl, cubeBufferInfo);
    }





<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>
    <canvas></canvas>

<!-- end snippet -->

A [scenegraph](https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html) is an organizational tool so instead of writing all the code you see in the sample above you can more generalize things by writing some code that walks the scenegraph and computes the matricies.
