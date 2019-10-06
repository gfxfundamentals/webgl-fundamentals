Title: HTML Save WebGL Canvas as Image
Description:
TOC: qna

# Question:

I am using https://github.com/auduno/clmtrackr

I am trying to get the image to be saved from the following example: 
https://github.com/auduno/clmtrackr/blob/dev/examples/facedeform.html

The issue is that I have obviously tried "canvas.dataToURL()". I can get the video of the webcam as an image; however, the overlay image is always transparent.

I attempted using the texture to draw on a canvas, but that also didn't work....

I have an example here: https://codepen.io/msj121/pen/RgXjYK

I want to save the whole image with overlay to a png, like "dataToURL" I suppose.

    // when everything is ready, automatically start everything ?
    
        var vid = document.getElementById('videoel');
        var vid_width = vid.width;
        var vid_height = vid.height;
        var overlay = document.getElementById('overlay');
        var overlayCC = overlay.getContext('2d');
        var webgl_overlay = document.getElementById('webgl');
    
        // canvas for copying videoframes to
        var videocanvas = document.createElement('CANVAS');
        videocanvas.width = vid_width;
        videocanvas.height = vid_height;
    
        /*********** Setup of video/webcam and checking for webGL support *********/
    
        var videoReady = false;
        var imagesReady = false;
    
        function enablestart() {
         if (videoReady && imagesReady) {
          var startbutton = document.getElementById('startbutton');
          startbutton.value = "start";
          startbutton.disabled = null;
         }
        }
    
        $(window).load(function() {
         imagesReady = true;
         enablestart();
        });
    
        var insertAltVideo = function(video) {
         if (supports_video()) {
          if (supports_webm_video()) {
           video.src = "./media/cap13_edit2.webm";
          } else if (supports_h264_baseline_video()) {
           video.src = "./media/cap13_edit2.mp4";
          } else {
           return false;
          }
          fd.init(webgl_overlay);
          return true;
         } else return false;
        }
    
        // check whether browser supports webGL
        var webGLContext;
        var webGLTestCanvas = document.createElement('canvas');
        if (window.WebGLRenderingContext) {
         webGLContext = webGLTestCanvas.getContext('webgl') || webGLTestCanvas.getContext('experimental-webgl');
         if (!webGLContext || !webGLContext.getExtension('OES_texture_float')) {
          webGLContext = null;
         }
        }
        if (webGLContext == null) {
         alert("Your browser does not seem to support WebGL. Unfortunately this face mask example depends on WebGL, so you'll have to try it in another browser. :(");
        }
    
        function gumSuccess( stream ) {
         // add camera stream if getUserMedia succeeded
         if ("srcObject" in vid) {
          vid.srcObject = stream;
         } else {
          vid.src = (window.URL && window.URL.createObjectURL(stream));
         }
         vid.onloadedmetadata = function() {
          // resize overlay and video if proportions are different
          var proportion = vid.videoWidth/vid.videoHeight;
          vid_width = Math.round(vid_height * proportion);
          vid.width = vid_width;
          overlay.width = vid_width;
          webgl_overlay.width = vid_width;
          videocanvas.width = vid_width;
          
          fd.init(webgl_overlay);
          vid.play();
         }
        }
    
        function gumFail() {
         // fall back to video if getUserMedia failed
         insertAltVideo(vid);
         alert("There was some problem trying to fetch video from your webcam, using a fallback video instead.");
        }
    
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;
    
        // check for camerasupport
        if (navigator.mediaDevices) {
         navigator.mediaDevices.getUserMedia({video : true}).then(gumSuccess).catch(gumFail);
        } else if (navigator.getUserMedia) {
         navigator.getUserMedia({video : true}, gumSuccess, gumFail);
        } else {
         insertAltVideo(vid);
         alert("Your browser does not seem to support getUserMedia, using a fallback video instead.");
        }
    
        vid.addEventListener('canplay', function() {videoReady = true;enablestart();}, false);
    
        /*********** Code for face substitution *********/
    
        var animationRequest;
        var positions;
    
        var ctrack = new clm.tracker();
        ctrack.init(pModel);
    
        function startVideo() {
         // start video
         vid.play();
         // start tracking
         ctrack.start(vid);
         // start drawing face grid
         drawGridLoop();
        }
    
        var fd = new faceDeformer();
    
        var mouth_vertices = [
         [44,45,61,44],
         [45,46,61,45],
         [46,60,61,46],
         [46,47,60,46],
         [47,48,60,47],
         [48,59,60,48],
         [48,49,59,48],
         [49,50,59,49],
         [50,51,58,50],
         [51,52,58,51],
         [52,57,58,52],
         [52,53,57,52],
         [53,54,57,53],
         [54,56,57,54],
         [54,55,56,54],
         [55,44,56,55],
         [44,61,56,44],
         [61,60,56,61],
         [56,57,60,56],
         [57,59,60,57],
         [57,58,59,57],
         [50,58,59,50],
        ];
    
        var extendVertices = [
         [0,71,72,0],
         [0,72,1,0],
         [1,72,73,1],
         [1,73,2,1],
         [2,73,74,2],
         [2,74,3,2],
         [3,74,75,3],
         [3,75,4,3],
         [4,75,76,4],
         [4,76,5,4],
         [5,76,77,5],
         [5,77,6,5],
         [6,77,78,6],
         [6,78,7,6],
         [7,78,79,7],
         [7,79,8,7],
         [8,79,80,8],
         [8,80,9,8],
         [9,80,81,9],
         [9,81,10,9],
         [10,81,82,10],
         [10,82,11,10],
         [11,82,83,11],
         [11,83,12,11],
         [12,83,84,12],
         [12,84,13,12],
         [13,84,85,13],
         [13,85,14,13],
         [14,85,86,14],
         [14,86,15,14],
         [15,86,87,15],
         [15,87,16,15],
         [16,87,88,16],
         [16,88,17,16],
         [17,88,89,17],
         [17,89,18,17],
         [18,89,93,18],
         [18,93,22,18],
         [22,93,21,22],
         [93,92,21,93],
         [21,92,20,21],
         [92,91,20,92],
         [20,91,19,20],
         [91,90,19,91],
         [19,90,71,19],
         [19,71,0,19]
        ]
    
        function drawGridLoop() {
         // get position of face
         positions = ctrack.getCurrentPosition();
    
         overlayCC.clearRect(0, 0, vid_width, vid_height);
         if (positions) {
          // draw current grid
          ctrack.draw(overlay);
         }
         // check whether mask has converged
         var pn = ctrack.getConvergence();
         if (pn < 0.4) {
          drawMaskLoop();
         } else {
          requestAnimFrame(drawGridLoop);
         }
        }
    
        function drawMaskLoop() {
         videocanvas.getContext('2d').drawImage(vid,0,0,videocanvas.width,videocanvas.height);
    
         var pos = ctrack.getCurrentPosition();
    
         if (pos) {
          // create additional points around face
          var tempPos;
          var addPos = [];
          for (var i = 0;i < 23;i++) {
           tempPos = [];
           tempPos[0] = (pos[i][0] - pos[62][0])*1.3 + pos[62][0];
           tempPos[1] = (pos[i][1] - pos[62][1])*1.3 + pos[62][1];
           addPos.push(tempPos);
          }
          // merge with pos
          var newPos = pos.concat(addPos);
    
          var newVertices = pModel.path.vertices.concat(mouth_vertices);
          // merge with newVertices
          newVertices = newVertices.concat(extendVertices);
    
          fd.load(videocanvas, newPos, pModel, newVertices);
    
          var parameters = ctrack.getCurrentParameters();
          for (var i = 6;i < parameters.length;i++) {
           parameters[i] += ph['component '+(i-3)];
          }
          positions = ctrack.calculatePositions(parameters);
    
          overlayCC.clearRect(0, 0, vid_width, vid_height);
          if (positions) {
           // add positions from extended boundary, unmodified
           newPos = positions.concat(addPos);
           // draw mask on top of face
           fd.draw(newPos);
          }
         }
         animationRequest = requestAnimFrame(drawMaskLoop);
        }
    
        /*********** Code for stats **********/
    
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        document.getElementById('container').appendChild( stats.domElement );
    
        document.addEventListener("clmtrackrIteration", function(event) {
         stats.update();
        }, false);
    
        /********** parameter code *********/
    
        var pnums = pModel.shapeModel.eigenValues.length-2;
        var parameterHolder = function() {
         for (var i = 0;i < pnums;i++) {
          this['component '+(i+3)] = 0;
         }
         this.presets = 0;
        };
    
        var ph = new parameterHolder();
        var gui = new dat.GUI();
    
        var presets = {
         "unwell" : [0, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "inca" : [0, 0, -9, 0, -11, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0],
         "cheery" : [0, 0, -9, 9, -11, 0, 0, 0, 0, 0, 0, 0, -9, 0, 0, 0, 0, 0],
         "dopey" : [0, 0, 0, 0, 0, 0, 0, -11, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0],
         "longface" : [0, 0, 0, 0, -15, 0, 0, -12, 0, 0, 0, 0, 0, 0, -7, 0, 0, 5],
         "lucky" : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -4, 0, -6, 12, 0, 0],
         "overcute" : [0, 0, 0, 0, 16, 0, -14, 0, 0, 0, 0, 0, -7, 0, 0, 0, 0, 0],
         "aloof" : [0, 0, 0, 0, 0, 0, 0, -8, 0, 0, 0, 0, 0, 0, -2, 0, 0, 10],
         "evil" : [0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, -8],
         "artificial" : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, -16, 0, 0, 0, 0, 0],
         "none" : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        };
    
        var control = {};
        var eig = 0;
        for (var i = 0;i < pnums;i++) {
         eig = Math.sqrt(pModel.shapeModel.eigenValues[i+2])*3
         control['c'+(i+3)] = gui.add(ph, 'component '+(i+3), -5*eig, 5*eig).listen();
        }
    
        /********** defaults code **********/
    
        function switchDeformedFace(e) {
         //var split = ph.presets.split(",");
         for (var i = 0;i < pnums;i++) {
          ph['component '+(i+3)] = presets[e.target.value][i];
         }
        }
    
        document.getElementById('deform').addEventListener('change', switchDeformedFace, false);
    
        for (var i = 0;i < pnums;i++) {
         ph['component '+(i+3)] = presets['unwell'][i];
        }

# Answer

The reason the webgl canvas is blank has been answered at least 10 times here on stackoverflow

https://stackoverflow.com/questions/32556939/saving-canvas-to-image-via-canvas-todataurl-results-in-black-rectangle?noredirect=1&lq=1

https://stackoverflow.com/questions/26783586/canvas-todataurl-returns-blank-image-only-in-firefox

https://stackoverflow.com/questions/31710748/todataurl-of-webgl-canvas-returning-transparent-image

https://stackoverflow.com/questions/12538193/why-does-my-canvas-go-blank-after-converting-to-image

I know there's several more but I'm too lazy to search for all of them

The only reason I didn't mark this as a duplicate is because you wanted 1 png from 2 canvases.

If you want just 1 png then you need to capture from one canvas. So, draw the WebGL canvas into the video canvas then call `toDataURL` on the video canvas.

    const vctx = videocanvas.getContext('2d');
    vctx.drawImage(webGLTestCanvas, 0, 0); 
    const capturedImage = videocanvas.toDataURL();


