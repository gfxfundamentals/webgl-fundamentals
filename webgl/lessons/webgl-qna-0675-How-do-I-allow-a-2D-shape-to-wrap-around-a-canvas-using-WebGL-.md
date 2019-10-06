Title: How do I allow a 2D shape to wrap around a canvas using WebGL?
Description:
TOC: qna

# Question:

I have created a simple animation in WebGL (html & javascript) where a 2D shape is animated and manipulated on a canvas. The default animation is shape moving to the right at a set speed and then using "WASD" changes its direction. The shape moves in the given direction indefinitely, even after it is off of the canvas and out of the clip-space. I would like to have the shape wrap around the canvas instead of just continuing even after it is unseen. For example, if the shape is moving to the right and moves completely off of the canvas, I would like it to appear on left side still moving to the right and continue cycling. Same goes for if it is moving left or up or down.

Any suggestions on how to implement this?

# Answer

You have to draw it 2 to 4 times depending on if you want to wrap both left/right and top/bottom

Assume we only want to wrap around horizontally. If the player is near the left edge we need to also draw the player 1 screen width to the right. If the player is near the right edge we need to draw the player again one screen to the left. Same with up and down

Here's an example using canvas 2D but the only difference for WebGL is you'd draw using WebGL. The concept is the same.

Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var x = 150;
    var y = 100;
    var vx = 0;
    var vy = 0;
    const maxSpeed = 250;
    const acceleration = 1000;
    const ctx = document.querySelector("canvas").getContext("2d");
    const keys = {};
    const LEFT = 65;
    const RIGHT = 68;
    const DOWN = 83;
    const UP = 87;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    var then = 0;
    function render(now) {
      now *= 0.001;  // seconds
      const deltaTime = now - then;
      then = now;
      
      ctx.clearRect(0, 0, width, height);
      
      if (keys[UP])    { vy -= acceleration * deltaTime; }
      if (keys[DOWN])  { vy += acceleration * deltaTime; }
      if (keys[LEFT])  { vx -= acceleration * deltaTime; }
      if (keys[RIGHT]) { vx += acceleration * deltaTime; }
      
      // keep speed under max
      vx = absmin(vx, maxSpeed);
      vy = absmin(vy, maxSpeed);
      
      // move based on velociy
      x += vx * deltaTime;
      y += vy * deltaTime;
      
      // wrap
      x = euclideanModulo(x, width);
      y = euclideanModulo(y, height);
      
      // draw player 4 times
      const xoff = x < width / 2 ? width : -width;
      const yoff = y < height / 2 ? height : -height;
      drawPlayer(x, y);
      drawPlayer(x + xoff, y);
      drawPlayer(x, y + yoff);
      drawPlayer(x + xoff, y + yoff);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function drawPlayer(x, y) {
      ctx.fillStyle = "blue";
      ctx.strokeStyle = "red";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.stroke();
    }

    function absmin(v, max) {
      return Math.min(Math.abs(v), max) * Math.sign(v);
    }

    function euclideanModulo(n, m) {
     return ((n % m) + m) % m;
    }

    window.addEventListener('keydown', e => {
      keys[e.keyCode] = true;
    });

    window.addEventListener('keyup', e => {
      keys[e.keyCode] = false;
    });

<!-- language: lang-css -->

    canvas { 
      display: block;
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <canvas></canvas>
    <p><span style="color:red;">click here</span> then use ASWD to move</p>

<!-- end snippet -->

A WebGL version changes no code related to wrapping.

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var x = 150;
    var y = 100;
    var vx = 0;
    var vy = 0;
    const maxSpeed = 250;
    const acceleration = 1000;
    const gl = document.querySelector("canvas").getContext("webgl");
    const keys = {};
    const LEFT = 65;
    const RIGHT = 68;
    const DOWN = 83;
    const UP = 87;
    const width = gl.canvas.width;
    const height = gl.canvas.height;

    var program = setupWebGL();
    var positionLoc = gl.getAttribLocation(program, "position");

    var then = 0;
    function render(now) {
      now *= 0.001;  // seconds
      const deltaTime = now - then;
      then = now;
      
      if (keys[UP])    { vy -= acceleration * deltaTime; }
      if (keys[DOWN])  { vy += acceleration * deltaTime; }
      if (keys[LEFT])  { vx -= acceleration * deltaTime; }
      if (keys[RIGHT]) { vx += acceleration * deltaTime; }
      
      // keep speed under max
      vx = absmin(vx, maxSpeed);
      vy = absmin(vy, maxSpeed);
      
      // move based on velociy
      x += vx * deltaTime;
      y += vy * deltaTime;
      
      // wrap
      x = euclideanModulo(x, width);
      y = euclideanModulo(y, height);
      
      // draw player 4 times
      const xoff = x < width / 2 ? width : -width;
      const yoff = y < height / 2 ? height : -height;
      drawPlayer(x, y);
      drawPlayer(x + xoff, y);
      drawPlayer(x, y + yoff);
      drawPlayer(x + xoff, y + yoff);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function drawPlayer(x, y) {
      gl.useProgram(program);
      // only drawing a single point so no need to use a buffer
      gl.vertexAttrib2f(
         positionLoc, 
         x / width * 2 - 1, 
         y / height * -2 + 1);
      gl.drawArrays(gl.POINTS, 0, 1);
    }

    function absmin(v, max) {
      return Math.min(Math.abs(v), max) * Math.sign(v);
    }

    function euclideanModulo(n, m) {
     return ((n % m) + m) % m;
    }

    window.addEventListener('keydown', e => {
      keys[e.keyCode] = true;
    });

    window.addEventListener('keyup', e => {
      keys[e.keyCode] = false;
    });

    function setupWebGL() {
      const vs = `
      attribute vec4 position;
      void main() {
        gl_Position = position;
        gl_PointSize = 40.;
      }
      `;
      const fs = `
      void main() {
        gl_FragColor = vec4(1,0,1,1);
      }
      `;
      // compiles and links shaders and assigns position to location 0
      return twgl.createProgramFromSources(gl, [vs, fs]);
    }

<!-- language: lang-css -->

    canvas { 
      display: block;
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <canvas></canvas>
    <p><span style="color:red;">click here</span> then use ASWD to move</p>
    <script src="https://twgljs.org/dist/3.x/twgl-full.min.js"></script>

<!-- end snippet -->

If you don't want the player appear on both sides then your question has nothing to do with graphics, you just wait until the player's x position is at least `screenWidth + haflPlayerWidth` which means they're completely off the right side and then you set their x position to `-halfPlayerWidth` which will put them just off the left and visa versa


<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    var x = 150;
    var y = 100;
    var vx = 0;
    var vy = 0;
    const maxSpeed = 250;
    const acceleration = 1000;
    const ctx = document.querySelector("canvas").getContext("2d");
    const keys = {};
    const LEFT = 65;
    const RIGHT = 68;
    const DOWN = 83;
    const UP = 87;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const playerSize = 40;
    const halfPlayerSize = playerSize / 2;

    var then = 0;
    function render(now) {
      now *= 0.001;  // seconds
      const deltaTime = now - then;
      then = now;
      
      ctx.clearRect(0, 0, width, height);
      
      if (keys[UP])    { vy -= acceleration * deltaTime; }
      if (keys[DOWN])  { vy += acceleration * deltaTime; }
      if (keys[LEFT])  { vx -= acceleration * deltaTime; }
      if (keys[RIGHT]) { vx += acceleration * deltaTime; }
      
      // keep speed under max
      vx = absmin(vx, maxSpeed);
      vy = absmin(vy, maxSpeed);
      
      // move based on velociy
      x += vx * deltaTime;
      y += vy * deltaTime;
      
      // wrap
      x = euclideanModulo(x + halfPlayerSize, width + playerSize) - halfPlayerSize;
      y = euclideanModulo(y + halfPlayerSize, height + playerSize) - halfPlayerSize;
      
      // draw player
      drawPlayer(x, y);
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function drawPlayer(x, y) {
      ctx.fillStyle = "blue";
      ctx.strokeStyle = "red";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, halfPlayerSize, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.stroke();
    }

    function absmin(v, max) {
      return Math.min(Math.abs(v), max) * Math.sign(v);
    }

    function euclideanModulo(n, m) {
     return ((n % m) + m) % m;
    }

    window.addEventListener('keydown', e => {
      keys[e.keyCode] = true;
    });

    window.addEventListener('keyup', e => {
      keys[e.keyCode] = false;
    });

<!-- language: lang-css -->

    canvas { 
      display: block;
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <canvas></canvas>
    <p><span style="color:red;">click here</span> then use ASWD to move</p>

<!-- end snippet -->

this code probably needs an explanation 

    x = euclideanModulo(x + haflPlayerSize, width + playerSize) - haflPlayerSize;
    y = euclideanModulo(y + haflPlayerSize, height + playerSize) - haflPlayerSize;

First off `euclideanModulo` is just like normal `%` modulo operator, it returns the remainder after division, except euclidean modulo keeps the same remainder even for negative numbers. In other words

      3 % 5 = 3
      8 % 5 = 3
     13 % 5 = 3
     -2 % 5 = -2
     -7 % 5 = -2
    -12 % 5 = -2

but

      3 euclideanMod 5 = 3
      8 euclideanMod 5 = 3
     13 euclideanMod 5 = 3
     -2 euclideanMod 5 = 3
     -7 euclideanMod 5 = 3
    -12 euclideanMod 5 = 3

So it's a super easy way to wrap things.

     x = euclideanModulo(x, screenWidth)

Is similar to

     if (x < 0)            x += screenWidth;
     if (x >= screenWidth) x -= screenWidth;

Except those would fail if `x > screenWidth * 2` for example where as the one using euclideanModulo would not.

So, back to 

    x = euclideanModulo(x + haflPlayerSize, width + playerSize) - haflPlayerSize;
    y = euclideanModulo(y + haflPlayerSize, height + playerSize) - haflPlayerSize;

We know the player (in this case a circle) has its position at its center. So, we know when its center is half the playerSize off the left or right of the screen it's completely off the screen and we therefore want to move it to the other side. That means we can imagine the screen is really `width + halfPlayerSize + halfPlayerSize` wide. The first `halfPlayerSize` is for the stepping off the left side, the second `halfPlayerSize` is for stepping off the right side. In other words it's just `width + playerSize` wide. We then want the player to wrap from left to right when `x < -halfPlayerSize`. So we add `halfPlayerSize` to the player's position, then do the euclideanModulo which will wrap the position, then subtract that halfPlayerSize back out.
