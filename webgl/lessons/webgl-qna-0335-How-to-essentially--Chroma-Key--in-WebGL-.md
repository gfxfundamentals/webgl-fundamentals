Title: How to essentially "Chroma Key" in WebGL?
Description:
TOC: qna

# Question:

I am trying to figure out how to set the alpha of a textured square that I draw depending on the color. I am using a picture of a red Alabama A with a white background. I want to be able to toggle it to take out the red and show through the A and toggle it to take out the white and leave the A. I have 2 textured squares. One is the background, So I thought I couldn't do this in the frag shader because it would do it to both images right? In my main js file I need to be able to toggle the "chroma key" from red to white when I click on the toggle HTML button.

So, how do I change the alpha of a textured square based on pixel, if there are only 4 true points with colors? Or 6 points with 2 being used twice (2 triangles).

This is only in 2-D by the way.

# Answer

Terse version is use red or something else for your alpha

Use red of alpha

    gl_FragColor = color.rgbr;

Use something not red (for example green) for alpha

    gl_FragColor = color.rgbg;

Now you need some way to select

    uniform bool useRed;

    ...
     
    gl_FragColor = vec4(color.rgb, useRed ? color.r : color.g);

Or maybe a more creative way is to blend red and green.

    uniform float mixAmount; // 0 = red, 1 = green
    ...
    gl_FragColor = mix(color.rgbr, color.rgbg, mixAmount);


