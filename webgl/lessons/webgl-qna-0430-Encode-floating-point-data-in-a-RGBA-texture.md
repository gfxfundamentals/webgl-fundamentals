Title: Encode floating point data in a RGBA texture
Description:
TOC: qna

# Question:

I wrote some WebGL code that is based on floating point textures. But while testing it on a few more devices I found that support for the OES_texture_float extension isn't as widespread as I had thought. So I'm looking for a fallback.

I have currently a luminance floating point texture with values between -1.0 and 1.0. I'd like to encode this data in a texture format that is available in WebGL without any extensions, so probably a simple RGBA unsigned byte texture. 

I'm a bit worried about the potential performance overhead because the cases where this fallback is needed are older smartphones or tablets which already have much weaker GPUs than a modern desktop computer.

How can I emulate floating point textures on a device that doesn't support them in WebGL? 

# Answer

If you know your range is -1 to +1 the simplest way is to just to convert that to some integer range and then convert back. [Using the code from this answer](https://stackoverflow.com/questions/18453302/how-do-you-pack-one-32bit-int-into-4-8bit-ints-in-glsl-webgl) which packs a value that goes from 0 to 1 into a 32bit color

    const vec4 bitSh = vec4(256. * 256. * 256., 256. * 256., 256., 1.);
    const vec4 bitMsk = vec4(0.,vec3(1./256.0));
    const vec4 bitShifts = vec4(1.) / bitSh;

    vec4 pack (float value) {
        vec4 comp = fract(value * bitSh);
        comp -= comp.xxyz * bitMsk;
        return comp;
    }

    float unpack (vec4 color) {
        return dot(color , bitShifts);
    }

Then

    const float rangeMin = -1.;
    const float rangeMax = -1.;

    vec4 convertFromRangeToColor(float value) {
       float zeroToOne = (value - rangeMin) / (rangeMax - rangeMin);
       return pack(value);
    }

    float convertFromColorToRange(vec4 color) {
       float zeroToOne = unpack(color);
       return rangeMin + zeroToOne * (rangeMax - rangeMin);
    }

