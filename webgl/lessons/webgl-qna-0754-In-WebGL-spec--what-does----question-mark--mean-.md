Title: In WebGL spec, what does ? (question mark) mean?
Description:
TOC: qna

# Question:

In the WebGL spec, what does `?` (question mark) mean? 

For example: `WebGLBuffer? createBuffer();`

# Answer

As @pleup pointed out it means the value can be `null`.  `createBuffer`, `createShader`, `createProgram`, `createTexture`, `createRenderbuffer`, `createFramebuffer` will all return `null` if the context is lost.

This is why you might not want to properties on WebGL objects.

     var tex = gl.createTexture();
     tex.width = 320;   // BAD!!

If the context is lost that code will fail.

