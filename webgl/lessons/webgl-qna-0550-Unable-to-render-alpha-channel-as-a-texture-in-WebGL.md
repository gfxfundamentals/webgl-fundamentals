Title: Unable to render alpha channel as a texture in WebGL
Description:
TOC: qna

# Question:

I am reading a alpha channel of a DICOM file which has the image data , after that I am parsing and rendering it using [this tutorial](http://studyjs.com/html5/dicom.html) , in addition to that I am forwarding the alpha channel to a webgl program to render the texture.

However, it works for few images , it also fails for some.
Here are few use cases :

**SNO** **Width**  **Height** **Status** 
  
1.  Width : 628 , Height : 888, Length of alpha channel : 557664 (Works fine).

2.  Width : 448 , Height : 612, Length of alpha channel : 274176(Works fine).

3. Width : 446 , Height : 612, Length of alpha channel : 272952(Doesn't work).

4. Width : 2219 , Height : 1200, Length of alpha channel : 2662800(Doesn't work).

And for Use case 3 and 4 I get these error messages :

 - Error: WebGL: texImage2D: Provided buffer is too small. (needs 2663999, has 2662800)
 - Error: WebGL: generateMipmap: The base level of the texture does not have power-of-two dimensions.

Any suggestions ?

# Answer

The errors are actually what they say. 

1. `Error: WebGL: texImage2D: Provided buffer is too small. (needs 2663999, has 2662800)`
 
   you called `gl.texImage2D` but the dimensions of the texture were larger than the data you provided. 

   For example if you did this

        var width = 16;
        var height = 16;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
                      gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(10));


   You'd get the same error. You specified a texture 16x16xRGBA(4) which
means that data has to be 16*16*4 or 1024 bytes but the code above only passed 10 bytes

   One thing to be aware of is the `UNPACK_ALIGNMENT` setting. It defaults to 4
   which means each row of data will be padded to 4 bytes. In other words and alpha texture of 7x3 will be 

        width = 7
        height = 3
        bytesPerPixel = 1   // gl.ALPHA
        unpaddedRowSize = width * bytesPerPixel
        paddedRowSize = Math.floor((minBytesPerRow + 3) / 4) * 4;  // = 8
        requiredDataSize = (height - 1 * paddedRowSize) + unpaddedRowSize

    You might have thought you only need 7x3 or 21 bytes for ALPHA but you actually need 8+8+7 or 23 bytes since each row except the last is padded to a multiple of 4

    You can tell WebGL to set the UNPACK_ALIGNMENT to 1 by calling

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    Now it will only need 21 bytes as it will no longer pad the rows.

2. `Error: WebGL: generateMipmap: The base level of the texture does not have power-of-two dimensions`

    WebGL 1.0 can't use mips unless a texture is a power of 2 in both dimensions. None of your example textures are powers of 2 in either dimension so you can't use mips and you can't call `gl.generateMipmap` for them.

    Instead you must set your texture filtering to only use the top (0 level) mip

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // or gl.NEAREST
 
     and you must set wrapping to `CLAMP_TO_EDGE`

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

     WebGL 2.0 removes these restrictions


