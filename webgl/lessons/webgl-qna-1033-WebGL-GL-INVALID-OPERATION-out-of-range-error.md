Title: WebGL GL_INVALID_OPERATION out of range error
Description:
TOC: qna

# Question:

All.I'm kind of new to webgl but I checked the resources about this error.I am trying to draw a single square right next to the my circle.I drew the circle after that ı added 4 indices for square and organize the drawArrays to based on that.But ı am getting this error : 

> GL ERROR : GL_INVALID_OPERATION : glDrawArrays: attempt to access out of range vertices in attribute 0

Also checked my bounds and indexes but there is no problem about that here is the code :





    var vPosition,angle=10,j=1,xr=0.2,yr=0.2,rad;
    var transformationMatrix, transformationMatrixLoc;

    window.onload = function init()
    {

    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );

    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    vertices = [
       vec2(0,0)
    ];

    for(var i =0 ; i<=360 ; i+=10)
    {
       vertices.push(vec2(xr*Math.cos(i*(Math.PI/180)),yr*Math.sin(i* 
       (Math.PI/180))));
    }

     vertices.push(vec2(0.20,0));
     vertices.push(vec2(0.25,-0.05));
     vertices.push(vec2(0.3,0));
     vertices.push(vec2(0.25,0.05));

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    transformationMatrixLoc = 
     gl.getUniformLocation(program,"transformationMatrix" );
    render();
     }


    render(){
    gl.clear( gl.COLOR_BUFFER_BIT );
  var MStack = [] ;
 
    var transformationMatrix = mat4();
    MStack.push(transformationMatrix);
    gl.uniformMatrix4fv( transformationMatrixLoc, false, 
    flatten(transformationMatrix) );
    gl.uniform4fv(colorLoc, vec4(red, green, blue, 1.0));

    gl.drawArrays( gl.TRIANGLE_FAN, 0, vertices.length-4 );

    transformationMatrix = MStack.pop();
    MStack.push(transformationMatrix);
    gl.uniformMatrix4fv( transformationMatrixLoc, false, 
    flatten(transformationMatrix) );

    gl.drawArrays(gl.TRIANGLE_FAN,vertices.length-4,vertices.length);
    gl.uniform4fv(colorLoc, vec4(red, green, blue, 1.0));

    window.requestAnimFrame(render);
    }


I hope you guys help me.Really thanks.

# Answer

Here is a working snippet. Next time please post a snippet that reproduces your issue

Things I needed to fix in the code you posted

1. The code didn't include shaders

   I guessed some shaders that seemed to match the code

        <script id="vertex-shader" type="x-shader/x-vertex">
        attribute  vec4 vPosition;
        uniform mat4 transformationMatrix;
        void main() 
        {
            gl_Position = transformationMatrix*vPosition;
        } 
        </script>
        
        <script id="fragment-shader" type="x-shader/x-fragment">
        precision highp float;
        uniform vec4 color;
        void
        main()
        {
            gl_FragColor = color;
        }
        </script>

2. The code didn't define a canvas

   I added one with an id that matched the code

        <canvas id="gl-canvas" width="200" height="200"></canvas>

3. The code didn't link to the scripts you're using. Things like `vec2` and `flatten` used in JavaScript are not part of WebGL. They are part of some library. Without those we can't know what your code does

   I guessed it was these: https://github.com/esangel/WebGL and so I included them by adding

        <script src="https://esangel.github.io/WebGL/Common/webgl-utils.js"></script>
        <script src="https://esangel.github.io/WebGL/Common/initShaders.js"></script>
        <script src="https://esangel.github.io/WebGL/Common/MV.js"></script>


4. The code didn't define or look up `colorLoc` for the `color` uniform location.

5. The code didn't define `red`, `green` and `blue`.

Assuming all of those existed in your actual code then I'm guessing the issue was this line

    gl.drawArrays(gl.TRIANGLE_FAN,vertices.length-4,vertices.length);

It should probably have been

    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);

The arguments to `drawArrays` are

    gl.drawArrays(primitiveType, offset, count);

where `primitiveType` is the type of primitive to draw. `offset` is the number of vertices to skip in the attributes you have configured and `count` is the number of vertices to process.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vPosition, angle = 10,
      j = 1,
      xr = 0.2,
      yr = 0.2,
      colorLoc,
      rad;
    var transformationMatrix, transformationMatrixLoc;

    function init() {
      canvas = document.getElementById("gl-canvas");
      gl = WebGLUtils.setupWebGL(canvas);

      if (!gl) {
        alert("WebGL isn't available");
      }
      gl.viewport(0, 0, canvas.width, canvas.height);

      gl.clearColor(1.0, 1.0, 1.0, 1.0);
      //  Load shaders and initialize attribute buffers

      var program = initShaders(gl, "vertex-shader", "fragment-shader");
      gl.useProgram(program);

      vertices = [
        vec2(0, 0)
      ];

      for (var i = 0; i <= 360; i += 10) {
        vertices.push(vec2(xr * Math.cos(i * (Math.PI / 180)), yr * Math.sin(i *
          (Math.PI / 180))));
      }

      vertices.push(vec2(0.20, 0));
      vertices.push(vec2(0.25, -0.05));
      vertices.push(vec2(0.3, 0));
      vertices.push(vec2(0.25, 0.05));

      vBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

      // Associate out shader variables with our data buffer
      vPosition = gl.getAttribLocation(program, "vPosition");
      gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(vPosition);

      transformationMatrixLoc =
        gl.getUniformLocation(program, "transformationMatrix");
      colorLoc = gl.getUniformLocation(program, "color");
      render();
    }

    function render() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      var MStack = [];
      const red = 1;
      const green = 0.5;
      const blue = 0.25;

      var transformationMatrix = mat4();
      MStack.push(transformationMatrix);
      gl.uniformMatrix4fv(transformationMatrixLoc, false,
        flatten(transformationMatrix));
      gl.uniform4fv(colorLoc, vec4(red, green, blue, 1.0));

      gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length - 4);

      transformationMatrix = MStack.pop();
      MStack.push(transformationMatrix);
      gl.uniformMatrix4fv(transformationMatrixLoc, false,
        flatten(transformationMatrix));

      gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);
      gl.uniform4fv(colorLoc, vec4(red, green, blue, 1.0));

      window.requestAnimFrame(render);
    }

    init();

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://esangel.github.io/WebGL/Common/webgl-utils.js"></script>
    <script src="https://esangel.github.io/WebGL/Common/initShaders.js"></script>
    <script src="https://esangel.github.io/WebGL/Common/MV.js"></script>
    <canvas id="gl-canvas" width="200" height="200"></canvas>
    <script id="vertex-shader" type="x-shader/x-vertex">
    attribute  vec4 vPosition;
    uniform mat4 transformationMatrix;
    void main() 
    {
        gl_Position = transformationMatrix*vPosition;
    } 
    </script>

    <script id="fragment-shader" type="x-shader/x-fragment">
    precision highp float;
    uniform vec4 color;
    void
    main()
    {
        gl_FragColor = color;
    }
    </script>

<!-- end snippet -->

One more thing the code did, it use an outdated way of starting using 

```
window.onload = function init() { ...
```

A more modern way is just to put your scripts at the bottom of your page instead of the top and call `init` directly. Otherwise use `window.addEventListener('load', function init() { ...` as that will let more than one script init things on the page.

You might find [these articles](https://webglfundamentals.org) helpful.
