Title: How to control the color between vertices
Description: How to control the color between vertices
TOC: How to control the color between vertices

## Question:

Is there a way to control color between vertices with shader?
Like in a classic tutorials with just a triangle being drawn on the screen - vertices have red, green and blue colors assigned accordingly. Values in between are interpolated.
Is there a way to control color of that middle ground, other than modifying geometry and adding more vertices inside?

## Answer:

The most common way to color a triangle is to [use a texture](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html). The second most common way would be to add vertices. As @derhass pointed out you could in theory create a fragment shader that some how colors the middle different. To do that though would require giving the fragment shader more data because a fragment shader has no idea which pixel of a triangle is being drawn. So you'll end up adding more data to your geometry to accomplish that even if you don't technically add more vertices.

Further, any solution you come up with will likely be fairly inflexible where as using a texture (the most common way to color something) gives you a ton of flexibiltity. For example you might make a fragment shader that lets you pick 1 new color in the middle of the triangle. 

{{{example url="../webgl-qna-how-to-control-the-color-between-vertices-example-1.html"}}}

Later you decide want 2 colors, one 1/3rd of the way from the first point down the line from the first point to the mid point of the other 2 points and another 2/3rd down that line. You'll need to write a completely new shader. If you'd used a texture you'd just change the texture.



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="">unknown</a>
    from
    <a data-href="https://stackoverflow.com/questions/60745502">here</a>
  </div>
</div>
