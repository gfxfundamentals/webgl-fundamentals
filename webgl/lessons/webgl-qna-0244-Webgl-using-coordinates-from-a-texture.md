Title: Webgl using coordinates from a texture
Description:
TOC: qna

# Question:

In webgl I created a scene where I have 4 objects, and I added different textures on each of them. Each texture is passed on to the shader via uniform variables. I am trying to make half of one of my objects red. But every time I try to change half of one of the objects to red, i somehow get the half of every texture red. The following is what I have in my fragment shader at the moment.

    varying vec2 vTextureCoord;
    uniform sampler2D Texture2;
    vec4 a = texture2D(Texture2, vTextureCoord);
    if(a.t>0.5)
    {
    gl_FragColor = vec4(1.0,0.0,0.0,1.0)
    }
    else
    {
    gl_FragColor = vec4(t.x,0.0,0.0,1.0)
    }
So to sum up my question, how can I get half of only one of my textures to red?

Thank you



# Answer

What is `t.x`? You're looking up a color from a texture, then based on the green value of the texel you looked up from texture `a.t`, if that texel's green value is `> 0.5` you're deciding to return either red or `vec4(t.x, 0, 0, 1)` which is another shade of red.

I'm guessing from your description you want to choose red based on the texture coordinates, not the texture's texel colors. In that case you want

    if (vTextureCoord.t > 0.5)  // If the texture coordinate's t is > 0.5

Instead of

    if (a.t)   // If the texel's green value is > 0.5

And if you want to choose the texture color or red then you'd do this

    varying vec2 vTextureCoord;
    uniform sampler2D Texture2;

    void main() {
      vec4 a = texture2D(Texture2, vTextureCoord);
      if (vTextureCoord.t > 0.5)
      {
        gl_FragColor = vec4(1.0,0.0,0.0,1.0);
      }
      else
      {
        gl_FragColor = a;
      }
    }

You could also do this

    varying vec2 vTextureCoord;
    uniform sampler2D Texture2;

    void main() {
      vec4 a = texture2D(Texture2, vTextureCoord);
      gl_FragColor = (vTextureCoord.t > 0.5) ? vec4(1,0,0,1) : a;
    }

or this

    varying vec2 vTextureCoord;
    uniform sampler2D Texture2;

    void main() {
      gl_FragColor = (vTextureCoord.t > 0.5) ? vec4(1,0,0,1) : texture2D(Texture2, vTextureCoord);
    }





