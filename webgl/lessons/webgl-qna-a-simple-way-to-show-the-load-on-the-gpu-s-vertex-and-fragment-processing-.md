Title: A simple way to show the load on the GPU's vertex and fragment processing?
Description: A simple way to show the load on the GPU's vertex and fragment processing?
TOC: A simple way to show the load on the GPU's vertex and fragment processing?

## Question:

I would like to be able to tell if I am CPU bound vs GPU vertex bound or GPU fragment bound.  I was hoping I could find a profiler that provides this information but I can't seem to find anything.  Does anyone know of a profiler that can do this?

## Answer:

Even without a profiler you can tell some of this very easily. Shrink your canvas (or FBO you're rendering into) to 1x1 pixels. If your app speeds up tremendously you were probably GPU fragment bound. If it barely speeds up you were probably CPU or GPU Vertex bound.

As for CPU, vs GPU Vertex Bound change the count in your calls to drawArrays and drawElements to 0. If it still runs slow you were CPU bound. If it runs fast you were GPU Vertex bound.

Otherwise, On Chrome I think if you pass in '--in-process-gpu' I believe you can run PIX on Windows and or the OpenGL Profiler on OSX and profile the entire browser though I haven't done it in a while.

 

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/256062">Xavier</a>
    from
    <a data-href="https://stackoverflow.com/questions/11702239">here</a>
  </div>
</div>
