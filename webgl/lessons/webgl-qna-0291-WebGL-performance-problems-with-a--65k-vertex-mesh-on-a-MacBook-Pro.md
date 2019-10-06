Title: WebGL performance problems with a >65k vertex mesh on a MacBook Pro
Description:
TOC: qna

# Question:

The following model has good performance on several low-end machines:

http://examples.x3dom.org/example/x3dom_sofaGirl.html

However on a MacBook Pro with Nvidia GT 650m the framerate is very low. I thought it was because the MacBook does not have the `OES_element_index_uint` extension, but the extension shows up if I do:

<!-- language: lang-js -->

    document.createElement("canvas").getContext("experimental-webgl").getSupportedExtensions();

Restructuring the mesh below 65K solves the problem. Is there any way to have good performance without restructuring?

I installed an application (gfxCardStatus), which disabled the GT 650m and forced using integrated graphics only.  Now, everything works fine.  Is this a driver bug?

I found another 3d scene that works faster on the dedicated GPU than on the integrated:

http://examples.x3dom.org/binaryGeo/oilrig_demo/index.html

I think this is because it consists of many small meshes.  Also when I run this scene I can hear the GPU fan spin up.  It did not with the sofaGirl scene.

# Answer

First off WebGL is not limited to 65k vertices per draw call. `gl.drawElements` has a 64k limit though there is an extensions that removes that limit. `gl.drawArrays` has no such limit though.

I don't know why it's slow but looking at a frame in the [WebGL Inspector](http://benvanik.github.io/WebGL-Inspector/) X3DOM is using `gl.drawArrays` 


![x3dom not limited to 65k][1]

I dug a little more. I tried using the [Web Tracing Framework](http://google.github.io/tracing-framework/) as well as Chrome's profiler. It showed a lot of time spent in `gl.readPixels`.

![profiler showing readpixels][2]

To see if that was the issue I opened the JavaScript console and replaced `gl.readPixels` with a no-op like this

In JavaScript Console:

    // find the canvas
    c = document.getElementsByTagName("canvas")[0]

    // get the webgl context for that canvas
    gl = c.getContext("webgl")

    // replace readPixels with a no-op
    gl.readPixels = function(x, y, w, h, f, t, b) { 
      var s = w * h * 4; 
      for (var ii = 0; ii < s; ++ii) {
        b[ii] = 0;
      }
    };

That removed `readPixels` from showing up in the profiler 

![enter image description here][3]

but the sample didn't run any faster.

Next I tried hacking `drawArrays` to draw less. 

In the JavaScript Console:

    // save off the original drawArrays so we can call it
    window.origDrawArrays = gl.drawArrays.bind(gl)

    // patch in our own that draws less
    gl.drawArrays = function(t, o, c) { window.origDrawArrays(t, o, 50000); }

What do you know, now it runs super fast. Hmm. Maybe it is a driver bug. It was being asked to draw 1070706 vertices but that hardly seems like a large number for an NVidia GT 650m

---

So, I don't know why but I felt like looking into this issue. I wrote a native app to display the same data. It runs at 60fps easily. I checked integrated graphics in WebGL like the OP said. Also 60fps easily. The NVidia 650GT is at around ~1fps.

I also checked Safari and Firefox. They run it slow too. The common thing there is ANGLE. They all use ANGLE to re-write shaders. Maybe there's an issue there since the same shader ran fine on my native test. Of course the Native test isn't doing the exact same things as WebGL but still, it's not just that it's drawing 1M polys.

So I filed a bug:
https://code.google.com/p/chromium/issues/detail?id=437150


  [1]: http://i.stack.imgur.com/Di7Wj.jpg
  [2]: http://i.stack.imgur.com/LDVXk.png
  [3]: http://i.stack.imgur.com/pJ43l.png
