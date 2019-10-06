Title: Recording FPS in webGL
Description:
TOC: qna

# Question:

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

# Answer

Displaying FPSs is pretty simple and has really nothing to do with WebGL other than it's common to want to know. Here's a small FPS display

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const fpsElem = document.querySelector("#fps");

    let then = 0;
    function render(now) {
      now *= 0.001;                          // convert to seconds
      const deltaTime = now - then;          // compute time since last frame
      then = now;                            // remember time for next frame
      const fps = 1 / deltaTime;             // compute frames per second
      fpsElem.textContent = fps.toFixed(1);  // update fps display
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


<!-- language: lang-html -->

    <div>fps: <span id="fps"></span></div>


<!-- end snippet -->

Use requestAnimationFrame for animation because that's what it's for. Browsers can sync to the screen refresh to give you buttery smooth animation. They can also stop processing if your page is not visible. setTimeout on the other hand is not designed for animation, will not be synchronised to the browser's page drawing.

You should probably not use `Date.now()` for computing FPS as `Date.now()` only returns milliseconds. Also using `(new Date()).getTime()` is especially bad since it's generating a new `Date` object every frame. 

`requestAnimationFrame` already gets passed the time in microseconds since the page loaded so just use that.

It's also common to average the FPS across frames.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const fpsElem = document.querySelector("#fps");
    const avgElem = document.querySelector("#avg");

    const frameTimes = [];
    let   frameCursor = 0;
    let   numFrames = 0;   
    const maxFrames = 20;
    let   totalFPS = 0;

    let then = 0;
    function render(now) {
      now *= 0.001;                          // convert to seconds
      const deltaTime = now - then;          // compute time since last frame
      then = now;                            // remember time for next frame
      const fps = 1 / deltaTime;             // compute frames per second
      
      fpsElem.textContent = fps.toFixed(1);  // update fps display
      
      // add the current fps and remove the oldest fps
      totalFPS += fps - (frameTimes[frameCursor] || 0);
      
      // record the newest fps
      frameTimes[frameCursor++] = fps;
      
      // needed so the first N frames, before we have maxFrames, is correct.
      numFrames = Math.max(numFrames, frameCursor);
      
      // wrap the cursor
      frameCursor %= maxFrames;
        
      const averageFPS = totalFPS / numFrames;

      avgElem.textContent = averageFPS.toFixed(1);  // update avg display
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

<!-- language: lang-css -->

    body { font-family: monospace; }


<!-- language: lang-html -->

    <div>        fps: <span id="fps"></span></div>
    <div>average fps: <span id="avg"></span></div>


<!-- end snippet -->


