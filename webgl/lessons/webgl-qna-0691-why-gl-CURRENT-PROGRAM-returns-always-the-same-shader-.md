Title: why gl.CURRENT_PROGRAM returns always the same shader?
Description:
TOC: qna

# Question:

My program has 5 shaders (1 for display, and the others for managing my particles).
I placed an onmouse event, and in the handler function, I made a log: 
 
    console.log (gl.getParameter (gl.CURRENT_PROGRAM));

On the console I see the list of uniforms, and thanks to this list I can identify which shader is being processed at the moment the event was triggered on the canvas.

But I still have the same shader, why?

edit : oups...the CURRENT_PROGRAM is the last in my render() loop...so i guess the mouse event is fire when render() is complete.

# Answer

First off you shouldn't see any uniforms on your programs. If you do [that's an anti-pattern](https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html)

Second JavaScript does not multitask [[1](1)]. Instead it responds to events. When an event happens it calls the listeners (JavaScript functions) for that event. Those functions run to completion and then the next event's listeners get called.

So, in your JavaScript program you probably have at least 2 event listeners. One is a requestAnimationFrame event listener, the other is your mousemove event listener. They don't interrupt each other. They each run to completion, exit, then the browser executes the next event (or goes to sleep until a new event happens).

The way most WebGL programs work is they render during a single event, usually a requestAnimationFrame event. During this event they do something like

    for each object
       set attributes for object
       gl.useProgram(program object needs)
       set uniforms
       draw

Then the event exits. Later your mousemove event comes in. This means `gl.getParameter(gl.CURRENT_PROGRAM)` called from inside your mousemove event listener is **always going to show the last program used** from your requestAnimationFrame event.

[1] Except of course for web workers
