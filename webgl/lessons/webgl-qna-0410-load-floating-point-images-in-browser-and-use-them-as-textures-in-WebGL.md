Title: load floating point images in browser and use them as textures in WebGL
Description:
TOC: qna

# Question:

I need to store some (longitude = RED, latitude = GREEN, time= BLUE, day= ALPHA) information in a texture and then do some queries in fragment shared for a data viz prototype. All the values are normalized [0,1].

I am using java to create a PNG files but is there a way I can create a float PNG file and load it in the browser. 

I thought reading them as binary file but I am not very familiar with web technologies yet. I am sorry for that. 

Another idea is to use 2 channels so that I will have 16 bit precision. That will complicate things a lot I guess and the deadline for this prototype is on 15th of December. 

So far I have everything working except for this and changing the texture format in webGL once i solve this problem.

# Answer

No browsers that I know of support floating point textures -> WebGL. Safari is the only browser that loads floating point textures that I know of and for Safari only in TIFF format but I don't believe it will pass those as floating point data into WebGL.

The only way I know of is for you to unpack the data yourself and upload it using `gl.texImage2D(target, level, internalFormat, width, height, 0, format, gl.FLOAT, someFloat32ArrayBufferYouMade)`

How you fill that array buffer is up to you. You can write your own PNG decompressor (I didn't know PNG supported float). If I were you I'd just use uncompressed binary files and download with XHR binary requests just to get something working. You can then work on compressing and decompressing later.

Your idea of using 2 or more channels to get more resolution and not use floating point textures is also a common solution.
