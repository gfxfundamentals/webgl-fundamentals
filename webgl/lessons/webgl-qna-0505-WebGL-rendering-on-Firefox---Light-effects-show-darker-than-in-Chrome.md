Title: WebGL rendering on Firefox - Light effects show darker than in Chrome
Description:
TOC: qna

# Question:

I have a scene where one light is present, and diamonds.
Light properties:
Point light, position: 0 0 30, intensity: 1, distance 60, color: White. 
The diamonds material is Phong, color:Red, no emissive, specular: White, shininess 10. 

On Chrome, the diamons shine as suppose to, but on Firefox the diamonds not shine at all, and looks very dark (like have something black on it).

I have tried to use both Firefox on desktop Windows and Android mobile phone.

I would like to ask what I am missing? 

Below are the settings in my code: 

    // Renderer: 
    ren=new THREE.WebGLRenderer({ antialias:true,alpha:true });
    ren.shadowMap.enabled=true;
    elm.appendChild(ren.domElement); // the renderer is added to a DOM element "elm"

    // Light
    var o=new THREE.PointLight(0xffffff,1,60);
 o.position.set(0,0,30);
 o.name="sun"; // light will be later added to the scene, and use "update materials" flag to update the materials of the entire scene.
    
    // The diamond's material: (I gave a new parameter "name", for later use. I guess it should not makes trouble to the engine....)
    var mt=new THREE.MeshPhongMaterial({ name:"RedDiamond", transparent:true, opacity:0.85, fog:false, color:0xff0020, specular:0xffffff, shininess:10 }); 

Live example can see here: https://www.crazygao.com/VideoGames/Lamps, since the first level (loading may takes a bit time only for the first time, the opening scene though is yet not complete). The lighting difference issue can be seen even in the progress scene (with the flash one)

<b>My question:</b> What should I do to make the diamonds shine in Firefox, but not make the entire scene too bright in Chrome? (I tried adding Ambient light to the scene, then in Chrome it becomes too bright....)

Is the problem comes from my settings, or it is the nature of Firefox? What are the best steps I can take to solve this issue? 

Thanks a lot

# Answer

My guess is that you're missing that the webgl canvas is composited with the HTML behind it. By default the browser expects the values of the pixels in the canvas to represent premultiplied alpha values. That means there are many possible **invalid colors**

Example RGBA = 1,1,1,0

That's an invalid color because since alpha = 0 and multiplying by 0 = 0 then R, G, and B also have to be zero

When the values are *invalid* the results are undefined and so you'll get different results on different browsers

[This answers covers some of the solutions](https://stackoverflow.com/a/35910189/128511).

