Title: Opengl ES diffuse shader not working
Description:
TOC: qna

# Question:

I'm implementing simple ray tracing for spheres in a fragment shader and I'm currently working on the function that computes color for a diffusely shaded sphere. Here is the code for the function:

    vec3 shadeSphere(vec3 point, vec4 sphere, vec3 material) {
          vec3 color = vec3(1.,2.,3.);
          vec3 N = (point - sphere.xyz) / sphere.w;
          vec3 diffuse = max(dot(Ldir, N), 0.0);
          vec3 ambient = material/5;
          color = ambient   + Lrgb * diffuse *  max(0.0, N * Ldir);
          return color;
       }
I'm getting errors on the two lines where I'm using the max function. I got the code for the line where I'm assigning ```max(dot(Ldir,N),0.0)``` from the webgl cheat sheet which uses the function ``` max(dot(ec_light_dir, ec_normal), 0.0);``` 
For some reason, my implementation is not working as I'm getting the error: 

    ERROR: 0:38: 'max' : no matching overloaded function found

What could be the problem with either of the these max functions I'm using?


   

# Answer

There's 2 `max` statements in your shader. It's the 2nd one that's the problem

`max(0.0, N * LDir)` makes no sense. `N` is a vec3. There's no version of `max` that takes `max(float, vec3)`. There *is* a version of `max` that's `max(vec3, float)` so swap that to be

    `max(N * LDir, 0.0)`

and it might work. Basically your shader is **NOT** an ES 2.0 shader. Maybe it's being used on a driver that is not spec compliant (ie, the driver has a bug). WebGL tries to follow the spec 100%
