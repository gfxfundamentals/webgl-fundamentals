Title: surprising behavior of trigonometric functions in webgl fragment shader
Description:
TOC: qna

# Question:

In the following shader, `m1` and `m2` should have the same value because [cos(asin(x)) == sqrt(1.0 - x*x)](https://en.wikipedia.org/wiki/Inverse_trigonometric_functions#Relationships_between_trigonometric_functions_and_inverse_trigonometric_functions).

However, the field produced using `m1` [shows a black ring in the lower left corner](http://thebookofshaders.com/edit.php?log=160815141625) whereas `m2` produces the expected smooth field:

    precision highp float;

    void main() {
        float scale = 10000.0;
        float p = length(gl_FragCoord.xy / scale);

        float m1 = cos(asin(p));
        float m2 = sqrt(1.0 - p*p);

        float v = asin(m1);  // change to m2 to see correct behavior

        float c = degrees(v) / 90.0;
        gl_FragColor = vec4(vec3(c), 1.0);
    }

This behavior is really puzzling. What explains the black ring? I thought it may be a precision issue, but `highp` produces the same result. Or perhaps the black ring represents NaN results, but NaNs shouldn't occur there.

[![black ring rendering][1]][1]

This replicates on MacOS 10.10.5 in Chrome/FF. Does not replicate on Windows 10 or iOS 9.3.3. Would something like this be a driver issue?

(For the curious, these formulas calculate latitude for an orthographic projection centered on the north pole.)

--UPDATE--

Confirmed today that MacOS 10.11.6 does _not_ show the rendering error. This really seems like a driver/OS issue.


  [1]: http://i.stack.imgur.com/iEaK9.png

# Answer

According [to the spec](https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf)

> asin(x) :  Results are undefined if ∣x∣ > 1.

and

> sqrt(x) :  Results are undefined if x < 0.

Do either of those point out the issue?

Try

    float m1 = cos(asin(clamp(p, -1., 1.)));
    float m2 = sqrt(abs(1.0 - p*p));


