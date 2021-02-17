Title: FPS-like camera movement with basic matrix transformations
Description: FPS-like camera movement with basic matrix transformations
TOC: FPS-like camera movement with basic matrix transformations

## Question:

I have a simple scene in WebGL where i store every transformation (for the camera and the models) in a single model/view matrix and i set them by rotating and moving said matrix. 

What i want is, to being able to rotate the camera around and when i "move forward" to move towards where the camera is pointing.

So far, i have modified [this][1] code to this:

        mat4.identity(mvMatrix);    
        mat4.rotateX(mvMatrix, degToRad(elev), mvMatrix);   
        mat4.rotateY(mvMatrix, degToRad(ang), mvMatrix);   
        mat4.rotateZ(mvMatrix, degToRad(-roll), mvMatrix);  
        mat4.translate(mvMatrix, [-px, -py, -pz], mvMatrix);
since it wasn't working as it was and it kind of works, until you do an extreme rotation (more than 90 degrees).

This is not a deal breaker for what i'm doing, but i want to know. Is this the best i can get without moving away from calculating the camera orientation like this? 

  [1]: https://stackoverflow.com/questions/18463868/webgl-translation-after-rotation-of-the-camera-as-an-fps

## Answer:

WebGL cameras generally point down the -Z axis so to move in the direction the camera is facing you just add the camera's Z axis (elements 8, 9, 10) to the position of the camera multiplied by some velocity.

{{{example url="../webgl-qna-fps-like-camera-movement-with-basic-matrix-transformations-example-1.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/3990721">George Daskalakis</a>
    from
    <a data-href="https://stackoverflow.com/questions/47849579">here</a>
  </div>
</div>
