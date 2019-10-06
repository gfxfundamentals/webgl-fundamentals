Title: WebGL: How do you changing the Zoom direction after selecting an object in a scene?
Description:
TOC: qna

# Question:

Using WebGL, I'm displaying a 3D scene containing several objects.  The camera/eye is aimed at the center of the scene and using the mouse wheel I can zoom in and out.  What I'm trying to do is to select any object in the 3D scene and then using the mouse wheel zoom in on the selected object.  I'm new to WebGL and I'm struggling trying to figure out how to get this to work.  I'm able to unproject the coordinates of the selected object to the 3D coordinates.  Here's where I'm getting confused.  Is the selected objects 3D coordinates to new target (lookAt) value?  Do I need to update the camera/eye coordinates before zooming in?  Guidance would be really appreciated.

# Answer

[This answer has a sample that zooms from object to object](https://stackoverflow.com/questions/29353242/webgl-zooming-to-and-stopping-at-object-in-a-scene-in-webgl/29362951#29362951). If your selection code is already working then only difference is you tell it which object to zoom to rather than it just going to the next one in order.

In general, `lookAt` functions just need the world space coordinate you want whatever to "look at". Zooming is up to you to put the camera further or closer to the object it's looking at.  The easiest way to do that is just to lerp along vector from the camera's current position to where you want it. The sample linked above does that.

Note that depending on your lookAt function it may generate a camera matrix (a matrix that puts the camera/object in world space pointing at its target), or a view matrix (a matrix that moves everything else in the world in front of it).  

I find a library generates a camera matrix more useful because all kind of things (character's heads, turrets, security cameras, etc) can use the same function to point at whatever they are tracking. A library that generates a view matrix is only useful for making view matrices.

One is the inverse of the other though so you can just take the inverse of the matrix if you need the other though.

