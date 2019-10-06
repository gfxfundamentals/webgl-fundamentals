Title: Prevent loop unrolling in shader program when using ANGLE
Description:
TOC: qna

# Question:

in my WEBGL shader I am using loop of unknown length (on compile). 



        do {
            sample = texture(uTex, posXY).a;
            accumulated += aSample * uAMultiplier;
        } while (accumulated < 0.8);

This works as expected on OpenGL browsers, but by default windows chrome/ff uses angle, that unrolls loops, which isn't possible in this case, causing compile errors.

>Error: Error compiling generate  
>Error: Cannot link program  
>Info log:  
>C:\fakepath(110,28-106): error X4014: cannot have gradient operations inside loops with divergent flow control

>C:\fakepath(59,12-96): warning X3570: gradient instruction used in a loop with varying iteration, forcing loop to unroll  
>C:\fakepath(118,1-82): error X3511: unable to unroll loop, loop does not appear to terminate in a timely manner (1024 iterations)  


Is there a solution to prevent unrolling or otherwise bypass having to loop?



# Answer

You can try to declare a static loop with an exit. For example

```
float accumulated = 0.0;
#define ITERATION_LIMIT 100;
for (int i = 0; i < ITERATION_LIMIT; ++i) {
  sample = texture(uTex, posXY).a;
  accumulated += aSample * uAMultiplier;
  if (accumulated >= 0.8) {
    break;
  }
}
```

Of course it's best to pick a reasonable number for the limit
