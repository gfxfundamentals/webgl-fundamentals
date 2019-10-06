Title: Is reusing a WebGLProgram a good idea?
Description:
TOC: qna

# Question:

Instead of creating new ```WebGlProgram```'s using ```gl.createProgram()``` is it a good idea to keep reusing one?

I am listing the steps that I should be doing if I am to reuse one:

1. AttachShader(s): in my case I need to attach a new Fragment shader only. (Question: Can I hang on to a compiled shader?)
2. linkProgram
3. useProgram
4. getAttribLocation
5. getUniformLocation


# Answer

What are you trying to do? 99.9% of all GPU apps make shader programs and are done. They might make 1, they might make 5000, but they aren't ever in a position where they would even need to consider your question. So what are you really trying to do? 

Those few apps that do allow you to edit shaders (shadertoy, glslsandbox, vertexshaderart, ...) either make new ones and delete old or reuse. There's no benefit to one or the other it's just a matter of style.

Yes you can hold on to shaders. You can use shaders with multiple programs. It's common to do so.

If you change a shader it won't affect a program unless/until you relink that program with `gl.linkProgram`. Anytime you call `gl.linkProgram` and it's successful all your previous uniform locations for that program are obsolete and you have to query new ones.  
