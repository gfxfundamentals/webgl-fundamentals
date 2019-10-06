Title: Drawing a circle in fragment shader
Description:
TOC: qna

# Question:

I am a complete noob when it comes to creating shaders. Or better said, I just learned about it yesterday.

I am trying to create a really simple circle. I thouht I finally figured it out but it turns out to be to large. It should match the DisplayObject size where the filter is applied to.

The fragment shader:

    precision mediump float;
    
    varying vec2 vTextureCoord;
    vec2 resolution = vec2(1.0, 1.0);

    void main() {
        vec2 uv = vTextureCoord.xy / resolution.xy;
        uv -= 0.5;
        uv.x *= resolution.x / resolution.y;
        float r = 0.5;
        float d = length(uv);
        float c = smoothstep(d,d+0.003,r);
        gl_FragColor = vec4(vec3(c,0.5,0.0),1.0);
    }

Example using Pixi.js: 

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var app = new PIXI.Application();
    document.body.appendChild(app.view);

    var background = PIXI.Sprite.fromImage("required/assets/bkg-grass.jpg");
    background.width = 200;
    background.height = 200;
    app.stage.addChild(background);

    var vertexShader = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat3 projectionMatrix;

    varying vec2 vTextureCoord;

    void main(void)
    {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
    }
    `;

    var fragShader = `
    precision mediump float;

    varying vec2 vTextureCoord;
    vec2 resolution = vec2(1.0, 1.0);

    void main() {
        vec2 uv = vTextureCoord.xy / resolution.xy;
        uv -= 0.5;
        uv.x *= resolution.x / resolution.y;
        float r = 0.5;
        float d = length(uv);
        float c = smoothstep(d,d+0.003,r);
        gl_FragColor = vec4(vec3(c,0.5,0.),1.0);
    }
    `;
    var filter = new PIXI.Filter(vertexShader, fragShader);
    filter.padding = 0;
    background.filters = [filter];

<!-- language: lang-css -->

    body { margin: 0; }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.5.2/pixi.js"></script>

<!-- end snippet -->



# Answer

Pixi.js's `vTextureCoord` do not go from 0 to 1.

From [the docs](https://github.com/pixijs/pixi.js/wiki/Creating-Filters-in-Pixi-v4) 

> V4 filters differ from V3. You can't just add in the shader and assume that texture coordinates are in the [0,1] range.
>
> ...
>
> Note: vTextureCoord multiplied by filterArea.xy is the real size of bounding box.
>
> If you want to get the pixel coordinates, use uniform filterArea, it will be passed to the filter automatically.
>
>     uniform vec4 filterArea;
>     ...
>     vec2 pixelCoord = vTextureCoord * filterArea.xy;
>
> They are in pixels. That won't work if we want something like "fill the ellipse into a bounding box". So, lets pass dimensions too! PIXI doesnt do it automatically, we need a manual fix:
>
>     filter.apply = function(filterManager, input, output)
>     {
>       this.uniforms.dimensions[0] = input.sourceFrame.width
>       this.uniforms.dimensions[1] = input.sourceFrame.height
>
>       // draw the filter...
>      filterManager.applyFilter(this, input, output);
>     }
>
> Lets combine it in shader!
>
>     uniform vec4 filterArea;
>     uniform vec2 dimensions;
>     ...
>     vec2 pixelCoord = vTextureCoord * filterArea.xy;
>     vec2 normalizedCoord = pixelCoord / dimensions;
 
Here's your snippet updated.

<!-- begin snippet: js hide: true console: false babel: false -->

<!-- language: lang-js -->

    var app = new PIXI.Application();
    document.body.appendChild(app.view);

    var background = PIXI.Sprite.fromImage("required/assets/bkg-grass.jpg");
    background.width = 200;
    background.height = 200;
    app.stage.addChild(background);

    var vertexShader = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat3 projectionMatrix;

    varying vec2 vTextureCoord;

    void main(void)
    {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
    }
    `;

    var fragShader = `
    precision mediump float;

    varying vec2 vTextureCoord;
    uniform vec2 dimensions;
    uniform vec4 filterArea;

    void main() {
        vec2 pixelCoord = vTextureCoord * filterArea.xy;
        vec2 uv = pixelCoord / dimensions;
        uv -= 0.5;
        float r = 0.5;
        float d = length(uv);
        float c = smoothstep(d,d+0.003,r);
        gl_FragColor = vec4(vec3(c,0.5,0.),1.0);
    }
    `;
    var filter = new PIXI.Filter(vertexShader, fragShader);
    filter.apply = function(filterManager, input, output)
    {
      this.uniforms.dimensions[0] = input.sourceFrame.width
      this.uniforms.dimensions[1] = input.sourceFrame.height

      // draw the filter...
      filterManager.applyFilter(this, input, output);
    }

    filter.padding = 0;
    background.filters = [filter];

<!-- language: lang-css -->

    body { margin: 0; }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.5.2/pixi.js"></script>

<!-- end snippet -->


