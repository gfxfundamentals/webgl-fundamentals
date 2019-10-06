Title: JS - Undeclared identifier: 'var' in GLSL script
Description:
TOC: qna

# Question:

I'm a bit new to HTML and Javascript and within my html, I have the following code:

            <script id="fragmentShader" type="x-shader/x-fragment">
                    precision mediump float;
                    
                    //varying vec3 fragmentColor;  //not needed?
                    varying vec3 fragmentNormal;
                    varying vec3 fragmentLight;
                    varying vec3 fragmentView;
                    
                    uniform vec3 modelColor;
                    uniform vec3 lightColor;
                    
                    void main() {
                            var m = normalize(fragmentNormal);
                            var l = normalize(fragmentLight);
                            var v = normalize(fragmentView);
                            var h = normalize(l + v);
                            
                            var d = Math.max(l * m , 0);
                            var s = Math.pow(Math.max(h * m, 0), 10);
                            
                            fragmentColor = modelColor * lightColor * d + lightColor * s;
                        
                            gl_FragColor = vec4(fragmentColor, 1.0);
                    }
            </script>

However, it returns 

    Failed to compile shader: ERROR: 0:13: 'var' : undeclared identifier 
    ERROR: 0:13: 'm' : syntax error 

Am I not allowed to declare/define variables inside of script tags in HTML?



# Answer

That code above is not JavaScript it's [GLSL](http://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html). It's the language used to write programs that run on your GPU. It doesn't have a keyword `var`. Instead to declare variables in GLSL you need to put a type in front of them

    vec3 m = normalize(fragmentNormal);

    vec3 l = normalize(fragmentLight);
    vec3 v = normalize(fragmentView);
    vec3 h = normalize(l + v);

    vec3 d = max(l * m , 0.0);
    vec3 s = pow(max(h * m, 0.0), vec3(10));

I'm not sure what you're trying to do above but all your equations produce `vec3`. 

Also GLSL 1.00 es is strict about types. You can't use vec3 with integers. You have to use floating point numbers. `0.0` instead of `0`.  The last line there is no function `pow` that takes a vec3 on the left and a single value on the right so `vec3(10)` takes the integer `10` and casts it to a `vec3`. It's the same as saying `vec3(10, 10, 10)`.

Also GLSL doesn't have a `Math.` library. It's built in functions are global.
