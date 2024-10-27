/**
 * Encapsulation of scale, rotation, and position of a 3D object.
 * The object's transformation matrix is defined as the product of
 * three transformations based on position * rotation * scale.
 */
 var CS336Object = function()
 {
 
   // Position of this object.
   this.position = new THREE.Vector3();
 
   // Rotation matrix.
   // The three columns of this matrix are the x, y, and z axes
   // of the object's current frame
   this.rotation = new THREE.Matrix4();
 
   // Scale for this object.
   this.scale = new THREE.Vector3(1, 1, 1);
 
   // The object's current transformation, to be calculated
   // as translate * rotate * scale.  Note that the matrix is saved
   // on call to getMatrix, to avoid recalculation at every frame unless needed.
   // Be sure to set the matrixNeedsUpdate flag whenever position, rotation, or
   // scale is changed.
   this.matrix = null;
   this.matrixNeedsUpdate = true;
 };
 
 /**
  * Sets the position.
  * @param x
  * @param y
  * @param z
  */
 CS336Object.prototype.setPosition = function(x, y, z)
 {
   this.position = new THREE.Vector3(x, y, z);
   this.matrixNeedsUpdate = true;
 };
 
 /**
  * Sets the scale.
  * @param x
  * @param y
  * @param z
  */
 CS336Object.prototype.setScale = function(x, y, z)
 {
   this.scale = new THREE.Vector3(x, y, z);
   this.matrixNeedsUpdate = true;
 };
 
 /**
  * Sets the current rotation matrix to the given one.
  */
 CS336Object.prototype.setRotation = function(rotationMatrix)
 {
   this.rotation = new THREE.Matrix4().copy(rotationMatrix);
   this.matrixNeedsUpdate = true;
 };
 
 /**
  * Returns the current transformation matrix, defined as
  * translate * rotate * scale.
  */
 CS336Object.prototype.getMatrix = function()
 {
   // this method will get called every frame, so only recalculate the
   // matrix if necessary
   if (this.matrixNeedsUpdate)
   {
     // compose the scale, rotation, and translation components
     // and cache the resulting matrix
     var px, py, pz, sx, sy, sz;
     px = this.position.x;
     py = this.position.y;
     pz = this.position.z;
     sx = this.scale.x;
     sy = this.scale.y;
     sz = this.scale.z;
 
     this.matrix = new THREE.Matrix4().makeTranslation(px, py, pz)
         .multiply(this.rotation)
         .multiply(new THREE.Matrix4().makeScale(sx, sy, sz));
     this.matrixNeedsUpdate = false;
 
   }
   return this.matrix;
 };
 
 /**
  * Moves the CS336Object along its negative z-axis by the given amount.
  */
 CS336Object.prototype.moveForward = function(distance)
 {
   // TODO

    let zed = this.position.z - distance;
    this.setPosition(this.position.x,this.position.y,zed);



 };
 
 /**
  * Moves the CS336Object along its positive z-axis by the given amount.
  */
 CS336Object.prototype.moveBack = function(distance)
 {
   this.moveForward(-distance);
 };
 
 /**
  * Moves the CS336Object along its positive x-axis by the given amount.
  */
 CS336Object.prototype.moveRight = function(distance)
 {
   // TODO
    let xed = this.position.x + distance;
    this.setPosition(xed, this.position.y, this.position.z);

 };
 
 /**
  * Moves the CS336Object along its negative x-axis by the given amount.
  */
 CS336Object.prototype.moveLeft = function(distance)
 {
   this.moveRight(-distance);
 };
 
 /**
  * Moves the CS336Object along its own y-axis by the given amount.
  */
 CS336Object.prototype.moveUp = function(distance)
 {
   // TODO
    let yed = this.position.y + distance;
    this.setPosition(this.position.x,yed, this.position.z);


 };
 
 /**
  * Moves the CS336Object along its own negative y-axis by the given amount.
  */
 CS336Object.prototype.moveDown = function(distance)
 {
   this.moveUp(-distance);
 };
 
 /**
  * Rotates the CS336Object ccw about its x-axis.
  */
 CS336Object.prototype.rotateX = function(degrees)
 {
   // TODO

    var roxed = new THREE.Matrix4().makeRotationX(degrees);

   var goat = this.rotation.multiply(roxed);
   this.setRotation(goat);


 };
 
 /**
  * Rotates the CS336Object ccw about its y-axis.
  */
 CS336Object.prototype.rotateY = function(degrees)
 {
   // TODO

    var royed = new THREE.Matrix4().makeRotationY(degrees);

    var goat = this.rotation.multiply(royed);
    this.setRotation(goat);

 };
 
 /**
  * Rotates the CS336Object ccw about its z-axis.
  */
 CS336Object.prototype.rotateZ = function(degrees)
 {
   // TODO

   var rozed = new THREE.Matrix4().makeRotationZ(degrees);

   var goat = this.rotation.multiply(rozed);
   this.setRotation(goat);
 };
 
 /**
  * Rotates the CS336Object ccw about the given axis, specified as a vector.
  */
 CS336Object.prototype.rotateOnAxis = function(degrees, x, y, z)
 {
   // TODO
 };
 
 /**
  * Rotates the CS336Object ccw about the given axis, specified in terms of
  * pitch and head angles (as in spherical coordinates).
  */
 CS336Object.prototype.rotateOnAxisEuler = function(degrees, pitch, head)
 {
   // TODO
 };
 
 /**
  * Rotates the CS336Object counterclockwise about an axis through its center that is
  * parallel to the vector (0, 1, 0).
  */
 CS336Object.prototype.turnLeft = function(degrees)
 {
   // TODO

  var royed = new THREE.Matrix4().makeRotationY(-degrees);

    var goat = this.rotation.premultiply(royed);
    this.setRotation(goat);

 };
 
 /**
  * Rotates the CS336Object clockwise about an axis through its center that is
  * parallel to the vector (0, 1, 0).
  */
 CS336Object.prototype.turnRight = function(degrees)
 {
   this.turnLeft(-degrees);
 };
 
 /**
  * Performs a counterclockwise rotation about this object's
  * x-axis.
  */
 CS336Object.prototype.lookUp = function(degrees)
 {
    this.rotateX(degrees);
 };
 
 /**
  * Performs a clockwise rotation about this object's
  * x-axis.
  */
 CS336Object.prototype.lookDown = function(degrees)
 {
   this.lookUp(-degrees);
 };
 
 
 /**
  * Moves the CS336Object the given number of degrees along a great circle. The axis
  * of rotation is parallel to the CS336Object's x-axis and intersects the CS336Object's
  * negative z-axis the given distance in front of the CS336Object. (This operation is
  * equivalent to a moveForward, lookDown and then moveBack.
  */
 CS336Object.prototype.orbitUp = function(degrees, distance)
 {
   // TODO

   this.moveForward(distance);
   this.lookAt(0,0,0);
    //this.moveBack(distance);
    



 };
 
 /**
  * Moves the CS336Object the given number of degrees along a great circle. The axis
  * of rotation is parallel to the CS336Object's x-axis and intersects the CS336Object's
  * negative z-axis the given distance in front of the CS336Object. (This operation is
  * equivalent to a moveForward, lookUp and then moveBack.
  */
 CS336Object.prototype.orbitDown = function(degrees, distance)
 {
   this.orbitUp(-degrees, distance);
 };
 
 /**
  * Moves the CS336Object the given number of degrees around a circle of latitude. The
  * axis of rotation is parallel to the world up vector and intersects the
  * CS336Object's negative z-axis the given distance in front of the CS336Object. (This
  * operation is equivalent to a moveForward, turnLeft, and moveBack.)
  */
 CS336Object.prototype.orbitRight = function(degrees, distance)
 {
   // TODO




 };
 
 /**
  * Moves the CS336Object the given number of degrees around a circle of latitude. The
  * axis of rotation is parallel to the world up vector and intersects the
  * CS336Object's negative z-axis the given distance in front of the CS336Object. (This
  * operation is equivalent to a moveForward, turnRight, and moveBack.)
  */
 CS336Object.prototype.orbitLeft = function(degrees, distance)
 {
   this.orbitRight(-degrees, distance);
 };
 
 /**
  * Orients the CS336Object at its current location to face the given position
  * using (0, 1, 0) as the up-vector.  That is, the given position will lie along
  * the object's negative z-axis, and this object's x-axis will be
  * parallel to the world x-z plane.  See the documentation for lookAt() in
  * THREE.Matrix4.
  */
 CS336Object.prototype.lookAt = function(x, y, z)
 {
   // TODO

var target = new THREE.Vector3(x, y, z);

var rotationMatrix = new THREE.Matrix4();
rotationMatrix.lookAt(this.position, target, new THREE.Vector3(0, 1, 0));

this.setRotation(rotationMatrix);


 };