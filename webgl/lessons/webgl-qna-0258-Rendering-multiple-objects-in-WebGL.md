Title: Rendering multiple objects in WebGL
Description:
TOC: qna

# Question:

I have tried following the suggestions given as answer to [this questions](https://stackoverflow.com/questions/21835972/multiple-objects-in-webgl?rq=1) but I still can't figure out how the "rendering flow" of a WebGL program really works.  
I am simply trying to draw two triangles on a canvas, and it works in a rather non-deterministic way: sometimes both triangles are rendered, sometimes only the second one (*second* as in *the last one drawn*) is rendered.  

![Lucky run][1]

![Out of luck][2]

<strike>(it appears to depend on rendering time: strangely enough, the *longer* it takes, the better the odds of ending up with both triangles rendered)</strike>. **EDIT**: not true, tried refreshing over and over and the two triangles sometimes show up on very rapid renders (~55ms), sometimes on longer-running ones (~120ms). What *does* seem to be a recurring pattern is that on the very first time the page is rendered, the two triangles show, and on subsequent repeated refreshes the red one either shows for good or for a very short lapse of time, then flickers away.  
Apparently I'm missing something here, let me explain my program's flow in pseudo-code (can include the real code if need be) to see if I'm doing something wrong:

    var canvas = new Canvas(/*...*/);
    var redTriangle = new Shape(/* vertex positions & colors */);
    var blueTriangle = new Shape(/* vertex positions & colors */);
    canvas.add(redTriangle, blueTriangle);

    canvas.init(); //compiles and links shaders, calls gl.enableVertexAttribArray()
                   //for vertex attributes "position" and "color"

    for(shape in canvas) {
        for(bufferType in [PositionBuffer, ColorBuffer]) {
            shape.bindBuffer(bufferType); //calls gl.bindBuffer() and gl.bufferData()
                                          //This is equivalent to the initBuffers()
                                          //function in the tutorial
        }
    }

    for(shape in canvas) {
        shape.draw();
        //calls:
        //-gl.bindBuffer() and gl.vertexAttribPointer() for each buffer (position & color),
        //-setMatrixUniforms()
        //-drawArrays()
        //This is equivalent to the drawScene() function in the tutorial
    }

Despite the fact I've wrapped the instructions inside object methods in my attempt to make the use of WebGLs slightly more OO, it seems to me I have fully complied to the instructions on [this lesson](http://learningwebgl.com/lessons/lesson02/index.html) (comparing the lesson's source and my own code), hence I cannot figure out what I'm doing wrong.  
I've even tried to use only one `for(shape in canvas)` loop, as so:

    for(shape in canvas) {
        for(bufferType in [PositionBuffer, ColorBuffer]) {
            shape.bindBuffer(bufferType); //calls gl.bindBuffer() and gl.bufferData()
                                          //This is equivalent to the initBuffers()
                                          //function in the tutorial
        }
        shape.draw();
        //calls:
        //-gl.bindBuffer() and gl.vertexAttribPointer() for each buffer (position & color),
        //-setMatrixUniforms()
        //-drawArrays()
        //This is equivalent to the drawScene() function in the tutorial
    }

but it doesn't seem to have any effect.
Any clues?

  [1]: http://i.stack.imgur.com/P5G2J.png
  [2]: http://i.stack.imgur.com/58eN0.png

# Answer

I'm guessing the issue is that by default WebGL canvases are cleared everytime they are composited

Try changing your WebGL context creation to

    var gl = someCanvas.getContext("webgl", { preserveDrawingBuffer: true });

I'm just guessing your app is doing things asynchronously which means each triangle is drawn in response to some event? So, if both events happen to come in quick enough (between a single composite) then you get both triangles. If they come on different composites then you'll only see the second one.

`preserveDrawingBuffer: true` says "don't clear after each composite". Clearing is the default because it allows certain optimizations for certain devices, specifically iOS, and the majority of WebGL apps clear at the beginning of each draw operation. Those few apps that don't clear can set `preserveDrawingBuffer: true`

In your particular case line 21 of `angulargl-canvas.js`

    options = {alpha: false, premultipliedAlpha: false};

try changing it to 

    options = {alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: true};
