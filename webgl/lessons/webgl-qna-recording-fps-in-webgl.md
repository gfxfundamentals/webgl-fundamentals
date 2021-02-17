Title: Recording FPS in WebGL
Description: Recording FPS in WebGL
TOC: Recording FPS in WebGL

## Question:

I am trying to compare performance for 3d applications on mobile devices.  I have a 3d solar system set up in webGL and im trying to record or at least display the FPS.  So far this is what i Have:

in the body

    <script language="javascript">
    var x, message;
    x = Time;
    message = "fps is equal to ";
    document.write (message); // prints the value of the message variable
    document.write (x); //prints the value of x
    </script>

and to get The Time Var in the draw function of canvas i have this
    
    var Time = 0;
    function drawScene() {
    var startTime = new Date();
    //draw scene here
    var endTime = new Date();
    Time = (endTime - startTime)
    }

the output i get at the bottom of the canvas is "fps is equal to null"

any help would be great!

## Answer:

Displaying FPSs is pretty simple and has really nothing to do with WebGL other than it's common to want to know. Here's a small FPS display

{{{example url="../webgl-qna-recording-fps-in-webgl-example-1.html"}}}

Use requestAnimationFrame for animation because that's what it's for. Browsers can sync to the screen refresh to give you buttery smooth animation. They can also stop processing if your page is not visible. setTimeout on the other hand is not designed for animation, will not be synchronised to the browser's page drawing.

You should probably not use `Date.now()` for computing FPS as `Date.now()` only returns milliseconds. Also using `(new Date()).getTime()` is especially bad since it's generating a new `Date` object every frame. 

`requestAnimationFrame` already gets passed the time in microseconds since the page loaded so just use that.

It's also common to average the FPS across frames.

{{{example url="../webgl-qna-recording-fps-in-webgl-example-2.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="http://timhasler.blogspot.co.uk">tim</a>
    from
    <a data-href="https://stackoverflow.com/questions/16432804">here</a>
  </div>
</div>
