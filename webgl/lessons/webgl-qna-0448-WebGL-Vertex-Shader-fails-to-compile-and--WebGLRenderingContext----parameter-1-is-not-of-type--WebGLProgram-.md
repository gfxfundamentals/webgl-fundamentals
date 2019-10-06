Title: WebGL Vertex Shader fails to compile and 'WebGLRenderingContext :' parameter 1 is not of type 'WebGLProgram'
Description:
TOC: qna

# Question:

When I try to run the code below in my browser I receive a pop-up notification that "Vertex shader failed to compile.  The error log is:

    <pre>ERROR: 0:11: 'assign' :  cannot convert from 'highp 3-component vector of float' to 'Position highp 4-component vector of float'
    </pre>

Followed by the console error message:

    "Uncaught TypeError: Failed to execute 'useProgram' on 'WebGLRenderingContext': parameter 1 is not of type 'WebGLProgram'.init @ tangram2.js:76"

I am trying to create several 2-D shapes (just one for now, as a proof of concept), each with their own buffer, so that I may translate and rotate them on the GPU individually.



    "use strict";`
    var canvas, gl, program;
    var points = [];
    var colors = [];
    var shapeScale = (1/3);
    
    /* RGBA colors */
    var vertexColors = [
        vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
        vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
        vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
        vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
        vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
        vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
        vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
        vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
    ];
    
    /* Shader transformation matrices */
    var modelViewMatrix, projectionMatrix;
    
    /* Rotational indicies */
    var LT1 = 0; /* Large  triangle 01 */
    var LT2 = 1; /* Large  triangle 02 */
    var MT1 = 2; /* Medium triangle 01 */
    var ST1 = 3; /* Small  triangle 01 */
    var ST2 = 4; /* Small  triangle 02 */
    var SQR = 5; /* Square */
    var PRL = 6; /* Parallelogram */
    
    var theta = [0,0,0,0,0,0,0];
    
    var modelViewMatrixLoc;
    
    /* For each shape, create a vertex and color buffer */
    var vLT1Buff, cLT1Buff;
    var vLT2Buff, cLT2Buff;
    var vMT1Buff, cMT1Buff;
    var vST1Buff, cST1Buff;
    var vST2Buff, cST2Buff;
    var vSQRBuff, cSQRBuff;
    var vPRLBuff, cPRLBuff;
    
    /* ----------------Initialize webGL---------------- */
    window.onload = function init(){
        /* From robotArm.js */
        canvas = document.getElementById( "gl-canvas" );
        gl = WebGLUtils.setupWebGL( canvas );
        if ( !gl ) { alert( "WebGL isn't available" ); }
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
        gl.enable( gl.DEPTH_TEST );
    
        /* Setup canvas background */
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1.0, 0.5, 0.5, 1.0);
    
        /* Load shaders and use the resulting shader program */
        program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );
    
        /* Create an initialize buffer objects */
        vLT1Buff = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vLT1Buff );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
    
        cLT1Buff = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cLT1Buff );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    
        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );
    
        modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    
        projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
        gl.uniformMatrix3fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );
    
        //-------------------------------------//
        //          Initialize Shapes          //
        //-------------------------------------//
    
        var largeTriangle01 = setupTriangle( 1, Math.sqrt(2) / 2);
        var largeTriangle02 = setupTriangle( 1, Math.sqrt(2) / 2);
        var medTriangle01   = setupTriangle( Math.sqrt(2) / 2, 0.35);
        var smallTriangle01 = setupTriangle( 0.5, 0.25);
        var smallTriangle02 = setupTriangle( 0.5, 0.25);
    
        /* Add our shapes to an array of shapes for quick access */
        var shapes = [
            largeTriangle01,
            /*
            largeTriangle02,
            medTriangle01,
            smallTriangle01,
            smallTriangle02,
            square01,
            */
        ];
    
        for(var i = 0; i < shapes.length; ++i){
            scaleShape( shapes[i] ); //Scale our shapes
            makeShape ( shapes[i] ); //And draw them
        }
    
        render(LT1);
    }//end init
    
    /* ----------------Helper funcitons---------------- */
    
    //TODO dont forget about Parallelogram!
    
    /* From robotArm.js */
    function scale3(a, b) {
       var result = mat3();
       result[0][0] = a;
       result[1][1] = b;
       return result;
    }
    
    /* Return an array of three points representing a triangle */
    function setupTriangle(hypotenuse, height){
        return [
            vec4( hypotenuse / 2, height, 0.0, 1.0 ),
            vec4( hypotenuse  , 0, 0.0, 1.0 ),
            vec4( 0, 0, 0.0, 1.0 ),
        ];
    }//end setupTriangle
    
    /* Return an array of four points representing a quad */
    function setupRectangle(width, height){
        return[
            vec4( -width,  height, 0.0, 1.0),
            vec4(  width,  height, 0.0, 1.0),
            vec4(  width, -height, 0.0, 1.0),
            vec4( -width, -height, 0.0, 1.0),
        ];
    }//end setupRectangle
    
    function scaleShape(shape){
        for( var i = 0; i < shape.length; ++i ){
            shape[i] = scale( shapeScale, shape[i] );
        }
    }//end scaleShape
    
    function makeShape(shape){
        if(shape.length == 3){ makeTriangle (shape); }
        if(shape.length == 4){ makeQuad     (shape); }
    }//end makeShape
    
    function makeTriangle(listOfPoints){
        for(var i = 0; i < listOfPoints.length; ++i){
            points.push(listOfPoints[i]);
        }
    }//end makeShape
    
    function makeQuad(listOfPoints){
        points.push( listOfPoints[0] );
        points.push( listOfPoints[1] );
        points.push( listOfPoints[2] );
        points.push( listOfPoints[0] );
        points.push( listOfPoints[2] );
        points.push( listOfPoints[3] );
    }//end makeShape
    
    /* ------------------------------------------------------------------------- */
    
    function largeTriangle01(){
        // var s = scale3(1.0, 1.0, 1.0);
        var instanceMatrix = translate(0.5, 0.5);
        var t = mult(modelViewMatrix, instanceMatrix);
        gl.uniformMatrix3fv(modelViewMatrixLoc,  false, flatten(t) );
        gl.drawArrays( gl.TRIANGLES, 0, points.length );
    }
    
    /* ------------------------------------------------------------------------- */
    function render(shape){
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    
        modelViewMatrix = rotate(theta[shape], 0, 1, 0);
    
        switch(shape){
            /* Large Triangle 01 */
            case 0:
                largeTriangle01();
                break;
        }//end switch
    
        requestAnimFrame(render);
    }//end render
  
My shaders are:

    <script id="vertex-shader" type="x-shader/x-vertex">
            attribute vec3 vPosition;
            attribute vec4 vColor;
            varying vec4 fColor;

            uniform mat3 modelViewMatrix;
            uniform mat3 projectionMatrix;

            void main() {
                fColor = vColor;
                gl_Position = projectionMatrix * modelViewMatrix * vPosition;
            }
        </script>

        <script id="fragment-shader" type="x-shader/x-fragment">
            precision mediump float;
            varying  vec4 fColor;

            void main() {
                gl_FragColor = fColor;
            }
        </script>

# Answer

As @Reto said, 

> the error message tells you exactly what the problem is. You're trying to assign a `vec3` to `gl_Position`, which is a `vec4`

It even tells you the line number: `ERROR: 0:11` line 11

If we number the lines

    <script id="vertex-shader" type="x-shader/x-vertex">1
     2    attribute vec3 vPosition;
     3    attribute vec4 vColor;
     4    varying vec4 fColor;
     5
     6    uniform mat3 modelViewMatrix;
     7    uniform mat3 projectionMatrix;
     8
     9    void main() {
    10       fColor = vColor;
    11       gl_Position = projectionMatrix * modelViewMatrix * vPosition;
    12    }
    </script>

I'm guessing you want 

    gl_Position = vec4(projectionMatrix * modelViewMatrix * vPosition, 1);

