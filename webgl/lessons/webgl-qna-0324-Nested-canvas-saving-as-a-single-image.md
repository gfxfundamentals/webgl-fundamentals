Title: Nested canvas saving as a single image
Description:
TOC: qna

# Question:

I have a canvas element called glCanvas. I wanted to append some text to it. glCanvas had a webGL rendering context so getContext('2d') did not work. Hence I created a new 2d canvas and made that the child of glCanvas:

  var Glcanvas = document.getElementById("glCanvas");
  
 
  var canvas = document.createElement('canvas');
  canvas.setAttribute("id","canvas");
  canvas.width="512";
  canvas.height="512";
  Glcanvas.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var text = "element";//overlay.elementIDs[i];
 
  ctx.beginPath();
  ctx.clearRect(0,0,300,300);
  ctx.fillStyle = 'white';
  ctx.fillRect(0,0,300,300);
 
  ctx.fillStyle = 'rgba(255,0,0,255)';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'red';
  ctx.save();
  ctx.font = 'bold 80px Verdana';
  
  var leftOffset = ctx.canvas.width/2;
  var rightOffset = ctx.canvas.height/2;
  ctx.strokeText(text,leftOffset,rightOffset);
  ctx.fillText(text,leftOffset,rightOffset);
  ctx.save();


Later I try to save my glCanvas onto an image. 

   var imageUrl = glCanvas.toDataURL('image/jpeg', 1.0);

  var pom = document.createElement('a');
  pom.setAttribute('href', imageUrl);
  pom.setAttribute('download', 'image_C' + cameraIndex + '.jpg');

  document.body.appendChild(pom);

  pom.click();

  document.body.removeChild(pom);

Over here, my text that I created isnt getting saved. How do I make sure both of them get saved?



# Answer

I think you just want to draw the WebGL canvas into the 2d canvas.

    ctx = ctx.getContext("2d");
    ctx.drawImage(glCanvas, imageX, imageY);
    ctx.fillText("sometext", textX, textY);

Now you can get a screenshot of the 2D canvas

    var dataURL = ctx.canvas.toDataURL();

Also note, IIRC children of a canvas do not get displayed unless the browser doesn't support canvas (Which only is only really old browsers at this point)


