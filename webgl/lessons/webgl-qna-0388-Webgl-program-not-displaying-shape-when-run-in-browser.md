Title: Webgl program not displaying shape when run in browser
Description:
TOC: qna

# Question:

I'm learning how to work with shaders and I'm currently trying to write a vertex and fragment shaders for a cartoon-style shape. I have example code for a sphere that is colored in, which works properly, so I copied the structure from that file into the one I'm creating. However, when I run my file, only a black background appears on the page without the shape being displayed. I tried comparing the two files to make sure that I had all of the boiler plate code and it seems so, but as I'm extremely new to computer graphics programming, there is probably something important that I'm leaving out. What does my program doing incorrectly or what should be added to it? The code for the program is below:

    <script src=lib1.js></script>
    <body bgcolor=black>
    <center>
    <canvas id='canvas1' width='600' height='600'>
    </canvas>
    </center>
    </body>
    
    
    <script id='vs' type='other'>
       uniform vec3 lightDir;
       varying float intensity;
       void main(){
        vec3 ld;
        intensity = dot(lightDir, gl_Normal);
        gl_Position = ftransform();
       }
    </script>
    
    
    <script id='fs' type='other'>
    varying float intensity;
    void main(){
     vec4 color;
     if(intensity > 0.95)
      color = vec4(1.0, 0.5, 0.5, 1.0);
        else if(intensity > 0.5)
      color = vec4(0.6, 0.3 , 0.3, 1.0);
     else if(intensity > 0.25)
      color = vec4(0.4 , 0.2, 0.2, 1.0);
     else color = vec4(0.2, 0.1, 0.1, 1.0);
     
     gl_FragColor = color;
     }
    </script>
    
    
    <script>
    start_gl("canvas1", getStringFromScript('vs'), getStringFromScript('fs'));
    </script>





# Answer

As @Reto eluded to in the comments there's no such thing as `gl_Normal` or `fTransform` in WebGL. Those are from old desktop OpenGL. They are not part of OpenGL ES 2.0 which is what WebGL is based on

[Maybe you should start lower level](http://webglfundamentals.org)
