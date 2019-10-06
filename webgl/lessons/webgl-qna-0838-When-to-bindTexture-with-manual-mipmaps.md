Title: When to bindTexture with manual mipmaps
Description:
TOC: qna

# Question:

When setting mipmap levels for a texture manually, which is the correct strategy for where to loop on each level? 

_note: I'm assuming `gl.createTexture()` definitely falls outside the loop_

**OPTION A**

1. gl.bindTexture(bindTarget, texture);
2. gl.texParameteri();
3. For each mipmap level: 
  * gl.texImage2D();

**OPTION B**

1. gl.bindTexture(bindTarget, texture);
2. For each mipmap level:
  * gl.texParameteri();
  * gl.texImage2D();

**OPTION C**

1. For each mipmap level:
  * gl.bindTexture(bindTarget, texture);
  * gl.texParameteri();
  * gl.texImage2D();

# Answer

texture parameters are for the entire texture not per mip level so option a.

It kind of seems like you could derive that given that those parameters help choose whether or not mips are used at all.
