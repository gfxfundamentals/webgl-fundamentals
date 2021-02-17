Title: How to make a smudge brush tool
Description: How to make a smudge brush tool
TOC: How to make a smudge brush tool

## Question:

I need idea how i can make brush who can color smudge. 

Example in picture: right side painting with basic brush with two different colors in left also painting but additional use smudge tool, **the result should be something like left side**

![enter image description here][1]

I need advice how i can try to do it

  [1]: http://i.stack.imgur.com/oyaBs.png

## Answer:

Here is one attempt

1. On mousedown grab a copy of the area under the mouse into a separate canvas

2. On mousemove draw that copy one pixel at a time from the previous mouse position to the current mouse position at 50% alpha, grabbing a new copy after each move.

In pseudo code

```
on mouse down
   grab copy of canvas at mouse position
   prevMousePos = currentMousePos

on mouse move
  for (pos = prevMousePos to currentMousePos step 1 pixel) 
    draw copy at pos with 50% alpha
    grab new copy of canvas at pos
  prevMousePos = currentMousePos
```

The brush is feathered by drawing a rgba(0,0,0,0) to rgba(0,0,0,1) radial gradient over it using `globalCompositeOperation = 'destination-out'`.  


{{{example url="../webgl-qna-how-to-make-a-smudge-brush-tool-example-1.html"}}}




<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/4270436">Your choice</a>
    from
    <a data-href="https://stackoverflow.com/questions/28197378">here</a>
  </div>
</div>
