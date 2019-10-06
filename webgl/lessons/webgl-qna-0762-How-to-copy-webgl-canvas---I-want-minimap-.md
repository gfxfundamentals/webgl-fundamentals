Title: How to copy webgl canvas? (I want minimap)
Description:
TOC: qna

# Question:



I want results..

![I want results..][2]

I have one webgl canvas
Is there a way to copy the webgl canvas to create a mini-map?

I invoke json and draw it on the canvas by ajax Like first picture

Original canvas and mini-map canvas  want to share coordinates and picture

The rectangle that controls the mini-map should use the draw function?

    <div id="glCanvsDiv" style="height: 100%; width: 100%; padding: 0px; margin: 0px; left: 0px; top: 0px; position: absolute;">
 <canvas id="glcanvas" class="canvasclass" style="width: 100%; height: 100%; margin: 0; padding: 0;"></canvas>
</div>

this is Coordinate function

    function getWorldPosition(event) {
  
 const pos = getNoPaddingNoBorderCanvasRelativeMousePosition(event, gl.canvas);
 
 const x = pos.x / gl.canvas.width  *  2 - 1;
 const y = pos.y / gl.canvas.height * -2 + 1;
 
 const view = mat4.inverse(cameraMatrix);

 const viewProjection = mat4.multiply(projectionMatrix, view);

 const viewZ = -5;
 
 const clip = transformPoint(projectionMatrix, [0, 0, viewZ]);
 
 const z = clip[2];
 
 const inverseViewProjection = mat4.inverse(viewProjection); 
 
 var world = transformPoint(inverseViewProjection, [x, y, z]);
   
 world[0] = -world[0];
 world[1] = -world[1];
 
 return world;
}

  [1]: https://i.stack.imgur.com/UccIb.png
  [2]: https://i.stack.imgur.com/2mbMK.png


my dialog

    <div id="aerialViewDlg" style="display:none; padding:0;">
</div>

    $("#aerialViewDlg").dialog({
     autoOpen: false,
     width: 300,
     height: 260,
     title: "aerialView",
     position: {
      my: "right top",
      at: "right top",
     }
    });

I want The mini-map includes full screen,
The original canvas will only display the selected area in the mini-map

# Answer

It's not clear to me what you're asking. A mini map usually shows much more info than is displayed outside the mini-map. In other words the main display might show a single building where as the mini-map shows the entire town. That means the 2 things are unrelated. To draw just the building you draw a building. To draw the town you draw the town. Copying the canvas will not solve this problem for you

You can draw one canvas into another. The easiest way is if the destination canvas is a 2D canvas you just call one of the `drawImage` variations

    ctx.drawImage(srcCanvas, dstX, dstY);

or

    ctx.drawImage(srcCanvas, dstX, dstY, dstWidth, dstHeight);

or

    ctx.drawImage(srcCanvas, 
                  srcX, srcY, srcWidth, srcHeight,
                  dstX, dstY, dstWidth, dstHeight);

If you want to draw the minimap in the same canvas you can enable the scissor test and set the viewport as in

    // draw main display
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.disable(gl.SCISSOR_TEST);
    compute projection matrix for main display
    draw main display

    // draw mini-map
    gl.viewport(miniMapX, minMapY, miniMapWidth, minMapHeigh);
    gl.scissor(miniMapX, minMapY, miniMapWidth, minMapHeigh);
    gl.enable(gl.SCISSOR_TEST);
    compute projection matrix for mini-map display
    draw mini map display
  
Example:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";
    const vs = `
    attribute vec4 position;
    uniform mat4 matrix;
    void main() {
      gl_Position = matrix * position;
    }
    `;
    const fs = `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }
    `;
    const m4 = twgl.m4;
    const gl = document.querySelector("canvas").getContext("webgl");

    // compiles shaders, link program, looks up locations
    const programInfo = twgl.createProgramInfo(gl, [vs, fs]);

    const arrays = {
      position: {
        numComponents: 2,
        data: [
         -1, -1, 
          1, -1,
         -1,  1,
          1,  1,
        ],
      },
      indices: {
        numComponents: 2,
        data: [
          0, 1,
          1, 3,
          3, 2,
          2, 0,
        ],
      },
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

      // note: a good app would try to only draw what's visible in each
      // view
    function drawScene(viewProjection) {  
      gl.useProgram(programInfo.program);
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      
      for (let y = -5; y <= 5; ++y) {
        for (let x = -5; x <= 5; ++x) {
          const world = m4.translation([x * 2.4, y * 2.4, 0]);
          const mat = m4.multiply(viewProjection, world);
      
          // calls gl.uniformXXX
          twgl.setUniforms(programInfo, {
            color: [(x + 5) / 10, (y + 5) / 10, x / 5 * y / 5 * .5 + 5, 1],
            matrix: mat,
          });
          // calls gl.drawArrays or gl.drawElements
          twgl.drawBufferInfo(gl, bufferInfo, gl.LINES);
        }
      }
    }

    function render(time) {
      time *= 0.001;
      twgl.resizeCanvasToDisplaySize(gl.canvas);
      
      // draw main scene
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.disable(gl.SCISSOR_TEST);

      gl.clearColor(0,0,0,1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      {
        const unitsVertical = 3;
        const half = unitsVertical * .5
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const left = -half * aspect;
        const right = half * aspect;
        const bottom = -half;
        const top = half;
        const zNear = -1;
        const zFar = 1;
        const projection = m4.ortho(left, right, bottom, top, zNear, zFar);

        const camera = m4.rotationZ(time * .1);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
      
        drawScene(viewProjection);
      }
      
      // draw mini map
      const miniMapWidth = gl.canvas.width / 3 | 0;
      const miniMapHeight = gl.canvas.height / 3 | 0;
      const miniMapX = gl.canvas.width - miniMapWidth;
      const miniMapY = gl.canvas.height - miniMapHeight;
      gl.viewport(miniMapX, miniMapY, miniMapWidth, miniMapHeight);
      gl.scissor(miniMapX, miniMapY, miniMapWidth, miniMapHeight);
      gl.enable(gl.SCISSOR_TEST);

      gl.clearColor(0.2,0.2,0.2,1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      {
        const unitsVertical = 20;
        const half = unitsVertical * .5
        const aspect = miniMapWidth / miniMapHeight;
        const left = -half * aspect;
        const right = half * aspect;
        const bottom = -half;
        const top = half;
        const zNear = -1;
        const zFar = 1;
        const projection = m4.ortho(left, right, bottom, top, zNear, zFar);

        const camera = m4.rotationZ(time * .1);
        const view = m4.inverse(camera);
        const viewProjection = m4.multiply(projection, view);
      
        drawScene(viewProjection);
      }
        
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);



<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <canvas></canvas>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->

Unfortunately you can't share resources across canvases in WebGL (you can't use the same buffers and textures). There are various other solutions though. See: https://stackoverflow.com/questions/15824840/display-different-scenes-sharing-resources-on-multiple-canvases


