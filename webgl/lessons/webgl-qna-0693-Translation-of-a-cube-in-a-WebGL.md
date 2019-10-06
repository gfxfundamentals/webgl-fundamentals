Title: Translation of a cube in a WebGL
Description:
TOC: qna

# Question:

I want to perform a translation of a cube in WebGL but I get a deformation of the cube instead of a translation
This is my code:

HTML file

    <!DOCTYPE html>
    <html>
    
    <script id="vertex-shader" type="x-shader/x-vertex">
    
    attribute  vec4 vPosition;
    attribute  vec4 vColor;
    varying vec4 fColor;
    
    uniform vec3 theta;
    uniform vec3 tr;
    
    void main()
    {
        // Compute the sines and cosines of theta for each of
        //   the three axes in one computation.
        vec3 angles = radians( theta );
        vec3 c = cos( angles );
        vec3 s = sin( angles );
        
        // Remeber: thse matrices are column-major
        mat4 rx = mat4( 1.0,  0.0,  0.0, 0.0,
               0.0,  c.x,  s.x, 0.0,
               0.0, -s.x,  c.x, 0.0,
               0.0,  0.0,  0.0, 1.0 );
    
        mat4 ry = mat4( c.y, 0.0, -s.y, 0.0,
               0.0, 1.0,  0.0, 0.0,
               s.y, 0.0,  c.y, 0.0,
               0.0, 0.0,  0.0, 1.0 );
    
    
        mat4 rz = mat4( c.z, s.z, 0.0, 0.0,
             -s.z,  c.z, 0.0, 0.0,
              0.0,  0.0, 1.0, 0.0,
               0.0,  0.0, 0.0, 1.0 );
    
        mat4 t= mat4( 1.0, 0.0, 0.0, tr.x,
                      0.0, 1.0, 0.0, tr.y,
                      0.0, 0.0, 1.0, tr.z,
                      0.0, 0.0, 0.0, 1.0 );
                      
                       
    
        fColor = vColor;
        gl_Position = rz * ry * rx  * t * vPosition;
        gl_Position.z = -gl_Position.z;
    }
    </script>
    
    <script id="fragment-shader" type="x-shader/x-fragment">
    
    precision mediump float;
    
    varying vec4 fColor;
    
    void
    main()
    {
        gl_FragColor = fColor;
    }
    </script>
    
    <script type="text/javascript" src="../Common/webgl-utils.js"></script>
    <script type="text/javascript" src="../Common/initShaders.js"></script>
    <script type="text/javascript" src="../Common/MV.js"></script>
    <script type="text/javascript" src="Lab20170314_1.js"></script>
    
    <body>
    <canvas id="gl-canvas" width="512"" height="512">
    Oops ... your browser doesn't support the HTML5 canvas element
    </canvas>
    
    <br/>
    
    <button id= "xButton">Rotate X</button>
    <button id= "yButton">Rotate Y</button>
    <button id= "zButton">Rotate Z</button>
    <button id= "stopAnimation"> Start/Stop Animation</button>
    <div>
    rotation angle 0  <input id="slide" type="range"
    min="0" max="10" step="1" value="5" />
    10 </div>
    
    <div>
    translation on x -1  <input id="slide1" type="range"
    min="-1" max="1" step="0.1" value="0" />
    1 </div>
    
    <div>
    translation on y -1  <input id="slide2" type="range"
    min="-1" max="1" step="0.1" value="0" />
    1 </div>
    
    <div>
    translation on z -1  <input id="slide3" type="range"
    min="-1" max="1" step="0.1" value="0" />
    1 </div>
    
    
    
    
    </body>
    </html>

JavaScript Code

    "use strict";
    
    var canvas;
    var gl;
    
    var NumVertices  = 36;
    
    var points = [];
    var colors = [];
    
    var xAxis = 0;
    var yAxis = 1;
    var zAxis = 2;
    
    var axis = 0;
    var axisTr = 0;
    var theta = [ 0, 0, 0 ];
    var tr=[ 0, 0, 0 ];
    
    var thetaLoc;
    var trLoc;
    var stop = false;
    var trInput = 0;
    var degrees=5;
    
    window.onload = function init()
    {
        canvas = document.getElementById( "gl-canvas" );
    
        gl = WebGLUtils.setupWebGL( canvas );
        if ( !gl ) { alert( "WebGL isn't available" ); }
    
        colorCube();
    
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
        gl.enable(gl.DEPTH_TEST);
    
        //
        //  Load shaders and initialize attribute buffers
        //
        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );
    
        var cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    
        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );
    
        var vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    
        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
    
        thetaLoc = gl.getUniformLocation(program, "theta");
        trLoc = gl.getUniformLocation(program, "tr")
    
        //event listeners for buttons
    
        document.getElementById( "xButton" ).onclick = function () {
            axis = xAxis;
        };
        document.getElementById( "yButton" ).onclick = function () {
            axis = yAxis;
        };
        document.getElementById( "zButton" ).onclick = function () {
            axis = zAxis;
        };
        document.getElementById( "stopAnimation" ).onclick= function() {
            stop =! stop;
       };
        document.getElementById( "slide" ).onchange= function(){
            degrees = parseInt(event.target.value,10);
       };
        
        document.getElementById( "slide1" ).onchange= function(){
            axisTr = xAxis;
            trInput = parseFloat(event.target.value,10);
       };
    
        document.getElementById( "slide2" ).onchange= function(){
            axisTr = yAxis;
            trInput = parseFloat(event.target.value,10);
       };
    
        document.getElementById( "slide3" ).onchange= function(){
            axisTr = zAxis;
            trInput = parseFloat(event.target.value,10);
       };
    
    
        render();
    }
    
    function colorCube()
    {
        quad( 1, 0, 3, 2 );
        quad( 2, 3, 7, 6 );
        quad( 3, 0, 4, 7 );
        quad( 6, 5, 1, 2 );
        quad( 4, 5, 6, 7 );
        quad( 5, 4, 0, 1 );
    }
    
    function quad(a, b, c, d)
    {
        var vertices = [
            vec4( -0.5, -0.5,  0.5, 1.0 ),
            vec4( -0.5,  0.5,  0.5, 1.0 ),
            vec4(  0.5,  0.5,  0.5, 1.0 ),
            vec4(  0.5, -0.5,  0.5, 1.0 ),
            vec4( -0.5, -0.5, -0.5, 1.0 ),
            vec4( -0.5,  0.5, -0.5, 1.0 ),
            vec4(  0.5,  0.5, -0.5, 1.0 ),
            vec4(  0.5, -0.5, -0.5, 1.0 )
        ];
    
        var vertexColors = [
            [ 0.0, 0.0, 0.0, 1.0 ],  // black
            [ 1.0, 0.0, 0.0, 1.0 ],  // red
            [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
            [ 0.0, 1.0, 0.0, 1.0 ],  // green
            [ 0.0, 0.0, 1.0, 1.0 ],  // blue
            [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
            [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
            [ 1.0, 1.0, 1.0, 1.0 ]   // white
        ];
    
        // We need to parition the quad into two triangles in order for
        // WebGL to be able to render it.  In this case, we create two
        // triangles from the quad indices
    
        //vertex color assigned by the index of the vertex
    
        var indices = [ a, b, c, a, c, d ];
    
        for ( var i = 0; i < indices.length; ++i ) {
            points.push( vertices[indices[i]] );
            //colors.push( vertexColors[indices[i]] );
    
            // for solid colored faces use
            colors.push(vertexColors[a]);
    
        }
    }
    
    function render()
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        if(stop)
    {
    }
        else
    {
        theta[axis] += degrees;
    }
    
        tr[axisTr] = trInput;
    
        gl.uniform3fv(thetaLoc, theta);
    
        gl.uniform3fv(trLoc, tr);
    
        gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
    
        requestAnimFrame( render );
    }


I use a translation matrix to perform the translation according to a system of homogeneous coordinates. Furthermore, I have three sliders to set the translation parameters. Where am I wrong?

Thank you in advance.

# Answer

It would be better if you'd post working code. Link in a common library from a CDN use a snippet for the rest.

Here's your code working and fixed?

* First I used [twgl](https://twgljs.org) to supply something to compile the shader. 
* You had and extra `"` in your canvas tag that was making all the rest of the file ignored
* There's no reason to use a helper for `requestAnimationFrame` anymore. All browsers that support WebGL support `requestAnimationFrame`.
* There's mostly no reason to use any special function to get a webgl context. Just do `someCanvas.getContext("webgl")`
* You didn't supply a `flatten` function. It looks like the flatten function you're using generates a `Float32Array` which would be extremely confusing for anyone used to JavaScript and expects it to generate an actual JavaScript array.
* You didn't supply a `vec4` function. Not sure why you even have that function but it was easy to guess
* no reason to use `window.onload`. Just put your script at the bottom of your HTML and call `init` directly.
* use `oninput` instead of `onchange` for live updates (as in you'll get called while the slide is sliding instead of only when the user lets off the slider). While we're at it it's arguably better to use `elem.addEventListener('input', listener)` than `elem.oninput`. The first is more flexible. It allows multiple listeners. 

Finally to your actual question. WebGL's storage order from a programming perspective is row major but it's multiplication functions interpret those rows as columns.

So, you can either swap the multiplication order OR you can change your matrices. I'd suggest changing the matrices because otherwise you'll be different that pretty much all other webgl apps.

I'd also suggest that creating matrices a shader is not flexible and not common. There are times when it's the right thing to do but this is arguably not one of the, You might want to [try these webgl tutorials](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html)

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    var canvas;
    var gl;

    var NumVertices  = 36;

    var points = [];
    var colors = [];

    var xAxis = 0;
    var yAxis = 1;
    var zAxis = 2;

    var axis = 0;
    var axisTr = 0;
    var theta = [ 0, 0, 0 ];
    var tr=[ 0, 0, 0 ];

    var thetaLoc;
    var trLoc;
    var stop = false;
    var trInput = 0;
    var degrees=5;

    function init()
    {
        canvas = document.getElementById( "gl-canvas" );

        gl = canvas.getContext("webgl");
        if ( !gl ) { alert( "WebGL isn't available" ); return; }

        colorCube();

        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

        gl.enable(gl.DEPTH_TEST);

        //
        //  Load shaders and initialize attribute buffers
        //
        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );

        var cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );

        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        var vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        thetaLoc = gl.getUniformLocation(program, "theta");
        trLoc = gl.getUniformLocation(program, "tr")

        //event listeners for buttons

        document.getElementById( "xButton" ).onclick = function () {
            axis = xAxis;
        };
        document.getElementById( "yButton" ).onclick = function () {
            axis = yAxis;
        };
        document.getElementById( "zButton" ).onclick = function () {
            axis = zAxis;
        };
        document.getElementById( "stopAnimation" ).onclick= function() {
            stop =! stop;
       };
        document.getElementById( "slide" ).oninput = function(){
            degrees = parseInt(event.target.value,10);
       };

        document.getElementById( "slide1" ).oninput = function(){
            axisTr = xAxis;
            trInput = parseFloat(event.target.value,10);
       };

        document.getElementById( "slide2" ).oninput = function(){
            axisTr = yAxis;
            trInput = parseFloat(event.target.value,10);
       };

        document.getElementById( "slide3" ).oninput= function(){
            axisTr = zAxis;
            trInput = parseFloat(event.target.value,10);
       };


        render();
    }

    function colorCube()
    {
        quad( 1, 0, 3, 2 );
        quad( 2, 3, 7, 6 );
        quad( 3, 0, 4, 7 );
        quad( 6, 5, 1, 2 );
        quad( 4, 5, 6, 7 );
        quad( 5, 4, 0, 1 );
    }

    function quad(a, b, c, d)
    {
        var vertices = [
            vec4( -0.5, -0.5,  0.5, 1.0 ),
            vec4( -0.5,  0.5,  0.5, 1.0 ),
            vec4(  0.5,  0.5,  0.5, 1.0 ),
            vec4(  0.5, -0.5,  0.5, 1.0 ),
            vec4( -0.5, -0.5, -0.5, 1.0 ),
            vec4( -0.5,  0.5, -0.5, 1.0 ),
            vec4(  0.5,  0.5, -0.5, 1.0 ),
            vec4(  0.5, -0.5, -0.5, 1.0 )
        ];

        var vertexColors = [
            [ 0.0, 0.0, 0.0, 1.0 ],  // black
            [ 1.0, 0.0, 0.0, 1.0 ],  // red
            [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
            [ 0.0, 1.0, 0.0, 1.0 ],  // green
            [ 0.0, 0.0, 1.0, 1.0 ],  // blue
            [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
            [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
            [ 1.0, 1.0, 1.0, 1.0 ]   // white
        ];

        // We need to parition the quad into two triangles in order for
        // WebGL to be able to render it.  In this case, we create two
        // triangles from the quad indices

        //vertex color assigned by the index of the vertex

        var indices = [ a, b, c, a, c, d ];

        for ( var i = 0; i < indices.length; ++i ) {
            points.push( vertices[indices[i]] );
            //colors.push( vertexColors[indices[i]] );

            // for solid colored faces use
            colors.push(vertexColors[a]);

        }
    }

    function render()
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if(stop)
    {
    }
        else
    {
        theta[axis] += degrees;
    }

        tr[axisTr] = trInput;

        gl.uniform3fv(thetaLoc, theta);

        gl.uniform3fv(trLoc, tr);

        gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

        requestAnimationFrame( render );
    }

    function initShaders(gl, vsId, fsId) {
      return twgl.createProgramFromScripts(gl, [vsId, fsId]);
    }

    function vec4(x, y, z, w) {
     return [x, y, z, w];
    }

    function flatten(arrays) {
      return new Float32Array([].concat.apply([], arrays));
    }
    init();

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <script id="vertex-shader" type="x-shader/x-vertex">

    attribute  vec4 vPosition;
    attribute  vec4 vColor;
    varying vec4 fColor;

    uniform vec3 theta;
    uniform vec3 tr;

    void main()
    {
        // Compute the sines and cosines of theta for each of
        //   the three axes in one computation.
        vec3 angles = radians( theta );
        vec3 c = cos( angles );
        vec3 s = sin( angles );

        // Remeber: thse matrices are column-major
        mat4 rx = mat4( 1.0,  0.0,  0.0, 0.0,
                        0.0,  c.x, -s.x, 0.0,
                        0.0,  s.x,  c.x, 0.0,
                        0.0,  0.0,  0.0, 1.0 );

        mat4 ry = mat4( c.y, 0.0,  s.y, 0.0,
                        0.0, 1.0,  0.0, 0.0,
                       -s.y, 0.0,  c.y, 0.0,
                        0.0, 0.0,  0.0, 1.0 );


        mat4 rz = mat4( c.z, -s.z, 0.0, 0.0,
                        s.z,  c.z, 0.0, 0.0,
                        0.0,  0.0, 1.0, 0.0,
                        0.0,  0.0, 0.0, 1.0 );

        mat4 t= mat4( 1.0, 0.0, 0.0, 0,
                      0.0, 1.0, 0.0, 0,
                      0.0, 0.0, 1.0, 0,
                      tr.xyz, 1.0 );



        fColor = vColor;
        gl_Position = rz * ry * rx  * t * vPosition;
        gl_Position.z = -gl_Position.z;
        
        // this would too but would be different than most WebGL programs
        //gl_Position = vPosition * t * rx * ry * rz;
        //gl_Position.z = -gl_Position.z;
    }
    </script>

    <script id="fragment-shader" type="x-shader/x-fragment">

    precision mediump float;

    varying vec4 fColor;

    void
    main()
    {
        gl_FragColor = fColor;
    }
    </script>
    <canvas id="gl-canvas" width="512" height="512">
    Oops ... your browser doesn't support the HTML5 canvas element
    </canvas>

    <br/>

    <button id= "xButton">Rotate X</button>
    <button id= "yButton">Rotate Y</button>
    <button id= "zButton">Rotate Z</button>
    <button id= "stopAnimation"> Start/Stop Animation</button>
    <div>
    rotation angle 0  <input id="slide" type="range"
    min="0" max="10" step="1" value="5" />
    10 </div>

    <div>
    translation on x -1  <input id="slide1" type="range"
    min="-1" max="1" step="0.1" value="0" />
    1 </div>

    <div>
    translation on y -1  <input id="slide2" type="range"
    min="-1" max="1" step="0.1" value="0" />
    1 </div>

    <div>
    translation on z -1  <input id="slide3" type="range"
    min="-1" max="1" step="0.1" value="0" />
    1 </div>

<!-- end snippet -->


