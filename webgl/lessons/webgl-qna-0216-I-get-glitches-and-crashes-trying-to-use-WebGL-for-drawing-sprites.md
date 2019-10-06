Title: I get glitches and crashes trying to use WebGL for drawing sprites
Description:
TOC: qna

# Question:

I am converting my sprite drawing function from canvas 2d to webgl.

As I am new to webgl (and openGL too), I learned from this tuto http://games.greggman.com/game/webgl-image-processing/ and I did copy many lines from it, and some other ones I found.

At last I got it working, but there are some issues. For some reason, some images are never drawn though other ones are, then I get big random black squares on the screen, and finally it makes firefox crash...

I am tearing my hair out trying to solve these problems, but I am just lost... I have to ask for some help.
Please someone have a look at my code and tell me if you see where I made errors.


The vertex shader and fragment shader :

    <script id="2d-vertex-shader" type="x-shader/x-vertex">
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  uniform vec2 u_resolution;
  uniform vec2 u_translation;
  uniform vec2 u_rotation;
  varying vec2 v_texCoord;
  void main()
  {
   // Rotate the position
   vec2 rotatedPosition = vec2(
     a_position.x * u_rotation.y + a_position.y * u_rotation.x,
     a_position.y * u_rotation.y - a_position.x * u_rotation.x);
  
   // Add in the translation.
   vec2 position = rotatedPosition + u_translation;
  
   // convert the rectangle from pixels to 0.0 to 1.0
   vec2 zeroToOne = a_position / u_resolution;
  
   // convert from 0->1 to 0->2
   vec2 zeroToTwo = zeroToOne * 2.0;
  
   // convert from 0->2 to -1->+1 (clipspace)
   vec2 clipSpace = zeroToTwo - 1.0;
  
   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  
   // pass the texCoord to the fragment shader
   // The GPU will interpolate this value between points
   v_texCoord = a_texCoord;
  }
    </script>

 <script id="2d-fragment-shader" type="x-shader/x-fragment">
  precision mediump float;

  // our texture
  uniform sampler2D u_image;

  // the texCoords passed in from the vertex shader.
  varying vec2 v_texCoord;
 
  void main()
  {
    // Look up a color from the texture.
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
 </script>



I use several layered canvas to avoid wasting ressources redrawing the big background and foreground at every frame while they never change. So my canvas are in liste_canvas[] and contexts are in liste_ctx[], c is the id ("background"/"game"/"foreground"/"infos"). Here is their creation code :

    // Get A WebGL context
 liste_canvas[c] = document.createElement("canvas") ;
 document.getElementById('game_div').appendChild(liste_canvas[c]);
 liste_ctx[c] = liste_canvas[c].getContext('webgl',{premultipliedAlpha:false}) || liste_canvas[c].getContext('experimental-webgl',{premultipliedAlpha:false});
 
 liste_ctx[c].viewport(0, 0, game.res_w, game.res_h);

 // setup a GLSL program
 liste_ctx[c].vertexShader = createShaderFromScriptElement(liste_ctx[c], "2d-vertex-shader");
 liste_ctx[c].fragmentShader = createShaderFromScriptElement(liste_ctx[c], "2d-fragment-shader");
 liste_ctx[c].program = createProgram(liste_ctx[c], [liste_ctx[c].vertexShader, liste_ctx[c].fragmentShader]);
 liste_ctx[c].useProgram(liste_ctx[c].program);


And here is my sprite drawing function.
My images are stored in a list too, sprites[], with a string name as id.
They store their origin, which is not necessarily their real center, as .orgn_x and .orgn_y.

    function draw_sprite( id_canvas , d_sprite , d_x , d_y , d_rotation , d_scale , d_opacity )
 {
  if( id_canvas=="" ){ id_canvas = "game" ; }
  if( !d_scale ){ d_scale = 1 ; }
  if( !d_rotation ){ d_rotation = 0 ; }

  if( render_mode == "webgl" )
  {
   c = id_canvas ;
  
   // look up where the vertex data needs to go.
   var positionLocation = liste_ctx[c].getAttribLocation(liste_ctx[c].program, "a_position");
   var texCoordLocation = liste_ctx[c].getAttribLocation(liste_ctx[c].program, "a_texCoord");
  
   // provide texture coordinates for the rectangle.
          var texCoordBuffer = liste_ctx[c].createBuffer();
   liste_ctx[c].bindBuffer(liste_ctx[c].ARRAY_BUFFER, texCoordBuffer);
   liste_ctx[c].bufferData(liste_ctx[c].ARRAY_BUFFER, new Float32Array([
    0.0,  0.0,
    1.0,  0.0,
    0.0,  1.0,
    0.0,  1.0,
    1.0,  0.0,
    1.0,  1.0]), liste_ctx[c].STATIC_DRAW);
   liste_ctx[c].enableVertexAttribArray(texCoordLocation);
   liste_ctx[c].vertexAttribPointer(texCoordLocation, 2, liste_ctx[c].FLOAT, false, 0, 0);

   // Create a texture.
   var texture = liste_ctx[c].createTexture();
   liste_ctx[c].bindTexture(liste_ctx[c].TEXTURE_2D, texture);

   // Set the parameters so we can render any size image.
   liste_ctx[c].texParameteri(liste_ctx[c].TEXTURE_2D, liste_ctx[c].TEXTURE_WRAP_S, liste_ctx[c].CLAMP_TO_EDGE);
   liste_ctx[c].texParameteri(liste_ctx[c].TEXTURE_2D, liste_ctx[c].TEXTURE_WRAP_T, liste_ctx[c].CLAMP_TO_EDGE);
   liste_ctx[c].texParameteri(liste_ctx[c].TEXTURE_2D, liste_ctx[c].TEXTURE_MIN_FILTER, liste_ctx[c].LINEAR);
   liste_ctx[c].texParameteri(liste_ctx[c].TEXTURE_2D, liste_ctx[c].TEXTURE_MAG_FILTER, liste_ctx[c].LINEAR);

   // Upload the image into the texture.
   liste_ctx[c].texImage2D(liste_ctx[c].TEXTURE_2D, 0, liste_ctx[c].RGBA, liste_ctx[c].RGBA, liste_ctx[c].UNSIGNED_BYTE, sprites[d_sprite] );
  
   // set the resolution
   var resolutionLocation = liste_ctx[c].getUniformLocation(liste_ctx[c].program, "u_resolution");
   liste_ctx[c].uniform2f(resolutionLocation, liste_canvas[c].width, liste_canvas[c].height);
  
   // Create a buffer and put a single clipspace rectangle in it (2 triangles)
   var buffer = liste_ctx[c].createBuffer();
   liste_ctx[c].bindBuffer(liste_ctx[c].ARRAY_BUFFER, buffer);
   liste_ctx[c].enableVertexAttribArray(positionLocation);
   liste_ctx[c].vertexAttribPointer(positionLocation, 2, liste_ctx[c].FLOAT, false, 0, 0);
  
   // then I calculate the coordinates of the four points of the rectangle
   // taking their origin and scale into account
   // I cut this part as it is large and has no importance here
    
   // and at last, we draw
   liste_ctx[c].bufferData(liste_ctx[c].ARRAY_BUFFER, new Float32Array([
    topleft_x , topleft_y ,
    topright_x , topright_y ,
    bottomleft_x , bottomleft_y ,
    bottomleft_x , bottomleft_y ,
    topright_x , topright_y ,
    bottomright_x , bottomright_y ]), liste_ctx[c].STATIC_DRAW);
   // draw
   liste_ctx[c].drawArrays(liste_ctx[c].TRIANGLES, 0, 6);
  }
 }

I did not find any way to port ctx.globalAlpha to webgl by the way. If someone knows how I could add it in my code, I woud be thanksful for that too.

Please help. Thanks.

# Answer

I don't know why things are crashing but just a few random comments.

1.  Only create buffers and textures once.

    Currently the code is creating buffers and textures every time you call `draw_sprite`. Instead you should be creating them at initialization time just once and then using the created buffers and textures later. Similarly you should look up the attribute and uniform locations at initialization time and then use them when you draw. 

    It's possible firefox is crashing because it's running out of memory since you're creating new buffers and new textures every time you call `draw_sprite`

2.  I believe it's more common to make a single buffer with a unit square it in and then use matrix math to move that square where you want it. See [http://games.greggman.com/game/webgl-2d-matrices/](http://games.greggman.com/game/webgl-2d-matrices/) for some help with matrix math.

    If you go that route then you only need to call all the buffer related stuff once.

    Even if you don't use matrix math you can still add translation and scale to your shader, then just make one buffer with a unit rectangle (as in 

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1]), gl.STATIC_DRAW)       

     After that then [just translate it](http://games.greggman.com/game/webgl-2d-translation/) where you want it and [scale it](http://games.greggman.com/game/webgl-2d-scale/) to the size you want it drawn.

     In fact, if you go the matrix route it would be really easy to simulate the 2d context's matrix functions `ctx.translate`, `ctx.rotate`, `ctx.scale` etc...

3.  The code might be easier to follow, and type, if you pulled the context into a local variable.

    Instead of stuff like

        liste_ctx[c].bindBuffer(liste_ctx[c].ARRAY_BUFFER, buffer);
        liste_ctx[c].enableVertexAttribArray(positionLocation);
        liste_ctx[c].vertexAttribPointer(positionLocation, 2, liste_ctx[c].FLOAT, false, 0, 0);

    You could do this

        var gl = liste_ctx[c];
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

4.  Storing things on the context is going to get tricky

    This code

        liste_ctx[c].vertexShader = createShaderFromScriptElement(liste_ctx[c], "2d-vertex-shader");
        liste_ctx[c].fragmentShader = createShaderFromScriptElement(liste_ctx[c], "2d-fragment-shader");
        liste_ctx[c].program = createProgram(liste_ctx[c], [liste_ctx[c].vertexShader, liste_ctx[c].fragmentShader]);

    Makes it look like you're going to only have a single vertexshader, a single fragment shader and single program. Maybe you are but it's pretty common in WebGL to have several shaders and programs.

5.  For globalAlpha first you need to turn on blending.

        gl.enable(gl.BLEND);

    And you need to tell it how to blend. To be the same as the canvas 2d context you 
    need to use pre-multiplied alpha math so

        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    Then you need to multiply the color the shader draws by an alpha value. For example

        <script id="2d-fragment-shader" type="x-shader/x-fragment">
        precision mediump float;

        // our texture
        uniform sampler2D u_image;

        // global alpha
        uniform float u_globalAlpha;

        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;

        void main()
        {
             // Look up a color from the texture.
             vec4 color = texture2D(u_image, v_texCoord);

             // Multiply the color by u_globalAlpha
             gl_FragColor =  color * u_globalAlpha;
        }
        </script>
 
   Then you'll need to set `u_globalAlpha`. At init time look up it's location

        var globalAlphaLocation = gl.getUniformLocation(program, "u_globalAlpha");
 
   And at draw time set it

        gl.uniform1f(globalAlphaLocation, someValueFrom0to1);
  
    Personally I usually use a `vec4` and call it `u_colorMult`
    
        <script id="2d-fragment-shader" type="x-shader/x-fragment">
        precision mediump float;

        // our texture
        uniform sampler2D u_image;

        // colorMult
        uniform float u_colorMult;

        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;

        void main()
        {
             // Look up a color from the texture.
             gl_FragColor = texture2D(u_image, v_texCoord) * u_colorMult;
        }
        </script>    

    Then I can tint my sprites for example to make the sprite draw in red just use

        glUniform4fv(colorMultLocation, [1, 0, 0, 1]);

    It also means I can easily draw in solid colors. Create a 1x1 pixel solid white texture. Anytime I want to draw in a solid color I just bind that texture and set `u_colorMult` to the color I want to draw in.
