Title: How to store state flags in floating point numbers for GLSL / WebGL
Description:
TOC: qna

# Question:

I have recently learned about [storing boolean flags in integers using bitmasks](https://blog.rinatussenov.com/juggling-bits-in-javascript-bitmasks-128ad5f31bed). I'm wondering how you can do this to store and retrieve boolean flags to/from JavaScript, and store and retrieve flags to/from GLSL. This requires **floating point bitmasks** I think, as opposed to integer bitmasks. This way I can encode in a texture some state flags in JavaScript, and then unpack them in GLSL. Likewise, if I write data to pixels in GLSL as state flags, I can read them out in JavaScript.

# Answer

In GLSL ES 3.0 in WebGL2 there are bit operations just like most languages

    uint flags = ??;

    ...

    bool flag1 = (flags & 0x1) > 0;
    bool flag2 = (flags & 0x2) > 0;
    bool flag3 = (flags & 0x4) > 0;

In WebGL1 you can mod out values up to some limit

    float flags = ??;

    bool flag1 = mod(flags, 2.0) > 0.;
    bool flag2 = mod(floor(flags / 2.0), 2.0) > 0.;
    bool flag3 = mod(floor(flags / 4.0), 2.0) > 0.;

This should work for the first 23 bits as long as `flags` is a `highp` value and is an positive integer value.

Of course it depends on where `flags` comes from. For example if you store your flags as `UNSIGNED_BYTE` in a texture or in an attribute then you'd be pulling them out as an 8bit value per channel (red, green, blue, alpha). 8bits is less than the 23 bit limit so for example

    vec4 flags = texture2D(textureWithFlags, someUV) * 255.0;
   
now `flags.r` or `flags[0]` is the first 8 bits, `flags.g` is the next 8 bits etc.

or

    attribute vec4 flags;

where you setup the attribute with UNSIGNED_BYTE values and normalize = false then just like above each channel of flags is your 8 bits from the original data

branching is discouraged in GLSL. In general if you want to do 2 or more different things, instead of adding flags, write or generate shaders for each variation. This is what most 3D engines do including Unity, Unreal, Three.js, etc...

On the other hand, rather than branch, sometimes, when appropriate, you can do things like use `step` and `mix`. For example

    vec4 color1 = ??
    vec4 color2 = ??
    float useColor2 = mod(flags, 2.0);  // will be 0.0 or 1.0
    vec4 color = mix(color1, color2, useColor2);

No branching in the code above.

In the same way this

    vec4 color;
    if (x < 100.0)
      color = color1;
    } else {
      color = color2;
    }

can be translated to 

    vec4 color = mix(color1, color2, step(100.0, x));

