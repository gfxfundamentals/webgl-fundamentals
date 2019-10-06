Title: Why is GPU render time inconsistent?
Description:
TOC: qna

# Question:

I'm building a WebGL application using THREE and am noticing some odd timing on the GPU. I don't have repro code available at the moment but I thought I'd ask the question in case it's a known browser quirk or something common and fixable.

### Scene Setup

- Scene with ~2,000,000 polygons, 136 Meshes, and 568 Object3D instances.
- Using THREE.Composer with the FXAA and Unreal Bloom passes.
- Using THREE.OrbitControls.
- The scene is only rendered when something is known to have changed. For example, a draw is scheduled when the user drags the scene to move the camera with the controls or something in the scene moves. The scene is often static so we try not to render unnecessarily in those cases.

### The Problem

The issue happens when the scene has been static (not drawn for a bit) and then the user changes the camera position by dragging. Once the user starts dragging the framerate is very choppy -- maybe 10-20 fps or lower -- for several frames before smoothing back out to something closer to 60. This happens consistently when leaving the scene alone for several seconds and then dragging again. If the mouse is dragged consistently after the initial stutter then the framerate stays smooth. Nothing different is being rendered for these frames.

This stuttering doesn't happen and the scene remains snappy if it's rendered every frame using `requestAnimationFrame`.

Here's the performance profiler with the stutter when the scene is only being rendered when something changes. You can see that there is a lot more time spent on the GPU during the frames that stutter before smoothing out again:

[![enter image description here][1]][1]

And the profiler when the scene is rendered at 60 fps:

[![enter image description here][2]][2]

Any thoughts? Why is there so much more GPU work happening suddenly on drag? Could the draw be blocked by some other rendering process? Why would it happen so consistently after not rendering for a few seconds? I've profiled using the latest version of Chrome but the stutter is present in Firefox, as well.

Thank you!


  [1]: https://i.stack.imgur.com/tMLK3.png
  [2]: https://i.stack.imgur.com/1KyEx.png

# Answer

without a live sample there is no easy way to know BUT....

#1 Three.js can do frustum culling on objects. 

That means if some objects are off outside of the view they won't get drawn. So, put the camera in such a way that all objects are visible will run slower than if only some objects are visible

#2 Primitive Clipping 

Same as above except at the GPU level. The GPU clips primitives (it doesn't draw or compute pixels outside the view) so similar to above, if the lots of the things you're trying to draw happen to be outside the view it will run faster than if everything is inside the view.

#3 Depth(Z) Buffer rejection

Similar to above again, if your objects are opaque then if a pixel is is behind an existing pixel via the depth test the GPU will skip calling the pixel shader if it can. This means if you draw 568 things and the first one you draw is the closest thing to the camera and covers up many things behind it than it will run faster than if all those things behind it draw drawn first. Three.js has the option to sort before drawing. Usually sorting is turned on for transparency since transparent objects need to be drawn back to front. For opaque objects though drawing front to back will be faster if any front objects occlude objects further back.

#4 Drawing too many frames?

Another question is how are you queuing your draws? ideally you only queue a single draw and until the drawing has happened don't queue any more.

So

    // bad
    someElement.addEventListener('mousemove', render);

The code above will try to render for every mouse move even if that's > 60 fps

    // bad
    someElement.addEventListener('mousemove', () => {
      requestAnimationFrame(render);
    });

The code above may queue up lots and lots of requestAnimationFrames all of which will get executed on the next frame, drawing your scene multiple times per frame

    // good?
    let frameQueued = false;

    function requestFrame() {
      if (!frameQueued) {
        frameQueued = true;
        requestAnimationFrame(render);
      }
    }

    function render(time) {
      frameQueued = false;
      ...
    }      
    

    someElement.addEventListener('mousemove', () => {
      requestFrame();
    });

Or something along those lines so that at most you only queue on render and don't queue any more until that render has completed. The code above is just one example of a way to structure your code so that you don't draw more frames than you need to.

 
