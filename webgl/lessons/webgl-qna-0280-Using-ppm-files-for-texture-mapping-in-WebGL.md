Title: Using ppm files for texture mapping in WebGL
Description:
TOC: qna

# Question:

I am trying to use .ppm images for texture mapping in my WebGL program. How can I read a .ppm image file for texture mapping in WebGL? After reading it, how can I use it in my javascript WebGL program? Is it the same procedure as reading a .jpeg or .gif file? Can someone explain me?

I understand that ppm is uncompressed image format, so reading this should probably be something like pixel-by-pixel, but I'm still not clear as to how to do this in javascript, for WeBGL. 

# Answer

A better question is why? My suggestion would be to batch convert them to .PNG or .JPG so the browser will load them for you.

But, if you want to pursue it you'd have to make an `XMLHttpRequest` to download them. Mark the request that you want the `XMLHttpRequest` to turn binary. You'd then have the binary file. You can now parse it into a `TypedArray` and pass that `TypedArray` to `gl.texImage2D`

You might be able to [read through this code from three.js that reads .DDS files](https://github.com/mrdoob/three.js/blob/1769fbfc6c994b51a54c15a5c096855fd3cb8a1a/examples/js/loaders/DDSLoader.js) as an example of downloading a binary file and reading a texture out of it.

