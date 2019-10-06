Title: Is it possible to pass a GLSL variable to javaScript.
Description:
TOC: qna

# Question:

I see that you can pass variables from javaScript to GLSL but is it possible to go the other way around. Basically I have a shader that converts a texture to 3 colors red, green, and blue based on the alpha channel. 

    if (texture.a == 1.0) {
     gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); 
    }
 if (texture.a == 0.0) {
     gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
  call0nce = 1;
    }
 if (texture.a > 0.0 && texture.a < 1.0) {
     "gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);", 
 }
I have been using the colors to help visualize things better. What I'm really trying to do is pick a random point with with an alpha of 1.0 and a random point with an alpha of 0.0 and output the texture coordinates of both in a way that I can access them from javaScript. How would I go about this?

# Answer

You can not directly pass values from GLSL back to JavaScript. GLSL, at least in WebGL 1.0, can only output pixels to textures, renderbuffers, and the backbuffer.

You can read the pixels though by calling `gl.readPixels` so you can indirectly get data from GLSL back into JavaScript by writing the values you want and then calling `gl.readPixels`.
