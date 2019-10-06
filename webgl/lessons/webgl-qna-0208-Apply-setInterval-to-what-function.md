Title: Apply setInterval to what function
Description:
TOC: qna

# Question:

The following code is part of an app to produce turtle graphics in a browser [using the programming language J (not shown)]. The code works but there is no animation. Instead the turtles' complex paths are just shown in their final state, all at once. So I would like to use setInterval or setTimeout to produce an animation effect, but I cannot see how. 

I have tried commands like `setInterval(drawPrimitive, 1000/2);` but with no change in results. 

**Update 0**

I do get a little reaction when I supply some fictitious arguments in the setInterval() call. For example , when I enter `setInterval(function(){drawPrimitive( gl.LINES, linecolors[0], moves[0]);}, 3000);` then after I issue a turtle command, the command is performed immediately and then after as many as 3 secs -- but often less -- the canvas goes white and stays white until I issue another command. But there is **still** no animation in the drawing/painting. Does this suggest anything?

**Update 0**

Thanks for ideas.

By the way if you want to see what I am talking about you can look at [about 1:34 in this video] [1] or just at the original splash screen of the video.

    drawTurtles(linecolors,moves,leftColors,rightColors,backColors,bottoms,lefts,rights,backs,bottomNs,leftNs,rightNs,backNs);

        function drawTurtles(linecolors,moves,leftColor,rightColor,backColor,bottom,left,right,back,bottomNs,leftNs,rightNs,backNs){
        gl.uniform1i( uLit, 0 );
        drawLines(linecolors,moves)
     bottomColor = [ 1,1,1,0]; 
        gl.uniform1i( uLit, 1 );
        for(var i=0;i<leftColor.length;i++)
        {
     gl.uniform3f( uNormal, leftNs[i][0],leftNs[i][1],leftNs[i][2]);
     drawPrimitive( gl.TRIANGLES, leftColor[i], left[i]);
     gl.uniform3f( uNormal, rightNs[i][0],rightNs[i][1],rightNs[i][2]);
     drawPrimitive( gl.TRIANGLES, rightColor[i], right[i]);
     gl.uniform3f( uNormal, backNs[i][0],backNs[i][1],backNs[i][2]);
     drawPrimitive( gl.TRIANGLES, backColor[i], back[i]);
     gl.uniform3f( uNormal, -bottomNs[i][0],-bottomNs[i][1],-bottomNs[i][2]);
     drawPrimitive( gl.TRIANGLES, bottomColor, bottom[i]);
        }
    }

    function drawLines(linecolors,moves) { 
    setInterval(drawPrimitive, 1000/2);
        gl.lineWidth(2);
        gl.uniform1i( uLit, 0 );
        for(var i=0;i<linecolors.length;i++)
        {
     drawPrimitive( gl.LINES, linecolors[i], moves[i]);
        }
        gl.lineWidth(1);
    }
    

    function drawPrimitive( primitiveType, color, vertices ) {
        gl.enableVertexAttribArray(aCoords);
        gl.bindBuffer(gl.ARRAY_BUFFER,aCoordsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
        gl.uniform4fv(uColor, color);
        gl.vertexAttribPointer(aCoords, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(primitiveType, 0, vertices.length/3);
    }

    function init() {
     var canvas = document.getElementById("glcanvas");
     var vertexShaderSource = getTextContent("vshader"); 
     var fragmentShaderSource = getTextContent("fshader");
     var prog = createProgram(gl,vertexShaderSource,fragmentShaderSource);
     linecolors = [];
     moves = [];
     gl.useProgram(prog);
     aCoords =  gl.getAttribLocation(prog, "coords");
     uModelview = gl.getUniformLocation(prog, "modelview");
     uProjection = gl.getUniformLocation(prog, "projection");
     uColor =  gl.getUniformLocation(prog, "color");
     uLit =  gl.getUniformLocation(prog, "lit");
     uNormal =  gl.getUniformLocation(prog, "normal");
     uNormalMatrix =  gl.getUniformLocation(prog, "normalMatrix");
     aCoordsBuffer = gl.createBuffer();
     gl.enable(gl.DEPTH_TEST);
     gl.enable(gl.CULL_FACE);
    }


  [1]: http://www.youtube.com/watch?v=YeLNbD0BpqA&t=1m34s

# Answer

Honestly it seems like you'd have to really re-structure the code to make it run in steps

But, at least one thing you must change if you want this to work, you need to create your canvas with `preserveDrawingBuffer: true` as in

    gl = canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true });

This is because by default WebGL clears the canvas after every event. Or rather it marks it to be cleared before the next draw call. So, where as

    drawThing1();
    drawThing2();

Would show both thing1 and thing2,

    drawThing1();
    setTimeout(drawThing2, 100);

Would only show thing2 (well, you might see thing1 for a moment) but when the timeout is executed the canvas will be cleared and then thing2 will be drawn to that cleared canvas. To prevent the clearing you need to set `preserveDrawingBuffer: true`.

This "feature" is specifically for mobile devices. In order for WebGL to both draw and show stuff on the screen with the correct browser behavior it has to be double buffered. When you draw you're drawing to an offscreen buffer. When your event exits that offscreen buffer is **swapped** or **copied** [1]. Swapping is faster but what's in the buffer you'd be swapping with is undefined so WebGL clears it. If you want the slower *copying* behavior you set `preserveDrawingBuffer: false`. In this case you're always rendering to the same offscreen buffer so there is no reason it needs to be cleared. But, now it has to be copied anytime the current event exits.

[1] Technically it doesn't get copied or swapped when the event exits, rather it gets marked 
to be copied or swapped. When exactly the copy or swap happens is not clearly defined other than it will happen the next time the browser composites the page to the screen.

Also while `preserveDrawingBuffer: true` pretty much requires copying, setting it to `false` does not guarantee swapping. It just means the browser can swap if it thinks that's the best thing to do. Regardless of if it swaps or copies, if `preserveDrawingbuffer` is `false` it will clear the buffer so the behavior is consistent.

As for restructuring, just changing drawPrimitive won't be enough. 

First off `setInterval(drawPrimitive, 1000/2)` will just call `drawPrimitive` with no arguments. But as you can see `drawPrimitive` needs 3 arguments. To supply the arguments you could call it like this

    setInterval(function(i) {
      return function() {
        drawPrimitive(gl.LINES, linecolors[i], moves[i]);
      }(i),
      1000/2);}

To split that out we have a function that creates a function to call drawPrimitives. A more general version might look like this

    function makeFunctionToCallDrawPrimitive(arg1, arg2, arg2) {
      return function() {
        drawPrimitive(arg1, arg2, arg3);
      }
    }

 Now you can call it like this

    function drawLines(linecolors,moves) { 
      gl.lineWidth(2);
      gl.uniform1i( uLit, 0 );
      for(var i=0;i<linecolors.length;i++)
      {
        var func = makeFunctionToCallDrawPrimitive(gl.LINES, linecolors[i], moves[i]);
        setTimeout(func, i * 500);
      }
      gl.lineWidth(1);
    }

We could even make a function to setup the timeout as well

    var count = 0;
    function deferredDrawPrimitive(arg1, arg2, arg3) {
        var func = makeFunctionToCallDrawPrimitive(arg1, arg2, arg3);
        setTimeout(func, ++count * 500);
    }

And then change every call to `drawPrimtive` to be a call to `deferredDrawPrimitive` instead but that's still not enough for the general case. 

The problem is although that will make `drawPrimitive` will actually get called with the correct arguments every 1/2 second there is other state that drawPrimitives relies on. For example in your code there's a few lines like this

    ...
    gl.uniform3f( uNormal, leftNs[i][0],leftNs[i][1],leftNs[i][2]);
    drawPrimitive( gl.TRIANGLES, leftColor[i], left[i]);
    gl.uniform3f( uNormal, rightNs[i][0],rightNs[i][1],rightNs[i][2]);
    drawPrimitive( gl.TRIANGLES, rightColor[i], right[i]);
    ...

You could change it to this

    ...
    gl.uniform3f( uNormal, leftNs[i][0],leftNs[i][1],leftNs[i][2]);
    deferredDrawPrimitive( gl.TRIANGLES, leftColor[i], left[i]);
    gl.uniform3f( uNormal, rightNs[i][0],rightNs[i][1],rightNs[i][2]);
    deferredDrawPrimitive( gl.TRIANGLES, rightColor[i], right[i]);
    ...

But the `gl.uniform3f` lines affect how `drawPrimtive` will function. You'd have to some how save the state of those and all the other `gl` calls as well to make it do what you want. In other words just calling `drawPrimitive` in setTimeout or setInterval **WILL NOT WORK**.

That's why I said it will take some major restructuring. Either that or you need to capture all calls to gl and then play them back. [This code attempts to do that](https://github.com/greggman/webgl-capture). Once you have all the gl calls captured you could then *play them back* at a slower speed. You'd have to write that code though.

---

From the comments my point that **THIS WON'T WORK** because drawPrimitives is dependent on state was missed. Maybe this example will help make it clear. Assume you had a program using canvas 2d that draws two rectangles of different colors like this.

    ctx.fillStyle = "red";
    ctx.fillRect(10, 10, 20, 20);
    ctx.fillStyle = "blue";
    ctx.fillRect(15, 15, 20, 20);

Now let's say you want to make it show each step 1/2 a second apart so you write a `deferredFillRect` similar to the `deferredDrawPrimitive`. You then change the code like this.

    ctx.fillStyle = "red";
    deferredFillRect(10, 10, 20, 20);
    ctx.fillStyle = "blue";
    deferredFillRect(15, 15, 20, 20);

So what happens when we run this?

1.  the `fillStyle` is set to "red"
2.  a setTimeout is setup to call `fillRect` 1/2 second later with `10,10,20,20`
3.  the `fillStyle` is set to "blue"
4.  a setTimeout is setup to call `fillRect` 1 second later with `15,15,20,20`
5.  your event exits (probably window's load event)
6.  a 1/2 second passes
7.  fillRect is called with `10,10,20,20`. It draws in **BLUE** but you wanted red.
8.  a 1/2 second passes
9.  fillRect is called with `15,15,20,20`. It draws in red

Do you see the problem at step #7? The color to draw is set in the code that runs at the beginning but that *state* is lost. When the fillRect finally gets called a 1/2 second later it will draw with the **wrong color**.

The same thing is happening in your example. There's 10s or 100s of `gl` calls that set state for `drawPrimitive`. Which buffers go on which attributes, which shader program is current, which textures are bound, which values are in which uniforms, what blend mode is on, etc etc etc. All of that is **WRONG** when `drawPrimitive` is finally called from setTimeout/setInterval

If you wanted it to work you'd have to move all that state to the set interval. Since the WebGL example is too complex I'll show the canvas 2d example. To make it work you'd have to do something like

    function step1() {
      ctx.fillStyle = "blue";
      ctx.fillRect(10,10,20,20);
    }
    function step2() {
      ctx.fillStyle = "red";
      ctx.fillRect(15,15,20,20);
    }
    setTimeout(step1, 500);
    setTimeout(step2, 1000);

There's lots of other state in canvas 2d. The current `transform`, the `globalCompositingOperation`, the `strokeStyle`, the `font` etc etc etc. All of that would need to be moved to each step otherwise when that runs it will use whatever *state* is left over from other steps.

In your example you'd also have to get rid of all the loops or else have them generate functions that do everything in steps and set all the required state for each one. It's not going to be a small change to make it run in steps. In other words you'd need to include every `gl` call between calls to `drawPrimitive` in your setInterval/setTimeout functions as well.

There's lots of ways to make it work but it would require a MASSIVE RE-WRITE of the code or else it would require something that records the `gl` calls and plays them back later. I linked to some code above that records all the `gl`. calls. You could use that as a basis for playing back the `gl` calls at a slower rate. It still wouldn't be simple though. Some `gl` calls need to happen immediately (like `getUniformLocation`, `createTexture` and similar functions whereas others need to happen later.). So regardless there's a ton of work that would need to be done.

