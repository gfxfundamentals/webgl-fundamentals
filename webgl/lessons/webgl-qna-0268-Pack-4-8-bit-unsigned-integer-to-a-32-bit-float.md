Title: Pack 4 8-bit unsigned integer to a 32-bit float
Description:
TOC: qna

# Question:

I'm developing a webgl-based renderer and as the title says I need to pack 4 8-bit unsigned integer to a 32-bit float, 
I wrote the following code :

    //pack 4 8-bit integer to a float
    function packIntsToFloat(i1, i2, i3, i4) {

        //ensure 32-bit allocation
        var ints = new Uint32Array(4);
                
        ints[0] = i1;
        ints[1] = i2;
        ints[2] = i3;
        ints[3] = i4;

        ints[0] <<= 24;
        ints[1] <<= 16;
        ints[2] <<= 8;
                
        ints[3] |= ints[0] | ints[1] | ints[2];      
        
        //convert to float
        var f = new Float32Array(1);
        f[0] = ints[3];

        return f[0];
    }
    
    //unpack 4 8-bit integer from a float
    function unPackIntsFromFloat(f) {
                
        var i = new Uint32Array(4);
        i[3] = f;

        var mask_7_to_0 = 255;
        var mask_15_to_8 = mask_7_to_0 << 8;
        var mask_23_to_16 = mask_15_to_8 << 8;
        var mask_31_to_24 = mask_23_to_16 << 8;
        
        i[0] = (i[3] & mask_31_to_24 ) >>> 24;
        i[1] = (i[3] & mask_23_to_16 ) >>> 16;
        i[2] = (i[3] & mask_15_to_8 ) >>> 8;
        i[3] = (i[3] & mask_7_to_0);        
        
        return new Uint8Array(i);
    }

but it won't work unless skipping what I need : 

    //convert to float
    var f = new Float32Array(1);
    f[0] = ints[3];

I'm aware of the IEEE standard but there shouldn't be any change of the bits, only their interpretation as a value.
Thank you in advance.

# Answer

What are you trying to do exactly?

For example are you trying to put both float positions and unsigned byte colors in the same buffer? In that case make 2 views to the same buffer. Example:

    var numVerts = 10;
    var bytesPerPosition = 3 * 4;  // x,y,z * 4 bytes per float
    var bytesPerColor = 4;  // r,g,b,a 1 byte each
    var bytesPerVertex = bytesPerPosition * bytesPerColor;
    var sizeOfBuffer = numVertex * bytesPerVertex;
    var offsetOfPositions = 0;
    var offsetOfColor = bytesPerPosition;

    // now make the buffer.
    var asUint8 = new Uint8Array(sizeOfBuffer);
    var asFloat = new FloatArray(asUint8.buffer);

You now have 2 views to the same buffer. So for example to set a position you'd effectively do

    var strideInFloats = bytesPerVertex / 4;

    function setPosition(index, x, y, z) {
      var offset = strideInFloats * index;
      asFloat[offset    ] = x;
      asFloat[offset + 1] = y;
      asFloat[offset + 2] = z;
    }

To set a color would be effectively

    function setColor(index, r, g, b, a) {
      var offset = strideInBytes * index + offsetToColor;
      asUint8[offset    ] = r;
      asUint8[offset + 1] = g;
      asUint8[offset + 2] = b;
      asUint8[offset + 3] = a;
    }

When setting up attributes, you'd do something like

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, bytesPerVertex, 
                           offsetOfPosition);
    gl.vertexAttribPointer(colorLoc, 4, gl.UNSIGNED_BYTE, true, bytesPerVertex, 
                           offsetOfColor);


