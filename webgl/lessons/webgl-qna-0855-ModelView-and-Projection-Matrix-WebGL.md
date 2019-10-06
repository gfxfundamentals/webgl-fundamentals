Title: ModelView and Projection Matrix WebGL
Description:
TOC: qna

# Question:

I'm a bit confused about the differences between these matrices. I don't know if I understood how them work. 

The ModelView matrix is the combination of the Model and the View Matrix where the View matrix is the one that specifies features like location and orientation of my camera while the Model matrix is the one that specifies the position's frame of the primitives that I'm going to draw.

The projection matrix specifies other features of the camera like clip space , projection method and field of view.

Is that right ?
Thanks

# Answer

It's a little confusing. The View Matrix moves the entire world to be relative the the camera. A Camera matrix (the inverse of the view matrix) puts the camera in the world. 

There are multiple ways to make a view matrix. While it's common to use a "lookAt" function that directly generates a view matrix. It's actually more common to put your camera in the world just like any other object. You'd have a scene hierarchy and put everything in the world, rocks, trees, houses, cars, people, camera. You then compute the world matrix for the camera which is the "camera matrix" you then take the inverse of that and you get a "view matrix". This is how pretty much all 3d engines work, Unity, Unreal, Maya, 3DSMax, etc.

The projection matrix decides things like field of view (a wide angle lens or a telephoto lens). It also helps define the aspect so that you can render to a rectangular area and it helps defined what distances in front of the camera are visible.

[Here's an article on projection matrices](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html). [Here's another on camera and view matrices](https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html)
