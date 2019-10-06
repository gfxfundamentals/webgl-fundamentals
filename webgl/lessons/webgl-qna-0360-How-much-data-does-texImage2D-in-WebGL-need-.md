Title: How much data does texImage2D in WebGL need?
Description:
TOC: qna

# Question:

I created a DataTexture in ThreeJS, which in turn will call texImage2D.

    var twidth = 50;
    var theight = 50;
    var tsize = twidth * theight;
    
    var tileData = new Uint8Array( tsize * 3);

    //fill it with some data

    tileDataTexture = new THREE.DataTexture(this.tileData, twidth, theight, THREE.RGBFormat);

As you can see, I used a size of 50x50 Texels and three 8Bit channels (THREE.RGB in threejs). When I used a UInt8Array of size 7500 (50*50*3), Firefox tells me, that it needs more data:

    Error: WebGL: texImage2D: not enough data for operation (need 7598, have 7500)

I would like to know: where do this extra 98 bytes come from? I would guess alignment, but 7598 is not even divisible by 4 while 7500 is. (Now that I think of it, it is not divisible by 3, my number of channels, either)

7600 would make sense, since that would mean 2 Bytes of padding per row, is the last row not padded?

(I get that one should use only multiples of four for the dimensions, still I would like to know the answer)

# Answer

As user1421750 pointed out the rows are padded

But, you can set how much padding per row by setting `texture.unpackAlignment`. it defaults to 4 but you can set it to 8, 4, 2 or 1.

Personally I would have made the default 1 because I think you'd be less likely to be surprised like you were
