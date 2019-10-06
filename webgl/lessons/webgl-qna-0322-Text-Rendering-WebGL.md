Title: Text Rendering WebGL
Description:
TOC: qna

# Question:

I am trying to give text labels to different elements in a 2D image. The 2d elements are obtained through projection from 3d. I have certain element ids that I want to include as text labels. I have been trying this for 2 days with no luck. I dont know what is going wrong. Here is the function that does the rendering:

    
    function drawOverlayTriangles()
    {
     if (overlay.numElements <= 0)
  return;
 
     gl.enableVertexAttribArray(shaderProgram.aVertexPosition);
     gl.enableVertexAttribArray(shaderProgram.aVertexColor);
 
     // Turn off textures
        //gl.vertexAttrib1f(shaderProgram.aHasTexture, 0.0);

      // Upload Projection, ModelView matrices
        gl.uniformMatrix4fv(shaderProgram.uMVMatrix, false, pMVMatrix);
        gl.uniformMatrix4fv(shaderProgram.uPMatrix, false, perspM);
    
     for (var i = 0; i < overlay.numElements; i++) {
      // Upload overlay vertices      
         gl.bindBuffer(gl.ARRAY_BUFFER, overlayVertices[i]);
         gl.vertexAttribPointer(shaderProgram.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

      // Upload overlay colors
         gl.bindBuffer(gl.ARRAY_BUFFER, overlayTriangleColors[i]);    
         gl.vertexAttribPointer(shaderProgram.aVertexColor, 4, gl.FLOAT, false, 0, 0);

         var canvas = document.createElement("canvas");
         canvas.setAttribute("id","canvas");
         canvas.width="512";
         canvas.height="512";
         document.body.appendChild(canvas);

         var ctx = canvas.getContext('2d');
         var text = "element";//overlay.elementIDs[i];
 
         ctx.beginPath();
         ctx.clearRect(0,0,300,300);
         ctx.fillStyle = 'white';
         ctx.fillRect(0,0,300,300);
 
         ctx.fillStyle = 'rgba(255,0,0,255)';
         ctx.lineWidth = 2.5;
          ctx.strokeStyle = 'black';
         ctx.save();
         ctx.font = 'bold 80px Verdana';
 
         var leftOffset = ctx.canvas.width/2;
         var rightOffset = ctx.canvas.height/2;
         ctx.strokeText(text,leftOffset,rightOffset);
         ctx.fillText(text,leftOffset,rightOffset);
         ctx.restore();
 
            var texttexture=gl.createTexture();
 
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
         gl.bindTexture(gl.TEXTURE_2D,texttexture);
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);      
         gl.bindTexture(gl.TEXTURE_2D, null);
 

          
     // Draw overlay
        gl.drawArrays(gl.TRIANGLES, 0, overlay.elementNumVertices[i]);
        }
    
   gl.disableVertexAttribArray(shaderProgram.aVertexPosition);
   gl.disableVertexAttribArray(shaderProgram.aVertexColor);
      }


I am a beginner in Webgl and since I only need 2d text labels for 2d projected elements, please tell me if there is a simpler way to do this.

This is the function that calls the rendering function :
   
    function saveModelImage(separateElementImages)
    {
 var glCanvas = document.getElementById("glCanvas");
 glCanvas.width = 2144;
 glCanvas.height = 1424;

 var fov = deg2rad(60);
 if(cameraIndex > -1)
 {
  var f = model.cameras[cameraIndex].f;
  glCanvas.width = camImageWidths[cameraIndex];
  glCanvas.height = camImageHeights[cameraIndex];
  console.info("w: " + glCanvas.width + "  h: " + glCanvas.height);
  fov = 2 * Math.atan(0.5 * glCanvas.height / f);
 }

 gl.viewportWidth = glCanvas.width;
 gl.viewportHeight = glCanvas.height;
 gl.aspectRatio = gl.viewportWidth / gl.viewportHeight;
 gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
 gl.viewportCenter = vec3.fromValues(gl.viewportWidth / 2.0, gl.viewportHeight / 2.0);
 updateBoundingRect();

 mat4.ortho(orthoM, -gl.aspectRatio, gl.aspectRatio, -1.0, 1.0, 1.0, 100.0);
 mat4.perspective(perspM, fov, gl.aspectRatio, 0.5, 10000);
    // we need to pass in the cameraID to this function
    // using camera.ID, we will find the accurate width and height to use for glCanvas.
    // then the gl.aspectRatio could be set as above
    // and FOV (in rad) = 2 atan(0.5 glCanvas.height / camera.f)

    
 if(separateElementImages == true)
 {
  //something
 }
 else
 {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawOverlayTriangles();

  var imageUrl = glCanvas.toDataURL('image/jpeg', 1.0);

  var pom = document.createElement('a');
  pom.setAttribute('href', imageUrl);
  pom.setAttribute('download', 'image_C' + cameraIndex + '.jpg');

  document.body.appendChild(pom);

  pom.click();

  document.body.removeChild(pom);
 }
    }
     
Any help will be greatly appreciated

# Answer

The simplest way is either draw on a 2d canvas over your webgl canvas or move HTML elements over your webgl canvas. 

Drawing on a 2d canvas over a WebGL Canvas

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var underCanvas = document.getElementById("under");
    var overCanvas = document.getElementById("over");

    // get a webgl context for the under canvas.
    var gl = underCanvas.getContext("webgl");

    // get a webgl context for the over canvas.
    var ctx = overCanvas.getContext("2d");

    var radius = 70;
    var clock;
    var x;
    var y;

    function render() {
      
      clock = Date.now() * 0.001;
     
      
      x = Math.floor(Math.cos(clock) * radius + gl.canvas.width  * 0.5);
      y = Math.floor(Math.sin(clock) * radius + gl.canvas.height * 0.5);
      
      
      drawWebGLStuff(gl);
      drawCanvas2DStuff(ctx);
      
      requestAnimationFrame(render);
    }
    render();


    function drawWebGLStuff(gl) {
      // I'm using the SCISSOR because it's the simplest thing
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.scissor(
         Math.max(0, x - 10),
         Math.max(0, y - 10),
         20,
         20);
      gl.enable(gl.SCISSOR_TEST);
      gl.clearColor(0, 1, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function drawCanvas2DStuff() {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.textAlign = "center";
      ctx.fillText("Hello World", x, ctx.canvas.height - y);
    }

<!-- language: lang-css -->

    canvas {
      border: 1px solid black;
    }
    #under {
      position: absolute;
      left: 0px;
      top: 0px;
    }
    /* put "over" on top of "under" */
    #over {
      position: absolute;
      left: 0px;
      top: 0px;
      z-index: 2;
    }

<!-- language: lang-html -->

    <canvas id="under"></canvas>
    <canvas id="over"></canvas>

<!-- end snippet -->

Drawing by moving an HTML element over the canvas

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var underCanvas = document.getElementById("under");
    var overCanvas = document.getElementById("over");

    // get a webgl context for the under canvas.
    var gl = underCanvas.getContext("webgl");

    // make a div for text
    var textDiv = document.createElement("div");
    textNode = document.createTextNode("");
    textDiv.className = "over";
    textDiv.appendChild(textNode);
    document.body.appendChild(textDiv);


    var radius = 70;
    var clock;
    var x;
    var y;

    function render() {
      
      clock = Date.now() * 0.001;
     
      
      x = Math.floor(Math.cos(clock) * radius + gl.canvas.width  * 0.5);
      y = Math.floor(Math.sin(clock) * radius + gl.canvas.height * 0.5);
      
      
      drawWebGLStuff(gl);
      moveTextDiv();
      
      requestAnimationFrame(render);
    }
    render();


    function drawWebGLStuff(gl) {
      // I'm using the SCISSOR because it's the simplest thing
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.scissor(
         Math.max(0, x - 10),
         Math.max(0, y - 10),
         20,
         20);
      gl.enable(gl.SCISSOR_TEST);
      gl.clearColor(0, 1, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function moveTextDiv() {
      textDiv.style.left = x + "px";
      textDiv.style.top  = (gl.canvas.height - y) + "px";
      textNode.nodeValue = clock.toFixed(2);
    }

<!-- language: lang-css -->

    html, body {
      overflow: none;
      position: absolute;
    }
    canvas {
      border: 1px solid black;
    }
    #under {
      position: absolute;
      left: 0px;
      top: 0px;
    }
    .over {
      position: absolute;
      left: 0px;
      top: 0px;
      z-index: 2;
    }

<!-- language: lang-html -->

    <body>
    <canvas id="under"></canvas>
    </body>

<!-- end snippet -->


