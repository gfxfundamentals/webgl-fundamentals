Title: Default color for webgl 3D scene
Description:
TOC: qna

# Question:

I have `webgl 3D scene` with `background image` and few shapes with `textures`.  
I want to add some lines and other shapes and apply on them default color which not affect the shapes  with textures.  
How can I do this?  
this is what I have now:  

    gl.clearColor(0.0, 0.0, 0.0, 0.0); //alpha=0 for background img
 gl.enable(gl.DEPTH_TEST);

# Answer

WebGL is by default composited into the webpage. That means clearing to 0,0,0,0 means the canvas is transparent the standard webpage CSS background color settings of the canvas itself or the elements behind it (`<body>`, `<html>`> etc are what that canvas will be blended with

You might find this answer helpful

https://stackoverflow.com/a/39354174/128511
