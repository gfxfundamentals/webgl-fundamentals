Title: Is it possible for webgl to use logic when processing pixels
Description:
TOC: qna

# Question:

I'm working on a project that attempts compression on an array of data.  Thus far I've been using the Canvas element and putImageData/getImageData to do my calculations. I am aware that generally Canvas and webGl are used for image processing, but in this case I'm converting the pixel values to the numbers I need and it works fine.  

I would like to use webGl to perform the compression/decompression due to it's increased speed. However to my understanding webGl is somewhat limited in regards to what type of math it can compute. 

So my question is, is it possible to port the below "logic" into webgl, vs running the calculations using plain javascript? 

This is the logic I am trying to replicate. Let's say you have an array of data that looks like this:

1, 2, 3, 4, 5, 10, 11, 12, 13, 16, 17, 18, 19

The pattern in this array is that it counts up by 1, however occasionally it skips several numbers and then starts again. The way I exploit this pattern is to convert this single array into 2 arrays. 

The first array keeps track of "where" the numbers "jump". The second array keeps track of the first digit after each jump, so I know where to start counting from again. 

So the compressed data looks like this:
first array (stores the position of the jumps): 1, 6, 10
second array (stores the value at each jump)  : 1,10,16

The way I "rebuild" the original array using canvas imgData processing is with for loops. The program looks like this:

    //Setup some variables
    var jumpDistance = 0;
    var y = 0;

    for(x = 0; x < 13; x ++){  //13 is the length of the original array

        jumpDistance = firstArray[y];
        originalArray[x] = originalArray[x] + secondArray [y];

        for(var jd = 1; jd < jumpDistance + 1; jd ++){
            originalArray[x + jd] = originalArray[x + jd] + 1;
        }

        y = y + 1;
        x = x + jumpDistance;
    }


The main logic here I desire to replicate in webGl is how I can build the final array at a faster "speed" then I read through the first 2 arrays that build it.

I know webGl is capable of reading other pixels around the current pixel. However is there anyway to make it read a certain pixel based on the data already stored in another array? If this is possible please let me know!

Thank you so much!


# Answer

> However is there anyway to make it read a certain pixel based on the data already stored in another array?

WebGL uses texture coordinates to look up data from textures (which are arrays of data). So you can use the results from one texture to look up data from another texture. 

    // get a pixel from someTexture (a type of array)
    vec4 pixel = texture2D(someTexture, someTextureCoordinate);

    // use it to look up data from another texture (a type of array)
    vec2 otherTexCoord = pixel.xy;  // OR whatever math you want
    vec4 pixel2 = texture2D(someTexture2, otherTexCoord);


