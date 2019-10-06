Title: How do I make these triangles have no fill and only borders?
Description:
TOC: qna

# Question:

I've tried following instructions for various sources but haven't had any success. I'm very new to WebGL and OpenGL. I was provided this code and have been making tweaks every since. If anybody has any resources they would like to share so I can answer my own question, that would be appreciated!

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
            vec2(-0.5, -0.5),
            vec2(-0.5, 0.5),
            vec2(0.5, 0.5),
            vec2(0.5, -0.5)
        ];
        
        
        //  Configure WebGL
        
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);

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
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }

# Answer

There is no *easy* way to have outlines vs solid colors. 

Your options are

1. Draw lines using `gl.LINES`

   you'll need to change supply different vertices or indices depending on what you want to draw. For example you're drawing a `TRIANGLE_STRIP` above but to draw an outlined quad you could use `LINE_LOOP` for this one case. For more complex shapes you'll likely need to supply different indices.

    The problem with `gl.LINES`, `gl.LINE_LOOP`, and `gl.LINE_STRIP` are WebGL only supports lines 1 pixel wide.

2. Make a texture that has an outline, apply it to your data

   This is a common method. You'll need to learn about [textures and texture coordinates](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html).

2. Make a procedural texture

   This is the same as above but instead of using the texture coordinates to reference an actual texture you use the texture coordinate in a calculation draw a certain color only near the edges of the texture.

3. Compute an outline in the fragment shader

   There are methods to compute outlines in the shader. They require you supply more data. [Here's one](http://codeflow.org/entries/2012/aug/02/easy-wireframe-display-with-barycentric-coordinates/)

4. [Compute vertices that draw outlines](https://mattdesl.svbtle.com/drawing-lines-is-hard)

   This is what most 3D libraries (and 2D libraries) do
