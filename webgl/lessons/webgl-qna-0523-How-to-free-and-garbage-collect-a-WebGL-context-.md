Title: How to free and garbage collect a WebGL context?
Description:
TOC: qna

# Question:

I'm developing a WebGL application for web and mobile. I often use hard-refreshs to test the results of my WebGL implementation. After a view tries, I get the error: 

    Error: WebGL: Exceeded 16 live WebGL contexts for this principal, losing the least recently used one.

This does not appear on a fresh started browser, but after refreshing the site multiple times. I guess the WebGL contexts are not finished, released, destroyed, cleaned up, freed correctly.

How can I do this?

Khronos Group created a test suite for freeing and garbage collecting WebGL context here: https://www.khronos.org/registry/webgl/sdk/tests/conformance/context/context-creation-and-destruction.html (Note: This might crash your browser!)

The test runs through with `PASS` and `TEST COMPLETE`, so basicly the test does not detect any issues. However, opening the JavaScript console, it reads 33 instances of: 

    Error: WebGL: Exceeded 16 live WebGL contexts for this principal, losing the least recently used one.

Is this a bug in how WebGL is handled by the browser? Or am I doing anything wrong? I never thought about freeing any WebGL contexts.

I'm using Firefox Developer Edition 48.0a2 and Firefox 46.0.1.

How to free and garbage collect a WebGL context?

# Answer

I think maybe I misunderstood your question

You say you're doing hard refreshes. Meaning you're pressing refresh in the browser? In that case first I'd disable all extensions and see if the issue is still there. If it is I'd file a bug with mozilla

Otherwise if you are trying to free canvases and create knew ones and hoping for garbage collection well.. here's the answer I wrote before I re-read your question

---

The short answer is you can't force garbage collection. You'd be better off re-using the same canvases.

There's a solution here to freeing all the data and resetting the canvas

https://stackoverflow.com/questions/23598471/how-do-i-clean-up-and-unload-a-webgl-canvas-context-from-gpu-after-use

In your particular case though are you 100% sure you're not holding on to some reference to the WebGL context or canvas? For example if you do this

    canvas.addEventListener('click', function(..) {});

You've just made a canvas that can NEVER be garbage collected. It has an event listener function attached. You have no way to remove that function since you didn't keep a reference to it. You need to remove all listeners as just one example of many ways you might be leaking references. 

[There's tons of ways to accidentally keep references to HTML elements like the canvas as well as WebGL objects](http://www.javascriptkit.com/javatutors/closuresleak/index3.shtml). Keep more than zero references and it will never be garbage collected.

[Here's some hints on finding the leaks](https://developers.google.com/web/tools/chrome-devtools/profile/memory-problems/memory-diagnosis?hl=en)

On the other hand if it was me I'd try to re-use the canvases. To make sure I freed everything I might call my own creation/deletion functions that track all the resources. Example

    var textures = [];
    function createTexture(gl) {
      var tex = gl.createTexture();
      textures.push(txt);
    }

    function deleteTexture(gl, tex) {
      gl.deleteTexture(tex);
      textures.splice(textures.indexOf(tex), 1);
    }

Now because I'm tracking all the textures I can easily delete all the remaining ones

    while (textures.length) {
      gl.deleteTexture(textures.pop());
    }


