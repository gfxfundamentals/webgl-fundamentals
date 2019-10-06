Title: Webgl and dart changing data in vertex buffer every frame
Description:
TOC: qna

# Question:

I have a very simple 'hello world' webgl app (the infamous triangle) and I decided I wanted to change the color of each vertices each frame to have a cool color show so I have this in my render method

<!-- language-all: lang-dart -->

    if (tick % 5 == 0) {
  data[3] = rand.nextDouble();
  data[4] = rand.nextDouble();
  data[5] = rand.nextDouble();

  data[3 + 6] = rand.nextDouble();
  data[4 + 6] = rand.nextDouble();
  data[5 + 6] = rand.nextDouble();

  data[3 + 12] = rand.nextDouble();
  data[4 + 12] = rand.nextDouble();
  data[5 + 12] = rand.nextDouble();
 }

where data is a Float32List containing 6 floats for 3 vertices. 

I currently do this after the code of block above

    gl.bindBuffer(GL.ARRAY_BUFFER, vertexBuffer);
    gl.bufferDataTyped(GL.ARRAY_BUFFER, data, GL.DYNAMIC_DRAW);

which does the job but somehow I have a feeling that this is not the proper answer to my problem and might have performance repercussions.

# Answer

there's nothing wrong with updating your vertices every frame if that's that you need to do for your app. For example these examples updates all vertices every frame

https://www.khronos.org/registry/webgl/sdk/demos/google/nvidia-vertex-buffer-object/index.html

http://webglsamples.googlecode.com/hg/google-io/2011/10000-objects-optimized.html

As for sprites as you mentioned in your comments, there are various ways to achieve sprites.

The most common way is *probably* to make a unit square quad with unit texture coordinates then use a 3x3 or 4x4 matrix adjust the vertices to render the size, place, and orientation you want and to use either another matrix or and offset and multiplier for the texture coordinates so you can translate and scale them to choose a particular sprite from a texture atlas.

I suspect though that a technique similar to the second sample above, updating vertices, will end up drawing more sprites than drawing one sprite at at time with a matrix for orientation and extra for texture coordinates.

For example, [here is a sample that draws one sprite per draw call](http://webglsamples.googlecode.com/hg/lots-o-images/lots-o-images-draw-elements.html). On my machine I get around 8000 sprites at 50fps

[here is a sample that updates vertices every frame](http://webglsamples.googlecode.com/hg/lots-o-images/lots-o-images-draw-elements.html) so it uses less draw calls. I get 72000 sprites at 50fps. That's nearly 9x the speed even though it's updating 72000x4 or 280000 vertices every frame.

Of course these samples are not doing the full work of a real sprite engine since they are always drawing the same sprite. If you used a texture atlas (so you needed up update texture coords) and you supported drawing sprites at different sizes, scales and orientations (so you needed to do vertex * matrix calculations in JavaScript) the timing might come out significantly different.

If I were you I'd start with the simplest method and abstract your usage so you can replace it later with something more optimized if you need it. 

