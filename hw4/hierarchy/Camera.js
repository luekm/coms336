/**
 * Basic perspective camera built on CS336Object.  Defaults
 * to position (0, 0, 5).  In normal usage a camera is never
 * scaled or rolled, that is, the x-axis is always parallel to
 * the world x-z plane.  This means that you normally don't ever
 * directly call rotate operations on a camera; instead use
 * turnLeft, turnRight, lookUp, and lookDown.
 */
 var Camera = function(fovy, aspect)
 {
   CS336Object.call(this);
 
   this.setPosition(0, 0, 5);
 
   // projection matrix
   this.aspect = aspect || 1.0;
   this.fovy = fovy || 30.0;
   this.zNear = 0.1;
   this.zFar = 1000;
 
   // cached copies of view matrix and projection matrix
   // (this is just to avoid recalculation at every frame)
 
   // view matrix is always the inverse of camera's translation * rotation
   // (initial rotation is the identity, so this is easy to initialize)
   this.viewMatrix = new THREE.Matrix4().makeTranslation(0, 0, -5);
 
   // use the helper function from cs336util.js
   this.projectionMatrix = createPerspectiveMatrix(this.fovy, this.aspect, this.zNear, this.zFar);
 
   // flag to indicate whether projection need recalculation
   this.projectionNeedsUpdate = false;
 };
 
 // "Inherit" methods of CS336Object
 Camera.prototype = Object.create(CS336Object.prototype);
 
 /**
  * Returns the view matrix for this camera.
  */
 Camera.prototype.getView = function()
 {
   if (this.matrixNeedsUpdate)
   {
     // we don't need the matrix, but this clears the needs update flag
     // and keeps everything consistent
     this.getMatrix();
 
     this.viewMatrix = new THREE.Matrix4().copy(this.rotation).transpose();
 
     var p = this.position;
     this.viewMatrix.multiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
   }
   return this.viewMatrix;
 };
 
 
 /**
  * Returns the projection matrix for this camera.
  */
 Camera.prototype.getProjection = function()
 {
   if (this.projectionNeedsUpdate)
   {
     // use the helper function from cs336util.js
     this.projectionMatrix = createPerspectiveMatrix(this.fovy, this.aspect, this.zNear, this.zFar);
   }
   return this.projectionMatrix;
 };
 
 /**
  * Sets the aspect ratio.
  */
 Camera.prototype.setAspectRatio = function(aspect)
 {
   this.aspect = aspect;
   this.projectionNeedsUpdate = true;
 };
 
 /**
  * Gets the aspect ratio.
  */
 Camera.prototype.getAspectRatio = function()
 {
   return this.aspect;
 };
 
 /**
  * Sets the field of view.
  */
 Camera.prototype.setFovy = function(degrees)
 {
   this.fovy = degrees;
   this.projectionNeedsUpdate = true;
 };
 
 /**
  * Gets the field of view.
  */
 Camera.prototype.getFovy = function()
 {
   return this.fovy;
 };
 
 /**
  * Sets the near plane.
  */
 Camera.prototype.setNearPlane = function(zNear)
 {
   this.zNear = zNear;
   this.projectionNeedsUpdate = true;
 };
 
 /**
  * Gets the near plane.
  */
 Camera.prototype.getNearPlane = function()
 {
   return this.zNear;
 };
 
 /**
  * Sets the far plane.
  */
 Camera.prototype.setFarPlane = function(zFar)
 {
   this.zFar = zFar;
   this.projectionNeedsUpdate = true;
 };
 
 /**
  * Gets the far plane.
  */
 Camera.prototype.getFarPlane = function()
 {
   return this.zFar;
 };
 
 
 Camera.prototype.keyControl = function(ch)
 {
   console.log(ch);
   
   var e = this.position; // returns Vector3
   var distance = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);
 
   switch (ch)
   {
   // camera controls
   case 'w':
     this.moveForward(0.1);
     return true;
   case 'a':
     this.moveLeft(0.1);
     return true;
   case 's':
     this.moveBack(0.1);
     return true;
   case 'd':
     this.moveRight(0.1);
     return true;
   case 'r':
     this.moveUp(0.1);
     return true;
   case 'f':
     this.moveDown(0.1);
     return true;
   case 'j':
     this.turnLeft(5);
     return true;
   case 'l':
     this.turnRight(5);
     return true;
   case 'i':
     this.lookUp(5);
     return true;
   case 'k':
     this.lookDown(5);
     return true;
   case 'O':
     this.lookAt(0, 0, 0);
     return true;
   case 'p':
     this.setPosition(0, 0, 0);
     return true;
   case 'S':
     var fovy = this.getFovy();
     fovy = Math.min(80, fovy + 5);
     this.setFovy(fovy);
     return true;
   case 'W':
     var fovy = this.getFovy();
     fovy = Math.max(5, fovy - 5);
     this.setFovy(fovy);
     return true;
 
     // alternates for arrow keys
   case 'J':
     this.orbitLeft(5, distance)
     return true;
   case 'L':
     this.orbitRight(5, distance)
     return true;
   case 'I':
     this.orbitUp(5, distance)
     return true;
   case 'K':
     this.orbitDown(5, distance)
     return true;
   }
   return false;
 }
 