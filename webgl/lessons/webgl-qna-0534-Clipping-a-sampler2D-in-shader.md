Title: Clipping a sampler2D in shader
Description:
TOC: qna

# Question:

I am trying to clip or cut the left side out of a loaded sampler2D texture in a shader before I return the texture2D. 

Currently I am making the texture edits before passing to the shader but this is happening multiple times a frames which is killing performance. Can the texture edit be done in the shader instead? 
 
I'm passing the texture first: 

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

And then using it as a uniform in the shader.. 
Would I clip it in the fragment shader or the vertex shader? 



# Answer

What do you mean by `clip the texture`. You don't clip textures. You read data out of textures and decide what you want to do with that data. Example

    // don't draw anything if the texture coords reference the right half
    // of the texture.
    if (someTexCoords.x > 0.5) {
       discard;
    }
    gl_FragCoord = texture2D(someSampler, someTexCoords);

Or

    // Draw red if texture coords access the right half of the texture
    vec4 texColor = texture2D(someSampler, someTexCoords);
    gl_FragCoord = mix(texColor, vec4(1,0,0,1), step(0.5, someTexCoords.x));

etc..

