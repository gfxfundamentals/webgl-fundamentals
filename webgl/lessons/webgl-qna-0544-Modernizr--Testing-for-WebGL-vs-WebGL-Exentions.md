Title: Modernizr: Testing for WebGL vs WebGL Exentions
Description:
TOC: qna

# Question:

I'm using **THREE.js** scenes and graphic objects on my webpage. I know, at the least, **THREE.js** utilizes **WebGL**.

I'd like to utilize **Modernizr** to check the current browser for compatability with **WebGL** and, if the browser doesn't have it, prompt a message to the user.

When selecting the [browser features][1] to have **Modernizr** test for, I see two features that relate to my goal

**WebGL:** _Detects for WebGL in the browser._

**WebGl Extentions**: _Detects support for OpenGL extensions in WebGL. It's `true` if the WebGL extensions API is supported, then exposes the supported extensions as subproperties, e.g.:_

  [1]: https://modernizr.com/download?webgl-setclasses

So in order for **THREE.js** to work, do I need to test for **WebGL Extentions** and **WebGL** _or_ simply just **WebGL**?

# Answer

It depends whether you're using features that require extensions. Three.js itself doesn't need any extensions. Certain things like shadows probably run faster if you `WEBGL_depth_texture` extension. 

If you don't know what extensions you personally need consider inserting some code to hide them and see if your app still runs

Example:

    // disable all extensions

    WebGLRenderingContext.prototype.getExtension = function() {
      return null;
    }
    WebGLRenderingContext.prototype.getSupportedExtensions = function() {
      return [];
    }

    // now init three.js

If you want to allow specific extensions you could do something like this

    var allowedExtensions = [
      "webgl_depth_texture",
      "oes_texture_float",
    ];

    WebGLRenderingContext.prototype.getExtension = function(origFn) {
      return function(name) {
        if (allowedExtensions.indexOf(name.ToLowerCase()) >= 0) {
          return origFn.call(this, name);
        }
        return null;
      };
    }(WebGLRenderingContext.prototype.getExtension);

    WebGLRenderingContext.prototype.getSupportedExtensions = function(origFn) {
      return function() {
        return origFn.call(this).filter(function(name) {
          return allowedExtensions.indexOf(n) >= 0;
        });
      };
    }(WebGLRenderingContext.prototype.getSupportedExtensions);

