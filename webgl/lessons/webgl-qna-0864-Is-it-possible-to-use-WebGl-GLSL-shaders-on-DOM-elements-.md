Title: Is it possible to use WebGl/GLSL shaders on DOM elements?
Description:
TOC: qna

# Question:

I'd like to use GLSL shaders to style a DOM element. I'm googling around and all I find are ways to include WebGl canvases into the DOM, and nothing about going the other way around.

Is there any way of passing the DOM as a texture to a shader?

# Answer

No, because it would be a major security breach.

The most you can do is [use a library to render the dom to a canvas](https://github.com/niklasvh/html2canvas)
