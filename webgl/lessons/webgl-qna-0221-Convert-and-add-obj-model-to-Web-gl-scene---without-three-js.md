Title: Convert and add obj model to Web gl scene - without three.js
Description:
TOC: qna

# Question:

I want someone to tell me the steps to follow to convert an .obj object to json object so I can add it to my web gl scene like this : [http://learningwebgl.com/blog/?p=1658][1] 

I ve tried everything. Python script, online converters etc. Every one has its flaws and I can't fix them.

I don't use the three.js lib.



  [1]: http://learningwebgl.com/blog/?p=1658

# Answer

Why can't you fix them?

There is no simple answer for how. [The format for .obj is documented here](http://www.martinreddy.net/gfx/3d/OBJ.spec). Read it, pull the data out you want in a format you design.

There's an infinite number of ways to convert it and an infinite number of ways to store the data. Maybe you'd like to read out the data and store the vertices in JavaScript arrays. Maybe you'd like to store them in binary which you download with XHR. Maybe you'd like to [apply lossy compression](https://code.google.com/p/webgl-loader/) to them so they download faster. Maybe you'd like to split the vertices when they reach some limit. Maybe you'd like to throw away texture coordinates because your app doesn't need them. Maybe you'd like to read higher order definitions and tessellate them into triangles. Maybe you'd like to read only some of the material parameters because you don't support all of them. Maybe you'd like to split the vertices by materials so you can more easily handle geometries with multiple materials. Maybe you'd like to reindex them so you can use `gl.drawElements` or maybe you'd like to flatten them so you can use `gl.drawArrays`.

The question you're asking is far too broad. 
