Title: What is the best way to execute intensive javascript without blocking?
Description:
TOC: qna

# Question:

So, I'm loading a 3d model using webgl, and have some code to perform some operations on it before displaying it.

The problem is that this takes on the order of seconds and completely blocks the user from doing anything in the meantime. It's bad enough that you can't even scroll during this period. I've heard there's no such thing as multithreading in javascript, but I need someway for it not to block the main thread.

I even tried a setup where I load it in an iframe and using *window.postMessage* and a *message* event listener, but it seems the frame's domain uses the same thread for its javascript as well so that didn't work. Anyone else have a solution for dealing with CPU intensive code so that the user isn't blocked from doing anything?



# Answer

There really isn't an easy answer at least at the moment

1. WebWorkers

   Web worker run JavaScript in another thread. Unfortunately they are extremely limited it what they are allowed to do. Generally all you can do is pass messages back and forth. A WebWorker can not touch the DOM, it can not do WebGL or make Canvas (yet). All you can really do currently is networking and passing strings and/or typed arrays to and from a WebWorker.

    If the thing you are doing that takes lots of time can be passed back to the main thread in a JSON string and/or typed arrays this might work for you.

2.  A state machine

   A common way to handle this in JavaScript is to make your loader do things over several states so that you can call it something like this

        function doALittleMoreWork() {
           ...
           if (theresStillMoreWorkToDo) {
             setTimeout(doALittleMoreWork, 16);
           } 
        }

    Or something along those lines. `doALittleMoreWork` does a portion of the work and then remembers enough state so when called again it can continue where it left off. This is how the [O3D loader worked](https://code.google.com/p/o3d/source/browse/trunk/samples/o3djs/serialization.js).

3.  You could try to use [ES6 generators](http://davidwalsh.name/es6-generators).

    Generators effectively let you create a state machine super easy. Browsers don't yet support ES6 but there are libraries that let you use this feature now like for example [Google Traceur](https://github.com/google/traceur-compiler)

    In fact if you write a simple generator like

        function *foo() {
            console.log("do first thing");
            yield 1;
            console.log("do 2nd thing");
            yield 2;
            console.log("do 3rd thing");
            yield 3;
            console.log("do 4th thing");
            yield 4;
            console.log("do 5th thing");
            yield 5;
        }

    and you run it through traceur [you'll see how it turns it into a state machine for you](https://google.github.io/traceur-compiler/demo/repl.html#%20%20%20%20%20%20%20%20function%20*foo()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20console.log(%22do%20first%20thing%22)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20yield%201%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20console.log(%22do%202nd%20thing%22)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20yield%202%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20console.log(%22do%203rd%20thing%22)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20yield%203%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20console.log(%22do%204th%20thing%22)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20yield%204%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20console.log(%22do%205th%20thing%22)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20yield%205%3B%0A%20%20%20%20%20%20%20%20%7D%0A) like #2 above.



