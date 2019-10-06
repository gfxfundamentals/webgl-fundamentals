Title: WebGL. Is it creating a buffer in GPU?
Description:
TOC: qna

# Question:

Looking for a decision about a realtime plotting of rather a large data stream. I would like to process it via a GPU to reduce memory costs.

I have found a WebGL example:

    // Fill the buffer with the values that define a triangle.
    function setGeometry(gl) {
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
                 0, -100,
               150,  125,
              -175,  100]),
          gl.STATIC_DRAW);
    }

And would like to clarify something:

- Does gl.ARRAY_BUFFER create a buffer inside a GPU, not inside a RAM?

- Is WebGL stable on linux?


----------


<sup>**UPDATE:**</sup> also would like to clarify, if it is possible to update only a part of the gl buffer by index.

# Answer

`gl.createBuffer` and `gl.bufferData` create buffers for WebGL. Whether those are on the GPU or not is up to the platform and browser. AFAIK All Intel GPUs store vertex data in the same memory as other CPU data. Also some WebGL implementations might store copies of buffers in CPU ram as well so there's really no way to know.

`gl.bufferData` sets the size of a buffer and puts data in it. You don't want to put data in it pass in a size instead of an ArrayBuffer

    // create buffer
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);

    // set it's size to 1024 bytes
    gl.bufferData(g.ARRAY_BUFFER, 1024, gl.STATIC_DATA);

After that you can put data in it a little at a time with `gl.bufferSubData`. Example

    var offset = 100;
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, someArrayBufferOrView);

`someArrayBufferORView` is just that, an ArrayBuffer like

    var someArrayBufferOrView = new Uint8Array(45);

In which case the buffer would have bytes 100 to 144 get updated with the contents of `someArrayBufferOrView`

Or if you want to use a part of an ArrayBuffer then you can make view 

    var someArrayBuffer = new Uint8Array(1024);

    ...

    var bufferOffset = 200;
    var bufferLength = 50;
    var someArrayBufferOrView = 
       new Uint8Array(someArrayBuffer.buffer, bufferOffset, bufferLength);

That makes `someArrayBufferOrView` a view into `someArrayBuffer` that starts 200 bytes into `someArrayBuffer` and is 50 bytes long. 

The better question is why do you want to do this? Calling `gl.bufferSubData` is relatively. For example if you called it once per vertex it would take much longer than calling `gl.bufferData` with all your data once. You mentioned reducing memory costs. Is what you're trying to do really having memory issues that this will solve? I know of know WebGL apps that do this.
