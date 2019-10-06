Title: Export from Shadertoy to Three.js
Description:
TOC: qna

# Question:

I am making my first steps coding. I made some courses on internet, then I played with some three.js experiments, and now I would like to continue learning experimenting with Shaders.

I found Shadertoy.com and it's really amazing! There are a lot of difference experiments with incredible effects. I am trying to use one of these shaders in Three.js but is not so easy.

The Shaders are already written, it's true. But I don't know what to do with that, I don't know how I can use it.

Because it's not only copy and paste the code. There is a relation that I have to write to can apply some of these amazing effects to a Three.js geometry. I have to use uniforms, and I don't know how I can make to know which uniforms I can use, and how can I use them.

I started see the tutorials in Shadertoy and some articles on Internet and it looks like something really abstract. I think that I should study a lot of maths before start understanding that language.

Do you have some recommendation to start? 

Maybe is something simpler than I think and I can just copy, paste, and experiment with the code on my HTML document?

# Answer

Shadertoy is a relatively complex program. It's got audio input into shaders, video input into shaders, audio data generation from shaders, various kinds of textures including both 2d and cubemaps. Supporting all those features is not a small amount of work.

That said a basic shader can be used pretty easily, see example below. But shadertoy shaders are not really designed to be used as materials on meshes in three.js. 

If you want to understand why and how WebGL works see http://webglfundamentals.org 



<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    const vs = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
    `;
    const userShader = `
    // FROM: https://www.shadertoy.com/view/4sdXDl
    //spikey
    #define SHAPE length(z.yz)
    //normal
    //#define SHAPE length(z.xyz)
    //bizarro
    //#define SHAPE length(z.yz-z.xx)
    //etc...
    #define HIGH_QUAL
    #ifdef HIGH_QUAL
    #define MARCH_STEPS 199
    #else
    #define MARCH_STEPS 99
    #endif
    float k=7.0+3.0*sin(iGlobalTime*0.15);
    vec3 mcol=vec3(0.0);
    void AbsBox(inout vec4 z){//abs box by kali 
     z.xyz=abs(z.xyz+1.0)-1.0; 
     z*=1.5/clamp(dot(z.xyz,z.xyz),0.25,1.0);
    }
    void Bulb(inout vec4 z, in vec4 c){//mandelBulb by twinbee
     float r = length(z.xyz);
     float zo = asin(z.z / r) * k + iGlobalTime*0.15;
     float zi = atan(z.y, z.x) * 7.0;
     z=pow(r, k-1.0)*vec4(r*vec3(cos(zo)*vec2(cos(zi),sin(zi)),sin(zo)),z.w*k)+c; 
    }
    float DE(vec3 p){
      vec4 c = vec4(p,1.0),z = c;
      Bulb(z,c);
      float r0=(length(z.xyz)-1.15)/z.w;
      z.xyz-=1.0;
      for(int i=0;i<7;i++)AbsBox(z);
      float r=SHAPE;
      mcol.rgb=vec3(1.0,0.5,0.2)+abs(sin(0.2*r+100.0*z.yxz/z.w));
      return 0.5 * max((r-1.0) / z.w,-r0);
    }

    vec3 sky(vec3 rd, vec3 L){//modified bananaft's & public_int_i's code
      float d=0.4*dot(rd,L)+0.6;
      //return vec3(d);
      rd.y+=sin(sqrt(clamp(-rd.y,0.0,0.9))*90.0)*0.45*max(-0.1,rd.y);
      rd=abs(rd);
      float y=max(0.,L.y),sun=max(1.-(1.+10.*y+rd.y)*length(rd-L),0.)
        +.3*pow(1.-rd.y,12.)*(1.6-y);
      return d*mix(vec3(0.3984,0.5117,0.7305),vec3(0.7031,0.4687,0.1055),sun)
        *((.5+pow(y,.4))*(1.5-abs(L.y))+pow(sun,5.2)*y*(5.+15.0*y));
    }
    float rnd;
    void randomize(in vec2 p){rnd=fract(float(iFrame)+sin(dot(p,vec2(13.3145,117.7391)))*42317.7654321);}

    float ShadAO(in vec3 ro, in vec3 rd){
     float t=0.0,s=1.0,d,mn=0.01;
     for(int i=0;i<12;i++){
      d=max(DE(ro+rd*t)*1.5,mn);
      s=min(s,d/t+t*0.5);
      t+=d;
     }
     return s;
    }
    vec3 scene(vec3 ro, vec3 rd){
      vec3 L=normalize(vec3(0.4,0.025,0.5));
      vec3 bcol=sky(rd,L);
      vec4 col=vec4(0.0);//color accumulator
      float t=DE(ro)*rnd,d,od=1.0,px=1.0/iResolution.x;
      for(int i=0;i<MARCH_STEPS;i++){
        d=DE(ro);
        if(d<px*t){
          float dif=clamp(1.0-d/od,0.2,1.0);
          vec3 scol=mcol*dif*(1.3-0.3*t);
    #ifdef HIGH_QUAL
           vec2 s=vec2(DE(ro+d*4.0*L),DE(ro+d*16.0*L));
            scol*=clamp(0.5*s.x/d+(s.y/d)/8.0,0.0,1.0);
    #endif
          float alpha=(1.0-col.w)*clamp(1.0-d/(px*t),0.0,1.0);
          col+=vec4(clamp(scol,0.0,1.0),1.0)*alpha;
          if(col.w>0.9)break;
        }
        t+=d;ro+=rd*d;od=d;
        if(t>6.0)break;
      }
      col.rgb+=bcol*(1.0-clamp(col.w,0.0,1.0));
      return col.rgb;
    }
    mat3 lookat(vec3 fw){
     fw=normalize(fw);vec3 rt=normalize(cross(fw,vec3(0.0,1.0,0.0)));return mat3(rt,cross(rt,fw),fw);
    }
    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
       randomize(fragCoord);
       float tim=iGlobalTime*0.3,r=2.0+cos(tim*0.7);
       vec2 uv=(fragCoord-0.5*iResolution.xy)/iResolution.x;
       vec3 ro=vec3(sin(tim)*r,sin(tim*0.4),cos(tim)*r);
       vec3 rd=lookat(-ro)*normalize(vec3(uv,1.0));
       //rd+=2.0*cross(qrt.xyz,cross(qrt.xyz,rd)+qrt.w*rd);
       fragColor=vec4(scene(ro,rd)*2.0,1.0);
    }
    `;

    // FROM shadertoy.com 
    const shadertoyBoilerplate = `
    #extension GL_OES_standard_derivatives : enable
    //#extension GL_EXT_shader_texture_lod : enable
    #ifdef GL_ES
    precision highp float;
    #endif
    uniform vec3      iResolution;
    uniform float     iGlobalTime;
    uniform float     iChannelTime[4];
    uniform vec4      iMouse;
    uniform vec4      iDate;
    uniform float     iSampleRate;
    uniform vec3      iChannelResolution[4];
    uniform int       iFrame;
    uniform float     iTimeDelta;
    uniform float     iFrameRate;
    struct Channel
    {
        vec3  resolution;
        float time;
    };
    uniform Channel iChannel[4];
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;
    uniform sampler2D iChannel3;
    void mainImage( out vec4 c,  in vec2 f );

    ${userShader}

    void main( void ){
      vec4 color = vec4(0.0,0.0,0.0,1.0);
      mainImage( color, gl_FragCoord.xy );
      color.w = 1.0;
      gl_FragColor = color;
    }
    `;

    const $ = document.querySelector.bind(document);

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -1, -1, 
       1, -1, 
      -1,  1, 
      -1,  1, 
       1, -1, 
       1,  1, 
    ]);
    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 2 ) );

    const uniforms = {
      iGlobalTime: { type: "f", value: 1.0 },
      iResolution: { type: "v3", value: new THREE.Vector3() },
    };

    const material = new THREE.RawShaderMaterial({
      uniforms: uniforms,
      vertexShader: vs,
      fragmentShader: shadertoyBoilerplate,
    });

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    var renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);

    resize(true);
    render(0);

    function resize(force) {
      var canvas = renderer.domElement;
      var dpr    = 1; //window.devicePixelRatio;  // make 1 or less if too slow
      var width  = canvas.clientWidth  * dpr;
      var height = canvas.clientHeight * dpr;
      if (force || width != canvas.width || height != canvas.height) {
        renderer.setSize( width, height, false );
        uniforms.iResolution.value.x = renderer.domElement.width;
        uniforms.iResolution.value.y = renderer.domElement.height;
      }
    }

    function render(time) {
      resize();
      uniforms.iGlobalTime.value = time * 0.001;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

<!-- language: lang-css -->

    canvas {
      border: 1px solid black;
    }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r74/three.min.js"></script>

<!-- end snippet -->

The code above from shadertoy passes `gl_FragCoord` as input to the user's shader which is the pixel coordinate of the pixel being drawn in the canvas. 

For a model we can pass in UV coordinates instead, we just have to choose a resolution to multiply them by since UV coordinates usually go from 0 to 1 and the shadertoy shaders are expecting 0 to canvas.width and 0 to canvas.height

Example:

<!-- begin snippet: js hide: false console: false babel: false -->

<!-- language: lang-js -->

    const vs = `
    varying vec2 vUv;

    void main()
    {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * mvPosition;
    }
    `;
    const userShader = `
    // FROM: https://www.shadertoy.com/view/4sdXDl
    //spikey
    #define SHAPE length(z.yz)
    //normal
    //#define SHAPE length(z.xyz)
    //bizarro
    //#define SHAPE length(z.yz-z.xx)
    //etc...
    #define HIGH_QUAL
    #ifdef HIGH_QUAL
    #define MARCH_STEPS 199
    #else
    #define MARCH_STEPS 99
    #endif
    float k=7.0+3.0*sin(iGlobalTime*0.15);
    vec3 mcol=vec3(0.0);
    void AbsBox(inout vec4 z){//abs box by kali 
     z.xyz=abs(z.xyz+1.0)-1.0; 
     z*=1.5/clamp(dot(z.xyz,z.xyz),0.25,1.0);
    }
    void Bulb(inout vec4 z, in vec4 c){//mandelBulb by twinbee
     float r = length(z.xyz);
     float zo = asin(z.z / r) * k + iGlobalTime*0.15;
     float zi = atan(z.y, z.x) * 7.0;
     z=pow(r, k-1.0)*vec4(r*vec3(cos(zo)*vec2(cos(zi),sin(zi)),sin(zo)),z.w*k)+c; 
    }
    float DE(vec3 p){
      vec4 c = vec4(p,1.0),z = c;
      Bulb(z,c);
      float r0=(length(z.xyz)-1.15)/z.w;
      z.xyz-=1.0;
      for(int i=0;i<7;i++)AbsBox(z);
      float r=SHAPE;
      mcol.rgb=vec3(1.0,0.5,0.2)+abs(sin(0.2*r+100.0*z.yxz/z.w));
      return 0.5 * max((r-1.0) / z.w,-r0);
    }

    vec3 sky(vec3 rd, vec3 L){//modified bananaft's & public_int_i's code
      float d=0.4*dot(rd,L)+0.6;
      //return vec3(d);
      rd.y+=sin(sqrt(clamp(-rd.y,0.0,0.9))*90.0)*0.45*max(-0.1,rd.y);
      rd=abs(rd);
      float y=max(0.,L.y),sun=max(1.-(1.+10.*y+rd.y)*length(rd-L),0.)
        +.3*pow(1.-rd.y,12.)*(1.6-y);
      return d*mix(vec3(0.3984,0.5117,0.7305),vec3(0.7031,0.4687,0.1055),sun)
        *((.5+pow(y,.4))*(1.5-abs(L.y))+pow(sun,5.2)*y*(5.+15.0*y));
    }
    float rnd;
    void randomize(in vec2 p){rnd=fract(float(iFrame)+sin(dot(p,vec2(13.3145,117.7391)))*42317.7654321);}

    float ShadAO(in vec3 ro, in vec3 rd){
     float t=0.0,s=1.0,d,mn=0.01;
     for(int i=0;i<12;i++){
      d=max(DE(ro+rd*t)*1.5,mn);
      s=min(s,d/t+t*0.5);
      t+=d;
     }
     return s;
    }
    vec3 scene(vec3 ro, vec3 rd){
      vec3 L=normalize(vec3(0.4,0.025,0.5));
      vec3 bcol=sky(rd,L);
      vec4 col=vec4(0.0);//color accumulator
      float t=DE(ro)*rnd,d,od=1.0,px=1.0/iResolution.x;
      for(int i=0;i<MARCH_STEPS;i++){
        d=DE(ro);
        if(d<px*t){
          float dif=clamp(1.0-d/od,0.2,1.0);
          vec3 scol=mcol*dif*(1.3-0.3*t);
    #ifdef HIGH_QUAL
           vec2 s=vec2(DE(ro+d*4.0*L),DE(ro+d*16.0*L));
            scol*=clamp(0.5*s.x/d+(s.y/d)/8.0,0.0,1.0);
    #endif
          float alpha=(1.0-col.w)*clamp(1.0-d/(px*t),0.0,1.0);
          col+=vec4(clamp(scol,0.0,1.0),1.0)*alpha;
          if(col.w>0.9)break;
        }
        t+=d;ro+=rd*d;od=d;
        if(t>6.0)break;
      }
      col.rgb+=bcol*(1.0-clamp(col.w,0.0,1.0));
      return col.rgb;
    }
    mat3 lookat(vec3 fw){
     fw=normalize(fw);vec3 rt=normalize(cross(fw,vec3(0.0,1.0,0.0)));return mat3(rt,cross(rt,fw),fw);
    }
    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
       randomize(fragCoord);
       float tim=iGlobalTime*0.3,r=2.0+cos(tim*0.7);
       vec2 uv=(fragCoord-0.5*iResolution.xy)/iResolution.x;
       vec3 ro=vec3(sin(tim)*r,sin(tim*0.4),cos(tim)*r);
       vec3 rd=lookat(-ro)*normalize(vec3(uv,1.0));
       //rd+=2.0*cross(qrt.xyz,cross(qrt.xyz,rd)+qrt.w*rd);
       fragColor=vec4(scene(ro,rd)*2.0,1.0);
    }
    `;

    // FROM shadertoy.com 
    const shadertoyBoilerplate = `
    #extension GL_OES_standard_derivatives : enable
    //#extension GL_EXT_shader_texture_lod : enable
    #ifdef GL_ES
    precision highp float;
    #endif
    uniform vec3      iResolution;
    uniform float     iGlobalTime;
    uniform float     iChannelTime[4];
    uniform vec4      iMouse;
    uniform vec4      iDate;
    uniform float     iSampleRate;
    uniform vec3      iChannelResolution[4];
    uniform int       iFrame;
    uniform float     iTimeDelta;
    uniform float     iFrameRate;
    struct Channel
    {
        vec3  resolution;
        float time;
    };
    uniform Channel iChannel[4];
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;
    uniform sampler2D iChannel3;

    varying vec2 vUv;

    void mainImage( out vec4 c,  in vec2 f );

    ${userShader}

    void main( void ){
      vec4 color = vec4(0.0,0.0,0.0,1.0);
      mainImage( color, vUv * iResolution.xy );
      color.w = 1.0;
      gl_FragColor = color;
    }
    `;

    const $ = document.querySelector.bind(document);

    const fieldOfView = 45;
    const zNear = .1;
    const zFar  = 100;
    const camera = new THREE.PerspectiveCamera(fieldOfView, 1, zNear, zFar);
    camera.position.z = 3;

    const scene = new THREE.Scene();

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    const uniforms = {
      iGlobalTime: { type: "f", value: 1.0 },
      iResolution: { type: "v3", value: new THREE.Vector3() },
    };

    // choose a resolution to pass to the shader
    uniforms.iResolution.value.x = 100;
    uniforms.iResolution.value.y = 100;

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vs,
      fragmentShader: shadertoyBoilerplate,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    var renderer = new THREE.WebGLRenderer();
    document.body.appendChild(renderer.domElement);

    resize(true);
    render(0);

    function resize(force) {
      const canvas = renderer.domElement;
      const dpr    = 1; //window.devicePixelRatio;  // make 1 or less if too slow
      const width  = canvas.clientWidth  * dpr;
      const height = canvas.clientHeight * dpr;
      if (force || width != canvas.width || height != canvas.height) {
        renderer.setSize( width, height, false );
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    }

    function render(time) {
      time *= 0.001;  // seconds
      
      resize();
      
      uniforms.iGlobalTime.value = time;
      mesh.rotation.x = time * 0.5;
      mesh.rotation.y = time * 0.6;
      
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

<!-- language: lang-css -->

    body { margin: 0; }
    canvas { width: 100vw; height: 100vh; display: block; }

<!-- language: lang-html -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/86/three.min.js"></script>

<!-- end snippet -->

Note that shadertoy shaders are generally not designed to be used as materials. They are not efficient, rather they are more like a fun activity of "how cool an image can I make using only time and pixel location as input". Because of that while the results can be amazing they are often 10x or 100x or even 1000x slower than traditional techniques for materials (using textures)

Compare for example [this amazing shader](https://www.shadertoy.com/view/XtsSWs) which draws an entire city but at least on my machine it runs at 10-18fps in a small window and 1fps when fullscreen. VS for example Grand Theft Auto 5 which also shows an entire city yet manages to run at 30-60fps when fullscreen on the same machine.

There is a lot of fun to be had and lots of interesting techniques to learn on shadertoy.com that might be useful in your shaders but don't mistake what's there for "production" techniques. It's called shaderTOY for a reason 
