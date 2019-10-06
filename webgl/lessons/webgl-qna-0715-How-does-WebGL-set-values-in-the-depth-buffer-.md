Title: How does WebGL set values in the depth buffer?
Description:
TOC: qna

# Question:

In OpenGL, depth buffer values are calculated based on the near and far clipping planes of the scene. (Reference: https://stackoverflow.com/questions/6652253/getting-the-true-z-value-from-the-depth-buffer)

How does this work in WebGL? My understanding is that WebGL is unaware of my scene's far and near clipping planes. The near and far clipping planes are used to calculate my projection matrix, but I never tell WebGL what they are explicitly so it can't use them to calculate depth buffer values.

How does WebGL set values in the depth buffer when my scene is rendered?


# Answer

WebGL (like modern OpenGL and OpenGL ES) gets the depth value from the value you supply to `gl_Position.z` in your vertex shader (though you can also write directly to the depth buffer using certain extensions but that's far less common)

There is no *scene* in WebGL nor modern OpenGL. That concept of a scene is part of legacy OpenGL left over from the early 90s and long since deprecated. It doesn't exist in OpenGL ES (the OpenGL that runs on Android, iOS, ChromeOS, Raspberry PI, WebGL etc...)

Modern OpenGL and WebGL are just rasterization APIs. You write shaders which are small functions that run on the GPU. You provide those shaders with data through attributes (per iteration data), uniforms (global variables), textures (2d/3d arrays), varyings (data passed from vertex shaders to fragment shaders).

The rest is up to you and what your supplied shader functions do. Modern OpenGL and WebGL are for all intents and purposes just generic computing engines with certain limits. To get them to do anything is up to you to supply shaders.

See [webglfundamentals.org](https://webglfundamentals.org/) for more.

In the Q&A you linked to it's the programmer supplied shaders that decide to use frustum math to decide how to set `gl_Position.z`. The frustum math is supplied by the programmer. WebGL/GL don't care how `gl_Position.z` is computed, only that it's a value between -1.0 and +1.0 so how to take a value from the depth buffer and go back to Z is solely up to how the programmer decided to calculate it in the first place.

[This article](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html) covers the most commonly used math for setting `gl_Position.z` when rendering 3d with WebGL/OpenGL. Based on your question though I'd suggest reading the preceding articles linked at the beginning of that one.

As for what actual values get written to the depth buffer it's

    ndcZ = gl_Position.z / gl_Position.w;
    depthValue = (far - near) / 2 * ndcZ + (near - far) / 2

`near` and `far` default to 0 and 1 respectively though you can set them with `gl.depthRange` but assuming they are 0 and 1 then

    ndcZ = gl_Position.z / gl_Position.w;
    depthValue = .5 * ndcZ - .5
 
That depthValue would then be in the 0 to 1 range and converted to whatever bit depth the depth buffer is. It's common to have a 24bit depth buffer so

    bitValue = depthValue * (2^24 - 1)

