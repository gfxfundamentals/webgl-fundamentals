Title: ReadPixels from WebGL canvas
Description:
TOC: qna

# Question:

I am trying to save an animation which is created with WebGL on [this page][1]. I'd like to store the `RGBA` values of the animation as an array on my hard drive. Therefore, I tried to use the `readPixels` method to access the data in javascript to save them. But there are always just zeros written into the array. 

I tried this code to read the data from the canvas `c`

    var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

How can I solve the problem? Are there other ways to save the RGBA data of the canvas' animation on my hard drive? 


  [1]: http://www.thevirtualheart.org/webgl/DS_SIAM/4v_minimal_model.html

# Answer

are you reading directly after rendering as in


    render();
    gl.readPixels()

or are you reading in some other event? If you're reading in another event then the drawingBuffer is being cleared as per the spec.

see: https://stackoverflow.com/a/44534528/128511

