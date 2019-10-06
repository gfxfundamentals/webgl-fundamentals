Title: Incorrect reading from DataTextures in shader
Description:
TOC: qna

# Question:

I have a program that works great when my POT DataTextures are 1:1 (width:height) in their texel dimensions, however when they are 2:1 or 1:2 in texel dimensions it appears that the texels are being incorrectly read and applied. I'm using continuous indexes (1,2,3,4,5...) to access the texels using the two functions below.

I'm wondering if there is something wrong with how I am accessing the texel data, or perhaps if my use of a Float32Array for the integer indexes needs to be switched to a Uint8Array or something else? Thanks in advance!

This function finds the uv for textures that have one texel per particle cloud in my visualization:

    float texelSizeX = 1.0 / uPerCloudBufferWidth;
    float texelSizeY = 1.0 / uPerCloudBufferHeight;
    vec2 perMotifUV = vec2( 
        mod(cellIndex, uPerCloudBufferWidth)*texelSizeX, 
        floor(cellIndex / uPerCloudBufferHeight)*texelSizeY );
    perCloudUV += vec2(0.5*texelSizeX, 0.5*texelSizeY);

This function finds the uv for textures that contain one texel for each particle contained in all of the clouds:

    float pTexelSizeX = 1.0 / uPerParticleBufferWidth;
    float pTexelSizeY = 1.0 / uPerParticleBufferHeight;
    vec2 perParticleUV = vec2( 
        mod(aParticleIndex, uPerParticleBufferWidth)*pTexelSizeX, 
        floor(aParticleIndex / uPerParticleBufferHeight)*pTexelSizeY );
    perParticleUV += vec2(0.5*pTexelSizeX, 0.5*pTexelSizeY);

# Answer

Shouldn't this

    vec2 perMotifUV = vec2( 
        mod(cellIndex, uPerCloudBufferWidth)*texelSizeX, 
        floor(cellIndex / uPerCloudBufferHeight)*texelSizeY );

be this?

    vec2 perMotifUV = vec2( 
        mod(cellIndex, uPerCloudBufferWidth)*texelSizeX, 
        floor(cellIndex / uPerCloudBufferWidth)*texelSizeY );  // <=- use width

And same for the other? Divide by width not height
