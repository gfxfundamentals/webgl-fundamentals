Title: How to reuse the WebGL context within a canvas?
Description:
TOC: qna

# Question:

I am trying to clear the contents of WebGL canvas. 

Is it fine if I just delete the canvas element from DOM and create a new one ,and most importantly , will it clear up all the resources and not cause any memory leak.

My scenario is that , I am getting images continuously via AJAX polling from the server every 20 seconds and using a hidden webgl canvas to draw it and further using another canvas to show it perfectly .

Suggestions?



# Answer

Basically no, if you just delete the canvas from the DOM there is no guarantee it will get freed in time to create a new one, after 8 or 16 of them you'll possibly get an error.

see https://stackoverflow.com/questions/23598471/how-do-i-clean-up-and-unload-a-webgl-canvas-context-from-gpu-after-use

Why can't you just keep reusing the same canvas or canvases?
