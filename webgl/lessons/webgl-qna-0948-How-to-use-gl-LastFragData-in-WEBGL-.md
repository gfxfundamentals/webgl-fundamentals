Title: How to use gl_LastFragData in WEBGL?
Description:
TOC: qna

# Question:

I'm currently working on a `THREE.JS` project. I need to customize a fragment_shader with programmable blending instead of using predefined blending. To do this, I want to use `gl_LastFragData` in my fragment_shader. But I got this error.[Error image][1]


  [1]: https://i.stack.imgur.com/hr5K1.png
How can I use gl_LastFragData in WEBGL or is there any other equivalent way?

# Answer

There is no `gl_LastFragData` in WebGL. WebGL is based on OpenGL ES 2.0, WebGL2 is based on OpenGL ES 3.0. Neither of those support `gl_LastFragData`

The traditional way of using a previous result is to pass it in as a texture when generating the next result

    someOperation1(A, B)            -> TempTexture1
    someOperation2(TempTexture1, C) -> TempTexture2
    someOperation3(TempTexture2, D) -> TempTexture1
    someOperation4(TempTexture1, E) -> TempTexture2
    someOperation5(TempTexture2, F) -> resultTexture/fb/canvas/window
    
[Example](https://webglfundamentals.org/webgl/lessons/webgl-image-processing-continued.html)
