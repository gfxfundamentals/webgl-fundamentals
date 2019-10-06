Title: WebGL Cel Shading in image processing
Description:
TOC: qna

# Question:

What is the best way to implement a WebGL shader for a toon / cel shading / borderlands style / vectorized-like effect on an image?

I know the outlines can be generated using sobel or Frei-chen filters, but most resources  I have found about the colours have been for 3D models.

The desired result is something similar to this, though, the quality is not a priority, as this will be implemented on a video feed, if feasible.

http://www.instructables.com/id/Cel-Shading-Real-Life-Pictures/


# Answer

I don't know of any simple GLSLish way of cartoonifying an image. AFAIK that requires way more image analysis than simple GLSL based post processing algorithms can do. The closest I can think of is just to lower the color resolution, maybe using a [3d tone mapping texture](https://www.youtube.com/watch?v=rfQ8rKGTVlg#t=24m30s) for more control and use [nearest neighbor filtering instead of linear filter](https://webglsamples.org/color-adjust/color-adjust.html?nearest=true&adjustment=posterize-4-lab). Another might be to try to quantize by hsv or hsl (whereas posterization quantizes by rgb) also I think you can do the same using tone-mapping you just need to generate the ramp cube using HSL quantization instead of RGB quantization. You might also do a blur step or reduce the resolution before quantizing.


