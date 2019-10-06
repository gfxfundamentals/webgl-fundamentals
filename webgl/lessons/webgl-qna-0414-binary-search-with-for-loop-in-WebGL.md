Title: binary search with for loop in WebGL
Description:
TOC: qna

# Question:

I have to implement a binary search in WebGL using fragment shader. The hard part is how to implement it without dynamic loops and without while loop. 

I will use a 1D texture that is normalized as a data structure. 

If there is any implementation in Java it would be very helpful because i could not find any so far. 

EDIT :

I think i have a version working or partially working 

I have been asked by a professor to try and do binary search in WebGL using fragment shader. His class is a research class that’s why problems are hard and I took the hardest one

The idea is coming from imMens paper as the fastest system for iterative visualization that uses Data Cubes. The whole idea is to use a sparse texture to save data instead of Data Cubes, but things didn’t go well so far because the professor made me change the whole project 4 times now and I have 1 week till the end of the semester. I made the fragment shader work and scan incrementally through 4.2 million points but it is just super slow and crashes the GPU driver( my 980m and my r9 290x at home) .

Now the new requirement is to try and make binary search on fragment shader on WebGL without dynamic loops and without while loop. This is what I cannot program.

I have to use a 1D texture to store data sorted by longitude that is saved on Red channel. Then for each pixel in the screen I have to do binary search and find out how many pixels from 1D texture have longitude that is on that pixel on the screen.

Lets say we have a screen with 4x4 and let’s take only the first row. Since the coordinates are normalizes we have the following ranges 0-0.25, till 0.75-1.0. What I need to do is find all the longitudes in 1D texture that fall between 0 and 0.25. So he asked me to do binary search and if I can’t find exactly 0 and 0.25 I will find the closest one, then I return the position of them in the texture and I calculate the offset from them.

I hope this is clearer because even the professor had problems coming up with this. 

EDIT 2; 

I believe i have a working version or a partial working version. I still need to figure out 2 things. 

How to do correct indexing with floating points and make sure i am at the correct texture position after dividing. Probably I have to use module for that or so some maths trick to make sure I am iterating at correct normalized texture coordinates while searching through texture. 

The second issue is, if the value is not found how I return the index that is the closes so that I will be able to do the count later. 

Thanks for help and feedback. :D 

        precision highp float;
    precision highp int;
     
    const int maxTextureSize = 32; // This means that the texture should not be bigger than 32x32
    const int maxTextureLength = 512; // X axis in the texture should not be longer than 512
    //const int maxBinarySearchLoop = int(ceil(log2(float(maxTextureLength)))); //maxTextureLength;
    
    uniform vec2 textureDimensions;
    uniform vec2 canvasDimensions;
    uniform vec2 partitionData;
    
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    
    uniform float f_time;
    
    float binarySearch(sampler2D data, float key){
     float oneTextPixel =  1.0 / textureDimensions.x; // size of a pixel 
     float keyL = 0.0; 
     float keyH = 1.0; // we have normalized texture values and the max texture size is 1.0
     float keyM = (keyH + keyL)/2.0;
     
     int maxBinarySearchLoop = int(ceil(log2(float(maxTextureLength))));
     
     // I dont know how to use non constantd in loops in WebGL 
     for(int i = 0; i < maxTextureLength; i++){
      if(i > maxBinarySearchLoop) {
       break;
      } else {
       if( texture2D(data, vec2(keyM,1)).r < key ){
        keyL = keyM + oneTextPixel;
       } else if( texture2D(data, vec2(keyM,1)).r == key ) {
         return keyM;
       } else {
        keyH = keyM - oneTextPixel;
       }
       keyM = (keyH + keyL)/2.0;
       // termination condition for now sicne i can not use uniforms ;(
       /*if(keyL > keyH){
        break;
       }*/
      }
     }
     // I return the position of the value in the texture of 
     // if not found I return the closes position one 
     return keyM;
    }
    
    void main(void) { 
     vec4 outColor = vec4(0.0);
     
     // normalize frag coordinates
     vec2 normFragCoord = vec2( gl_FragCoord.st / (float(canvasDimensions.x)/*+0.5*/) );
     float oneFragPixel =  1.0 / float(canvasDimensions.x)/*+0.5*/ ; // size of a pixel
     
     vec4 color = texture2D(u_texture, v_texCoord);
     
      // this adds the offset e.g. if the canvas is 4 pixels then the
     // first pixel will be .0125 and the range is 0.0 and 0.25
     float keyL = normFragCoord.x - (normFragCoord.x/2.0); 
     float keyH = normFragCoord.x + (normFragCoord.x/2.0);
     
     float b1 = binarySearch(u_texture, keyL);
     float b2 = binarySearch(u_texture, keyH);
     // The difference between positions is the count
     float br = (b2-b1);
      
     gl_FragColor = vec4(br);
    }



# Answer

I'm just thinking out loud here but.....

First write a function to generate a "match" texture from your original. This texture would store 1 where there's match and 0 where there isn't.

So for example

    uniform vec2 textureResolution;

    // Just an example match function
    float isMatch(vec4 color) {
      return step(0.5, color.r); // match if red < 0.5
    }

    void main() {
      vec4 uv = gl_FragCoord.xy / textureResolution;
      vec4 color = texture2D(texture, uv);

      gl_FragColor = mix(vec4(0), vec4(1), isMatch(color));
    }

Once you have that you could write a shader to generate mips on the GPU. Your mip generator would add the pixels together but not divide. Clamp the result (or not up to you). Once you have all the mips generated you could walk the mips from smallest to largest on the CPU. So for example a 16x1 pixel match texture and the generated mips

    0000000000100000   mip 0
    0 0 0 0 0 1 0 0    mip 1 
    0   0   1   0      mip 2 
    0       1          mip 3
    1                  mip 4

So, checking the smallest mip you see there's at least one answer because it's not 0. Checking the next mip you can tell it's on right half of the texture. Walkup up the mips you only have to check 2 pixels per mip and eventually you'll wind up at the top mip and know exactly where the answer is. This assumes there is only one answer although I suppose you could walk them up and find all the answers if there's more than one.

If you're using a 2 dimensional texture you'd have to check 4 pixels per mip but the basic solution would be the same. 

If you didn't clamp when generating the mips, just added, you'd end up with a count of the number of matches which might be useful. The only issue would be if the count overflowed. You could either check for overflow and say "too many matches", encode the count across channels or use floating point textures.

To get the answer on the GPU it seems like you'd just loop in another shader

    #define NUM_MIPS 8 // set this before creating the shader

    float getPixel(float u, float bias) {
       return texture2D(answerTexture, vec2(u, 0.0), bias).r;
    }

    void main() {
      float u = 0.5;  // start in the middle
      float unit = 0.25;  // how much to move to get left or right 1 pixel
      for (int i = 0; i < NUM_MIPS; ++i) {
        float bias = float(NUM_MIPS - i - 1);
        float left  = getPixel(u - unit, bias);
        float right = getPixel(u + unit, bias);
        unit = unit / 2.;
        if (left > 0.) {
           u -= unit;
        } else if (right > 0.) {
           u -= unit;
        } else {
           discard; // no answer!
        }
      }   
      // assuming this is a floating point texture
      gl_FragColor = vec4(u, 0, 0, 0);
    }

This assumes there's only 1 answer

Note: having not actually tried any of the above ideas I might be missing something.




