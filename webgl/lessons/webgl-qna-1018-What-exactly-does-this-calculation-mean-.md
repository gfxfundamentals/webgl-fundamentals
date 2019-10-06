Title: What exactly does this calculation mean?
Description:
TOC: qna

# Question:

I'm new to GLSL and learning from the tutorial here.
(It's using ShaderToy)

https://gamedevelopment.tutsplus.com/tutorials/a-beginners-guide-to-coding-graphics-shaders--cms-23313


My question is why you can set x coordinates to 0-1 by dividing the fragCoord's x coordinates by the iResolution(screensize).

It might be just a math question, but I'm confused what exactly the "iResolution.x" indicates or what kind of calculation is made here. (Is it a vector division? )





    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        vec2 xy = fragCoord.xy; //We obtain our coordinates for the current pixel
        xy.x = xy.x / iResolution.x; //We divide the coordinates by the screen size
        xy.y = xy.y / iResolution.y;
        // Now x is 0 for the leftmost pixel, and 1 for the rightmost pixel
        vec4 solidRed = vec4(0,0.0,0.0,1.0); //This is actually black right now
        if(xy.x > 0.5){
            solidRed.r = 1.0; //Set its red component to 1.0
        }
        fragColor = solidRed;
    }

# Answer

The other answers are correct.  `fragCoord` is the pixel currently being drawn, `iResolution` is the size of the screen so
   
    xy.x = xy.x / iResolution.x; //We divide the coordinates by the screen size
    xy.y = xy.y / iResolution.y

Gives normalized values where xy.x goes from 0 to 1 across and xy.y goes from 0 to 1 up the screen which seems to be *exactly what the comments say*

It's important to note though that `iResolution` and `fragCoord` are user variables. In this case I'm guessing you're getting this GLSL from Shadertoy. Those variables are not part of WebGL or GLSL, they are defined by Shadertoy and so their values and meaning are defined by shadertoy.

Note that if you are new to GLSL and WebGL you might want to consider some [webgl tutorials](https://webglfundamentals.org). Also see [this answer about shadertoy](https://stackoverflow.com/a/54798106/128511)
