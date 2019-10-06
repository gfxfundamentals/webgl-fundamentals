Title: Can't get the needed attribute from fragment shader in WebGL
Description:
TOC: qna

# Question:

There is a famous function from WebGL API (and from OpenGL too) `getAttribLocation` http://msdn.microsoft.com/en-us/library/ie/dn302408(v=vs.85).aspx

In my project I'm trying to get the needed attribute by using this function, but getting the `-1` value.

It's ok, when there isn't such attribute in shader, but in my program there is:

![enter image description here][1]


See it? I've dump in console the existed members of shaders, and `vertexColor` exists.
I don't know how can I get `-1`, when the dump of shader from which I'm fetching attributes shows that such an attribute exists in memory.

If to fetch other attributes, all is normal, except this one (but it was declared in same way as others and I didn't delete something in memory):

![enter image description here][2]

As you can see for `vertexPosition` and `textureCoordinatesAttribute` it returns their location number of the attribute.

So what's wrong and why does it occur I can't explain. Please help with a piece of advice.

Can't provide a source code, because I'm developing large library, which is right now 3k+ lines of codes. I can only tell you that you may see how shaders are creating by the screenshots and the function, which is getting attributes is just iterating a collection of the input objects with attribute list, and for each attribute is calling `getAttribLocation` function from WebGL. Despite on this, the screenshots show the real dump, and you can see, that I'm telling the truth about existed attributes in shader. Also, you can see that fetching two of them gives a correct result and one fails. What's wrong I don't know. As for me and if to use logic it must not return the `-1` value. The attributes exists in memory and the calling syntax is correct, so this issue is rather mysterious for me right now.


  [1]: http://i.stack.imgur.com/9VZV1.png
  [2]: http://i.stack.imgur.com/oc9ZU.png

# Answer

If the attribute is not used the GLSL compiler is allowed to optimize it out. The WebGL API is designed so you can ignore that. Passing `-1` to any of the functions that take an attribute location basically become a no-op.

Similarly the GLSL compiler can optimize away unused uniforms. `gl.getUniformLocation` will return `null` for unknown uniforms and passing `null` to any of the functions that take uniform location are a no-op

It's a good thing it works this way because when debugging it's common to comment out parts of a shader. Because unknown attribute and uniform locations just become a no-op everything just keeps working, no errors.
