Title: using WebGL instead of desktop OpenGL
Description:
TOC: qna

# Question:

I have to make a basic Computer Graphics Assignment in which I have to display a basic model on the screen and give the user controls to move the position/orientation of the components of the model. I have some background with `OpenGL` but I was thinking about making this assignment in `WebGL` instead. So what I want to know is whether there are any limitations in terms of features in `WebGL`? I would be working on `Windows` so I have an option to learn `DirectX` instead but that has a steep learning curve and is limited by platform. Also, what possible problems I should be prepared for while working with `WebGL`? Assume I have one of the latest graphics-cards.

# Answer

There are HUGE advantages to doing it in WebGL IMO

* You have all of HTML5 to help you.
 * you get free image loading
 * free mouse input
 * free keyboard input
 * free cross platform audio
 * free cross platform fonts and text
 * free 2d library for generating textures or manipulating images
* You're cross platform out of the box
 * One friend has a mac, another Linux, it just works
 * You can access it from nearly anywhere. 
   * Put your code up on github, publish it and you can run and edit from anywhere. Forgot your machine? Just edit online with one of the many direct github editors (or use dropbox)
   * Need help? Send someone a link. They can run, inspect and help you even if they have a different machine. No need for a compatible C++ compiler or a gazillion libraries.


