Title: Fragment Shader noob needs to know why this crashes driver
Description:
TOC: qna

# Question:

I am trying to learn WebGL and I have the following fragment shader. So far I have actually managed to get my PC to reset spontaneously and also Windows to inform my graphics driver crashed and restarted. All through JS in a browser! 

Now I have progressed to the point where nothing happens at all, just the WebGL renderer goes into hibernation. The code below isn't intended to do anything, I am just learning syntax, so don't worry about the fact it's not going to put anything on the screen,  but the question is why does this kill my GPU? 

     precision mediump float;
 
            uniform sampler2D  tex;
         
            

            void main(void) 
            {
                const int gsl=1024;
                vec4 texel=vec4(0.5, 0.5, 0.5, 1.0);
                for(int i = 0; i < gsl; i++)
                {
                    float xpos=mod(float(i),256.0);
                    float ypos=float(i)/256.0;
                    vec2 vTextureCoord=vec2(xpos,ypos);
                    texel=  texture2D(text, vTextureCoord); 
                  
                }

                gl_FragColor = texel;
      
            }

# Answer

Most likely it's because the shader is too slow.

Unlike CPUs, GPUs do not have preemptable multitasking (at least not yet). That means when you give a GPU something to do it has to do it to completion. There's no interrupting it like you can with a CPU.

So for example if you ask a GPU to draw 1000000 fullscreen polygons even a fast GPU will take several seconds during which time it can do nothing else. Similarly if you give it a very expensive per pixel fragment shader and draw a lot of pixels with it it will take a very long time during which the GPU can't be interrupted. If you gave it something that took 30 minutes the user could not use their machine for 30 minutes

The solution is OS times how long each GPU operation takes. If it takes too long (like 2-3 seconds) than the OS just resets the GPU. At that point the OS has no idea how far the GPU got in the current operation. A good OS/Driver then just kills the one context that issued the bad draw call. An older OS kills all contexts across all programs.

Note of course that *too long* depends on the GPU. A fast GPU can do things in moments and a slow GPU might take seconds. Also different GPUs have different types of optimizations.

TL;DR: Your shader probably crashed because it runs too slow and the OS reset the GPU.


