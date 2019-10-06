Title: How do I convert between float and vec4,vec3,vec2?
Description:
TOC: qna

# Question:

This question is very related to the question here(https://stackoverflow.com/questions/7059962/how-do-i-convert-a-vec4-rgba-value-to-a-float).

There is some of articles or questions related to this question already, but I wonder most of articles are not identifying which type of floating value.
As long as I can come up with, there is some of floating value packing/unpacking formula below.

* unsigned normalized float
* signed normalized float
* signed ranged float (the floating value I can find range limitation)
* unsigned ranged float
* unsigned float
* signed float

However, these are just 2 case actually. The other packing/unpacking can be processed by these 2 method.

* unsigned ranged float (I can pack/unpack by easy bitshifting)
* signed float

I want to pack and unpack signed floating values into vec3 or vec2 also. 

For my case, the floating value is not ensured to be normalized, so I can not use the simple bitshifting way.


# Answer

If you know the max range of values you want to store, say +5 to -5, than the easiest way is just to pick some convert that range to a value from 0 to 1. Expand that to the number of bits you have and then break it into parts.

    vec2 packFloatInto8BitVec2(float v, float min, float max) {
       float zeroToOne = (v - min) / (max - min);
       float zeroTo16Bit = zeroToOne * 256.0 * 255.0;
       return vec2(mod(zeroToOne, 256.0), zeroToOne / 256.0);
    }

To put it back you do the opposite. Assemble the parts, divide to get back to a zeroToOne value, then expand by the range.

    float unpack8BitVec2IntoFloat(vec2 v, float min, float max) {
       float zeroTo16Bit = v.x + v.y * 256.0;
       float zeroToOne = zeroTo16Bit / 256.0 / 255.0;
       return zeroToOne * (max - min) + min;
    }

For vec3 just expand it

    vec3 packFloatInto8BitVec3(float v, float min, float max) {
       float zeroToOne = (v - min) / (max - min);
       float zeroTo24Bit = zeroToOne * 256.0 * 256.0 * 255.0;
       return vec3(mod(zeroToOne, 256.0), mod(zeroToOne / 256.0, 256.0), zeroToOne / 256.0 / 256.0);
    }

    float unpack8BitVec3IntoFloat(vec3 v, float min, float max) {
       float zeroTo24Bit = v.x + v.y * 256.0 + v.z * 256.0 * 256.0;
       float zeroToOne = zeroTo24Bit / 256.0 / 256.0 / 256.0;
       return zeroToOne * (max - min) + min;
    }



