Title: How do I display <iframe>s as a texture in A-Frame?
Description:
TOC: qna

# Question:

I want to display webpages as 2D content with a VR scene. Can I use an `<iframe>` element as a source for a texture in WebGL/three.js in https://aframe.io?

# Answer

You can't use iframes or any other HTML element inside WebGL as it would be a security risk. People could read passwords and other private info from the textures.

you can however find creative solutions [like this one](http://learningthreejs.com/blog/2013/04/30/closing-the-gap-between-html-and-webgl/) which is the first hit of googling "iframe webgl".

You do it by putting a iframe behind a webgl canvas, using 3d math *cut a hole* (draw transparent pixels) where you need the iframe to show through by using a 2d plane that represents the iframe. Then use 3D css to position the iframe element to match the plane.
