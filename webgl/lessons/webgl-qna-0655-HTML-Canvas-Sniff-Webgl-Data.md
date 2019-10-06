Title: HTML Canvas Sniff Webgl Data
Description:
TOC: qna

# Question:

This question might be weird but suppose we have a canvas which for example draws some 3D content like this [experiment][1].

Disregarding using ThreeJS, Babylon or any other library to achieve same effect, is it possible to set some interval that copies the birth of every voxel and repeat (redraw) it later.

Simply I want to record the canvas draw process and replay it, without using RTC , video, or images sequence.

**What Have been done?**

I have been trying with **[WebGl Context][2]**
and **[Stream Capture][3]**, but unfortunately could not achieve the desired result.

Can anyone help with this?


  [1]: https://www.chromeexperiments.com/experiment/pixels-3d
  [2]: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext
  [3]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream

# Answer

You can wrap the WebGL context and capture all the function calls. An example of wrapping the WebGL context would be something like    

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const rawgl = document.querySelector("canvas").getContext("webgl");
    const gl = wrapContext(rawgl);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(40, 50, 200, 60);
    gl.clearColor(0,1,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.scissor(60, 40, 70, 90);
    gl.clearColor(1,0,1,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    function wrapContext(gl) {
      const wrapper = {};
      for (let name in gl) {
        var prop = gl[name];
        if (typeof(prop) === 'function') {
          wrapper[name] = wrapFunction(gl, name, prop);
        } else {
          wrapProperty(wrapper, gl, name);
        }
      }
      return wrapper;
    }

    function wrapFunction(gl, name, origFn) {
      // return a function that logs the call and then calls the original func
      return function(...args) {
        log(`gl.${name}(${[...args].join(", ")});`);
        origFn.apply(gl, arguments);
      };
    }

    function wrapProperty(wrapper, gl, name) {
      // make a getter because these values are dynamic
      Object.defineProperty(wrapper, name, {
        enumerable: true,
        get: function() {
          return gl[name];
        },
      });
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join(" ");
      document.body.appendChild(elem);
    }


<!-- language: lang-css -->

    canvas { border: 1px solid black; }
    pre { margin: 0; }

<!-- language: lang-html -->

    <canvas></canvas>  

<!-- end snippet -->

In your case instead of logging the calls you'd add them to some array of calls only on the frames you want captured.

You then need to somehow keep track of all the resources (buffers, textures framebuffers, renderbuffers, shaders, programs) and all their parameters (like filtering settings on textures) and you also need to track uniform settings etc.

The [WebGL-Inspector](https://benvanik.github.io/WebGL-Inspector/) does this and can playback frames so it might be a good example. There's also this [webgl-capture](https://github.com/greggman/webgl-capture) library.

What you need to capture for your program is up to your program. For example if you know your buffers and textures never change and they're still in memory when you want to playback then maybe you don't need to try to capture the state of buffers and textures which both of the above examples have to do.
