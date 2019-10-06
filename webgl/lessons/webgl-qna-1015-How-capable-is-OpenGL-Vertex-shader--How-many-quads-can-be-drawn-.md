Title: How capable is OpenGL Vertex shader? How many quads can be drawn?
Description:
TOC: qna

# Question:

I wrote a demo application to test the capability of vertex shader as it is said everywhere that it can handle millions of quads per second but in my case it fails at a certain limit.

I wrote a demo [here](https://jsfiddle.net/Subhasish2015/yc9sg17p/13/) which has a input box only accepting numbers, it will render squares according to the input number dynamically.
I can easily see it in action without any delay until some 25 square quads after which it slows down and at some point even the GPU crashes which is worse.

Can we optimise the code I wrote or is it a limitation of GPU and OpenGL-ES?

Code :
 
`
      
        <script type="vertexShader" id="vertexShader">
  #version 300 es
  in vec3 position;
  in vec4 color;
  out vec4 fcolor;
  void main () {
   gl_Position = vec4(position, 1.0);
   fcolor = color;
  }
 </script>

 <script type="fragmentShader" id="fragmentShader">
  #version 300 es
  precision mediump float;
  in vec4 fcolor;
  out vec4 finalColor;
  void main () {
   finalColor = vec4(fcolor);
  }
 </script>
        var gl, canvas;
  gl = initWebGLCanvas('canvas');
  var program = getProgram('vertexShader', 'fragmentShader', true);
  document.getElementById('numOfGrids').oninput = function () {
   clearCanvas(gl);
   this.value = this.value || 1;
   this.value = this.value >= 0 ? this.value : 0;
   var gridVertices = createGridVerticesBuffer(this.value || 1);
   enableVerticesToPickBinaryDataWithinGPU(program, 'position', 'color');
   fetchDataFromGPUAndRenderToCanvas({
    positionIndex : gl.positionIndex,
    vertices : gridVertices,
    positionSize : 3,
    stride : 7,
    colorIndex : gl.colorIndex,
    colorSize : 4,
    positionoffset : 0,
    colorOffset : 3,
    startIndexToDraw : 0,
    numOfComponents : 6
   }, gl);
  };

            var r = [1.0, 0.0, 0.0, 1.0];
    var g = [0.0, 1.0, 0.0, 1.0];
    var b = [0.0, 0.0, 1.0, 1.0];
    var z = 0.0;

    var createGridVerticesBuffer = (gridsRequested) => {
        var vertices = [
            1.0, -1.0, z, r[0], r[1], r[2], r[3],
        -1.0, 1.0, z, g[0], g[1], g[2], g[3],
        -1.0, -1.0, z, b[0], b[1], b[2], b[3],
    
        1.0, -1.0, z, r[0], r[1], r[2], r[3],
        -1.0, 1.0, z, g[0], g[1], g[2], g[3],
        1.0, 1.0, z, b[0], b[1], b[2], b[3]];
        
        var vertexArray = [];
        var factor = 2.0/gridsRequested;
        var areaRequired = -1.0 + factor;
        vertices[21] = vertices[0] = areaRequired;
        vertices[15] = vertices[1] = -areaRequired;
        
        vertices[22] = -areaRequired;
        vertices[35] = areaRequired;
        vertices[36] = vertices[8];
        vertexArray.push(vertices);
        var lastVertices = vertices.slice();
        var processX = true;
        for (var i = 1; i <= gridsRequested * gridsRequested - 1; i++) {
            var arr = lastVertices.slice();
            if (processX) {
                arr[21] = arr[0] = lastVertices[0] + factor;
                arr[28] = arr[7] = lastVertices[35];
                arr[8] = lastVertices[36];
                arr[14] = lastVertices[0];
                arr[15] = lastVertices[1];
                arr[35] = lastVertices[35] + factor;
            } else {
                arr[22] = arr[1] = lastVertices[1] - factor;
                arr[29] = arr[8] = lastVertices[8] - factor;
                arr[15] = lastVertices[15] - factor;
                arr[36] = lastVertices[36] - factor;
            }
            vertexArray.push(arr);
            if ((i + 1) % gridsRequested === 0) {
                lastVertices = vertexArray[i + 1 - gridsRequested];
                processX = false;
            } else {
                processX = true;
                lastVertices = arr;
            }
        }
        return createBuffers(gl, vertexArray, true);

    };

`

# Answer

You've asked an un-answerable question

> How many quads can be drawn?

Which device are we talking about? A Raspberry PI? An iPhone 2? A Windows PC with an NVidia 2080 RTX? What size quads? What's your fragment shader doing?

In any case the issue you're running into is not a vertex shader issue it's a fragement shader issue. Drawing pixels takes time. Drawing say a 1024x1024 quad is drawing 1 million pixels. Drawing one hundred 1024x1024 quads is drawing 100 million pixels. Trying to do that 60 times a second is asking to draw 6 billion pixels.

Change all the quads to be 1x1 pixel and it will run just fine because then you are only asking it to draw 6000 pixels per second.

This is often referred to as being *fillrate bound*. You just can't draw that many pixels. In your case it's also called having *too much overdraw*. By drawing overlapping quads your doing wasteful work drawing the same pixel more than ones. You should try to draw each pixel only once if possible.

I would guess a general rule of thumb is that most GPUs can only draw between 2 and 12 fullscreen quads at 60 frames a second. I just pulled that number out of no where but for example an original android GPU could only draw 1.5 fullscreen quads at 60fps. I think a Raspberry PI it's probably less than 4. I know a 2015 Intel Graphics (not sure which model) could do about 7 at 1280x720. My 2019 Macbook Air can do about 3 (it's resolution is 2560x1600 which is about the same as 12 screens at 1280x720.

As for crashing the GPU didn't crash, rather the browser or the OS reset the GPU because it was taking too long. Most GPUs (as of 2019) are **not** multitasking like a CPU. A CPU can be interrupted and switched to do something else. This is how your PC is able to run lots of apps and services at the same time. Most GPUs can't do this. They can only do one thing at a time. So if you give them 30 seconds of work to do in a single draw call they will do 30 seconds of work no interruptions. This is no good for the OS since it needs the GPU to update windows and run other apps. So, the OS (and some browsers) time every draw call. If one draw call takes more than a certain amount of time they reset the GPU and often kill the program or page that asked the GPU to do something that took too long.

As for how to know what's too much work, you shouldn't be trying to do as much work as possible, rather you should be trying to do as little as possible. Your app is drawing overlapping quads for no reason.

If you really do need to draw overlapping quads or do some calculation that takes a long time then you probably need to find a way to break it up into smaller operations per draw call. Process 5 quads per draw call and use 5 draw calls instead of one with 25. Process more smaller quads instead of fewer large quads, etc...
