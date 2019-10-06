Title: How to lock FPS with requestAnimationFrame?
Description:
TOC: qna

# Question:

I used script from Paul Irish 
https://gist.github.com/paulirish/1579671
to create animation loop inside html site.

It works although it's faster in fullscreen mode than in browser window.
Also, I observed different speeds depending on canvas size and depending on browser I use. 

Question: How can I ensure stable frame rate using the script? 

Code is available here (Beginning WebGL, chapter 1 by Brian Danchilla): 
https://github.com/bdanchilla/beginningwebgl/blob/master/01/2D_movement.html

# Answer

To embellish what @emackey said,

The short answer is you can't. You could ask the computer to do an infinite amount of work each frame. I can't promise to do that work in a finite amount of time.

On top of that each computer has a different amount of power. A cheap integrated GPU has much less power than a high end graphics card. An intel i3 is much slower than an i7.

You also mentioned changing the canvas size. Drawing a 300x150 canvas is only 45000 pixels worth of work. Drawing a 1920x1080 canvas would be 2,073,600 pixels of work or 46x more work

The best you can do is do the least amount of work possible, and or remove features on slow hardware either automatically or by user choice. Most games do this. They graphics setting options where the user can choose resolution, texture res, anti-alising levels and all kinds of other things.

That said, you can try to do your computations so things in your app move at a consistent speed relative to time. The framerate might slower on a slow machine or with a larger canvas but the distance something moves per second will remain the same.

You can do this by using the time value passed into `requestAnimationFrame`

    function render(time) {
       // time is time in milliseconds since the page was loaded
       
       ...do work...
    
       requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

For example here is **NON** framerate independent animation

    function render(time) {
       
       xPosition = xPosition + velocity;

       ...
    
       requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

and here is frame rate independent animation


    var then = 0;
    function render(time) {
       var timeInSeconds = time * 0.001;
       var deltaTimeInSeconds = timeInSeconds - then;
       then = timeInSeconds;

       xPosition = xPosition + velocityInUnitsPerSecond * deltaTimeInSeconds;

       ...
    
       requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

Note: The time passed into requestAnimationFrame is higher resolution than `Date.now()`

[Here's an article on it with animations](http://webglfundamentals.org/webgl/lessons/webgl-animation.html)
