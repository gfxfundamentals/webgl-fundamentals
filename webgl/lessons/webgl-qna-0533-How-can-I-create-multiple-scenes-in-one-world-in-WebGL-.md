Title: How can I create multiple scenes in one world in WebGL?
Description:
TOC: qna

# Question:

I want to create 5 scenes such that camera is animated and moves automatically in the scene. I want the camera to be animated for 20 seconds in each scene, and after the 20 seconds to move to the other scene, so that it all finishes in 100 seconds. I want all the scenes to be part of a one world. So, basically I want to create something as a movie. How can I achieve this in WebGL? I couldn't find any similar code segments or tutorials online. Please note that I need a solution based purely on WebGL, not any other library like three.js for example.

# Answer

It sounds like you're basically asking for something like this

https://stackoverflow.com/questions/29353242/webgl-zooming-to-and-stopping-at-object-in-a-scene-in-webgl

In your case you put a bunch of objects at different places in the world. You decide on 5 camera locations. You lerp/tween between the locations. 

For example imagine each of these letters are groups of objects in the world. `C1` through `C5` are cameras that aimed such that they only see the 3 objects in from of them

    D E F       G H I      J K L      M N O      P Q R

     \  /       \  /       \  /       \  /       \  /
      C1         C2         C3         C4         C5

You just need to lerp between cameras C1->C2, C2->C3, C3->C4 etc. The simplest way is to use the fairly standard `lookAt` function that most 3D math libraries have. `lookAt` takes 3 arguments. `eye`, `target`, `up`. So for each camera you need need a target, eye, up value. Lerp/tween those 3 values between 2 cameras then feed them into `lookAt` to get your moving camera.

The only difference between your needs and the example linked above is the example above is computing camera locations on the fly. In your case you'd hardcode your camera locations.
