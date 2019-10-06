Title: ThreeJS & Fragment Shader Window Size
Description:
TOC: qna

# Question:

In my ThreeJS `WebGLRenderer` scene, I am currently clipping pixels with a GLSL fragment (pixel) shader, according to their distance from the lower left-hand corner of the screen:

    if (distance(vec2(gl_FragCoord.x, gl_FragCoord.y), vec2(0.0, 0.0)) > 42.0)
        discard;

This shader is used with a `ThreeJS.ShaderMaterial` instance, that ends up used with a `PointCloud` mesh, that ends up a particle system in the scene.

My question is, how do I determine the "window size" for this shader? I am happy to pass these pixel dimensions from ThreeJS to the shader, but do not know the best way to map a ThreeJS geometry & mesh to a GLSL window size. Passing in `window.innerWidth` and `window.innerHeight` does not work.

The goal is to clip fragments that are near the center of the physical screen:

    if (distance(vec2(gl_FragCoord.x, gl_FragCoord.y), vec2(pixelWidth * 0.5, pixelHeight * 0.5)) > 42.0)
        discard;

How would I find `pixelWidth` and `pixelHeight` on the ThreeJS side?

# Answer

If you're rendering to the canvas you can get the actual size with

    var width = renderer.context.drawingBufferWidth;
    var height = renderer.context.drawingBufferHeight;

If you're rendering to a render target then

    var width = renderTarget.width;
    var height = renderTarget.height;

should work
