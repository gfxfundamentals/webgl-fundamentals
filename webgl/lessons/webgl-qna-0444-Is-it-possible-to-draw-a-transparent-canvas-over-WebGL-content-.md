Title: Is it possible to draw a transparent canvas over WebGL content?
Description:
TOC: qna

# Question:

I am used to Flash where I can combine the old 2D API over Stage3D (OpenGL).

Now I would like to use **EaselJS** which is very similar to the Flash 2D API for my UI, but I would like it to be drawn **over** **3D content**.

Now, AFAIK **EaselJS is Canvas-based**. Is it be possible to **combine Canvas over WebGL** in some way? Or would it require serious hacks?

# Answer

A WebGL canvas is just a canvas which is like any other HTML element. You can stack as many as you like (up to browser set limits or memory)

Here's 5 layers. 

1.  A bottom div
2.  A webgl canvas
3.  A middle div
4.  A 2d canvas
5.  A top div


<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var gl = document.querySelector("#l1").getContext("webgl");
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(100, 50, 100, 90);
    gl.clearColor(0, 0.25, 0, 0.25);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var ctx = document.querySelector("#l3").getContext("2d");
    ctx.fillStyle = "rgba(255,0,255,0.25)";
    ctx.font = "55px san-serif";
    ctx.textAlign = "center";
    ctx.fillText("layer 3", 150, 50);

<!-- language: lang-css -->

    #l0, #l1, #l2, #l3, #l4 {
      position: absolute;
      left: 0;
      top: 0;
      width: 300px;
      height: 150px;
      border: 1px solid black;
      text-align: center;
      font-weight: bold;
    }

    #l0 {
      color: rgba(255,0,0,0.25);  
      font-size: 70px;
    }

    #l2 {
      color: rgba(0,255,0,0.25);
      font-size: 60px;
    }

    #l4 {
      color: rgba(0,0,255,0.25);
      font-size: 50px;
    }

<!-- language: lang-html -->

    <div id="l0">layer 0</div>
    <canvas id="l1"></canvas>
    <div id="l2">layer 2</div>
    <canvas id="l3"></canvas>
    <div id="l4">layer 4</div>

<!-- end snippet -->

[Here's an article that draws text into a 2d canvas layered on top of a webgl canvas](http://webglfundamentals.org/webgl/lessons/webgl-text-canvas2d.html).
