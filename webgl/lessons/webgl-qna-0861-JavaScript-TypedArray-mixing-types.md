Title: JavaScript TypedArray mixing types
Description:
TOC: qna

# Question:

I'm trying to use WebGL and would like to mix some different types into one buffer of bytes. I understand TypedArrays serve this purpose but it's not clear if I can mix types with them (OpenGL vertex data is often floats mixed with unsigned bytes or integers).

In my test I want to pack 2 floats into a `UInt8Array` using `set()`, but it appears to just place the 2 floats into the first 2 elements of the `UInt8Array`. I would expect this to fill the array of course since we have 8 bytes of data.

Is there anyway to achieve this in JavaScript or do I need to keep all my vertex data as floats?

    src = new Float32Array(2); // 2 elements = 8 bytes
    src[0] = 100;
    src[1] = 200;
    
    dest = new UInt8Array(8); // 8 elements = 8 bytes
    dest.set(src, 0); // insert src at offset 0
     
    dest = 100,200,0,0,0,0,0,0 (only the first 2 bytes are set)

# Answer

You can mix types by making different views on the same buffer.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const asFloats = new Float32Array(2);
    // create a uint8 view to the same buffer as the float32array
    const asBytes = new Uint8Array(asFloats.buffer);

    console.log(asFloats);
    asBytes[3] = 123;
    console.log(asFloats);

<!-- end snippet -->

The way TypeArrays really work is there is something called an `ArrayBuffer` which is a certain number of bytes long. To view the bytes you need an `ArrayBufferView` of which there are various types `Int8Array`, `Uint8Array`, `Int16Array`, `Uint16Array`, `Int32Array`, `Uint32Array`, `Float32Array`, `Float64Array`.

You can create the `ArrayBuffer` from scratch.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const buffer = new ArrayBuffer(8);
    const asFloats = new Float32Array(buffer);
    asFloats[0] = 1.23;
    asFloats[1] = 4.56;
    console.log(asFloats);

<!-- end snippet -->

Or you can do the more normal thing which is to create an `ArrayBufferView` of a specific type and it will create both the `ArrayBufferView` of that type **and** create the `ArrayBuffer` for it as well if you don't pass one into the constructor. You can then access that buffer from `someArrayBufferView.buffer` as shown in the first example above.

You can also assign a view an offset in the `ArrayBuffer` and a length to make it smaller than the `ArrayBuffer`. Example:

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // make a 16byte ArrayBuffer and a Uint8Array (ArrayBufferView)
    const asUint8 = new Uint8Array(16);

    // make a 1 float long view in the same buffer
    // that starts at byte 4 in that buffer
    const byteOffset = 4;
    const length = 1;  // 1 float32
    const asFloat = new Float32Array(asUint8.buffer, byteOffset, length);

    // show the buffer is all 0s
    console.log(asUint8);

    // set the float
    asFloat[0] = 12345.6789

    // show the buffer is affected at byte 4
    console.log(asUint8);

    // set a float out of range of its length
    asFloat[1] = -12345.6789;  // this is effectively a no-op

    // show the buffer is NOT affected at byte 8
    console.log(asUint8);



<!-- end snippet -->

So if you want to for example mix float positions and Uint8 colors for WebGL you might do something like

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    // we're going to have
    // X,Y,Z,R,G,B,A, X,Y,Z,R,G,B,A, X,Y,Z,R,G,B,A, 
    // where X,Y,Z are float32
    // and R,G,B,A are uint8

    const sizeOfVertex = 3 * 4 + 4 * 1;  // 3 float32s + 4 bytes
    const numVerts = 3;
    const asBytes = new Uint8Array(numVerts * sizeOfVertex);
    const asFloats = new Float32Array(asBytes.buffer);

    // set the positions and colors
    const positions = [
      -1,  1, 0,
       0, -1, 0,
       1,  1, 0,
    ];
    const colors = [
       255, 0, 0, 255,
       0, 255, 0, 255,
       0, 0, 255, 255,
    ];
    {
      const numComponents = 3;
      const offset = 0;  // in float32s
      const stride = 4;  // in float32s
      copyToArray(positions, numComponents, offset, stride, asFloats);
    }
    {
      const numComponents = 4;
      const offset = 12;  // in bytes
      const stride = 16;  // in bytes
      copyToArray(colors, numComponents, offset, stride, asBytes);
    }

    console.log(asBytes);
    console.log(asFloats);

    function copyToArray(src, numComponents, offset, stride, dst) {
      const strideDiff = stride - numComponents;
      let srcNdx = 0;
      let dstNdx = offset;
      const numElements = src.length / numComponents;
      if (numElements % 1) {
        throw new Error("src does not have an even number of elements");
      }
      for (let elem = 0; elem < numElements; ++elem) {
        for(let component = 0; component < numComponents; ++component) {
          dst[dstNdx++] = src[srcNdx++];
        }
        dstNdx += strideDiff;
      }
    }

<!-- end snippet -->


