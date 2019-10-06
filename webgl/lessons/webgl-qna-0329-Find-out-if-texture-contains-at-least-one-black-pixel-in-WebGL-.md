Title: Find out if texture contains at least one black pixel in WebGL?
Description:
TOC: qna

# Question:

Is there a special webGL trick to check if a texture contains at least one black rgb pixel, without having to read pixels on CPU ?

To me, it seems that checking pixels on CPU is the only solution. In this case,
is there a way for example, to compress a high resolution texture to a 1x1 texture containing a single boolean color information, so that I only have to read one single pixel for performance reason.

Thanks !

# Answer

Just idea, not sure if it would work.

Make a render target, draw your texture into it using a shader that draws white if the pixel is rgb 0,0,0 and black otherwise. Let's assume is 1024x768 and now has 1 white pixel. Draw that into a texture 1/4 it's size. In this case 512x384. With linear filtering on if we have the worst case, just 1 white pixel then it will average to 0.25 (63). We can do that 2 more times first to 256x192, then again 128x96. That one original white (255) pixel will now be (3). So run the black/white shader again and repeat 64x48, 32x24, 16x12, run the black/white shader, then again 8x6, 4x4, 2x2, run the black/white shader. Then 1x1. Now check If that's not pure black there was at least 1 black pixel.

Instead of doing a 1/2 size reduction each time you could try reducing those 3 levels into one by averaging a bunch of pixels in a shader. 15x15 pixels for example would still leave something > 0 if only 1 pixel was white and the rest black. In that case starting at 1024x768 it would be 

    1024x768 -> 67x52 -> 5x4 -> 1x1

I have no idea if that would be faster or slower.
