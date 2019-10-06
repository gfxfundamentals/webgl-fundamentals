Title: WebGL Shared Resources Web Workers
Description:
TOC: qna

# Question:

I am just a beginner to WebGL - sorry, if this question is naive. I searched online, but could not find the latest support from a WebGL expert.

I would like to do share resources for WebGL using web workers - mainly texture upload and texture readback. What is the status of the support to do this? What workaround(s) do I have? 

# Answer

You can't share resources inside a Web Worker yet. You can pass `TypedArrays` into and out of WebWorkers though so it really depends on what you want to do. If you're decoding textures in JavaScript you can do the decoding in a worker, then pass a TypedArray with the data back to the main thread. [This can happen with zero copying](http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/). But the call to `gl.texImage2d` has to happen on the main thread currently.

As for reading back textures in a worker you're out of luck for now.
