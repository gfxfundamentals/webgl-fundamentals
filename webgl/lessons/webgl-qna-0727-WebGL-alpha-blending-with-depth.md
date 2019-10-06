Title: WebGL alpha blending with depth
Description:
TOC: qna

# Question:

How to correctly blend two half opaqued faces in WebGL, as shown in the diagram?


[![Diagram of intersecting faces][1]][1]

  [1]: https://i.stack.imgur.com/TIn7h.png

# Answer

The *normal* way to do this is you have to split those 2 faces into 4 faces, sort them by depth and draw them furthest to nearest.

There's another technique, [depth peeling](http://developer.download.nvidia.com/SDK/10/opengl/src/dual_depth_peeling/doc/DualDepthPeeling.pdf) but it's also fairly complicated.

There's also [order independent transparency](http://casual-effects.blogspot.jp/2015/03/implemented-weighted-blended-order.html).



Both of these last techniques are probably better suited for WebGL2
