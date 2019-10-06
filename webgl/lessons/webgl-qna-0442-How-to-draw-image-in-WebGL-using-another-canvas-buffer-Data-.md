Title: How to draw image in WebGL using another canvas buffer Data?
Description:
TOC: qna

# Question:

I am trying to draw image to webgl canvas from a 2d canvas.

If I use:

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

, it works and renders the image successfully, but if I use : 
    
    gl.texImage2D(gl.TEXTURE_2D, 0,  gl.RGBA, c.width, c.height, 0,  gl.RGBA, gl.UNSIGNED_BYTE, dataTypedArray);

, it just shows a black screen.

Here's my Code :

**Vertex Shader**
        
    attribute vec2 a_position;
 uniform vec2 u_resolution;
 uniform mat3 u_matrix;
 varying vec2 v_texCoord;
 
 void main() {
  gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
  v_texCoord = a_position;
 }

**Fragment Shader**
      
    precision mediump float;
 // our texture
 uniform sampler2D u_image;
 // the texCoords passed in from the vertex shader.
 varying vec2 v_texCoord;
 
 void main() {
     gl_FragColor = texture2D(u_image, v_texCoord);
 } 

**Javascript**

    window.onload = main;
    var buffer = null;
    function main() {
        var image = new Image();
        image.src = "images/GL.jpg"
        image.onload = function() {
            render(image);
        }
    }

    function render(image) {
        var c = document.getElementById("c");
        c.width = window.innerWidth*0.90;
        c.height = window.innerHeight*0.90;
        var context = c.getContext('2d');
        context.drawImage(image, 0, 0);
 
        var imageData = context.getImageData(0,0,image.width,image.height);
        buffer = imageData.data.buffer;  // ArrayBuffer
        var canvas = document.getElementById("canvas");
        canvas.width = window.innerWidth*0.90;
        canvas.height = window.innerHeight*0.90;
  
        //Get A WebGL context
        var gl = getWebGLContext(canvas);
        if (!gl) {
            return;
        }
        
        // setup GLSL program
        var program = createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
        gl.useProgram(program);

        // look up where the vertex data needs to go.
        var positionLocation = gl.getAttribLocation(program, "a_position"); 
  
        // look up uniform locations
        var u_imageLoc = gl.getUniformLocation(program, "u_image");
        var u_matrixLoc = gl.getUniformLocation(program, "u_matrix");

        // provide texture coordinates for the rectangle.
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
               0.0,  0.0,
               1.0,  0.0,
               0.0,  1.0,
               0.0,  1.0,
               1.0,  0.0,
               1.0,  1.0]), gl.STATIC_DRAW);
            
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        // Upload the image into the texture.
        var dataTypedArray = new Uint8Array(buffer);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        textureFromPixelArray(gl, buffer, gl.RGBA, canvas.width, canvas.height);
        
        var dstX = 20;
        var dstY = 30;
        var dstWidth = canvas.width;
        var dstHeight = canvas.height;

        // convert dst pixel coords to clipspace coords      
        var clipX = dstX / gl.canvas.width  *  2 - 1;
        var clipY = dstY / gl.canvas.height * -2 + 1;
        var clipWidth = dstWidth  / gl.canvas.width  *  2;
        var clipHeight = dstHeight / gl.canvas.height * -2;

        // build a matrix that will stretch our
        // unit quad to our desired size and location
        gl.uniformMatrix3fv(u_matrixLoc, false, [
            clipWidth, 0, 0,
            0, clipHeight, 0,
            clipX, clipY, 1,
            ]);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }


     function textureFromPixelArray(gl, dataArray, type, width, height)        {
          var dataTypedArray = new Uint8Array(dataArray); // Don't need to do this if the data is already in a typed array
          var texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, type, width, height, 0, type, gl.UNSIGNED_BYTE, dataTypedArray);
          // Other texture setup here, like filter modes and mipmap generation
          console.log(dataTypedArray);
          return texture;
      }

# Answer

So first off, you can pass a canvas directly to `gl.texImage2D`. There's no good reason to first call `ctx.getImageData` and get the data out. Just call

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, someCanvas);

Second, looking at your code you first create a texture, then set filtering. You then call `textureFromPixelArray`, **WHICH CREATES A NEW TEXTURE**, that texture does not have filtering set so if it's not a power-of-2 then it won't render. Just a guess but did you check the JavaScript console? I'm just guessing it probably printed a warning about your texture not being renderable.

On top of that, even though `textureFromPixelArray` creates a new texture the code ignores the return value.

To make the code work as is I think you want to change it to this

    // not needed -- var texture = gl.createTexture();
    // not needed --  gl.bindTexture(gl.TEXTURE_2D, texture);

    // moved from below
    // Upload the image into the texture.
    var dataTypedArray = new Uint8Array(buffer);
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    var texture = textureFromPixelArray(gl, buffer, gl.RGBA, canvas.width, canvas.height);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

