Title: There are too many active WebGL contexts on this page, the oldest context will be lost. [dedup.min.js]
Description:
TOC: qna

# Question:

I am getting this wiered error only on Safari browser. Don't know why. 
I am using AngularJS 1.3.x. 
![click here for image][1]


  [1]: https://i.stack.imgur.com/ckZp0.png


So how do I detect which libraries may be using this. 
And why only in safari I get this error ? 
Is there a way via JS to enable or disable WebGL ? 

# Answer

Put this at the top of your HTML?

    <script>
    HTMLCanvasElement.prototype.getContext = (function(origFn) {
      var bannedTypes = {
        "webgl": true,
        "webgl2": true,
        "experimental-webgl":, true,
      };
      return function() {
        var type = arguments[0];
        return bannedTypes[type]
           ? null
           : origFn.apply(this, arguments);
      };
    }(HTMLCanvasElement.prototype.getContext));
    </script>

As long as this appears before any other scripts it should block webgl.

The script above changes replaces the function `someCanvas.getContext` so that when some other JavaScript tries to create a "webgl" context it returns `null` which means creating the context fails. Otherwise if JavaScript asks for a different kind of context it calls the original `getContext` function. 

As long as this script is executed first it should prevent other JavaScript on the page from creating a webgl context. It won't prevent JavaScript in iframes from creating contexts. You'd need to add the same solution to each iframe.
