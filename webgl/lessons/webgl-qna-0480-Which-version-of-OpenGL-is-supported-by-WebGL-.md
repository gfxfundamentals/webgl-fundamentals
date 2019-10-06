Title: Which version of OpenGL is supported by WebGL?
Description:
TOC: qna

# Question:

I am in the process of reading WebGL and going through some tutorials .
But I think I had to learn OpenGL explicitly in order to work with WebGL more efficiently.

But there are many versions of OpenGL and this [wiki link](https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences) shows that WebGL uses OpenGL 2.0 but the latest version of OpenGL is 4.5 .

Can anybody suggest how to know which version of OpenGL is supported through some script in WebGL ,if possible.



# Answer

WebGL is not based on OpenGL. It is based on OpenGL **ES** 2.0. The same OpenGL ES found on Android and iOS.

There's significant differences between OpenGL and OpenGL ES. While OpenGL ES is a subset of OpenGL it is missing the old deprecated fixed function pipeline that so many people continue to use and so many outdated tutorials (like Nehe GL, still teach)

What's the fixed function pipeline? Anything having to do with `glVertex`, `glColor`, `glNormal`, `glLight`, `glPushMatrix`, `glPopMatrix`, `glMatrixMode`, etc... in GLSL using any of the variables that access the fixed function data like `gl_Vertex`, `gl_Normal`, `gl_Color`, `gl_MultiTexCoord`, `gl_FogCoord`, `gl_ModelViewMatrix` and the various other matrices from the fixed function pipeline.

Those are all removed from OpenGL ES 2.0 and therefore don't exist in WebGL
