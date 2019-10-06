Title: WebGL Clip Space
Description:
TOC: qna

# Question:

My question is in regards to the WebGL clip space volume.

From what I understand, the WebGL clip space volume is -1 to +1 for x,y,z and centered on the origin. Further, the camera is also at origin looking down the -z axis.

Does that mean half of the scene I'm rendering I cannot see?

# Answer

What does 

> Does that mean half of the scene I'm rendering I cannot see?

mean? 

[Your job as a programmer using WebGL is to write code, both JavaScript and GLSL shaders to take your scene and coerce the relevant parts into WebGL's clip space](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html).

So for example if you use [fairly typical 3D matrix math and use a fairly typical projection matrix](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html) then the area (frustum) defined by your projection matrix is the space that will appear on the WebGL canvas. The matrix math performed by the projection matrix effectively converts the space defined by the frustum  into clip space.

If your scene fits in that space you'll see it. If it's not in that space you won't. You can change the parameters to make the space bigger or smaller or whatever you want. If half of your scene is to the left of that space you'll only see half the scene. If all of your scene is to the right of that space you'll see none of your scene. If 2/3rds of your scene is above that space you'll see only 1/3rd of your scene.

Typically you'd also use [math to implement a camera](https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html) so you can more easily decide which part of your scene end up inside clip space.

For reference

> #frustum
> noun, GEOMETRY
> noun: frustum; plural noun: frusta; plural noun: frustums
>
> the portion of a cone or pyramid which remains after its upper part has  been cut off by a plane parallel to its base, or which is intercepted between two such planes.
