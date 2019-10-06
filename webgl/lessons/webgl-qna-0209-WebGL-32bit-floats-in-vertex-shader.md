Title: WebGL 32bit floats in vertex shader
Description:
TOC: qna

# Question:

Is there any way to get 32bit floats in WebGL shaders?
I have a lot of data packed into 4 unsigned bytes, and I would prefer to not split it into three bytes, because that would add many calculations on the client side.

E.g. for three pairs of packed data, I would obviously prefer this layout:

    |u0 u1 u2 u3|u4 u5 u6 u7|u8 u9 u10 u11|

Than this:

    |u0 u1 u2|u3 u4 u5|u6 u7 u8|u9 u10 u11|

Not only does this add a float which adds data sent through the bus, but it also makes me generate the 24bit numbers on the client instead of simply using a Float32Array which automatically handles 4 bytes.

If getting 32bit numbers isn't possible, is there any neat trick to generate 24bit numbers given a buffer, or must I loop over the bytes and encode each one (u1 + u2 * 256 + u3 * 65536)?

# Answer

I'm not really understanding your question but if you want to upload bytes to WebGL why not just pass bytes?

    var data = new Uint8Array([1,2,3,4,5,6,7,8]);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    ...

    gl.enableVertexAttribArray(someLoc);

    var numComponents = 4;  // number of bytes to pull out each time
    var type = gl.BYTE;     // BYTE goes from -128 to +127 or -1.0 to 1.0
                            // UNSIGNED_BYTE goes from 0 to 255 or 0.0 to 1.0
    var normalize = false;  // false = use the value as is (-128 to +127 for BYTE,
                            // 0 to 255 for UNSIGNED_BYTE). 
                            // true = convert to -1.0 to +1.0 for BYTE or 0 to 1.0 for
                            // UNSIGNED_BYTE
    var stride = 0;         // 0 means just advance numComponents * sizeof type.
    var offset = 0;         // how far into your buffer to start.
    gl.vertexAttribPointer(someLoc, numComponents, type, normalize, stride, offset);

If you're using `Uint8Array` or `Int8Array` then it doesn't seem like there's any special work to do to 'pack' in the values so having `numComponents = 3` is no harder or easier than `numComponents = 4`. You just set each component directly. Similarly there's no work to unpack them, GL will do it for you.


