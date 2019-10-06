Title: WebGl position for traslate and rotate
Description:
TOC: qna

# Question:

I m starting now to use WebGl, and i m seeing this example

[WebGL How It Works](https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html)

I this the same example (for traslation) in this way in HTML part:

    gl_Position = traslation * vPosition;

where traslation is a matrix
Now (just for take pratics) i wish make my triangle that rotate and traslate.
I alread did the rotation and work too, but when i combine the two things don't rotate.

In my rotate version i have :

    <script id="vertex-shader" type="x-shader/x-vertex">
               
        attribute vec4 vPosition;
        uniform float theta;
    
        void main()
        {
            float s = sin( theta );
            float c = cos( theta );
    
            gl_Position.x = -s * vPosition.y + c * vPosition.x;
            gl_Position.y =  s * vPosition.x + c * vPosition.y;
            gl_Position.z = 0.0;
            gl_Position.w = 1.0;
    
        }
    </script>

So i see the notation is different. Because for rotate need x,y,z axe, instead for traslation no. I just try my traslation part in rotation:

    gl_Position.x = -s * vPosition.y + c * vPosition.x;
    gl_Position.y =  s * vPosition.x + c * vPosition.y;
    gl_Position.z = 0.0;
    gl_Position.w = 1.0;
    gl_Position = traslation * vPosition;

**Can I use this notation?**

in example that i linked, used this way that i don't understand well

     gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);

Why use vec4? I think matrix for trasformation is better choice.

Someone can help me?

# Answer

this code

```
gl_Position.x = -s * vPosition.y + c * vPosition.x;
gl_Position.y =  s * vPosition.x + c * vPosition.y;
gl_Position.z = 0.0;
gl_Position.w = 1.0;
gl_Position = traslation * vPosition;
```

that last line is replacing the result of the first 4 lines

You could do this instead

```
gl_Position += traslation;
```

But you should probably be using a matrix as [this article explains](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html)

As for why this code 

```
 gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
```

uses a vec4 that's because `gl_Position` is a vec4

You could also do this

```
 gl_Position.xy = (u_matrix * vec3(a_position, 1)).xy;
 gl_Position.z = 0.0;
 gl_Position.w = 1.0;
```

or this

```
 gl_Position.xyz = u_matrix * vec3(a_position, 1);
 gl_Position.w = 1.0;
```

In general most GLSL shaders use a vec4 and mat4 as this allows both 2D and 3D with the same shaders

See https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html
