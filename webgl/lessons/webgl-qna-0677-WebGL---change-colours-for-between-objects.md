Title: WebGL - change colours for between objects
Description:
TOC: qna

# Question:

I am new to WebGL and want to know how to change between colours for different objects. 

I have a data for a circle and a field in one array. I want to display the field in green, and display the circle on the field in blue.

I am getting the error for my vColor attribute (which doesn't not display my circle, only the field):<br>
`[.Offscreen-For-WebGL-05A18588]GL ERROR :GL_INVALID_OPERATION : glDrawArrays: attempt to access out of range vertices in attribute 1`, 

However, when I remove the code to set up the vColor attribute, I can see the circle but both field and circle are displayed in black. Any clue where I am going wrong?

Shader code: 

        <script id="vertex-shader" type="x-shader/x-vertex">
            attribute vec4 vPosition;
            attribute vec4 vColor;
            varying vec4 fColor;

            void main() {
                fColor = vColor;
                gl_Position = vPosition;
            }
        </script>

        <script id="fragment-shader" type="x-shader/x-fragment">
            precision mediump float;
            varying vec4 fColor;

            void main() {
                gl_FragColor = fColor;
            }
        </script>

JS code:

    //cirlce data
    var pi = 3.14159;
    var x = 2*pi/100;
    var y = 2*pi/100;
    var r = 0.5;
    var center = vec2(0.0, 0.0);
    //data for gpu
    var vertices = [
        vec2(-7.0,-1),
        vec2(-0.6, 0),
        vec2(0.6, 0),
        vec2(6.0, -1)
    ];

    var vertexColors = [
        vec4( 0.0, 0.0, 0.0, 0.0 ),  // black
        vec4( 1.0, 0.0, 0.0, 0.0 ),  // red
        vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
        vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
        vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
        vec4( 1.0, 0.0, 1.0, 0.0 ),  // magenta
        vec4( 0.0, 1.0, 1.0, 0.0 )   // cyan
    ];

    window.onload = function init()
    {
        canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    vertices.push(center);
    for(var i = 0; i < 100; i++) {
        vertices.push(add(center, vec2(r*Math.cos(x*i), r*Math.sin(y*i))));
    }

    console.log(flatten(vertices));

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);    
    
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 ); //error produced here
    gl.enableVertexAttribArray( vColor );

    var buffer2 = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer2 );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Associate out shader variables with our data buffer

    render();
    };

    function render() {
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.drawArrays( gl.TRIANGLE_FAN, 0, 4);//draw the field - field coordinates start at 0-4
        gl.drawArrays( gl.TRIANGLE_FAN, 5, 100);//draw the circle - circle    coordinates start at 5-100
    }

# Answer

If you're using vertex colors as attributes to color your shapes you need one vertex color PER vertex. In other words if you have 1000 vertices each vertex needs a position and a color.

If you're using a constant color per shape then you can do one of these.

1.  Use a constant vertex attribute

        // disabling the array means this attribute uses a constant value
        gl.disableVertexAttribArray(vertexColorLocation);

        // set the constant value
        gl.vertexAttrib4f(vertexColorLocation, r, g, b, a);

    Note: using constant values on attributes is not a common usage case

2.  Use a uniform instead

    change your shader to

        <script id="vertex-shader" type="x-shader/x-vertex">
            attribute vec4 vPosition;

            void main() {
                gl_Position = vPosition;
            }
        </script>

        <script id="fragment-shader" type="x-shader/x-fragment">
            precision mediump float;
            uniform vec4 fColor;     // <=- changed

            void main() {
                gl_FragColor = fColor;
            }
        </script>

    Now you can set the color of your shape by setting the fColor uniform

        // at init time
        var fColorLocation = gl.getUniformLocation(program, "fColor");

        // at render time
        gl.uniform4f(fColorLocation, r, g, b, a);

