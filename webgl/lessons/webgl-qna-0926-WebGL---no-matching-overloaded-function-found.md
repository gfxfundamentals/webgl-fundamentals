Title: WebGL - no matching overloaded function found
Description:
TOC: qna

# Question:

I have this WebGL fragment shader on my html file which is running fine, except when I call the first 5 vec2 functions.

    vec2 subCalc(vec2 z1, vec2 z2){
        return vec2((z1.x - z2.x), (z1.y - z2.x));
    }

I get this error:

![ERROR ALERT ON BROWSER][1]

It's weird because I use the vec4's, for example 'HSVtoRGB', the code runs fine.

full shaders

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-html -->

    <script id="fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
    varying vec4 actualPos;
    uniform vec2 drag;
    uniform float func;
    uniform float n;
    uniform vec2 center;
    uniform float scale;
    uniform float test;

    vec2 subCalc(vec2 z1, vec2 z2){
        return vec2((z1.x - z2.x), (z1.y - z2.x));
    }

    vec2 expCalc(vec2 z){
        return vec2(exp(z.x)*cos(z.y),exp(z.x)*sin(z.y));
    }

    vec2 divCalc(vec2 z1, vec2 z2){
        return vec2((z1.x*z2.x + z1.y*z2.y)/(z2.x*z2.x+z2.y*z2.y),(z1.y*z2.x-z1.x*z2.y)/(z2.x*z2.x+z2*z2.y));
    }

    vec2 multCalc(vec2 z1, vec2 z2){
        return vec2((z1.x*z2.x - z1.y*z2.y), (z1.y*z2.x + z1.x*z2.y));
    }

    vec2 sumCalc(vec2 z1, vec2 z2){
        return vec2((z1.x + z2.x), (z1.y + z2.x));
    }

    vec4 HSVtoRGB(float h, float s, float v)
    {
    //Convert between the HSV and RGB color model.
    //Taken from http://www.cs.rit.edu/~ncs/color/t_convert.html and rewritten for GLSL 
    int i;
    float f, p, q, t;
    vec4 RGB;

    if (s == 0.0)
    {
    // achromatic (grey)
    RGB.x = RGB.y = RGB.z = v;
    RGB.w = 1.0;
    return RGB;
    }

    h /= 60.0; // sector 0 to 5
    i = int(floor(h));
    f = h - float(i); // fracional part of h
    p = v * (1.0 - s);
    q = v * (1.0 - s * f);
    t = v * (1.0 - s * (1.0 - f));

    if(i==0)
    {
    RGB.x = v;
    RGB.y = t;
    RGB.z = p;
    }
    else if(i==1)
    {
    RGB.x = q;
    RGB.y = v;
    RGB.z = p;
    }
    else if(i==2)
    {
    RGB.x = p;
    RGB.y = v;
    RGB.z = t;
    }
    else if(i==3)
    {
    RGB.x = p;
    RGB.y = q;
    RGB.z = v;
    }
    else if(i==4)
    {
    RGB.x = t;
    RGB.y = p;
    RGB.z = v;
    }
    else if(i==5)
    {
    RGB.x = v;
    RGB.y = p;
    RGB.z = q;
    }
    else
    {
    RGB.x = 1.0;
    RGB.y = 1.0;
    RGB.z = 1.0;
    }
    RGB.w = 1.0;
    return RGB;
    }



    vec4 secondCase(vec4 posi){

        float multX = ((posi.x * posi.x) - (posi.y * posi.y));
        float multY = ((posi.y * posi.x) + (posi.x * posi.y));

        float newX = multX;
        float newY = multY;

        
        
        float r = pow(sqrt((newX)*(newX)+(newY)*(newY)),n);
        for(float i = 0.0; i <=10000.0; i++){
            if(i>=n){break;}
            newX = ((newX * posi.x) - (newY * posi.y));
            newY = ((newY * posi.x) + (newX * posi.y));
        }
        float h = (atan(newY/newX));
        float s = 1.0;
        float v = fract((log2(r)));

        

        h = (h*180.0)/(3.14);

        if(h<0.0)
            h = h*(-1.0);

        if(newX <= 0.0 && newY > 0.0)
            h = 180.0 - h;

        if(newX < 0.0 && newY < 0.0)
            h = 180.0 + h;

        if(newX >= 0.0 && newY < 0.0)
            h = 360.0 - h;

        return HSVtoRGB(h,s,v);

    }

    vec4 thirdCase(vec4 posi){

        vec2 divi = vec2((100.0*posi.x + 0.0*posi.y)/(posi.x*posi.x+posi.y*posi.y),(0.0*posi.x-100.0*posi.y)/(posi.x*posi.x+posi.y*posi.y));

        vec2 exp = vec2(exp(divi.x)*cos(divi.y),exp(divi.x)*sin(divi.y));
        
        float r = pow(sqrt((exp.x)*(exp.x)+(exp.y)*(exp.y)),n);
        float h = (atan((exp.y/exp.x)));
        float s = 1.0;
        float v = fract((log2(r)));

        h = (h*180.0)/(3.14);

        if(h<0.0)
            h = h*(-1.0);

        if(exp.x <= 0.0 && exp.y > 0.0)
            h = 180.0 - h;

        if(exp.x < 0.0 && exp.y < 0.0)
            h = 180.0 + h;

        if(exp.x >= 0.0 && exp.y < 0.0)
            h = 360.0 - h;

        return HSVtoRGB(h,s,v);

    }

    vec4 forthCase(vec4 posi){
        
        

        vec2 divi = vec2((100.0*posi.x + 0.0*posi.y)/(posi.x*posi.x+posi.y*posi.y),(0.0*posi.x-100.0*posi.y)/(posi.x*posi.x+posi.y*posi.y));

        vec2 exp = vec2(exp(divi.x)*cos(divi.y),exp(divi.x)*sin(divi.y));
        
        float r = pow(sqrt((exp.x)*(exp.x)+(exp.y)*(exp.y)),n);
        float h = (atan((exp.y/exp.x))*3.0);
        float s = 1.0;
        float v = fract((log2(r)));

        h = (h*180.0)/(3.14);

        if(h<0.0)
            h = h*(-1.0);

        if(exp.x <= 0.0 && exp.y > 0.0)
            h = 180.0 - h;

        if(exp.x < 0.0 && exp.y < 0.0)
            h = 180.0 + h;

        if(exp.x >= 0.0 && exp.y < 0.0)
            h = 360.0 - h;

        return HSVtoRGB(h,s,v);

    }



    void main() {

        vec4 finalPosition = actualPos;
        finalPosition.x += drag.x;
        finalPosition.y += drag.y;

        finalPosition.x *= test;
        finalPosition.y *= test;
        
        float r = sqrt((finalPosition.x)*(finalPosition.x)+(finalPosition.y)*(finalPosition.y));
        float h = atan((finalPosition.y/finalPosition.x));
        float s = 1.0;
        float v = fract((log2(r)));

        h = (h*180.0)/(3.14);

        if(h<0.0)
            h = h*(-1.0);

        if(finalPosition.x < 0.0 && finalPosition.y > 0.0)
            h = 180.0 - h;

        if(finalPosition.x < 0.0 && finalPosition.y < 0.0)
            h = 180.0 + h;

        if(finalPosition.x > 0.0 && finalPosition.y < 0.0)
            h = 360.0 - h;

        vec2 firstMemb = expCalc(finalPosition);
      

        if(func == 1.0){
            gl_FragColor = HSVtoRGB(h,s,v);
        } else if(func == 2.0){
            gl_FragColor = secondCase(finalPosition);
        } else if(func == 3.0){
            gl_FragColor = thirdCase(finalPosition);
        }

        
    }

    </script>

<!-- end snippet -->

Thanks in advance.

  [1]: https://i.stack.imgur.com/Xetma.png

# Answer

This line

      vec2 firstMemb = expCalc(finalPosition);

Is trying to pass a `vec4` to a function that takes a `vec2`

