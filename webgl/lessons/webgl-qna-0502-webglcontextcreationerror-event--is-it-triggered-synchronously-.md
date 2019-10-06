Title: webglcontextcreationerror event: is it triggered synchronously?
Description:
TOC: qna

# Question:

Is the [webglcontextcreationerror event][1] triggered synchronously or asynchronously? For example does

    canvas.addEventListener("webglcontextcreationerror", function() {
      console.log("Error");
    });
    var context = canvas.getContext("webgl");
    console.log("After creation");

in the case of error output

    "After creation"
    "Error"

or

    "Error"
    "After creation"

?

I am unsure how to force this event to find out the answer myself.

  [1]: https://developer.mozilla.org/en-US/docs/Web/Events/webglcontextcreationerror

# Answer

So one question is why do you care the order? `getContext` returns `null` on failure so if you want to know if it failed then you're done. `webglcontextcreationerror`'s only point is for you to get the reason why it failed since `getContext` has no way to do that. So, you could structure your code such that it doesn't matter whether it's sync or async

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var canvas = document.createElement('canvas')

    function doSomethingWithStatusMessage(e) {
      log("context creation error: "+ e.statusMessage);
    }

    canvas.addEventListener("webglcontextcreationerror", doSomethingWithStatusMessage);

    log("2d: " + canvas.getContext('2d'));
    log("webgl: " + canvas.getContext("webgl"));
    log("after creation");

    function log(msg, color) {
      var div = document.createElement("pre");
      div.appendChild(document.createTextNode(msg));
      document.body.appendChild(div);
    }

<!-- end snippet -->

`doSomethingWithStatus` message could do anything you want. Assume based on `getContext` you display a dialog. 

    if (!canvas.getContext("webgl")) {
       g_dialog = new Dialog("can't create context", g_reason);
    }

Then you might have code like

    var g_reason = "unknown";
    var g_dialog;

    function doSomethingWithStatusMessage(e) {
      if (g_dialog) {
        g_dialog.updateReason(e.statusMessage);
      } else {
        g_reason = g.statusMessage;
      }
    }

    function Dialog(msg, reason) {
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(msg));
      var reasonNode = document.createTextNode("");
      div.appendChild(reasonNode);
      updateReason(reason);      

      function updateReason(reason) {
        reasonNode.nodeValue = reason;
      }
      this.updateReason = updateReason;
    }

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

    var g_reason = "unknown";
    var g_dialog;

    function doSomethingWithStatusMessage(e) {
      if (g_dialog) {
        g_dialog.updateReason(e.statusMessage);
      } else {
        g_reason = e.statusMessage;
      }
    }

    var canvas = document.createElement('canvas')

    canvas.addEventListener("webglcontextcreationerror", doSomethingWithStatusMessage);

    log("2d: " + canvas.getContext('2d'));
    var gl = canvas.getContext("webgl");
    log("webgl: " + gl);
    log("after creation");

    if (!gl) {
      new Dialog("could not create WebGL context: ", g_reason);
    }

    function log(msg, color) {
      var div = document.createElement("pre");
      div.appendChild(document.createTextNode(msg));
      document.body.appendChild(div);
    }

    function Dialog(msg, reason) {
      var outer = document.createElement("div");
      outer.className = "dialog";
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(msg));
      var reasonNode = document.createTextNode("");
      div.appendChild(reasonNode);
      outer.appendChild(div);
      updateReason(reason);      
      document.body.appendChild(outer);
      outer.addEventListener('click', close);

      function updateReason(reason) {
        reasonNode.nodeValue = reason;
      }
      
      function close() {
        document.body.removeChild(outer);
        outer.removeEventListener('click', close);
      }
      
      this.close = close;
      this.updateReason = updateReason;
    }

<!-- language: lang-css -->

    .dialog {
      position: absolute;
      z-index: 2;
      background: rgba(0,0,0,0.8);
      color: red;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      
      display: flex;
      justify-content: center;
      align-content: center;
      align-items: center;
    }

<!-- end snippet -->

If instead you wanted to report the error to a server for example then just trigger it a few moments later to give the async message a chance to arrive.

    if (!canvas.getContext("webgl")) {
       // give a moment for the async message to arrive
       setTimeout(uploadReason, 1000);
    }

The rest would just be 

    var g_reason = "unknown";

    function doSomethingWithStatusMessage(e) {
      g_reason = e.statusMessage;
    }

    function uploadReason() {
      .. XHR g_reason to server ..
    }

Note: I [file a bug on this part of the spec](https://github.com/KhronosGroup/WebGL/issues/1603) so you can follow up if you'd like.
