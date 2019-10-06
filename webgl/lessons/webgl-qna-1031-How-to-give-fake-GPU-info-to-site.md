Title: How to give fake GPU info to site
Description:
TOC: qna

# Question:

I need to create web browser using CefSharp.Wpf with ability to give fake data to site for example CPU cores, browser plugins, platform name etc. 
There are site that can retrieve all this info: https://www.deviceinfo.me/

My quesiton is: How to hide GPU info from this site? Using javascript or CefSharp functionality

I have tried to redefine WebGLRenderingContext.getParameter method, which gives an info about GPU renderer and vendor:

```

var canvas = document.createElement('canvas');

var gl;

try {
  gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl2") || canvas.getContext("experimental-webgl");
} catch (e) {
}

var oldParam = WebGLRenderingContext.prototype.getParameter;


WebGLRenderingContext.prototype.getParameter = function(parameter){

    console.log("we have guests");

    if(parameter == debugInfo.UNMASKED_RENDERER_WEBGL){
         return "GTX 1080";
    }

    if(parameter == gl.getExtension("WEBGL_debug_renderer_info").UNMASKED_RENDERER_WEBGL){
        return "GTX 1080";
    }

    if(parameter == debugInfo.UNMASKED_RENDERER_WEBGL){
        return "NVidia";
    }

    if(parameter == gl.VERSION){
        return "GTX 1080";
    }
    return oldParam(parameter);
};
```

I expected to completely redefine this method and return some fake info, but when i called `gl.getParameter(param)` again, it still gave me an old gpu info

# Answer

If you still want Canvas2D and WebGL to still work then you can't hide since they can finger print by actually rendering.

You could disable them with

```
HTMLCanvasElement.prototype.getContext = function() {
  return null;
};
```

Though the fact they don't exist is also a data point.

Otherwise your wrapper appears to have some issues. 

First you really should set the function **before** creating the context.

Second your last line should be

```
   oldParam.call(this, parameter);
```

Also you didn't show `debugInfo` but you can use `WebGLRenderingContext` instead or you can just hard code the numbers


As for http://www.deviceinfo.me you need to make sure your patch runs in all iframes and workers before any other JavaScript. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    WebGLRenderingContext.prototype.getParameter = function(origFn) {
      const paramMap = {};
      paramMap[0x9245] = "Foo";         // UNMASKED_VENDOR_WEBGL
      paramMap[0x9246] = "Bar";         // UNMASKED_RENDERER_WEBGL
      paramMap[0x1F00] = "Nobody";      // VENDOR
      paramMap[0x1F01] = "Jim";         // RENDERER
      paramMap[0x1F02] = "Version 1.0"; // VERSION

      return function(parameter) {
        return paramMap[parameter] || origFn.call(this, parameter);
      };
    }(WebGLRenderingContext.prototype.getParameter);

    // --- test

    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');

    show(gl, gl, [
      'VENDOR',
      'RENDERER',
      'VERSION',
    ]);
    if (ext) {
      show(gl, ext, [
        'UNMASKED_VENDOR_WEBGL',
        'UNMASKED_RENDERER_WEBGL',
      ]);
    }

    function show(gl, base, params) {
      for (const param of params) {
        console.log(param, ':', gl.getParameter(base[param]));
      }
    }
        

<!-- end snippet -->


