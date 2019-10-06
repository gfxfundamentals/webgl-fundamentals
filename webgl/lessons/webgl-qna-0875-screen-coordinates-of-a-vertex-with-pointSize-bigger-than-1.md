Title: screen coordinates of a vertex with pointSize bigger than 1
Description:
TOC: qna

# Question:

assuming the canvas size is (wx,wy), the exact coordinates of the vertex lower and left is (-1 + 1/wx , -1 + 1/wy).
But when the pointSize is bigger than 1, i dont managed to find a formula.

in this fiddle, https://jsfiddle.net/3u26rpf0/14/   i draw some pixels of size=1 with the following formula for gl_Position :
  
    float p1 = -1.0 + (2.0 * a_position.x + 1.0) / wx ;  
    float p2 = -1.0 + (2.0 * a_position.y + 1.0) / wy ;
    gl_Position=vec4(p1,p2,0.0,1.0);

a_position.x goes from 0 to wx-1 .  
a_position.y goes from 0 to wy-1 . 

but if you change the value of size in the vertex (see fiddle link)
my formula doesn't work, there is some offset to put.



# Answer

From the [OpenGL ES 2.0 spec section 3.3](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf)

>  Point rasterization produces a fragment for each framebuffer pixel whose center
lies inside a square centered at the point’s (xw, yw), with side length equal to
the point size


