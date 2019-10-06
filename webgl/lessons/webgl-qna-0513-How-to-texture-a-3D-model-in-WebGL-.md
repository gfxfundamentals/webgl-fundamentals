Title: How to texture a 3D model in WebGL?
Description:
TOC: qna

# Question:

How do you texture a 3D model in WebGL? I understand all the basics of 3D in WebGL, I understand how to load textures and I understand how to load 3D models from external files, but I have no clue how to texture a model that is more complex than a basic cube.

I assume that the same principles apply in WebGL as in OpenGL or any other 3D rendering language, but I can't find any good information out there for WebGL, OpenGL, etc.  
Any guidance/links/explanations would be greatly appreciated. Thank you.

# Answer

So just FYI, *skinning* has a specific meaning in 3D graphics. It has to do with making a mesh follow a set of bones and bend between the bones. I edited your question once I saw your comment that you're really asking about texturing.

You want to know how to texture a complex model. The simple answer is you use a 3D modeling package like [Maya](http://www.autodesk.com/products/maya/overview) or [Blender](https://www.blender.org/) for pretty much anything more complex than a simple cube or sphere. You then need to write (or find) tools to convert the data from the modeling package into something useful for your program.

A few links. Warning: For a complex model it's a complex process

https://blender.stackexchange.com/questions/1022/adding-uv-mapping-to-mesh

https://www.youtube.com/watch?v=f2-FfB9kRmE

http://www.chocofur.com/5-uv-mapping.html

http://sophiehoulden.com/tutorials/blender/unwrapTut.html



There are programmatic ways to apply textures like using various kinds of texture projections. [See this answer](https://stackoverflow.com/a/34960116/128511) for a few of them

Almost none of them are very useful except for a few basic things. For example spherical mapping is useful for texture mapping a sphere. But there's really no reason to use a separate spherical mapping calculation for a sphere as you can compute the sphere's texture coordinates as you compute the sphere vertices themselves.

