Title: idTech 4 vertex blend technique in three.js
Description:
TOC: qna

# Question:

I want to implement vertex blend technique of idTech 4 engine. I found the [article][1] explaining it but I still do not understand how to do that in three.js. I think I need THREE.ShaderMaterial with some kind of shader. Can anyone tell me where to start?


  [1]: http://www.katsbits.com/tutorials/idtech/vertex-texture-blending-applied-to-models.php "article"

# Answer

I'd argue this is too broad a question. You're going to need to read up on shaders and [how they work](http://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html). The terse answer is in your fragment shader you take as input 2 textures and vertex colors and blend between them using the alpha value of the vertex colors.

    varying vec2 v_texcoords;
    varying vec4 v_color;         // vertex colors
    uniform sampler2D u_texture1; 
    uniform sampler2D u_texture2; 

    ...

    // get color from first texture
    vec4 color1 = texture2D(u_texture1, v_texcoords);
    // get color from second texture
    vec4 color2 = texture2D(u_texture2, v_texcoords);

    // blend between the colors based on vertex alpha
    vec4 output = mix(color1, color2, v_color.a);

Since you're writing the shader though you can have infinite variations. Maybe you want 4 textures and use the vertex color r,g,b,a to pick the amount of each one. Maybe you want 2 separate sets of UV coordinates instead of just one like the example above. Maybe you want to blend between N textures where the alpha selects 0 to N.

On top of that if your materials are not just a color but also include normap maps or other kinds of data (specular maps, gloss maps, ...) you'll need to decide how to blend those as well.
