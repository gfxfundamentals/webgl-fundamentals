Title: function to compute orthogonal projection matrix
Description:
TOC: qna

# Question:

I was given a code of shaders (vertex and fragment) and my goal is to add some functionality into. But I'm having a trouble to understand some functions and Math inside. I have an image I want to project the texture of this image onto the cylinder. This is how I'm getting pixels from texture:

    float hFOV=0.0789;   // orizontal field of view
    float aspectRatio=1.5; 
    float ax = tan(hFOV * M_PI);
    float ay = ax / aspectRatio;
    vec4 q1 = myW2N(ax,ay,1.,6.) * vec4(d, 1.); // ??    
    vec2 p = q1.xy / q1.w;
    p = 0.5 * (p + 1.0);
    vec4 c = texture2D(foto, p);


But what makes me a headache is `myW2N()` function, I can't go through the idea inside and what the result means. Its just my opinion that this creates projection matrix.. To show you body of this function:

    mat4 myW2N(float ax, float ay, float zNear, float zFar) {
        float cx = 1.0 / ax;
        float cy = 1.0 / ay;
        float z0 = -zNear;
        float z1 = -zFar;
        float az = (z0 + z1) / (z0 - z1);
        float bz = (1. - az) * z0;
        return mat4(
            cx, 0., 0., 0.,
            0., cy, 0., 0.,
            0., 0., az, bz,
            0., 0., -1., 0.
            );
        }

Can anybody tell me what `zNeat and zFar` represent there? I tried to put there some values and it changes shape of wraped image, but what is weird it somehow works even if `zNear` is bigger that `zFar`..

Could you give me a clue what this function means and what it does in the end, please?

# Answer

[You might want to read up on how matrices work](http://webglfundamentals.com) but if you follow the columns 

the first column is going to multiply `X` by `1 / ax` which means it's going to scale from `+/-ax` units across to clip space `+/-1`. 

The second column is going to do the same for Y scaling from `+/-ay` to clip space. 

The 3rd column and 4th column effectively make the area of `zNear` to `zFar` go in Z clip space (in front of the camera) once things are divided by w. Because the 4th column is using `Z` (3rd row down), this is a perspective matrix not an orthographic matrix.

`d` is then multiplied by that matrix. The next line `vec2 p = q1.xy / q1.w`; actually makes a `p` a 2d clip space perspective coordinate. The line after `p = 0.5 * (p + 1.0)` converts from clip space 2d to texture space 2d

There's no code in your fragment related to cylinders 
