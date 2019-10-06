Title: pass texture map to another fragment shader
Description:
TOC: qna

# Question:

I want to generate a texture map in WebGl in one fragment shader and then pass that texture map to another fragment shader for processing but the syntax escapes me. I believe if I understood it correctly, an example I found online said I could do something like this:

    (1)
    // setup frame buffer and depth buffer for the two fragment shaders.


    (2)
    // texture map generating frag shader:
    
    uniform sampler2D texturemap;
    
    void main(){
        // generate texture map
        vec4 coorindate_value = ...;
        output_texture = texture( texturemap , coorindate_value );
        // my understanding is that that sampler2d will generate some kind of a mapping. how can I map coorindate_value to some other vec4, like another vec4 coordinate???
    }


    (3)
    // second fragment shader:
    
    uniform sampler2D same_texturemap;
    
    void main(){
        vec4 coorindate_value = ...;
        vec4 value = texture2D( same_texturemap , coorindate_value );
        // the returned value should be one of the color values from the first fragment shader, correct??

    }


I'm not looking for anyone to provide code to help me here necessarily, but just to get some confirmation that I have an understanding of how this could work. **I suppose my main confusion is over what sampler2D actually does. Is it like a dictionary or hashtable in that it maps between two values, and if so, how do I choose what those two values are?**  Any tips or corrections would be great.

thanks much in advance

# Answer

A `sampler2D` is a reference to a texture unit. A texture unit holds a reference to a texture. A texture is a 2D array of data you can pull data out of using the `texture2D` function. You pass it the sampler2D uniform and a normalized texture coordinate. It returns a *sampled* value from the texture. I say *sampled* value because how that value is generated depends on the filter settings of the texture.

Output in WebGL is via a special variable `gl_FragColor`. The output goes to the current framebuffer to the canvas if no framebuffer is bound.

You probably need to [read some tutorials on webgl](https://webglfundamentals.org). Here is one [specifically about textures](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html) and also [rendering to texture](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html) but if you're not familiar with the rest of WebGL you'll probably need to read the preceding articles.
