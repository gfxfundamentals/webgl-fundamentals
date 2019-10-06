Title: Can I get a texture onto my second cube?
Description:
TOC: qna

# Question:

I'd like to get an opinion: I currently have the following program consisting of two multi-colored cubes that can be selected via the one html button and rotated by pressing corresponding keys on the keyboard.

Here is my HTML file:

    <html>
    <script id="vertex-shader" type="x-shader/x-vertex">
    
    attribute vec4 vPosition;
    attribute vec4 vColor;
    varying vec4 fColor;
    
    uniform vec3 theta;
    uniform vec4 posiz;
    
    void main()
    {
        // Compute the sines and cosines of theta for each of the three axes in one computation.
        vec3 angles = radians( theta );
        vec3 c = cos( angles );
        vec3 s = sin( angles );
    
        // Remember: these matrices are column-major
        mat4 rx = mat4( 1.0,  0.0,  0.0, 0.0,
         0.0,  c.x,  s.x, 0.0,
         0.0, -s.x,  c.x, 0.0,
         0.0,  0.0,  0.0, 1.0 );
    
        mat4 ry = mat4( c.y, 0.0, -s.y, 0.0,
         0.0, 1.0,  0.0, 0.0,
         s.y, 0.0,  c.y, 0.0,
         0.0, 0.0,  0.0, 1.0 );
    
    
        mat4 rz = mat4( c.z, -s.z, 0.0, 0.0,
         s.z,  c.z, 0.0, 0.0,
         0.0,  0.0, 1.0, 0.0,
         0.0,  0.0, 0.0, 1.0 );
         
     // position matrix
     mat4 posMat = mat4( 1.0,  0.0,  0.0,  0.0,
          0.0,  1.0,  0.0,  0.0,
          0.0,  0.0,  1.0,  0.0,
          posiz[0], posiz[1], posiz[2],  1.0 );
         
     // size matrix
     mat4 sizMat = mat4( posiz[3],  0.0,  0.0,  0.0,
          0.0,  posiz[3],  0.0,  0.0,
          0.0,  0.0,  posiz[3],  0.0,
          0.0,  0.0,  0.0,  1.0 );
    
        fColor = vColor;
        gl_Position = sizMat * posMat * rz * ry * rx * vPosition;
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
    <script type="text/javascript" src="cubev-1.js"></script>
    
    <body>
    <canvas id="gl-canvas" width="512"" height="512">
    Oops ... your browser doesn't support the HTML5 canvas element
    </canvas>
       
    <br/>
    
    <input type = "button" value = "First" id = "switchButton" ></input>
    
    </body>
    </html>

files webgl-utils.js, initShaders.js, and MV.js can be found here:

http://www.cs.unm.edu/~angel/WebGL/7E/Common/

And here is the accompanying javascript file:

    var canvas;
    var gl;
    
    var numVertices  = 36;
    
    var xAxis = 0;
    var yAxis = 1;
    var zAxis = 2;
    
    var axis1 = 0;
    var axis2 = 0;
    
    var rot1 = 1.0; // rate of rotation
    var rot2 = 1.0;
    
    var theta1 = [ 0, 0, 0 ];
    var theta2 = [ 0, 0, 0 ];
    
    // cube position along x, y, and z axis and size
    var posiz1 = [ 0, 0, 0, 1 ];
    var posiz2 = [ 0, 0, 0, 1 ];
    
    // used to send info back to html, I think
    var thetaLoc;
    var posLoc;
    
    var firstCube = true;
    
        var vertices = [
            vec3( -0.5, -0.5,  0.5 ),
            vec3( -0.5,  0.5,  0.5 ),
            vec3(  0.5,  0.5,  0.5 ),
            vec3(  0.5, -0.5,  0.5 ),
            vec3( -0.5, -0.5, -0.5 ),
            vec3( -0.5,  0.5, -0.5 ),
            vec3(  0.5,  0.5, -0.5 ),
            vec3(  0.5, -0.5, -0.5 )
        ];
    
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
    
    // indices of the 12 triangles that comprise the cube
    var indices = [
        1, 0, 3, 3, 2, 1, 2, 3, 7, 7, 6, 2,
        3, 0, 4, 4, 7, 3, 6, 5, 1, 1, 2, 6,
     4, 5, 6, 6, 7, 4, 5, 4, 0, 0, 1, 5
    ];
    
    window.onload = function init()
    {
        canvas = document.getElementById( "gl-canvas" );
        
        gl = WebGLUtils.setupWebGL( canvas );
        if ( !gl ) { alert( "WebGL isn't available" ); }
    
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
        
        gl.enable(gl.DEPTH_TEST);
    
        //  Load shaders and initialize attribute buffers
        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );
    
        // array element buffer    
        var iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
        
        // color array attribute buffer
        var cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW );
    
        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );
    
        // vertex array attribute buffer
        var vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );
    
        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
     
     // connect location to variable in html
        thetaLoc = gl.getUniformLocation(program, "theta"); 
     posizLoc = gl.getUniformLocation(program, "posiz");
     
        //event listeners for buttons
        document.getElementById( "switchButton" ).onclick = function ()
     {
      firstCube = !firstCube; // switch between cubes
      
      if (firstCube) document.getElementById("switchButton").value = "First";
      else document.getElementById("switchButton").value = "Second";
        };
     
     window.onkeydown = function(event)
     {
      var key = String.fromCharCode(event.keyCode);
      
      if (firstCube)
      {
       if (key == 'R') posiz1[0] += .1;
       else if (key == 'L') posiz1[0] -= .1;
       else if (key == 'U') posiz1[1] += .1;
       else if (key == 'D') posiz1[1] -= .1;
       else if (key == 'I') posiz1[2] += .1;
       else if (key == 'O') posiz1[2] -= .1;
       else if (key == 'G') posiz1[3] += .1;
       else if (key == 'S') posiz1[3] -= .1;
       
       if (event.shiftKey == 0)
       {
        if (key == 'X' || key == 'Y' || key == 'Z') rot1 = -1.0;
       }
       else
       {
        if (key == 'X' || key == 'Y' || key == 'Z') rot1 = 1.0;
       }
       
       if (key == 'X') axis1 = xAxis;
       if (key == 'Y') axis1 = yAxis;
       if (key == 'Z') axis1 = zAxis;
      }
      else
      {
       if (key == 'R') posiz2[0] += .1;
       else if (key == 'L') posiz2[0] -= .1;
       else if (key == 'U') posiz2[1] += .1;
       else if (key == 'D') posiz2[1] -= .1;
       else if (key == 'I') posiz2[2] += .1;
       else if (key == 'O') posiz2[2] -= .1;
       else if (key == 'G') posiz2[3] += .1;
       else if (key == 'S') posiz2[3] -= .1;
       
       if (event.shiftKey == 0)
       { 
        if (key == 'X' || key == 'Y' || key == 'Z') rot2 = -1.0;
       }
       else
       {
        if (key == 'X' || key == 'Y' || key == 'Z') rot2 = 1.0;
       }
       
       if (key == 'X') axis2 = xAxis;
       if (key == 'Y') axis2 = yAxis;
       if (key == 'Z') axis2 = zAxis;
      }
     };
     
        render();
    }
    
    function render()
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
     
     // handle rendering of first cube
        theta1[axis1] += rot1;
    
        gl.uniform3fv(thetaLoc, theta1);
     gl.uniform4fv(posizLoc, posiz1);
     
        gl.drawElements( gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0 );
    
     // handle rendering of second cube
     theta2[axis2] += rot2;
     
     gl.uniform3fv(thetaLoc, theta2);
     gl.uniform4fv(posizLoc, posiz2);
     
     gl.drawElements( gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0 );
     
     requestAnimFrame( render );
    }

I have little experience with WebGL and I am trying to get a texture mapped onto the second cube without interfering with the colors on the first. I am trying to go about this by following these instructions:

https://developer.mozilla.org/en-US/docs/Web/WebGL/Using_textures_in_WebGL#The_fragment_shader

which instruct me to update the fragment shader in my html to a value I feel would interfere with normal rendering of the first cube.

Am I perhaps going about it the wrong way? Is it realistically possible to map a texture onto the second cube without interfering with the colors of the first? I'd like an opinion because I don't want to chase what could be a dead end.

By the way, if you would like to run the program yourself, here are the controls:

u - up, d - down, l - left, r - right, i - in, o - out, g - grow, s - shrink

x/y/z - spin along cube's x/y/z-axis

shift + x/y/z - same as above but in opposite direction

and the button switches between the cubes.

Thank you so much for your help and time in advance.

# Answer

I think you might really find [these tutorials](http://webglfundamentals.org) helpful. In particular [this one about matrix math](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html).

In particular it's not common to do so much matrix creation a vertex shader. Generally all your code about rx, ry, rz, posMat & sizeMat would typically be done in JavaScript and only the result send to the shader. That makes the shader far more flexible because you can do any matrix math you want in JavaScript, not just the 5 hardcoded things you did in your shader. Of course there's also nothing technically wrong with the way you did it. Whatever works for you. I'm just pointing out it's not a common approach.

As for the texture vs your current shader's vertex colors it's common to have hundreds or even thousands of shaders for a large program each with different features. In fact for a 3D engine or game engine it's super common to generate your shaders depending what features you need for that particular object.

At the same time for your particular case, instead of 2 shaders another way to do it might be to mix the color and then set one to white

    varying vec4 fColor;
    varying vec2 texcoord;
    uniform sampler2D texture;

    void main(void) {
      gl_FragColorl = texture2D(texture, texcoord) * fColor; 
    }

So when you want to draw with a texture

    // set attributes for texcoord
    gl.bindBuffer(..... texcoordBuffer);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, ....);

    // set the texture
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(...., texture);
    
    // tell the shader which unit you put the texture on
    gl.uniform1i(textureLocation, unit);

    // turn OFF the attribute for vertex colors
    gl.disableVertexAttribArray(fColorLocation);
    
    // set the attribute so it returns white
    gl.vertexAttrib4f(fColorLocation, 1, 1, 1, 1);

When you want to draw with vertex colors you can do the opposite

    // set attributes for vertex colors
    gl.bindBuffer(..... fColorBuffer);
    gl.enableVertexAttribArray(fColorLocation);
    gl.vertexAttribPointer(fColorLocation, ....);

    // turn OFF the attribute for texcoords
    gl.disableVertexAttribArray(texcoordLocation);
    
    // bind a white texture
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(...., white1x1PixelTexture);
    
    // tell the shader which unit you put the texture on
    gl.uniform1i(textureLocation, unit);

At init time you'd create a 1x1 white pixel texture

    var white1x1PixelTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, white1x1PixelTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
         gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255,255,255,255]));

With this style it also means you can use a texture and vertex colors at the same time which is a common way to add variety to something like a terrain map. Just setup both a texture and the vertex colors and they'll be multiplied.



