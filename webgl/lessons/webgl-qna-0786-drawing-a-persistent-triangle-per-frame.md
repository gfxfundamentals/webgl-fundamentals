Title: drawing a persistent triangle per frame
Description:
TOC: qna

# Question:

I'm very new to webgl and i was playing around with the sample code for a assignment from class and i cant seem to find a way with my limited knowledge of javascript and webgl to accomplish my goal. so i wanted to have it draw one random triangle and the move to the next frame without clearing the last triangle and draw another triangle in the screen space. however i dont know how to go about doing this. I've tried running the window.requestAnimeFrame function in the render function, as well as commenting out the gl.clear function so that it would clear the buffer but that did not allow the triangles to persist and no new random triangles are made

thanks for any help and suggestions.

# Answer

WebGL automatically clears the canvas every frame by default. If you want previous contents of the canvas to remain across frames you need to tell WebGL when you create the WebGL context by passing in `preserveDrawingBuffer: true` as in

    const gl = someCanvas.getContext("webgl", { preserveDrawingBuffer: true });

