Title: WebGL: Texture rendering not working correctly
Description:
TOC: qna

# Question:

I'm trying to use textures for the first time in WebGL and I'm having a problem getting it to work. I'm trying to apply a stone-like texture to cubes that are moving around in a 3D space, as you can see in the rocks.js below. I always get this error which I don't know what to make of (I'm using Chrome btw): 

> RENDER WARNING: there is no texture bound to the unit 0

Here is my index.html file:

    <html>
    
    <script id="vertex-shader" type="x-shader/x-vertex">
    
    attribute vec4 vPosition;
    attribute vec4 vColor;
    attribute  vec2 vTexCoord;
    
    varying vec2 fTexCoord;
    varying vec4 fColor;
    
    uniform mat4 projection;
    uniform mat4 modelview;
    
    void main()
    {
        fTexCoord = vTexCoord;
        fColor = vColor;
        gl_Position = projection * modelview * vPosition;
    }
    </script>
    
    <script id="fragment-shader" type="x-shader/x-fragment">
    
    precision mediump float;
    
    varying vec4 fColor;
    
    varying vec2 fTexCoord;
    
    uniform sampler2D texture;
    
    void
    main()
    {
         gl_FragColor = texture2D( texture, fTexCoord );
        //gl_FragColor = fColor;
    }
    </script>

    <script type="text/javascript" src="../Common/webgl-utils.js"></script>
    <script type="text/javascript" src="../Common/initShaders.js"></script>
    <script type="text/javascript" src="../Common/MV.js"></script>
    <script type="text/javascript" src="main.js"></script>
    <script type="text/javascript" src="grid.js"></script>
    <script type="text/javascript" src="spaceship.js"></script>
    <script type="text/javascript" src="rocks.js"></script>
    <body>
     <canvas id="gl-canvas" width="1100" height="1200" style="float:left;">
    Oops ... your browser doesn't support the HTML5 canvas element
     </canvas>

    </div>

    </body>
    </html>

Here is my rocks.js where the object which I'm attempting to apply texture to is defined:

        // global webgl variables
    var gl;
    
    var vBuffer;
    var cBuffer;
    var iBuffer;
    var tBuffer;
    var mvLoc;
    
    var rocks = (function() {
    
        var direction = vec3();
        var lastDirection = vec3();
        var location = vec3();
        var lastLocation = vec3();
    
        var rock = {
            NumVertices : 36,
    
            indices :[
                1, 0, 3,
                3, 2, 1,
                2, 3, 7,
                7, 6, 2,
                3, 0, 4,
                4, 7, 3,
                6, 5, 1,
                1, 2, 6,
                4, 5, 6,
                6, 7, 4,
                5, 4, 0,
                0, 1, 1
            ],
    
            vertices : [
                vec4( -0.5, -0.5,  0.5, 1.0 ),
                vec4( -0.5,  0.5,  0.5, 1.0 ),
                vec4(  0.5,  0.5,  0.5, 1.0 ),
                vec4(  0.5, -0.5,  0.5, 1.0 ),
                vec4( -0.5, -0.5, -0.5, 1.0 ),
                vec4( -0.5,  0.5, -0.5, 1.0 ),
                vec4(  0.5,  0.5, -0.5, 1.0 ),
                vec4(  0.5, -0.5, -0.5, 1.0 )
            ],
    
            texVertices : [
                vec2(-0.5, -0.5),
                vec2(-0.5, 0.5 ),
                vec2( 0.5, 0.5 ),
                vec2( 0.5, -0.5 ),
                vec2( -0.5, -0.5 ),
                vec2( -0.5, 0.5 ),
                vec2( 0.5, 0.5 ),
                vec2( 0.5, -0.5 )
            ],
    
            render : function(mv) {
    
                gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(this.vertices));
    
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
                gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, new Uint8Array(this.indices))
    
                gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
                gl.bufferSubData( gl.ARRAY_BUFFER, 0, flatten(this.texVertices) );
    
    
                mv = mult( mv, scalem(0.2, 0.2, 0.2) );
                mv = mult( mv, translate(0.0, 0.0, 0.0) );
    
                gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
                gl.drawElements( gl.TRIANGLES, this.NumVertices, gl.UNSIGNED_BYTE, 0 );
            }
        }
    
        var init = function(glIn, vBufferIn, iBufferIn, tBufferIn, mvLocIn) {
            // set global webgl variagles
            gl = gl;
            vBuffer = vBufferIn;
            iBuffer = iBufferIn;
            mvLoc = mvLocIn;
            tBuffer = tBufferIn;
    
    
            direction = [(Math.random()*0.06-0.03)/2, (Math.random()*0.06-0.03)/2, (Math.random()*0.06-0.03)/2];
            location = [Math.random()*6-3, Math.random()*6-3, Math.random()*6-3];
            lastDirection = direction;
            lastLocation = location;
        }
    
        var render = function(spinX, spinY, mv) {
            mv = mult( mv, rotateX(spinX) );
            mv = mult( mv, rotateY(spinY) );
            mv = mult( mv, translate(location) );
    
            rock.render(mv);
        }
    
        var updateRock = function() {
            // direction = updatedDir;
            location = add( location, direction );
    
            if(location[0] > 3 || location[0] < -3) location[0] = -location[0];
            if(location[1] > 3 || location[1] < -3) location[1] = -location[1];
            if(location[2] > 3 || location[2] < -3) location[2] = -location[2];
    
            lastDirection = direction;
            lastLocation = location;
        }
    
    
        return {
            init : init,
            render : render,
            update : updateRock
        };
    });

And finally, my main.js for running everyting: 

    // webgl global variables
    var gl;
    var canvas;
    
    var texture;
    
    var texCoords = [];
    
    var movement = false;
    var spinX = 0;
    var spinY = 0;
    var origX;
    var origY;
    
    var xRot = 0;
    var yRot = 0;
    
    var grid;
    var spaceship;
    var rocksArray = [];
    
    function configureTexture( image ) {
        texture = gl.createTexture();
        gl.bindTexture( gl.TEXTURE_2D, texture );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
        gl.generateMipmap( gl.TEXTURE_2D );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    }
    
    
    window.onload = function init()
    {
        canvas = document.getElementById( "gl-canvas" );
    
        gl = WebGLUtils.setupWebGL( canvas );
        if ( !gl ) { alert( "WebGL isn't available" ); }
    
        gl.viewport( 0, 0, canvas.width, canvas.height );
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
    
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
        var program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );
    
        var iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 36, gl.DYNAMIC_DRAW);
    
        var cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, 128, gl.DYNAMIC_DRAW );
    
        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );
    
        var vBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, 1024, gl.DYNAMIC_DRAW );
    
        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
    
        var tBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, 128, gl.STATIC_DRAW );
    
        var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
        gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vTexCoord );
    
        var image = new Image();
        image.src = "rock.jpg"
        image.onload = function() {
          configureTexture( image );
        }
    
        var proLoc = gl.getUniformLocation( program, "projection" );
        mvLoc = gl.getUniformLocation( program, "modelview" );
        gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    
    
        var pers = perspective( 100.0, 1.0, 0.2, 100.0 );
        gl.uniformMatrix4fv(proLoc, false, flatten(pers));
    
        grid = new grid();
        grid.init(gl, vBuffer, cBuffer, iBuffer, mvLoc);
    
        spaceship = new spaceship();
        spaceship.init(gl, vBuffer, cBuffer, iBuffer, mvLoc);
    
        for (var i = 0; i < 100; i++) {
            rocksArray[i] = new rocks();
            rocksArray[i].init(gl, vBuffer, iBuffer, tBuffer, mvLoc);
        }
    
        attachEventHandlers();
    
        render();
    }
    
    function reloadPage() {
        location.reload();
    }
    
    function attachEventHandlers() {
    
        canvas.addEventListener("mousedown", function(e){
            movement = true;
            origX = e.offsetX;
            origY = e.offsetY;
            // Disable drag and drop
            e.preventDefault();
        });
    
        canvas.addEventListener("mouseup", function(e){
            movement = false;
        });
    
        canvas.addEventListener("mousemove", function(e){
            if(movement) {
                spinY += (e.offsetX - origX) % 360;
                spinX += (e.offsetY - origY) % 360;
                origX = e.offsetX;
                origY = e.offsetY;
            }
        });
    
        window.addEventListener("keydown", function(e) {
          spaceship.keyArray[e.keyCode] = true;
        });
    
        window.addEventListener("keyup", function(e) {
          spaceship.keyArray[e.keyCode] = false;
        });
    
    }
    
    
    function render() {
      spaceship.moveSpaceship();
    
    
      rocksArray.forEach(function(rock) {
          rock.update();
      });
    
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        mv = lookAt( vec3(0.0, 0.0, 1.0), vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0) );
        mv = mult(mv, rotateX(90));
    
        // spaceship.render(spinX, spinY, mv);
        mv = mult( mv, translate(-xVal, -yVal, -zVal));
        mv = mult(mv, rotateZ(-zSpin));
        mv = mult(mv, rotateX(-xSpin));
    
    
        grid.render(spinX, spinY, mv);
    
        rocksArray.forEach(function(rock) {
            rock.render(spinX, spinY, mv);
        });
    
        requestAnimFrame( render );
    }


# Answer

The issue is most likely you start rendering immediately but your texture doesn't get created until the image has downloaded. 

My suggestion is to create a 1x1 pixel texture to start, then replace the contents of that texture with the image once it has downloaded.

    function configureTexture( image ) {
        // texture = gl.createTexture(); -- delete this line
        ...
    }

And change your initialization to something like

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // put a 1x1 red pixel in the texture so it's renderable immediately
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
                  gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));

    // now load the image, the image will replace the contents of the
    // texture once it has finished downloading
    var image = new Image();
    image.src = "rock.jpg"
    image.onload = function() {
      configureTexture( image );
    }

[I'd suggest taking a look at these tutorials](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html)
