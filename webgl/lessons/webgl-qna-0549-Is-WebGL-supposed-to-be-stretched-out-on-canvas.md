Title: Is WebGL supposed to be stretched out on canvas
Description:
TOC: qna

# Question:

I'm learning webgl. I'm fallowing a [tutorial][1] on youtube. My issue is the traingle I'm rendering to the canvas is streched out. [![][2]][2]

on a wider canvas.

[![enter image description here][3]][3]

on a more square canvas. (These are the same triangles.) Is that supposed to happen and how can I fix it.



  [1]: https://www.youtube.com/watch?v=3yLL9ADo-ko
  [2]: http://i.stack.imgur.com/TeRT0.png
  [3]: http://i.stack.imgur.com/h8S4x.png

# Answer

Yes, WebGL coordinates always go from -1 to +1 across the canvas (or across the viewport). Any other coordinate system is something you provide with the math/data/shaders you provide. In other words, if you don't update your math based on the size of the canvas things will stretch.
