Title: Can glsl shaders be compiled to Webassemly/wasm with Unity?
Description:
TOC: qna

# Question:

I am new to Unity and therefore I have a question, which might be obvious. When exporting a project which uses webgl as WASM are the shaders also compiled in web assembly or just the project code? How could I check this? I have read this https://blogs.unity3d.com/2018/08/15/webassembly-is-here/ but it doesn’t mention specifically if the glsl shaders can be compiled as well. I appreciate any help/ guidance you can give me! 

# Answer

Shaders are not compiled into WebAssembly. Shaders are written in Cg / HLSL and when you export Unity translates the shaders into GLSL and embeds the GLSL in the game. At runtime the game then uploads those GLSL shaders to WebGL.
