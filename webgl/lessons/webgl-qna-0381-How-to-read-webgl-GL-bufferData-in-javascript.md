Title: How to read webgl GL.bufferData in javascript
Description:
TOC: qna

# Question:

i want to read back the data stored in the GL.bufferData array in javascript.

Here is my code

`var TRIANGLE_VERTEX = geometryNode["triangle_buffer"];
GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
GL.bufferData(GL.ARRAY_BUFFER,new Float32Array(vertices),GL.STATIC_DRAW);`

is it possible in webgl to read back the bufferdata in GPU?
if possible then please explain me with a sample code.

How to know the memory size(filled and free) of the Gpu in webgl at run time and how to debug the shader code and data in GPU in webgl.


# Answer

It is not directly possible to read the data back in WebGL1. (see below for WebGL2). This is limitation of OpenGL ES 2.0 on which WebGL is based.

There are some workarounds:

1.  You could try to render that data to a texture then use `readPixels` to read the data.

    You'd have to encode the data into bytes in your shader because `readPixels` in WebGL can only read bytes

2.  You can wrap your WebGL to store the data yourself something like

        var buffers = {};
        var nextId = 1;
        var targets = {};

        function copyBuffer(buffer) {
           // make a Uint8 view of buffer in case it's not already
           var view = new Uint8Buffer(buffer.buffer); 
           // now copy it
           return new UintBuffer(view);
        }

        gl.bindBuffer = function(oldBindBufferFn) {
          return function(target, buffer) {
            targets[target] = new Uint8Buffer(buffer.buffer);
            oldBindBufferFn(target, buffer);
          };
        }(gl.bindBuffer.bind(gl));

        gl.bufferData = function(oldBufferDataFn) {
           return function(target, data, hint) {
             var buffer = targets[target];
             if (!buffer.id) {
               buffer.id = nextId++;
             }
             buffers[buffer.id] = copyBuffer(data);
             oldBufferDataFn(target, data, hint);
           };
        }(gl.bufferData.bind(gl)));

    Now you can get the data with

        data = buffers[someBuffer.id];

    This is probably what [the WebGL Inspector](http://benvanik.github.io/WebGL-Inspector/) does

    Note that there are a few issues with the code above. One it doesn't check for errors. Checking for errors would make it way slower but not checking for error will give you incorrect results if your code generates errors. A simple example

        gl.bufferData(someBuffer, someData, 123456);

    This would generate an `INVALID_ENUM` error and not update the data in `someBuffer` but our code isn't checking for errors so it would have put `someData` into `buffers` and if you read that data it wouldn't match what's in WebGL.

    Note the code above is pseudo code. For example I didn't supply a wrapper for `gl.bufferSubData`. 

## WebGL2

In WebGL2 there is a function `gl.getBufferSubData` that will allow you to read the contents of a buffer. Note that WebGL2, even though it's based on OpenGL ES 3.0 does not support `gl.mapBuffer` because there is no performant and safe way to expose that function.

