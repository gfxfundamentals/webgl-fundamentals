Title: How can we have display of same objects in two canvas in webgl?
Description:
TOC: qna

# Question:

I am under a situation that i have two canvas, and i want to display the same object in both canvas (in fact i have to display different objects in each canvas, but i want to start by showing same object in both), but i am not able to do this, 
  could some one please hlep me in doing this ? 
  
  My try to do it is: (i have two canvas (canvas ans canvas2) in grey and it display mutiple square in both, but it is  displayed in only one), how to display in both.
  My code to try is :
    
            
    <!DOCTYPE html>
    
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <script class="WebGL">
            var gl,gl2;
            function createProgram(gl, vertexShader, fragmentShader)
            {
                var vs = gl.createShader(gl.VERTEX_SHADER);
                gl.shaderSource(vs, vertexShader);
                gl.compileShader(vs);
    
                if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
                    alert(gl.getShaderInfoLog(vs));
                //////
                var fs = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(fs, fragmentShader);
                gl.compileShader(fs);
    
                if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
                    alert(gl.getShaderInfoLog(fs));
                program = gl.createProgram();
                gl.attachShader(program, vs);
                gl.attachShader(program, fs);
                gl.linkProgram(program);
                if (!gl.getProgramParameter(program, gl.LINK_STATUS))
                    alert(gl.getProgramInfoLog(program));
                return program;
            }
            function createShaderFromScriptElement(gl , shaderName)
            {
                var Shader = document.getElementById(shaderName).firstChild.nodeValue;
                return Shader;
            }
            function start()
            {            
                var canvas = document.getElementById("canvas");
                canvas2 = document.getElementById("canvas2");
                gl = canvas.getContext("experimental-webgl");
                gl2 = canvas2.getContext("experimental-webgl");
                if (!gl) { alert("error while GL load"); }
                if (!gl2) { alert("error while GL load"); }
    
              //  var vertexShader2 = createShaderFromScriptElement(gl, "2d-vertex-shader");
              //  var fragmentShader2 = createShaderFromScriptElement(gl, "2d-fragment-shader");
                  var vertexShader = createShaderFromScriptElement(gl, "2d-vertex-shader");
                  var fragmentShader = createShaderFromScriptElement(gl, "2d-fragment-shader");
    
                  var program = createProgram(gl, vertexShader, fragmentShader);
    
                gl.useProgram(program);
                var positionLocation = gl.getAttribLocation(program, "a_position");
                var colorLocation = gl.getUniformLocation(program, "u_color");
                var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    
                var buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.uniform2f(resolutionLocation, 200, 200);
                
                gl.enableVertexAttribArray(positionLocation);
                gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
                for (var ii = 0; ii < 5005; ++ii)
                {
                    // Setup a random rectangle
                    setRectangle(gl, randomInt(300), randomInt(300), 50, 50);
                    // Set a random color.
                    gl.uniform4f(colorLocation, Math.random(), Math.random(), Math.random(), 1);
                    // Draw the rectangle.
                    gl.drawArrays(gl.TRIANGLES, 0, 3);
                    gl2.drawArrays(gl2.TRIANGLES, 0, 3);
                }
                function randomInt(range)
                {
                    return Math.floor(Math.random() * range);
                }
    
                // Fills the buffer with the values that define a rectangle.
                function setRectangle(gl, x, y, width, height)
                {
                    var x1 = x;
                    var x2 = x + width;
                    var y1 = y;
                    var y2 = y + height;
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                       x1, y1,
                       x1, -y1,
                       -x1, y1,
                     ]), gl.STATIC_DRAW);
                }
            }
        </script>
        <script id="2d-vertex-shader" type="x-shader/x-vertex">
            attribute vec2 a_position;
            uniform vec2 u_resolution;
    
            void main() {
            // convert the rectangle from pixels to 0.0 to 1.0
            vec2 zeroToOne = a_position / u_resolution;
    
            // convert from 0->1 to 0->2
            vec2 zeroToTwo = zeroToOne * 2.0;
    
            // convert from 0->2 to -1->+1 (clipspace)
            vec2 clipSpace = zeroToTwo - 1.0;
    
            gl_Position = vec4(clipSpace* vec2(1, -1), 0, 1);
            }
        </script>
    
        <script id="2d-fragment-shader" type="x-shader/x-fragment">
            precision mediump float;
            uniform vec4 u_color;
    
            void main()
            {
              gl_FragColor = u_color;  // green
            }
        </script>
    </head>
    <body onload="start()">
        <div style="text-align: center">
           
        </div>
        <table style="width:100%; height: 10%;">
          
            <tr>
                <td style="width:200px; max-width:200px; background-color:gray ">
                    <canvas id="canvas" width="300" height="300"></canvas>
                </td>
                <td style="width:200px; max-width:200px; background-color:gray; ">
                    <canvas id="canvas2" width="300" height="300"></canvas>
                </td>
            </tr>
        </table>
    </body>
    </html>

# Answer

No, unfortunately you can not share WebGL objects across canvases in WebGL 1.0 

What are you trying to accomplish? 

Some solutions:

*  Split 1 canvas

   If you need multiple views like many 3D modeling programs you can split a single canvas using `gl.enable(gl.SCISSOR_TEST)`, `gl.scissor` and `gl.viewport`. [Here's one example](http://webglsamples.org/multiple-views/multiple-views.html)

*  Draw to one canvas, then copy to other canvases

   In this case you render to an offscreen canvas with WebGL then
   use multiple visible canvas 2d canvases to display by using
   drawImage.

        gl = offscreenCanvas.getContext("webgl");
        ctx1 = onscreenCanvas1.getContext("2d");
        ctx2 = onscreenCanvas2.getContext("2d");

        // render whatever you want to appear in onscreenCanvas1
        renderScene(scene1Settings, gl);
        // copy the result to offscreenCanvas1
        ctx1.drawImage(gl.canvas, ...);


        // render whatever you want to appear in onscreenCanvas2
        renderScene(scene2Settings, gl);
        // copy the result to offsceenCanvas2
        ctx2.drawImage(gl,canvas, ...);

*   Make 1 canvas the size of the window, put it in the background, use the first technique (scissor, viewport) and `getBoundingClientRect` to render exactly where some other element is.

    In this case you make a single WebGL canvas the size of the window
    and using CSS put it in the background. Then you create a placeholder
    `<div>` or other element to represent where you want a canvas to
    appear.

    You can then ask the browser exactly where that element appears and
    use that info to set the viewport and scissor and then render to
    that area to make it appear like it's a canvas

    [Example1](http://twgljs.org/examples/itemlist.html), 
    [Example2](http://threejs.org/examples/webgl_multiple_elements.html)

