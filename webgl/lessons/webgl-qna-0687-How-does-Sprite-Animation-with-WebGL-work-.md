Title: How does Sprite Animation with WebGL work?
Description:
TOC: qna

# Question:

Although there are many tutorials about how to render sprites, which I already know, I was wondering about how I can animate my sprites in an object oriented way. Let's say I have a Player-`class`

    class Player{
        constructor(){
            this.textureAtlasPath = 'textures/player.jpg'
            this.uvCoords = [0,0,1,0,1,1,0,1]
        }
    }
So if `player.jpg` contains only ONE texture (like one character) i think it is very clear, that i use uv coordinates `[0,0,1,0,1,1,0,1]`. But lets say the `player.jpg` contains of 4 textures (character facing up, character to the left, character to the right and character facing down). What i did was dividing the uv coordinates in 4 uv coordinates (within a vertex shader) and depending on the frame f.e.:

    if(currentFrame < 15)
        //use uv coord subdivision 1
    if(currentFrame < 30)
        //use uv coord subdivision 2
    to be continued.....
So my question is:
Do I subdivide the uv coords within the vertex/fragment shader or do I calculate them on the CPU? If so do I store them in 4 different buffers or only 1 buffer? And if possible can you provide a code example?
Additional note: I want my ALL my animated sprites to have 4 states of movement, so f.e. the whole image is 64x64 and it contains 4 16x16 textures.

# Answer

Probably the most common way is to use a unit quad with unit quad texture coordinates and pass in a texture matrix to multiply the texture coordinates to select the part of the texture you want.

     // vertex shader
     attribute vec2 texcoord;
     ...
     uniform mat4 texMatrix;
     ...
     varying vec2 v_texcoord;
     ...

     void main() {
        ...
        v_texcoord = (texMatrix * vec4(texcoord, 0, 1)).xy;
     }

See [here for the math](https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html)
 
If you don't plan on rotating you can shorten that by just passing in a uv offset and uv scale

     // vertex shader
     attribute vec2 texcoord;
     ...
     uniform vec2 uvOffset;
     uniform vec2 uvScale;
     ...
     varying vec2 v_texcoord;
     ...

     void main() {
        ...
        v_texcoord = texcoord * uvScale + uvOffset;
     }


If all your sprites are the same size for a given texture (say all of them are 40x20) then you can also do it by just passing in the size of a single sprite or the number of sprites across and down, the size of the texture, and a sprite number then calculate the UVs in the shader.

Which one you use depends on how flexible you want to be and how much speed you need. I almost always choose the first method is it's the most flexible. If it's too slow for my needs then I start optimizing.


