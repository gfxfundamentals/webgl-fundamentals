Title: Change the number of MSAA smaples
Description:
TOC: qna

# Question:

I can get the number of MSAA samples like this:

    gl.getParameter(gl.SAMPLES);

Is it possible to change the number of samples, either in JavaScript or in browser settings?

# Answer

No

WebGL 1.0 does not allow changing the samples. To do that requires the ability to create multi-sampled renderbuffers which has not been exposed in WebGL 1.0

WebGL 2.0, whenever it ships, should allow creating your own multi-sample renderbuffers. It's not clear if it will allow setting the number of samples for the canvas itself though.


