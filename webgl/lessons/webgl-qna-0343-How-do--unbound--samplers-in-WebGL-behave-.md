Title: How do "unbound" samplers in WebGL behave?
Description:
TOC: qna

# Question:

I'm finding that samplers without a texture bound to them seem to return the values of another sampler when passed to texture2D:

                for (int l = 0; l < Main.MaxLayers; l++)
                {
                    if (layers[l] != null && layers[l].enabled)
                    {
                        finalShader.SetInt("layer" + l, l);
                        layers[l].BindTexture(GL.TEXTURE0 + l);
                    }
                    else
                    {
                        Context.activeTexture(GL.TEXTURE0 + l);
                        Context.bindTexture(GL.TEXTURE_2D, null);
                    }

                }

Here I bind "layers" to my shader (max. 8). Some of these might not be enabled, and in fact in my test I only had one enabled, the one in texture slot 0.


Now in my "finalShader" I'm doing the following: 

    uniform sampler2D layer0;
    uniform sampler2D layer1;
    uniform sampler2D layer2;
    uniform sampler2D layer3;
    uniform sampler2D layer4;
    uniform sampler2D layer5;
    uniform sampler2D layer6;
    uniform sampler2D layer7;
    varying vec2 vTextureCoord;
    void main(void) {
        gl_FragColor = texture2D(layer0, vTextureCoord)
                        +texture2D(layer1, vTextureCoord)
                        +texture2D(layer2, vTextureCoord)
                        +texture2D(layer3, vTextureCoord)
                        +texture2D(layer4, vTextureCoord)
                        +texture2D(layer5, vTextureCoord)
                        +texture2D(layer6, vTextureCoord)
                        +texture2D(layer7, vTextureCoord);
    }

one would expect that all the unbound samplers return vec4(0.0). Not here. ALL samplers give me the color value of sampler 0. Is that to be expected or is there an error in my code ?

# Answer

Unbound and unrenderable textures return 0,0,0,1 in WebGL. 

Rendering in WebGL and unbound or [unrenderalble textures](#unrenderalble-textures) **WILL** render with 0,0,0,1 and on many browsers will generate a warning in the JavaScript console to help you find what is probably in a bug in your code. 

As for your code it's not clear what you're doing. 

First off 

                    finalShader.SetInt("layer" + l, l);
                    layers[l].BindTexture(GL.TEXTURE0 + l);

Does what? does it correctly call `gl.activeTexture` with the correct enum and does it then bind the correct texture to the active texture unit?

Also are you setting your uniforms for `layer0`, `layer1`, `layer2` etc.

You need to set each uniform to tell it which texture unit to use. Looking at your example, assuming you looked up the uniform locations already I'd guess you need

    gl.uniform1i(layer0location, 0);
    gl.uniform1i(layer1location, 1);
    gl.uniform1i(layer2location, 2);
    gl.uniform1i(layer3location, 3);
    gl.uniform1i(layer4location, 4);
    gl.uniform1i(layer5location, 5);
    gl.uniform1i(layer6location, 6);
    gl.uniform1i(layer7location, 7);

###Unrenderable Textures

Unrenderable textures are any texture that is not setup correctly. For WebGL 1.0 that's texture with non-power of 2 dimensions who's filtering is setup to require MIPS. It's also textures missing any mips down the last level if the filtering requires mips, or if any of the mips are the wrong size, or if they're not all the same format/type. Or for a cubemap if they aren't square and all faces the same size.

Note: This is different than OpenGL. In OpenGL there is the concept of the default texture, texture #0. So binding 0, `glBindTexture(GL_TEXTURE_2D,0)`, just binds texture 0. You can upload data to texture 0 just like any other texture. WebGL doesn't have a default texture though.
