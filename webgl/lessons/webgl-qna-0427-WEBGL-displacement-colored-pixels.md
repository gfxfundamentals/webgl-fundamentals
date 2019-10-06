Title: WEBGL displacement colored pixels
Description:
TOC: qna

# Question:

I am new to the WebGL and shaders world, and I was wondering what the best way to make the effect below.

*Work in progress*

[![Work in progress][1]][1]

*Desired effect*

[![enter image description here][2]][2]

I used THREE.TextGeometry to draw the text. In ShaderMaterial text I created a simple light. And I'm moving vertices with a simple noise , to give a cloth effect.

What I need now is basically move the colored pixels. Could someone give me a direction? Thanks!


  [1]: http://i.stack.imgur.com/SZMGh.jpg
  [2]: http://i.stack.imgur.com/7NQxW.jpg

# Answer

It's not really clear what effect you're trying to achieve. I looks like you're trying to achieve a post processing effect that makes it look like you're looking through glass with surface imperfections.

In that case you'd probably use a post processing effect. You'd use a normal map to represent which way the glass is pointing at each pixel and then use that in a post processing shader to look at the rendered text geometry based on which way the normal *bends* the direction the bump in the glass points at.

There's a non-three.js [example here](http://tympanus.net/codrops/2015/11/04/rain-water-effect-experiments/).


