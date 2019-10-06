Title: Why doesn't WebGL allow binding the same buffer to Array_Buffer and Element_Array_Buffer?
Description:
TOC: qna

# Question:

Reference: https://github.com/tmpvar/WebGL-standalone/blob/master/test/khronos-tests/conformance/buffers/buffer-bind-test.html

Why doesn't WebGL allow the same buffer to be bound to Array and Index targets?

# Answer

Because WebGL needs to be secure since it runs in a web browser an any random site or ad can run WebGL code.

To be secure it has to check that all usages don't read or write any data out of bounds. A simple input example would be calling `gl.texImage2D` with a large width and height but a buffer too small. Normal C OpenGL will happily read past the end of the buffer but WebGL will not and will give an error. A simple output example would be calling `gl.readPixels` with a buffer to small for the given width and height. OpenGL would just happily trash memory past the buffer. WebGL will generate an error.

So, similarly, when you call `gl.drawElements` you're using an index buffer to access data in other buffers. If any of those indices are too large they would access out of bounds data. For example you have a buffer on an attribute that has 3 vertices but you have an index of 3. The only in range indices are 0, 1, and 2. OpenGL doesn't care about this but WebGL does. 

So, to make sure you can't do that WebGL has to validate your indices. In other words it has to read through your `ELEMENT_ARRAY_BUFFER` and check that no indices are would reference out of bounds data. To do that it has to keep of a copy of the data in the ELEMENT_ARRAY_BUFFER (since OpenGL ES 2.0 provides no way to read data from a buffer and even if it did it would be too slow). WebGL's copies of the data in the buffer use memory so in order not to waste memory only buffers that are made with `ELEMENT_ARRAY_BUFFER` have a copy of their data kept. Other buffers don't need to have a copy of their data.

Because of that the 2 types buffers are incompatible in WebGL hence you can't bind one to both `ARRAY_BUFFER` and `ELEMENT_ARRAY_BUFFER`. To do so would require both kinds of buffers to keep a copy of the data.

NOTE: WebGL implementations cache the info related to the indies in an `ELEMENT_ARRAY_BUFFER`. That means the first time you draw with the buffer for a given range WebGL will scan the copy of the data to make sure no indices are out of range. The next time you draw with that same buffer using the same range, if you haven't changed any data in the buffer then WebGL already knows the highest index and does not have to scan the buffer again.

