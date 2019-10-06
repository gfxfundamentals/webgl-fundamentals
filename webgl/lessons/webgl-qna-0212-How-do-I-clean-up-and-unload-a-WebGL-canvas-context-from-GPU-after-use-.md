Title: How do I clean up and unload a WebGL canvas context from GPU after use?
Description:
TOC: qna

# Question:

How do you clean up a WebGL context program and unload the program, buffers and everything from the GPU and dom-element?

I'd like to make sure we're not littering. 

Also it'd be nice to reuse the canvas if possible (and I don't know if it'd be `2d` or `webgl` context).

# Answer

You can just lose every reference to your gl context and all gl objects and the canvas and remove the canvas from the DOM. Unfortunately, because JavaScript is garbage collected there's no knowing when the browser will actually free the memory. There are some conformance tests to try to test they do this correctly but if you don't want to just hope and pray then ....

To free all your resources by calling `gl.deleteXXX` on everything you created and unbind all bind points. That means for every texture unit call gl.bindTexture on all targets with null, the same with arrays, framebuffers and renderbuffers. 

    var numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    for (var unit = 0; unit < numTextureUnits; ++unit) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Delete all your resources
    // Note!!!: You'd have to change this code to delete the resources YOU created.
    gl.deleteTexture(someTexture);
    gl.deleteTexture(someOtherTexture);
    gl.deleteBuffer(someBuffer);
    gl.deleteBuffer(someOtherBuffer);
    gl.deleteRenderbuffer(someRenderbuffer);
    gl.deleteFramebuffer(someFramebuffer);

Because you can't bind null to an attribute you could set the size of all your buffers to 1 (zero is not allowed) before you delete them. Either that or make a new  buffer and assign it to all attributes.

Example of the first

    // set a buffer to 1 byte before deleting
    // NOTE: You'd need to do this for ALL BUFFERS you created.
    gl.bindBuffer(gl.ARRAY_BUFFER, someArrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
    gl.deleteBuffer(someArrayBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, someElementArrayBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 1, gl.STATIC_DRAW);
    gl.deleteBuffer(someElementArrayBuffer);

Or make a new buffer and assign it to all attributes
    
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    var numAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    for (var attrib = 0; attrib < numAttributes; ++attrib) {
      gl.vertexAttribPointer(attrib, 1, gl.FLOAT, false, 0, 0);
    }

This will unbind the old buffers from the attributes.

Finally set the canvas size to 1x1 pixel.

    gl.canvas.width = 1;
    gl.canvas.height = 1;

It's not a perfect solution but it will immediately free all but a few k of memory immediately, no waiting for garbage collection which is out of your control.

As for reusing the canvas from scratch you can't. The canvas will always have the same context you first asked it for.

Also see @Johan's answer about `loseContext`
