Title: Creating a Gradient Color in Fragment Shader
Description:
TOC: qna

# Question:

I'm trying to achieve making a gradient color as the design apps (Photoshop for example) does, but can't get the exact result i want.

My shader creates very nice 'gradients' but also contains other colors that are different from the colors I want to switch in.

It looks nice but, my aim is adding blending functions later and make a kind of color correction shader. but first of all I have to get the right colors.

Here is my fragment shader
http://player.thebookofshaders.com/?log=171119111216

    uniform vec2 u_resolution;

    void main() {
    
      vec2 st = gl_FragCoord.xy/u_resolution.xy;
    
      vec3 color1 = vec3(1.9,0.55,0);
      vec3 color2 = vec3(0.226,0.000,0.615);

   float mixValue = distance(st,vec2(0,1));
      vec3 color = mix(color1,color2,mixValue);

      gl_FragColor = vec4(color,mixValue);
    }


And here is [![comparison of the results in shader and design apps][1]][1]

Thanks in advance..

  [1]: https://i.stack.imgur.com/YZcs9.png

# Answer

In response to just the title of your question you might also want to consider doing the mix in other color spaces. Your code is mixing in RGB space but you'll get different results in different spaces.

Example

<img src="https://i.stack.imgur.com/tSNdr.png" width="438">

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl");
    gl.canvas.width = 100;
    gl.canvas.height = 100;
    gl.viewport(0, 0, 100, 100);

    const vsrc = `
    void main() {
     gl_PointSize = 100.0;
     gl_Position = vec4(0, 0, 0, 1);
    }
    `;
    const fRGB = `
    precision mediump float;

    uniform vec3 color1;
    uniform vec3 color2;

    void main() {
      vec2 st = gl_PointCoord;
      float mixValue = distance(st, vec2(0, 1));

      vec3 color = mix(color1, color2, mixValue);
        
      gl_FragColor = vec4(color, 1);
    }
    `;
    const fHSV = `
    precision mediump float;

    uniform vec3 color1;
    uniform vec3 color2;

    // from: http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
      c = vec3(c.x, clamp(c.yz, 0.0, 1.0));
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec2 st = gl_PointCoord;
      float mixValue = distance(st, vec2(0, 1));

      vec3 hsv1 = rgb2hsv(color1);
      vec3 hsv2 = rgb2hsv(color2);
      
      // mix hue in toward closest direction
      float hue = (mod(mod((hsv2.x - hsv1.x), 1.) + 1.5, 1.) - 0.5) * mixValue + hsv1.x;
      vec3 hsv = vec3(hue, mix(hsv1.yz, hsv2.yz, mixValue));
      
      vec3 color = hsv2rgb(hsv);
        
      gl_FragColor = vec4(color, 1);
    }

    `;

    const fHSL = `
    precision mediump float;

    uniform vec3 color1;
    uniform vec3 color2;

    const float Epsilon = 1e-10;

    vec3 rgb2hcv(in vec3 RGB)
    {
      // Based on work by Sam Hocevar and Emil Persson
      vec4 P = lerp(vec4(RGB.bg, -1.0, 2.0/3.0), vec4(RGB.gb, 0.0, -1.0/3.0), step(RGB.b, RGB.g));
      vec4 Q = mix(vec4(P.xyw, RGB.r), vec4(RGB.r, P.yzx), step(P.x, RGB.r));
      float C = Q.x - min(Q.w, Q.y);
      float H = abs((Q.w - Q.y) / (6. * C + Epsilon) + Q.z);
      return vec3(H, C, Q.x);
    }

    vec3 rgb2hsl(in vec3 RGB)
    {
      vec3 HCV = rgb2hcv(RGB);
      float L = HCV.z - HCV.y * 0.5;
      float S = HCV.y / (1 - abs(L * 2. - 1.) + Epsilon);
      return vec3(HCV.x, S, L);
    }

    vec3 hsl2rgb(vec3 c)
    {
      c = vec3(fract(c.x), clamp(c.yz, 0.0, 1.0));
      vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
      return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
    }

    void main() {
      vec2 st = gl_PointCoord;
      float mixValue = distance(st, vec2(0, 1));

      vec3 hsl1 = rgb2hsl(color1);
      vec3 hsl2 = rgb2hsl(color2);
      
      // mix hue in toward closest direction
      float hue = (mod(mod((hsl2.x - hsl1.x), 1.) + 1.5, 1.) - 0.5) * mixValue + hsl1.x;
      vec3 hsl = vec3(hue, mix(hsl1.yz, hsl2.yz, mixValue));

      vec3 color = hsl2rgb(hsv);
        
      gl_FragColor = vec4(color, 1);
    }
    `;

    const fLAB = `
    precision mediump float;

    uniform vec3 color1;
    uniform vec3 color2;

    // from: https://code.google.com/archive/p/flowabs/source

    vec3 rgb2xyz( vec3 c ) {
        vec3 tmp;
        tmp.x = ( c.r > 0.04045 ) ? pow( ( c.r + 0.055 ) / 1.055, 2.4 ) : c.r / 12.92;
        tmp.y = ( c.g > 0.04045 ) ? pow( ( c.g + 0.055 ) / 1.055, 2.4 ) : c.g / 12.92,
        tmp.z = ( c.b > 0.04045 ) ? pow( ( c.b + 0.055 ) / 1.055, 2.4 ) : c.b / 12.92;
        return 100.0 * tmp *
            mat3( 0.4124, 0.3576, 0.1805,
                  0.2126, 0.7152, 0.0722,
                  0.0193, 0.1192, 0.9505 );
    }

    vec3 xyz2lab( vec3 c ) {
        vec3 n = c / vec3( 95.047, 100, 108.883 );
        vec3 v;
        v.x = ( n.x > 0.008856 ) ? pow( n.x, 1.0 / 3.0 ) : ( 7.787 * n.x ) + ( 16.0 / 116.0 );
        v.y = ( n.y > 0.008856 ) ? pow( n.y, 1.0 / 3.0 ) : ( 7.787 * n.y ) + ( 16.0 / 116.0 );
        v.z = ( n.z > 0.008856 ) ? pow( n.z, 1.0 / 3.0 ) : ( 7.787 * n.z ) + ( 16.0 / 116.0 );
        return vec3(( 116.0 * v.y ) - 16.0, 500.0 * ( v.x - v.y ), 200.0 * ( v.y - v.z ));
    }

    vec3 rgb2lab(vec3 c) {
        vec3 lab = xyz2lab( rgb2xyz( c ) );
        return vec3( lab.x / 100.0, 0.5 + 0.5 * ( lab.y / 127.0 ), 0.5 + 0.5 * ( lab.z / 127.0 ));
    }


    vec3 lab2xyz( vec3 c ) {
        float fy = ( c.x + 16.0 ) / 116.0;
        float fx = c.y / 500.0 + fy;
        float fz = fy - c.z / 200.0;
        return vec3(
             95.047 * (( fx > 0.206897 ) ? fx * fx * fx : ( fx - 16.0 / 116.0 ) / 7.787),
            100.000 * (( fy > 0.206897 ) ? fy * fy * fy : ( fy - 16.0 / 116.0 ) / 7.787),
            108.883 * (( fz > 0.206897 ) ? fz * fz * fz : ( fz - 16.0 / 116.0 ) / 7.787)
        );
    }

    vec3 xyz2rgb( vec3 c ) {
        vec3 v =  c / 100.0 * mat3( 
            3.2406, -1.5372, -0.4986,
            -0.9689, 1.8758, 0.0415,
            0.0557, -0.2040, 1.0570
        );
        vec3 r;
        r.x = ( v.r > 0.0031308 ) ? (( 1.055 * pow( v.r, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.r;
        r.y = ( v.g > 0.0031308 ) ? (( 1.055 * pow( v.g, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.g;
        r.z = ( v.b > 0.0031308 ) ? (( 1.055 * pow( v.b, ( 1.0 / 2.4 ))) - 0.055 ) : 12.92 * v.b;
        return r;
    }

    vec3 lab2rgb(vec3 c) {
        return xyz2rgb( lab2xyz( vec3(100.0 * c.x, 2.0 * 127.0 * (c.y - 0.5), 2.0 * 127.0 * (c.z - 0.5)) ) );
    }

    void main() {
      vec2 st = gl_PointCoord;
      float mixValue = distance(st, vec2(0, 1));

      vec3 lab1 = rgb2lab(color1);
      vec3 lab2 = rgb2lab(color2);
        
      vec3 lab = mix(lab1, lab2, mixValue);
      
      vec3 color = lab2rgb(lab);
        
      gl_FragColor = vec4(color, 1);
    }
    `;

    function draw(gl, shaders, color1, color2, label) {
      const programInfo = twgl.createProgramInfo(gl, shaders);
      gl.useProgram(programInfo.program);
      twgl.setUniforms(programInfo, {
        color1: color1,
        color2: color2,
      });
      gl.drawArrays(gl.POINTS, 0, 1);
      const div = document.createElement("div");
      const img = new Image();
      img.src = gl.canvas.toDataURL();
      div.appendChild(img);
      const inner = document.createElement("span");
      inner.textContent = label;
      div.appendChild(inner);
      document.body.appendChild(div);
    }

    const color1 = [1.0, 0.55, 0];
    const color2 = [0.226, 0.000, 0.615];

    draw(gl, [vsrc, fRGB], color1, color2, "rgb");
    draw(gl, [vsrc, fHSV], color1, color2, "hsv");
    draw(gl, [vsrc, fHSV], color1, color2, "hsl");
    draw(gl, [vsrc, fLAB], color1, color2, "lab");

<!-- language: lang-css -->

    img { border: 1px solid black; margin: 2px; }
    span { display: block; }
    div { display: inline-block; text-align: center; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->

I would also suggest passing your colors in in a ramp texture. An Nx1 texture and using

    color = texture2D(
        rampTexture, 
        vec2((mixValue * (rampWidth - 1.) + .5) / rampWidth, 0.5)).rgb;

Then you can easily blend across 2 colors, 3 colors, 20 colors. You can space out the colors as well by repeating colors etc..

Example:

<img src="https://i.stack.imgur.com/bcxRv.png" width="537">

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const gl = document.createElement("canvas").getContext("webgl");
    gl.canvas.width = 100;
    gl.canvas.height = 100;
    gl.viewport(0, 0, 100, 100);

    const vsrc = `
    void main() {
     gl_PointSize = 100.0;
     gl_Position = vec4(0, 0, 0, 1);
    }
    `;
    const fsrc = `
    precision mediump float;

    uniform sampler2D rampTexture;
    uniform float rampWidth;

    void main() {
      vec2 st = gl_PointCoord;
      float mixValue = distance(st, vec2(0, 1));

      vec3 color = texture2D(
        rampTexture, 
        vec2((mixValue * (rampWidth - 1.) + .5) / rampWidth, 0.5)).rgb;
        
      gl_FragColor = vec4(color, 1);
    }
    `;

    const programInfo = twgl.createProgramInfo(gl, [vsrc, fsrc]);
    gl.useProgram(programInfo.program);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    function draw(gl, ramp, label) {
      const width = ramp.length;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const level = 0;
      const internalFormat = gl.RGB;
      const height = 1;
      const border = 0;
      const format = gl.RGB;
      const type = gl.UNSIGNED_BYTE;
      const rampData = new Uint8Array([].concat(...ramp).map(v => v * 255));
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border,
                    format, type, rampData);
      twgl.setUniforms(programInfo, {
        rampTexture: tex,
        rampWidth: width,
      });
      gl.drawArrays(gl.POINTS, 0, 1);
      const div = document.createElement("div");
      const img = new Image();
      img.src = gl.canvas.toDataURL();
      div.appendChild(img);
      const inner = document.createElement("span");
      inner.textContent = label;
      div.appendChild(inner);
      document.body.appendChild(div);
    }

    const color1 = [1.0, 0.55, 0];
    const color2 = [0.226, 0.000, 0.615];
    const r = [1, 0, 0];
    const g = [0, 1, 0];
    const b = [0, 0, 1];
    const w = [1, 1, 1];

    draw(gl, [color1, color2], "color1->color2");
    draw(gl, [r, g], "red->green");
    draw(gl, [r, g, b], "r->g->b");
    draw(gl, [r, b, r, b, r], "r->b->r->b->r");
    draw(gl, [g, b, b, b, g], "g->b->b->b->g");

<!-- language: lang-css -->

    img { border: 1px solid black; margin: 2px; }
    span { display: block; }
    div { display: inline-block; text-align: center; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl.min.js"></script>

<!-- end snippet -->


  [1]: https://i.stack.imgur.com/bcxRv.png
