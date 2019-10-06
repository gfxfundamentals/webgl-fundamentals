Title: check if webgl texture is loaded in fragment shader
Description:
TOC: qna

# Question:

i am writing a webgl program with texturing.

As long as the image isn´t loaded, the texture2D-function returns a vec4(0.0, 0.0, 0.0, 1.0). So all objects are black.

So i would like to check, if my sampler2D is available. 

I have already tried:

    <script id="shader-fs" type="x-shader/x-fragment">
    precision mediump float;

    varying vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main(void) {
        vec4 color = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
        if(color.r == 0.0 && color.g == 0.0 && color.b == 0.0)
           color = vec4(1.0, 1.0, 1.0, 1.0);

        gl_FragColor = color;
    }
    </script>
But of course this doesn´t make sense, because the texture could be black.

Can anybody help me? How can I check, whether my texture image is already loaded in the fragment shader?

# Answer

You can't really check that in WebGL.

Solutions:

1.  Don't render until the texture is loaded

2.  Use a 1x1 pixel texture to start, fill it in with the image
    once it's loaded. [See this answer](https://stackoverflow.com/a/19748905/128511)

3.  Pass in more info to the shader like `uniform bool textureLoaded`.
Me, I always pick #2 because it means the app runs immediately and the textures get filled in as they download.

