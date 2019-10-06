Title: creating a circle with webgl with mouse clicks
Description:
TOC: qna

# Question:

i found this program online. how can i modify the following program to create the circle each time the user clicks with the mouse? so multiple circles can be created? im new to webgl and im lost, thanks a lot for your help

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-html -->

    <!DOCTYPE html>

    <html>
        <head>
            <title>TODO supply a title</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body onload="onLoad()">
            <script id="vertex-shader" type="x-shader/x-vertex">
        uniform vec2 u_resolution;
        attribute vec2 a_position;

        void main(void) {
          vec2 clipspace = a_position / u_resolution * 2.0 - 1.0;
          gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);
        }

    </script>

    <script id="fragment-shader" type="x-shader/x-fragment">
        precision mediump float;

        void main(void) {
            gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);
        }
    </script>
    <script>
        function onLoad () {
       var canvas = document.getElementById("canvas");
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");//   
                //gl.viewport(0, 0, canvas.width, canvas.height);
                gl.clearColor(0.8, 0.0, 0.3, 1.0);//
                gl.clear(gl.COLOR_BUFFER_BIT);//

            
                var v = document.getElementById("vertex-shader").firstChild.nodeValue;//
                var f = document.getElementById("fragment-shader").firstChild.nodeValue;//

                var vs = gl.createShader(gl.VERTEX_SHADER);//
                gl.shaderSource(vs, v);//
                gl.compileShader(vs);//

                var fs = gl.createShader(gl.FRAGMENT_SHADER);//
                gl.shaderSource(fs, f);//
                gl.compileShader(fs);//

                var program = gl.createProgram();//
                gl.attachShader(program, vs);//
                gl.attachShader(program, fs);//
                gl.linkProgram(program);//
                
                gl.useProgram(program);

        var circle = {x: 50, y: 50, r: 15};
        var ATTRIBUTES = 2;
        var numFans = 16;
        var degreePerFan = (2 * Math.PI) / numFans;
        var vertexData = [circle.x, circle.y];
        
        for(var i = 0; i <= numFans; i++) {
          var index = ATTRIBUTES * i + 2; // there is already 2 items in array
          var angle = degreePerFan * (i+1);
          vertexData[index] = circle.x + Math.cos(angle) * circle.r;
          vertexData[index + 1] = circle.y + Math.sin(angle) * circle.r;
        }

        var vertexDataTyped = new Float32Array(vertexData);

        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexDataTyped, gl.STATIC_DRAW);
        
        var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

        gl.enableVertexAttribArray(positionLocation);

        var positionLocation = gl.getAttribLocation(program, "a_position");
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, ATTRIBUTES * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexData.length/ATTRIBUTES);
      }
    onLoad();
    </script>

    <canvas id="canvas" style="border: none;" width="300" height="150"></canvas>
        </body>
    </html>
               

<!-- end snippet -->

thanks

# Answer

I'd recommend some webgl tutorials like http://webglfundamentals.org

[Here's an article on drawing multiple things](http://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html)

But in particular WebGL is just a rasterization library. It has no concept of circles directly. If you want to draw multiple circles you need to decide how you want to represent your circles (a texture, points, some fancy shader) and then how you want to draw them (one draw call per circle, one circle per quad, multiple circles per draw call). It's up to you.

Even the code you posted there are too many options. That code draws one circle. Put a loop around the code that draws one circle and it will draw N circles. On the other hand you could also generate a single circle and [use various matrix transforms to scale and position it](http://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html)

With mouse clicks you've added multiple issues. 

By default the canvas is cleared every frame in WebGL. So you draw where the user clicked the mouse but the next time you draw the previous circles will be erased. 

The simplest solution so to tell webgl not to clear the canvas with

    gl = someCanvas.getContext("webgl", { preserveDrawingBuffer: true });

But that's not usually a good solution because if you want to resize the canvas it will still be cleared when you resize it.

Instead you need to keep a list of all mouse clicks and then draw a circle for each click each time. But that brings up a new issue in that after too many clicks it will get too slow. Which means you'd need to do a combination of the 2 things above. 

Don't clear the canvas, just draw the new circles on click, if you need to resize the canvas after resizing it draw all the old circles.

As you can see it turns out to be a bigger topic than it sounds.
