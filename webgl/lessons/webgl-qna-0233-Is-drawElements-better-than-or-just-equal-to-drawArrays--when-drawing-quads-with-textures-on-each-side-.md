Title: Is drawElements better than or just equal to drawArrays, when drawing quads with textures on each side?
Description:
TOC: qna

# Question:

I want to draw many quads, with a texture on each side. If i use drawElements and only use 8 vertices my texture coordinates are messed up and i do understand why. To fix this i have to specify 24 vertices. But now drawElements no longer has any benefits over drawArrays, or does it?

drawArrays: 36 vertices * 3 values = 108 values

drawElements: 24 vertices * 3 values + 36 indices = 108 values aswell

Obviously, if i didn't care about texture coordinates or normals, it would be:

drawElements: 8 vertices * 3 values + 36 indices = 60 values

But i don't get that performance boost for a  quad. If the faces of my object weren't rectangles but something like flat stars, that share more vertices drawElements would be worth it again.

Am i missing something or can i just stick to drawArrays?

This question is similar to:
https://stackoverflow.com/questions/21988072/webgl-texture-coordinates-and-obj


# Answer

For a quad with unique normals on each side you're not going to see any benefit to using `gl.drawElements`. In fact it's likely slightly slower since you have to bind the indices and since there's a level of indirection that not there in the `gl.drawArrays` case.

Most 3D is arguably not just cubes with simple faces. Spheres, organic things like people, plants, animals, stuff like terrain (hills), even geometric things like columns (cylinders,) usually share many vertices. In those cases it makes sense to use `gl.drawElements` both because it's less data and because it's probably faster. 

If you want optimal speed you should [arrange the vertices so they are cache friendly](http://home.comcast.net/~tom_forsyth/papers/fast_vert_cache_opt.html).

