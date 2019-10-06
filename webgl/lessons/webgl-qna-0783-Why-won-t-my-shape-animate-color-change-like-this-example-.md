Title: Why won't my shape animate color change like this example?
Description:
TOC: qna

# Question:

This is the example that I am following: https://thebookofshaders.com/03/

Here is my HTML:

<!-- language: lang-html -->

    <!DOCTYPE html>
    <html>
    <head>
    </head>
    <body>
        <!--Include A/S WebGL support libraries-->
        <script type="text/javascript" src="../Common/webgl-utils.js"></script>
        <script type="text/javascript" src="../Common/initShaders.js"></script>
        <script type="text/javascript" src="../Common/MV.js"></script>
        <script type="text/javascript" src="../Common/webgl-debug.js"></script>
        <script type="text/javascript" src="assignment1.js"></script>
        <script id="vertex-shader" type="x-shader/x-vertex">
            // GLSL vertex shader code
            attribute vec4 vPosition;
            void main()
            {
                gl_Position = vPosition;
            }
        </script>
        <script id="fragment-shader" type="x-shader/x-fragment">
            // GLSL fragment shader code
            precision mediump float;
            uniform float u_time;
            void main()
            {

                gl_FragColor = vec4( abs(sin(u_time)), 1.0, 1.0, 1.0 );
            }
        </script>
    <canvas id="gl-canvas" width="512" height=" 512">>
    Oops ... your browser doesn't support the HTML5 canvas element
    </canvas>
    </body>
    </html>

Here is my JavaScript:

<!-- language: lang-js -->

    // square.js -- a graphics "Hello World"
    var gl;
    var points;

    window.onload = function init(){
        var canvas = document.getElementById( "gl-canvas" );
        
        //    gl = WebGLUtils.setupWebGL( canvas );  // More efficient
        gl = WebGLDebugUtils.makeDebugContext( canvas.getContext("webgl") ); // For debugging
        if ( !gl ) { alert( "WebGL isn't available" );
                   }

        // Four 2D Vertices using Angel/Shreiner utility class vac2
        var vertices = [           
            vec2( -0.5, 0.5 ),
            vec2(  0.5,  0.5 ),
            vec2(  0.5, -0.5 ),
            vec2( -0.5, -0.5)
        ];
        
        
        //  Configure WebGL
        
        gl.viewport( canvas.width/2, 0, canvas.width/2, canvas.height/2 );
        gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

        //  Load shaders and initialize attribute buffers using A/S utility initShaders

        var program = initShaders( gl, "vertex-shader", "fragment-shader" ); 
        gl.useProgram( program );

        // Load the data into the GPU using A/S flatten function

        var bufferId = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW ); 
                                                                             

        // Associate our shader variables with our data buffer

        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer(
            vPosition, // Specifies the index of the generic vertex attribute to be modified.
            2,         // Specifies the number of components per generic vertex attribute. 
                       // Must be 1, 2, 3, or 4. 
            gl.FLOAT,  // Specifies the data type of each component in the array. 
                // GL_BYTE, GL_UNSIGNED_BYTE, GL_SHORT, GL_UNSIGNED_SHORT, GL_FIXED, or GL_FLOAT. 
            false,     // Specifies whether fixed-point data values should be normalized (GL_TRUE) 
                // or converted directly as fixed-point values (GL_FALSE) when they are accessed.
            0,         // Specifies the byte offset between consecutive generic vertex attributes. 
                // If stride is 0, the generic vertex attributes are understood 
                // to be tightly packed in the array.
            0          // Specifies a pointer to the first component 
                // of the first generic vertex attribute in the array.
                              );
        gl.enableVertexAttribArray( vPosition );    
        
        render();
    };

    function render() {
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }

I feel like it has something to do with calling render after every change. Also, I'm not sure why the shape is blue. I'm really new to WebGL. Does anybody have any suggested materials for learning it?

# Answer

The recommended way to animate things programmatically in the browser is to use [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // animate the background color
    function render(timeSincePageLoadedInMilliseconds) {
       const timeInSeconds = timeSincePageLoadedInMilliseconds * 0.001;
       document.body.style.backgroundColor = `rgb(${timeInSeconds % 1 * 256 | 0}, 0, 0)`;
       requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- end snippet -->

That examples updates the background color of the body of the page based on time. In your own program you'd update your own variables that represent the positions, orientations, scales, colors, whatever you want to animate and then re-draw everything.

See [this](https://webglfundamentals.org/webgl/lessons/webgl-animation.html)
