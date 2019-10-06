Title: GLSL vars conversion problem from ShaderToy to Android Studio GLSL
Description:
TOC: qna

# Question:

I would like to have a very simple explanation WHY these variables doesn't work on "Android Studio" and how to solve my problem(some work on "*TheeBookOfShaders*", some work on "*Atom*", others work on both, some work only on "*ShaderToy*" and some only work on "*Android Studio*").


----------


*** To really understand, this is a sample (from a "fragment.glsl" file) ***

    uniform vec2 resolution;     // [-] work on...
    uniform vec2 uresolution;    // [-] work on...
    uniform vec2 iresolution;    // [Y] work only on "ShaderToy"
    uniform vec2 u_resolution;   // [Y] work on "Atom" and "WebGL"


----------


i.e.
*** Sample Conversion FROM "ShaderToy" TO "Atom" (live coding)***

    uniform vec2 iresolution;    // is used on: "ShaderToy"
    uniform vec2 u_resolution;   // is used on: "Atom", "WebGL", etc.

so: [*iresolution* = *u_resolution*] *** OK It works ***


----------


*** Well, now, why in "Android Studio" (java code + fragment.glsl) no one of these it works? ***

       uniform vec2 resolution;     // doesn't work on "Android Studio"
       uniform vec2 uresolution;    // doesn't work on "Android Studio"
       uniform vec2 iresolution;    // doesn't work on "Android Studio"
       uniform vec2 u_resolution;   // doesn't work on "Android Studio"
       uniform vec2 vresolution;    // doesn't work on "Android Studio"
       uniform vec2 v_resolution;   // doesn't work on "Android Studio"

and obviously:

       vec2 A = (gl_FragCoord.xy / u_resolution);     // doesn't work on "Android Studio"
       vec2 A = (gl_FragCoord.xy / uresolution);      // doesn't work on "Android Studio"
       vec2 A = (gl_FragCoord.xy / *SOME*resolution); // doesn't work on "Android Studio"

etc.

----------

Same situation about the *time* var: *time, utime, u_time, itime, vtime, v_time, globalTime,* etc.


----------


*** Where do I can find the exact keyword to use *RESOLUTION/TIME/other*s system-var in "Android Studio" GLSL shader file? ***


- "resolution" is there a currently defined reference table to understand how to convert system variables?


- "resolution" is it a system-lib variable or not?


- "Xresolution" is there a simple final real scheme to understand something in this confusion?


----------
- [Atom-Editor - "u_resolution" using][1]

in this sample, we can see the ONLY work version of Xresolution - try at home


- [Atom-Editor - "OTHERSresolution" using][2]

in this other sample, we can see the ALL THE OTHERS yellow-failure versions of Xresolution - try at home


----------
**The "fragment.glsl" test-file work 100% on Atom-Editor (try at home please)**

    #ifdef GL_ES
        precision highp float;
    #endif

    uniform vec2 resolution;    // not-system var
    uniform vec2 uresolution;   // not-system var
    uniform vec2 iResolution;   // system-var WORK 100% on ShaderToy
    uniform vec2 vresolution;   // not-system var
    uniform vec2 u_resolution;  // system-var WORK 100% on Atom-Editor but NOT on Android Studio
    uniform vec2 i_resolution;  // not-system var
    uniform vec2 v_resolution;  // not-system var

    void main()
    {
     vec2 A = (gl_FragCoord.xy / u_resolution);

        gl_FragColor = vec4(A.x, A.y, 0.0, 1.0);
    }


----------

*** SOLUTION | WORK 100% ONLY ON ANDROID STUDIO ***

    #ifdef GL_ES
        precision highp float;
    #endif

    uniform vec2 u_resolution; // note: you can name it also "Pacman"...
                               // this mode let you can to create your
                               // personal var-name to access to windows view-port

    void main()
    {
        // ---------------------------------------------------------------------------------
        u_resolution = vec2(1920, 1080); // this assignment work 100% ONLY on Android Studio
        // ---------------------------------------------------------------------------------

        // --------------------------------------------------------------------------
        vec2 A = (gl_FragCoord.xy / u_resolution);                      // solution 1
        vec2 A = (gl_FragCoord.xy / vec2(1920, 1080));                  // solution 2
        vec2 A = (vec2(gl_FragCoord.x / 1920, gl_FragCoord.y / 1080));  // solution 3
        // --------------------------------------------------------------------------

        gl_FragColor = vec4(A.x, A.y, 0.0, 1.0);
    }

----------

Finally we found the solution, always before our eyes.
We start from a window of which we have the dimensions of X and Y set to 1920x1080 (in our case we do not need anything else) and I point out 3 modes of setting the variable "*u_resolution*". **WARNING** - this feature **works ONLY in Android Studio** and is able to answer my questions above. The problem has been solved. Felipe showed his commitment to solving the problem by getting involved. Of course we can also set this value from the main-code via Java or C ++ or other; but to us, in this post, it was only interesting **to set/retrieve these "*u_resolution*" directly via/from GLSL**.


----------


The solution adopted perfectly meets the needs of departure, and I hope it will be helpful to all those who come after me.
**The 3 line solution are equivalent: choose your preferred**


----------


A special thank to @felipe-gutierrez for his kind cooperation.




  [1]: https://i.stack.imgur.com/8fr6l.jpg
  [2]: https://i.stack.imgur.com/qmr7f.jpg

# Answer

**NONE** of the GLSL variables you mentioned are system vars

They are user made up variables.

    uniform vec2 resolution;

has absolutely no more meaning than;

    uniform vec2 foobar;

Those are variables chosen by **you**.

You set them by looking up their location

In WebGL/JavaScript

    const resolutionLocation = gl.getUniformLocation(someProgram, "resolution");
    const foobarLocation = gl.getUniformLocation(someProgram, "foobar");

In Java

    int resolutionLocation = GLES20.glGetUniformLocation(mProgram, "resolution");
    int foobarLocation = GLES20.glGetUniformLocation(mProgram, "foobar");

You set them in WebGL/JavaScript

    gl.useProgram(someProgram);  
    gl.uniform2f(resolutionLocation, yourVariableForResolutionX, yourVariableForResolutionY);
    gl.uniform2f(foobarLocation, yourVariableForFoobarX, yourVariableForFoobarY);

or Java

    GLES20.glUseProgram(someProgram);  
    GLES20.glUniform2f(resolutionLocation, yourVariableForResolutionX, yourVariableForResolutionY);
    GLES20.glUniform2f(foobarLocation, yourVariableForFoobarX, yourVariableForFoobarY);

There is no magic system vars, they are 100% your app's variables. `iResolution` is a variable that the programmers of ShaderToy made up. `u_resolution` is a variable that some plugin author for Atom made up. They could have just as easily chosen `renderSize` or `gamenHirosa` (japanese for screen width), or anything. Again, they are not system vars, they are variables chosen by the programmer. In your app you also make up your own variables.

I suggest you [read some tutorials on WebGL](https://webglfundamentals.org)
