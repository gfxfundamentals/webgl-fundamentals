Title: WebGL: Pass texture from vertex shader to fragment shader
Description:
TOC: qna

# Question:

Is it possible to pass a texture from a vertex to a fragment shader in WebGL? If so, how can one achieve this behavior?

I tried to pass a Sampler2D to the frag shader and got an error:

> sampler2Ds must be uniform

I'd be grateful for any help others can offer on this question!

# Answer

Why would you pass a texture from the vertex shader to the fragment shader? Just declare the same sampler in both shader?

vertex shader

    ...
    uniform sampler2D foo;
    ....

fragment shader

    ...
    uniform sampler2D foo;
    ...

Otherwise the answer is no, you can't pass a texture between shaders. You can pass some value to select sampler results

vertex shader

    varying float textureSelector;
    ...
    textureSelector = ???

fragment shader

    vec4 color1 = texture2D(foo, ...);
    vec4 color2 = texture2D(bar, ...);
    vec4 color = mix(color1, color2, textureSelector);

Note: Updated based on comments from Nicol, According to the spec textures break if used in inside conditional code. From [the spec, Appendix A.6](https://www.khronos.org/files/opengles_shading_language.pdf)

> # Texture Accesses
>
> Accessing mip-mapped textures within the body of a non-uniform conditional block gives an undefined value. A non-uniform conditional block is a block whose execution cannot be determined at compile time

In other words code like this might not work

    varying float textureSelector;
    uniform sampler2D foo;
    uniform sampler2D bar;

    ...

    if (textureSelector > ???) {
      ... use foo ...
    } else {
      ... use bar ...
    }

so I guess it's best to sample all the textures in a non-conditional part of your shader and then either use math like `mix` above or use conditionals after you've gotten the values out of the textures. An example of accessing N textures but choosing only 1.

    #define NUM_TEXTURES 6
    uniform sampler2D u_textures[NUM_TEXTURES];
    varying float textureSelector;  // 0 to NUM_TEXTURES - 1
    void main() {
      vec4 color = vec4(0);
      for (int i = 0; i < NUM_TEXTURES; ++i) {
        float id = float(i);
        float mult = step(id - .5, textureSelector) * step(textureSelector, id + .5);
        vec4 texColor = texture2D(u_textures[i], someTexCoord);
        color = mix(color, texColor, mult); 
      }
      ... use color ...
    }

Of course for most use cases you should probably be using a texture atlas and using texture coordinates to select parts of it. The normal reasons to use multiple textures are things like normal maps, opacity maps, reflectivity maps, ambient occlusion, lighting and or smooth mixes like dirt/grass/snow in which cases you wouldn't need conditionals. To re-iterate, it's not common to select from multiple textures in a shader.
