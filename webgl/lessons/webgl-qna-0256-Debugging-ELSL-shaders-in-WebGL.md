Title: Debugging ELSL shaders in WebGL
Description:
TOC: qna

# Question:

Is there something roughly equivalent to a print command in WebGL, or some extension that would support it, or even an API that would allow me to write support for it?  

# Answer

If you want to step through GLSL I don't know of any. If you want to step through WebGL API calls the [WebGL inspector](http://benvanik.github.io/WebGL-Inspector/) and the [Web Tracing Framework](http://google.github.io/tracing-framework/) will both do that

For GLSL I don't know of anything. Generally to debug GLSL I simplify

#Step 1: Output a solid color in the fragment shader.

I just generally go to the fragment shader and add

    gl_FragColor = vec4(1,0,0,1);
    return;

If I see red on the screen in the correct places I can kind of assume the issue is in my fragment shader not my vertex shader.

#Step 2: Display each piece of data

Assuming I think the issue is in the fragment shader I might try displaying the different inputs.  Examples:

display the normals

    gl_FragColor = vec4(normal * 0.5 + 0.5, 1);

display some texture coords

    gl_FragColor = vec4(texCoord, 0, 1);

etc. I then look at what I see and see if it matches what I expect. If there's lighting I might skip and just draw the texture. If the texture is blank then it's a texture setup problem maybe. If the texture is correct maybe it's a lighting problem.

etc...

#Step 3: Simplify the vertex shader

If I think the problem is in the vertex shader I'd probably still set the fragment shader to the simplest thing possible. Maybe a solid color, or just the texture, or just the normals. Then I'd start pulling things out of the vertex shader. Just pass the positions through, no normals, no other data. Am I doing matrix math? Remove it, pass in one matrix, make sure I get something on the screen with something I know should work. etc. etc..
