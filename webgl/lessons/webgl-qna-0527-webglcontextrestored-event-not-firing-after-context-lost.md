Title: webglcontextrestored event not firing after context lost
Description:
TOC: qna

# Question:

I'm writing a webgl application and am trying to recover a webgl context after it has been lost, but the context restored event does not seem to be firing.

I'm running the following code, and expecting both "context lost" and "context restored" to be logged, based on the [WebGL specification](https://www.khronos.org/registry/webgl/specs/1.0/#5.15.2) and the documentation on the [WebGL wiki](https://www.khronos.org/webgl/wiki/HandlingContextLost). When I run the code below in jsfiddle in both Chrome (50.0.2661.102 m) and Firefox (46.0.1) I see "context lost" logged but not "context restored", and I'm seeing the same behaviour in my electron application.

    var canvas = document.createElement( 'canvas' )
    var gl = canvas.getContext("webgl");
    var WEBGL_lose_context = gl.getExtension('WEBGL_lose_context');
    
    canvas.addEventListener("webglcontextlost", function(e) {
     log("context lost");
        e.preventDefault();
    }, false);
    
    canvas.addEventListener("webglcontextrestored", function() {
     log("context restored");
    }, false);
    
    WEBGL_lose_context.loseContext();
    
    function log(msg) {
      var div = document.createElement("pre");
      div.appendChild(document.createTextNode(msg));
      document.body.appendChild(div);
    }

Do I need to do anything extra to get the context restored event to fire? Have I misunderstood the WebGL specification?

# Answer

In the case of using `WEBGL_lose_context` you have to call `WEBGL_lose_context.restoreContext()`. `WEBGL_lose_context` is for testing only. In the normal case it's up to the browser to decide when to restore the context. For example if you're tab is not the front tab and another tab needs all the WebGL memory your tab might get a lost context event. Later when you're tab is made the active tab you'll finally get a restore context event.

[See conformance test here](https://www.khronos.org/registry/webgl/sdk/tests/conformance/context/context-lost-restored.html?webglVersion=1&quiet=0)

