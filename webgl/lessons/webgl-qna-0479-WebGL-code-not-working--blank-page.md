Title: WebGL code not working- blank page
Description:
TOC: qna

# Question:

I´ve started working with WebGL and javascript in these last few days and I´ve stumbled across a problem that I have no idea how to solve.I don´t know why, but everytime that I´m trying to run this program a html opens with nothing unless a blank page.The program should be drawing points when I click on the screen.

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

     //ClickedPoints.js
     //Vertex shader program


     var VSHADER_SOURCE =
       'attribute vec4 a_Position;\n' +
       'void main() {\n' +
       ' gl_Position = a_Position;\n' +
       ' gl_PointSize= 10.0; \n' +
       '}\n';

     //Fragment shader program

     var FSHADER_SOURCE =
       'void main() {\n' +
       'gl_FragColor= vec4(1.0,0.0,0.0,1.0);\n' +
       '}\n';

     function main() {

       //Retrieve <canvas> element

       var canvas = document.getElementById('webgl');

       //Get the rendering context for WebGL

       var gl = getWebGLContext(canvas);

       if (!gl) {
         console.log('Failed to get the rendering context for WebGL');
         return;
       }

       //Initialize shaders

       if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
         console.log('Failed to initialize shaders');
         return;
       }

       //Get the storage location of attribute variable

       var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

       if (a_Position < 0) {
         console.log('Failed to get the storage location of a_Position');
         return;
       }

       //Register function (event handler) to be called on a mouse press

       canvas.onmousedown = function(ev) {
         click(ev, gl, canvas, a_Position);
       };

       gl.clearColor(0.0, 0.0, 0.0, 0.0)


       //Clear <canvas>

       gl.Clear(gl.COLOR_BUFFER_BIT);

     }

     var g_points = []; //The array for a mouse press

     function click(ev, gl, canvas, a_Position) {

       var x = ev.clientX; //x coordinate of a mouse pointer
       var y = ev.clientY; //y coordinate of a mouse pointer
       var rect = ev.target.getBoundingClientRect(); //getting the location of canvas, including its start point

       x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2); //adjusting the x and y axis in these two lines
       y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

       //Store the coordinates to g_points array

       gpoints.push(x);
       gpoints.push(y);

       //Clear <canvas>

       gl.Clear(gl.COLOR_BUFFER_BIT);

       var len = g_points.length; //the lenght of the array for the times the mouse was pressed

       for (var i = 0; i < len; i += 2) {

         //Pass the position of a point to a_Position variable

         gl.vertexAttrib3f(a_Position, g_points[i], g_points[i + 1], 0.0);

         //Draw a point

         gl.drawArrays(gl.POINTS, 0, 1);
       }
     }

<!-- language: lang-html -->

    <!DOCTYPE html>
    <html lang="en">

    <head>
      <meta charset="utf-8" />
      <title>Draw points with mouse click</title>
    </head>

    <body onload="main()">
      <canvas id="webgl" width="400" height="400">
        Please use a browser that supports "canvas"
      </canvas>

      <script src="webgl-utils.js"></script>
      <script src="webgl-debug.js"></script>
      <script src="cuon-utils.js"></script>
      <script src="ClickedPoints2.js"></script>

    </body>

    </html>


<!-- end snippet -->



# Answer

You might find it helpful to use the JavaScript DevTools built into your browser. All browsers have them. [Here's Chrome's](https://developer.chrome.com/devtools). 

In particular you want the [JavaScript console](https://developer.chrome.com/devtools/docs/console).

If you had looked there you'd have seen several errors like

    Uncaught TypeError: gl.Clear is not a function

Because it's `clear` not `Clear`

Also

    Uncaught ReferenceError: gpoints is not defined

Because you defined it as `g_points` above not `gpoints`

Also BTW `initScripts` is doing something horrible. It's creating a WebGL shader program and attaching it to the WebGLRenderingContext object by doing

    gl.program = someProgram

I can see this is the case because you have code that says 

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

Why is this bad? Because most WebGL apps have multiple shader programs. Instead `initScripts` should return a program

    var program = initScripts(...)

Then you'd call 

    var a_Position = gl.getAttribLocation(program, 'a_Position');

And 

    gl.useProgram(program);

to use it.
