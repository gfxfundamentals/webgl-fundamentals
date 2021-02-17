Title: Pure WebGL Dashed Line
Description: Pure WebGL Dashed Line
TOC: Pure WebGL Dashed Line

## Question:

I'm trying to create a dashed line using pure webgl.  I know there is already a question on this, and maybe I'm dumb, but I cannot figure out how to make it work.  I understand the concept, but I do not know how to get the distance along the path in the shader.  A previous answer had the following line:

    varying float LengthSoFar; // <-- passed in from the vertex shader

So how would I get `LengthSoFar`?  How can I calculate it in the vertex shader?

Am I totally missing something?  Can someone give me a working example?  Or at least some good leads?  I've been banging my head against the wall on this for days.

## Answer:

I'm assuming it works like this. You have a buffer of positions. You make a corresponding buffer of `lengthSoFar` so,

    function distance(array, ndx1, ndx2) 
    {
      ndx1 *= 3;
      ndx2 *= 3;

      var dx = array[ndx1 + 0] - array[ndx2 + 0];
      var dy = array[ndx1 + 1] - array[ndx2 + 1];
      var dz = array[ndx1 + 2] - array[ndx2 + 2];

      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    var positions = 
    [
      0.123, 0.010, 0.233,
      0.423, 0.312, 0.344,
      0.933, 1.332, 0.101,
    ];

    var lengthSoFar = [0];  // the length so far starts at 0
    for (var ii = 1; ii < positions.length / 3; ++ii) 
    {
      lengthSoFar.push(lengthSoFar[ii - 1] + distance(positions, ii - 1, ii));
    }

Now you can make buffers for both `positions` and `lengthSoFar` and pass `lengthSoFar` as an attribute into your vertex shader and from there pass it as a varying to to your fragment shader.

Unfortunately it won't work with indexed geometry (the most common type?). In other words it won't work with `gl.drawElements`, only with `gl.drawArrays`. Also the dashed line would be dashed in 3D not 2D so a line going into the screen (away from the viewer) would look different than a line going across the screen. Of course if you're drawing 2D then there's no problem. 

If those limitations are good for you does this answer you question?

{{{example url="../webgl-qna-pure-webgl-dashed-line-example-1.html"}}}

Note: [Here's an article that might help explain how varyings work][2]

Also note you can't change the thickness of the lines. To do that you need to [draw lines from triangles](https://mattdesl.svbtle.com/drawing-lines-is-hard)

  [1]: http://jsfiddle.net/greggman/7dQu9/
  [2]: http://games.greggman.com/game/webgl-how-it-works/

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://i.robbiew.xyz/resume">Robbie Wxyz</a>
    from
    <a data-href="https://stackoverflow.com/questions/19341590">here</a>
  </div>
</div>
