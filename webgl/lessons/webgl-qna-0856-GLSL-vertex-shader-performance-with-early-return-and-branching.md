Title: GLSL vertex shader performance with early return and branching
Description:
TOC: qna

# Question:

I have a vertex shader as such

    void main (){

        vec4 wPos = modelMatrix * vec4( position , 1. );

        vWorldPosition = wPos.xyz;

        float mask = step(
            0.,
            dot(
                cameraDir, 
                normalize(normalMatrix * aNormal)
            )
        );

        gl_PointSize = mask * uPointSize;

        gl_Position = projectionMatrix * viewMatrix * wPos;

    }

I'm not entirely sure how to test the performance of the shader, and exclude other factors like overdraw. I imagine a point of size 1, arranged in a grid in screen space without any overlap would work?

Otherwise i'm curious about these tweaks:

(removes `step`, removes a multiplication, introduces `if` `else`)

    void main (){

        if(dot(
             cameraDir, 
             normalize(normalMatrix * aNormal) //remove step
        ) < 0.) {
            gl_Position = vec4(0.,.0,-2.,.1); 
            gl_PointSize = 0.;
        } else {

            gl_PointSize = uPointSize; //remove a multiplication
    
            vec4 wPos = modelMatrix * vec4( position , 1. );

            vWorldPosition = wPos.xyz;
         gl_Position = projectionMatrix * viewMatrix * wPos;
        }

    }

vs something like this:


    void main (){

        if(dot(
             cameraDir, 
             normalize(normalMatrix * aNormal) 
        ) < 0.) {
            gl_Position = vec4(0.,.0,-2.,.1); 
            return;
        }

        gl_PointSize = uPointSize; 
    
        vec4 wPos = modelMatrix * vec4( position , 1. );

        vWorldPosition = wPos.xyz;

     gl_Position = projectionMatrix * viewMatrix * wPos;
        
    }

Will these shaders behave differently and why/how?

I'm interested if there is a something to quantify the difference in performance. 

 - Is there some value, like number of MADs or something else that the different code would obviously yield?
 - Would different generation GPUs treat these differences differently?
 - If the step version is guaranteed to be fastest, is there a known list of patterns of how branching can be avoided, and which operations to prefer? *(Like using `floor` instead of `step` could also be possible?)*:

.

    float condition = clamp(floor(myDot + 1.),0.,1.); //is it slower?

# Answer

There are just way too many variables so the answer is "it depends". Some GPU can handle branches. Some can't and the code is expanded by the compiler so that there are no branches, just math that is multiplied by 0 and other math that is not. Then there's things like tiling GPUs that attempt to aggressively avoid overdraw. I'm sure there are other factors.

Theoretically you can run a million or a few million iterations of your shader and time it with 

    gl.readPixels(one pixel);
    const start = performance.now();
    ...draw a bunch..
    gl.readPixels(one pixel);
    const end = performance.now();
    const elapsedTime = end - start;

`gl.readPixels` is a synchronous operation so it's stalls the GPU pipeline.
The `elapsedTime` itself is not the actual time since it includes starting up the GPU and stopping it among other things it but it seems like you could compare the `elapsedTime` from one shader with another to see which is faster. 

In other words if `elapsedTime` is 10 seconds it does not mean your shader took ten seconds. It means it took 10 seconds to start the gpu, run your shader, and stop the GPU. How many of those seconds are start, how many are  stop and how many are your shader isn't available. But, if `elaspedTime` for one shader is 10 seconds and 11 for another than it's probably safe to say one shader is faster than the other.  Note you probably want to make your test long enough that you get seconds of difference and not microseconds of difference. You'd also need to test on multiple GPUs to see if the speed differences always hold true.

Note that calling `return` in the vertex shader does not prevent the vertex from being generated. In fact what `gl_Position` is in that case is undefined.
