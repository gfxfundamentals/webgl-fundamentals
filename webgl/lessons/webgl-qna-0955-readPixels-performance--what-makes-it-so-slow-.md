Title: readPixels performance, what makes it so slow?
Description:
TOC: qna

# Question:

When trying to hittest with a large amount of data (but with almost none of it on screen) read pixels is really slow even though frame times are way below 16.7ms (10ms all in)

I'm working on a datavis platform running in webgl but something thats baffling me is why readpixels is so slow.  We are using the colour picking approach to hittest an item that being dragged so that it can br dropped on to things etc.  It seems the more data uploaded into the scene the longer it takes despite the render (without read) is 60fps.  Its only pulling one pixel out so its clearly related to the blocking aspect of it but why would that take nearly 4x longer than the frame time?


    if (xPos >= 0 && yPos >= 0 && xPos < drawBufferWidth && yPos < drawBufferHeight) {
       gl.readPixels(xPos, yPos, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, lastCapturedColourMap);
    }


I would expect that the higher the framerate the lower the cost of readpixels but it seems to be a fixed cost.  Could anyone enlighten me?  I'm looking for anyone who might understand better about what actually makes it slow or for any other alternative hit testing method for 2d graphics in webgl

[![enter image description here][1]][1]


  [1]: https://i.stack.imgur.com/PoaRy.png

# Answer

As mlkn points out it's slow because WebGL is pipelined. It's double pipelined in Chrome for security.

You issue a webgl command from JavaScript. That command gets copied to a command buffer. Another process, the GPU process reads that command, it validates that you aren't doing something bad and then calls some corresponding GL function which writes a command into the driver's command buffer. Another process reads that command. 

Under normal circumstances all of these things run in parallel. While you're issuing new commands, the previous commands are being read and passed to GL by the GPU process. While the GPU process is issuing commands the GPU and GPU driver is off processing previous commands before that.

The moment you try to read though all of those processes running in parallel have to stop and all of them have to wait for all commands to process so that they can read the pixels (the results of all the commands you've issued so far) and then pass them back. They then all have to start up again but at this point all of their command lists are empty so it will take several commands to give all of them something to do in parallel again.


