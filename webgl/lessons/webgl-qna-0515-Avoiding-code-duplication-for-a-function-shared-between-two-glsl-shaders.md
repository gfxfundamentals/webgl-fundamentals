Title: Avoiding code duplication for a function shared between two glsl shaders
Description:
TOC: qna

# Question:

My HTML page (pipad.org/tmp/fourier02.html) contains two shaders:

    <script type="application/glsl" id="shaderA">
        uniform vec4 a;
        vec4 f(vec4 x, vec4 y){ ... } // DUP
        vec4 main(vec4 u, vec4 v) { return f(a,u); }
    </script>

    <script type="application/glsl" id="shaderB">
        uniform vec4 a;
        vec4 f(vec4 x, vec4 y){ ... } // DUP
        vec4 main(vec4 u) { return f(a,u); } // notice main's sig is different
    </script>  

I hope I'm not oversimplifying, I may have to revise if I am. These shaders are used in different ways (shaderB is RTT).

As can be seen, `f` is identical in both cases.

Is there any way to avoid writing it twice?

The only way I can see is keeping the shaders as strings, which is messy because syntax highlighting no longer works and you have to do:

    :
    var
    f = 
        "vec4 f(vec4 x, vec4 y){\n" +
        "...\n" +
        "}\n",

    shaderA = f + 
        "uniform vec4 a;\n" +
        "vec4 main(vec4 u, vec4 v) { return f(a,u); }\n",

    shaderB = f + 
        "uniform vec4 a;\n" +
        "vec4 main(vec4 u) { return f(a,u); }\n"
    ;
       
etc.

which is ... meh.  No clear advantage over the original. We've just exchanged duplication for ickyness.

Is there a better way?

# Answer

As you've already found, string manipulation is a common way to make shaders. Pretty much all large engines use lots of string substitution to build shaders at runtime. WaclawJasper pointed out template strings. They are a new feature of JavaScript but since pretty much all browsers that support WebGL get regular updates you can probably use then pretty safely, or you can use a polyfill.  

Example

<!-- begin snippet: js hide: false -->

<!-- language: lang-js -->

    var t = {
      PI: '3.14159',
      plusToPlusMinus: `
        float plusToPlusMinus(float v) {
           return v * 2.0 - 1.0;
        }
      `,
    };

    var shader = `
      ${t.plusToPlusMinus}
      ...
      void main() {
       a = b * ${t.PI};
      }
    `;

    console.log(shader);


<!-- end snippet -->

outputs:

      float plusToPlusMinus(float v) {
         return v * 2.0 - 1.0;
      }

    ...
    void main() {
     a = b * 3.14159;
    }


