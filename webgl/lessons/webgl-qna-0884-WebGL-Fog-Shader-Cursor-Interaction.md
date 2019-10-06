Title: WebGL Fog Shader Cursor Interaction
Description:
TOC: qna

# Question:

First of all I want to apologize, but I'm a complete newbie in learning GLSL and shaders. There is no single place where you can learn all about shading language, so I've researched a lot and inspected examples/experiments that people create trying to learn and understand as much as I can.

I've found one [Fog shader][1] (experiment, the github source code can be found [here][2]) online and looks really cool and what I'm trying to understand for example how can I implement mouse inside this shader, so when I move the mouse over the screen it pushes/moves/disperses the fog around the cursor, then after a second or 2 it comes back. I really don't need someone to create me a full code. I just need some directions, explanations etc...

Do I implement this stuff into vertex shader or fragment shader, becouse as far as I understand (please correct me if I'm wrong) fragment shader just decide the color of each "pixel/fragment", while vertex shader seems the place which define positions and such?

So in basic I would like to know how to implement interactions like mouse (I know how to send mouse as uniforms x-y to shader, and normalize (convert to 0/1) so that part is not a problem at all.


  [1]: https://ykob.github.io/sketch-threejs/sketch/fog.html
  [2]: https://github.com/ykob/sketch-threejs/tree/master/src/glsl/sketch/fog

# Answer

it's really hard to give generic advice. for 99% of apps mouse interaction happens outside GLSL. put to in three.js terms the mouse input would only manipulate various scene nodes positions and rotations and maybe material settings. that is literally 99% of all 3d apps native or web. For fun people sometimes put some mouse input directly into the shader. then it's up to you. for the fog compute the distance from the mouse position to the vertex in the vertex shader. the closer it is push the positions back or forward or away from th mouse. or in fragment shader use distance to darken.

the problem is you asked for the fog to only come back after a second or two. That is much more work and again something much more likely to be done outside the shader in most apps.

if.you really want to do it in the shader you'd probably use a texture that you draw circles into corresponding to the mouse position. every frame you'd blur that texture so it slowely fades to black. your vertex shader would look into that texture where each vertex would find it's corresponding displacement. 

in other words you now need at least 3 shaders. one to draw a circle. it doesn't have to be a circle shader can just be a generic shader that draws triangles that you happen to pass the data for a circle to. You need the shader that fades / blurs the draw history. and you need the fog shader.

there's probably 20 more ways to accomplish this.

a related q&a

https://stackoverflow.com/questions/42049942/creating-a-smudge-liquify-effect-on-mouse-move-that-continuously-animates-back-t


personally I feel like the ones that try to do as much as possible in the shader are more about challenging yourself with limits rather than pragmatic. That can be great fun and good for learning but it is rarely "best practice"

