Title: Moving point with mouse
Description:
TOC: qna

# Question:

I drew a lot points in my program with webgl. Now I want to pick any point and move this point new position. The case is I don't know how to select point. So am I supposed to add actionlistener to each point? 

# Answer

[WebGL is a rasterization library](http://webglfundamentals.org). It has no concept of movable, clickable position or points. It just draws pixels where you ask it to.

If you want to move things it's up to you to make your own data, use that data to decide if the mouse was clicked on something, update the data to reflect how the mouse changed it, and finally use WebGL to re-render something based on the data.

Notice none of those steps except the last one involve WebGL. WebGL has no concept of an actionlistener since WebGL has no actions you could listen to. [It just draws pixels based on what you ask it to do](http://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html). That's it. Everything else is up to you and outside the scope of WebGL.

Maybe you're using some library like [three.js](http://threejs.org) or [X3D](http://www.web3d.org/) or [Unity3d](http://unity3d.com) but in that case your question would be about that specific library as all input/mouse/object position related issues would be specific to that library (because again, WebGL just draws pixels)
