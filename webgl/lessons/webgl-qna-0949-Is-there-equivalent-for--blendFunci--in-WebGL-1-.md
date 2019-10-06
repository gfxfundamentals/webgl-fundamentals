Title: Is there equivalent for `blendFunci` in WebGL 1?
Description:
TOC: qna

# Question:

I'm working on WebGL 1 project. I need to use `gl_FragData[0]` and `gl_FragData[1]` in customized fragment shader. How can I set blendFunction for `gl_FragData[1]`. I think OpenGL uses `glBlendFunci`. for ex, `glBlendFunc(1, gl.ONE, gl.ONE)`. How can I do this in WebGL?  

# Answer

There is no `glBlendFunci` equivalent in WebGL1. To do custom blending the normal solution is to take 2 textures in, blend them in a shader, and output to a new texture

     uniform sampler2D t1;
     uniform sampler2D t2;

     void main() {
       gl_FragColor = someOperation(t1, t2);
     }

To do more than one would just be the same thing repeated as in

     uniform sampler2D t1;
     uniform sampler2D t2;
     uniform sampler2D t3;
     uniform sampler2D t4;

     void main() {
       gl_FragData[0] = someOperation(t1, t2);
       gl_FragData[1] = someOperation(t3, t4);
     }


