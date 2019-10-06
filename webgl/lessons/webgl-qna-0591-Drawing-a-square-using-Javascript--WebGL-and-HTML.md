Title: Drawing a square using Javascript, WebGL and HTML
Description:
TOC: qna

# Question:

Hi I am following Edward Angel's Introduction to Interactive 3D Graphics. I want to make a recursive maze but first I need to be able to do a basic square. I modeled this script on the book script for a sierpinski gasket. I have been hours at this and just cant see what I am doing wrong. HTML page will only display one line. Ive tried different types of vertex joiner like LINES LINE_LOOP POLYGON but I cant seem to get it to work. Please help me out I feel like Im going crazy.
Here is the script:

    <!DOCTYPE html>
    <html>
    <head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" >
    <title>Maze Sierpinski Gasket</title>
    
    
    <script id="vertex-shader" type="x-shader/x-vertex">
    attribute vec4 vPosition;
    
    
    void
    main()
    {
        gl_Position = vPosition;
    }
    </script>
    
    <script id="fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
    
    void
    main()
    {
        gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
    }
    </script>
    
    <script type="text/javascript" src="../Common/webgl-utils.js"></script>
    <script type="text/javascript" src="../Common/initShaders.js"></script>
    <script type="text/javascript" src="../Common/MV.js"></script>
    <script>
    //goal: try and draw just a square.
    
    var canvas;
    var gl;
    
    var points = [];
    
    
    
    window.onload = function init()
    {
        canvas = document.getElementById( "gl-canvas" );
        
        gl = WebGLUtils.setupWebGL( canvas );
        if ( !gl ) { alert( "WebGL isn't available" ); }
            
       //enter new script 
    
    var vertices = [
      vec2(-1.0,-1.0),
      vec2(-1.0,1.0),
      vec2(1.0,1.0),
      vec2(1.0,-1.0)
    ];
    
    square(vertices[0],vertices[1],vertices[2],vertices[3]);
    
    //
        //  Configure WebGL
        //
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
        //  Load shaders and initialize attribute buffers
        
        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );
    
        // Load the data into the GPU
        
        var bufferId = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
        // Associate out shader variables with our data buffer
        
        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
    
        render();
    };
    
    function square(a,b,c,d)
    {
    points.push(a);
    points.push(b);
    points.push(c);
    points.push(d);
    }
    
    
    function render(){
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.drawArrays(gl.LINES, 0, points.length);
    }
    
    </script>
    </head>   
    
    <body>
    <canvas id="gl-canvas" width="512" height="512">
    Oops ... your browser doesn't support the HTML5 canvas element
    </canvas>
    </body>
    </html>





# Answer

2 issues

1. Assuming a standard implementation of `flatten` it returns a JavaScript native array but `gl.bufferData` requires a typed array. So I changed it to

        gl.bufferData(..., new Float32Array(flatten(...)), ...

2. `gl.LINES` draws every pair of points. You're only passing in 4 points which means 2 lines. You won't get a square with that. You could use `gl.LINE_LOOP` to connect all 4 points and the last to the first as well.

Also, when I ran your code I got errors in the JavaScript console which helped me find the issues. You should always check the JavaScript console for errors and warnings.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    //goal: try and draw just a square.

    var canvas;
    var gl;

    var points = [];

    function init()
    {
        canvas = document.getElementById( "gl-canvas" );

        gl = WebGLUtils.setupWebGL( canvas );
        if ( !gl ) { alert( "WebGL isn't available" ); }

       //enter new script 

    var vertices = [
      vec2(-1.0,-1.0),
      vec2(-1.0,1.0),
      vec2(1.0,1.0),
      vec2(1.0,-1.0)
    ];

    square(vertices[0],vertices[1],vertices[2],vertices[3]);

    //
        //  Configure WebGL
        //
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

        //  Load shaders and initialize attribute buffers

        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );

        // Load the data into the GPU

        var bufferId = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(flatten(points)), gl.STATIC_DRAW );

        // Associate out shader variables with our data buffer

        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        render();
    };

    function square(a,b,c,d)
    {
    points.push(a);
    points.push(b);
    points.push(c);
    points.push(d);
    }


    function render(){
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.drawArrays(gl.LINE_LOOP, 0, points.length);
    }

    // ---------------[ missing functions ] ---------

    var WebGLUtils = {
      setupWebGL: function(canvas) {
        return canvas.getContext("webgl");
      },
    };

    function initShaders(gl, vs, fs) {
      return twgl.createProgramFromScripts(gl, [vs, fs]);
    }

    function vec2(x, y) {
      return [x, y];
    }

    function flatten(arrayOfArrays) {
      var flattened =  arrayOfArrays.reduce(function(a, b) {
        return a.concat(b);
      }, []);
      return flattened;
    }
      
    init();

<!-- language: lang-html -->

    <script id="vertex-shader" type="x-shader/x-vertex">
    attribute vec4 vPosition;


    void
    main()
    {
        gl_Position = vPosition;
    }
    </script>

    <script id="fragment-shader" type="x-shader/x-fragment">
    precision mediump float;

    void
    main()
    {
        gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
    }
    </script>

    <script src="https://twgljs.org/dist/twgl.min.js"></script>
    <canvas id="gl-canvas" width="512" height="512">
    Oops ... your browser doesn't support the HTML5 canvas element
    </canvas>

<!-- end snippet -->


