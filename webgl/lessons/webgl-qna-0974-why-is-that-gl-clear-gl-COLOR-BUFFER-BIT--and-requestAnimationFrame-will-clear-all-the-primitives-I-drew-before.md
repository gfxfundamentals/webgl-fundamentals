Title: why is that gl.clear(gl.COLOR_BUFFER_BIT) and requestAnimationFrame will clear all the primitives I drew before
Description:
TOC: qna

# Question:

Hi guys I been leanring WebGL and trying to make a Tetris game out of it.

I have a couple of questions I'd like to ask:

1. For this game I wanted to first draw the grid as the background. However I noticed that after I drew the line, if I use `gl.clear(gl.COLOR_BUFFER_BIT );` after, it will clear all the lines I drew before. I understand that `gl.clear(gl.COLOR_BUFFER_BIT );`  is about clearing the color buffer (and you probably will ask why I would want to do that. Just bear with me. ). Then I tried use `gl.uniform4f( uColor, 0, 0, 0, 1);` to send the color again to the fragment shader but it doesn't help.

The snippet is like this

    window.onload = function(){
        getGLContext();
        initShaders();
        drawLines( 0, 0, 400,400 );
        gl.clear(gl.COLOR_BUFFER_BIT );
        gl.uniform4f( uColor, 0, 0, 0, 1);
    }



2. For the game I need the grid as background and I need `requestAnimationFrame` for the game loop and will render Tetrominos inside the loop. Therefore after drawing the line I used this `draw()` to draw other Tetrominos. However it removes the line I drew before. And when I comment out  `gl.clear(gl.COLOR_BUFFER_BIT );` inside `draw()`, it will remove the line along with background color.
   

     `function draw() {
                    gl.clear(gl.COLOR_BUFFER_BIT );
                    gl.drawArrays(gl.TRIANGLES, 0, index*6);
                    requestAnimationFrame(draw);
                }`


Here is the demo: https://codepen.io/zhenghaohe/pen/LqxpjB

Hope you could answer these two questions. Thanks!



# Answer

This is generally the way WebGL works. 

WebGL is just draws into a rectangle of pixels. There is no memory of primitives. There is no structure. There is just code and the resulting canvas which is an rectangle of pixels. 

Most WebGL programs/pages clear the entire canvas every frame and redraw 100% of the things they want to show every time they draw. For tetris the general code might be something like

    function render()  {
      clear the canvas
      draw the grid
      draw all the stable pieces
      draw the current piece
      draw the next piece
      draw the effects
      draw the score
    }

Any knowledge of primitives or other structure is entirely up to your code. 

If you want the grid lines to be static then either set a static background with CSS or use another canvas

Using a background:

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.querySelector('#c').getContext('webgl');

    function render(time) {
      time *= 0.001;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      drawBlocks(gl, time);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // --- below this line not important to the answer

    function drawBlocks(gl, time) {
      gl.enable(gl.SCISSOR_TEST);
      
      const numBlocks = 5;
      for (let i = 0; i < numBlocks; ++i) {
        const u = i / numBlocks;
        gl.clearColor(i / 5, i / 2 % 1, i / 3 % 1, 1);
        const x = 150 + Math.sin(time + u * Math.PI * 2) * 130;
        const y = 75 + Math.cos(time + u * Math.PI * 2) * 55;
        gl.scissor(x, y, 20, 20);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      
      gl.disable(gl.SCISSOR_TEST);
    }

<!-- language: lang-css -->

    #c {
      background-image: url(https://i.imgur.com/ZCfccZh.png);
    }

<!-- language: lang-html -->

    <canvas id="c"></canvas>

<!-- end snippet -->

Using 2 canvases

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    // this is the context for the back canvas. It could also be webgl
    // using a 2D context just to make the sample simpler
    const ctx = document.querySelector('#back').getContext('2d');
    drawGrid(ctx);

    // this is the context for the front canvas
    const gl = document.querySelector('#front').getContext('webgl');

    function render(time) {
      time *= 0.001;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      drawBlocks(gl, time);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // --- below this line not important to the answer

    function drawBlocks(gl, time) {
      gl.enable(gl.SCISSOR_TEST);
      
      const numBlocks = 5;
      for (let i = 0; i < numBlocks; ++i) {
        const u = i / numBlocks;
        gl.clearColor(i / 5, i / 2 % 1, i / 3 % 1, 1);
        const x = 150 + Math.sin(time + u * Math.PI * 2) * 130;
        const y = 75 + Math.cos(time + u * Math.PI * 2) * 55;
        gl.scissor(x, y, 20, 20);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      
      gl.disable(gl.SCISSOR_TEST);
    }

    function drawGrid(ctx) {
      // draw grid
      ctx.translate(-10.5, -5.5);
      ctx.beginPath();
      for (let i = 0; i < 330; i += 20) {
        ctx.moveTo(0, i);
        ctx.lineTo(330, i);
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 300);
      }
      ctx.strokeStyle = "blue";
      ctx.stroke();
    }


<!-- language: lang-css -->

    #container {
      position: relative; /* required so we can position child elements */
    }
    #front {
      position: absolute;
      left: 0;
      top: 0;
    }

<!-- language: lang-html -->

    <div id="container">
      <canvas id="back"></canvas>
      <canvas id="front"></canvas>
    </div>

<!-- end snippet -->

As for why it clears even if you didn't call clear that's because that's whqt the spec says it's supposed to do

See: https://stackoverflow.com/questions/33327585/why-webgl-clear-draw-to-front-buffer

