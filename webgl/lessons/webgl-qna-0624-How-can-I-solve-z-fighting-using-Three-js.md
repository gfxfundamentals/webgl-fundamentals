Title: How can I solve z-fighting using Three.js
Description:
TOC: qna

# Question:

I'm learing three.js and I faced a z-fighting problem.


[![z-fighting][1]][1]


There are two plane object, one is blue and the other is pink.
And I set the positions using the flowing codes:

    plane1.position.set(0,0,0.0001);
    plane2.position.set(0,0,0);

**Is there any solution in three.js to fix all the z-fighting problem in a big scene?**

I ask this problem because I'm working on render a BIM(Building Information Model, which is .ifc format) on the web.
And the model itself have so much faces which are so closed to each other. And it cause so much z-fighting problems as you can see:

[![z-fighting-2][2]][2]

**Is three.js provide this kind of method to solve this problem so that I can handle this z-fighting problem just using a couple of code?**


  [1]: https://i.stack.imgur.com/Nibv2.png
  [2]: https://i.stack.imgur.com/jiSMz.png

# Answer

What is your PerspectiveCamera's zNear and zFar set to. Try a smaller range. Like if you currently have 0.1, 100000 use 1, 1000 or something. See this answer

https://stackoverflow.com/a/21106656/128511

Or [consider using a different type of depth buffer](https://threejs.org/examples/webgl_camera_logarithmicdepthbuffer.html)

