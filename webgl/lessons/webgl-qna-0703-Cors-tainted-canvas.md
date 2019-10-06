Title: Cors tainted canvas
Description:
TOC: qna

# Question:

I'm running a mjpeg streamer and trying to set the stream as a texture in three.js.
 
I'm doing this by writing it to a canvas and then the canvas as the texture.
However, I get a tainted canvas error. 

    DOMException: Failed to execute 'texImage2D' on 'WebGLRenderingContext': 
    Tainted canvases may not be loaded.

I have added the crossOrigin header on the server, and it is recieved as: 
 
      Access-Control-Allow-Origin:*
      Content-type:multipart/x-mixed-replace; boundary=--jpgboundary
      Date:Tue, 04 Apr 2017 22:27:35 GMT
      Server:BaseHTTP/0.3 Python/2.7.9**strong text**

on the client side I have added the appropriate crossOrigin attributes

    <p>Image to use:</p>
    <img id="stream" crossorigin="anonymous" 
    src="http://192.168.1.224:8080/cam.mjpg">
 
 
    <p>Canvas:</p>
    <canvas id="myCanvas" width="200" height="200" style="border:1px solid 
    #d3d3d3;">
    Your browser does not support the HTML5 canvas tag.
    </canvas>

    function updateCanvas() {
  var c = document.getElementById("myCanvas");
  var ctx2 = c.getContext("2d");
  var img = document.getElementById("stream");
  img.crossOrigin = "anonymous";
  ctx2.drawImage(img, 0, 0);
    }


Does anyone have any idea what isn't working here?



Edit: sorry i should have clarified, putting it on the canvas works fine, the problem is that when i try and use that canvas as a texture, then the canvas is tainted and it fails

    function init() {
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        document.body.appendChild(renderer.domElement);
    
     scene = new THREE.Scene();
  
        camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
        camera.position.z = 500;
        scene.add(camera);
        window.setTimeout("updateCanvas()", 1000); //start with a delay
        texture = new THREE.Texture(canvas);
        var material = new THREE.MeshBasicMaterial({ map: texture });
        geometry = new THREE.BoxGeometry( 200, 200, 200 );
        mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );
        canvas.width = canvas.height = size;
        renderer.setClearColor(0xeeeeee, 1);
    }


    function animate() {
       requestAnimationFrame(animate);
       updateCanvas();
       texture.needsUpdate = true;
       mesh.rotation.y += 0.01;
       renderer.render(scene, camera);
    }

# Answer

I don't see any reason your code won't work. Setting `img.crossOrigin` has no point because the image has already been downloaded in your example. 

Trying it with an image from imgur it works. Which suggests the issue is with your server?

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    function updateCanvas() {
      var c = document.getElementById("myCanvas");
      var ctx2 = c.getContext("2d");
      var img = document.getElementById("stream");
      ctx2.drawImage(img, 0, 0);
      try {
        const d = c.toDataURL();
        log("canvas is not dirty, CORS permission received, it can be used in WebGL");
      } catch (e) {
        log("canvas IS dirty, no CORS permission, it can *NOT* be used in WebGL");
      }
    }

    function log(...args) {
      const elem = document.createElement("pre");
      elem.textContent = [...args].join("\n");
      document.body.appendChild(elem);
    }


    document.getElementById("stream").addEventListener('click', updateCanvas);

<!-- language: lang-css -->

    img, canvas { width: 32px; }
    p { margin: 0; }

<!-- language: lang-html -->

    <p>Click the Image:</p>
    <img id="stream" crossorigin="anonymous" src="https://i.imgur.com/TSiyiJv.jpg">


    <p>Canvas:</p>
    <canvas id="myCanvas" width="200" height="200" style="border:1px solid 
    #d3d3d3;">
    </canvas>

<!-- end snippet -->

Maybe check the headers from imgur and see what's different?
