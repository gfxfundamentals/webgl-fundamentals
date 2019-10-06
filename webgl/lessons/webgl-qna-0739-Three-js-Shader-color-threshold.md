Title: Three.js Shader color threshold
Description:
TOC: qna

# Question:

I do not know how to correctly say, in general, the essence is, I found a bloom shader: https://threejs.org/examples/webgl_postprocessing_unreal_bloom.html

It works fine, but a little not as it is necessary for me, it allocates only bright areas and highlights.

I need to highlight not the brightness, I need to highlight the intensity of the color.

For example:

[![http://dt-byte.ru/fe3ba464.png][1]][1]

In the picture I highlighted a circle where there should be a selection, have ideas how to do this?

Thanks in advance)


  [1]: https://i.stack.imgur.com/3nIh8.png

# Answer

You could use a `RGBtoHSV` function to check the hue, saturation, and value  of a pixel then take the distance from that to the actual color to decide to bloom or not

From [this answer](https://stackoverflow.com/a/17897228/128511):

    vec3 rgb2hsv(vec3 c)
    {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

Therefore

    // PSEUDO CODE!

    uniform vec3 targetHSV;   // supply hue, saturation, value in 0 to 1 range for each. 
                              // Red = 0,1,1

    vec3 color = texture2D(renderTarget, uv).rgb;
    vec3 hsv = rgb2hsv(color);
    vec3 hueDist = abs(hsv.x - targetHSV.x);

    // hue wraps
    if (hueDist > 0.5) {
      hueDist = 1. - hueDist;
    }

    // 2x for hue because it's at most .5 dist?
    float dist = length(vec3(hueDist * 2., hsv.yz - targetHSV.yz));

    // now use dist < threshold or smoothstep or something to decide
    // whether value contributes to bloom


