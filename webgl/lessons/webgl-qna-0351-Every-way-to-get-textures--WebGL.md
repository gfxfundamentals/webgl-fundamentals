Title: Every way to get textures, WebGL
Description:
TOC: qna

# Question:

I was wondering if there was any other way to get textures in WebGL other than the standard Image() constructor.

Specifically I would like to make a texture using the data from a <img> tag in html, but I would also like to see other ways.

# Answer

You can't get data from HTML tags in general. Only `HTMLCanvasElement`, `HTMLImageElement`, and `HTMLVideoElement`.

Otherwise you can also use `ImageData` and you can provide your data in `TypedArray`s 


