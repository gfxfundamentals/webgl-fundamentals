Title: How to bind an array of textures to a WebGL shader uniform?
Description: How to bind an array of textures to a WebGL shader uniform?
TOC: How to bind an array of textures to a WebGL shader uniform?

## Question:

I need to handle many objects which share only a few textures. Defining and loading textures one by one manually (as described in [another post on SO][1]) does not feel right... even more so since there's no `switch (index) {case:...}` statement in WebGL. 

So I wanted to pass the texture to use for a vertex as a vertex attribute, and use this number as an index into some "array of textures" in the fragement shader. But the [OpenGL wiki on Samplers][2] (not quite the perfect reference for WebGL, but the one I found) says:

> A variable of sampler can only be defined in one of two ways. It can be defined as a function parameter or as a uniform variable.
> 
> uniform sampler2D texture1;

That to me sounds like I can have no array of samplers. I've read a few pages on texture units, but until now, that remains a mystery to me. 

In the SO post cited above, Toji hinted at a solution, but wanted a separate question - voila!

Thanks, nobi

PS: I know the other possibility of using a "texture atlas" - if this is more efficient or less complicated - I'd be happy to hear experiences!


  [1]: https://stackoverflow.com/questions/11292599/how-to-use-multiple-textures-in-webgl/11300434#11300434
  [2]: http://www.opengl.org/wiki/Sampler_%28GLSL%29

## Answer:

You have to index sampler arrays with constant values so you can do something like this

    #define numTextures 4

    precision mediump float;
    varying float v_textureIndex;
    uniform sampler2D u_textures[numTextures];
    
    vec4 getSampleFromArray(sampler2D textures[4], int ndx, vec2 uv) {
        vec4 color = vec4(0);
        for (int i = 0; i < numTextures; ++i) {
          vec4 c = texture2D(u_textures[i], uv);
          if (i == ndx) {
            color += c;
          }
        }
        return color;
    }
    
    void main() {
        gl_FragColor = getSampleFromArray(u_textures, int(v_textureIndex), vec2(0.5, 0.5));
    }

You also need to tell it which texture units to use

    var textureLoc = gl.getUniformLocation(program, "u_textures");
    // Tell the shader to use texture units 0 to 3
    gl.uniform1iv(textureLoc, [0, 1, 2, 3]);

The sample above uses a constant texture coord just to keep it simple but of course you can use any texture coordinates.

Here's a sample: 

{{{example url="../webgl-qna-how-to-bind-an-array-of-textures-to-a-webgl-shader-uniform--example-1.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/1329113">virtualnobi</a>
    from
    <a data-href="https://stackoverflow.com/questions/19592850">here</a>
  </div>
</div>
