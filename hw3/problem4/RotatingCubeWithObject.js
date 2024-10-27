//
// Colored rotating cube with controls for moving it around.
// Depends on CS336Object.js.  See handleKeyPress() for details
// of key controls.
//


// vetex shader
const vshaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
attribute vec4 a_Color;
varying vec4 color;
void main()
{
  color = a_Color;
  gl_Position = transform * a_Position;
}
`;

// fragment shader
const fshaderSource = `
precision mediump float;
varying vec4 color;
void main()
{
  gl_FragColor = color;
}
`;


var axisVertices = new Float32Array([
0.0, 0.0, 0.0,
1.5, 0.0, 0.0,
0.0, 0.0, 0.0,
0.0, 1.5, 0.0,
0.0, 0.0, 0.0,
0.0, 0.0, 1.5]);

var axisColors = new Float32Array([
1.0, 0.0, 0.0, 1.0,
1.0, 0.0, 0.0, 1.0,
0.0, 1.0, 0.0, 1.0,
0.0, 1.0, 0.0, 1.0,
0.0, 0.0, 1.0, 1.0,
0.0, 0.0, 1.0, 1.0]);

// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexColorBuffer;
var indexBuffer;
var axisBuffer;
var axisColorBuffer;

// handle to the compiled shader program on the GPU
var shader;

// scale, rotation, and position of the cube
var theObject = new CS336Object();

//Alternatively, use helper function, specifying the view (eye) point,
//a point at which to look, and a direction for "up".
//Approximate view point for the above is (1.77, 3.54, 3.06)
var view = createLookAtMatrix(
               new THREE.Vector3(1.77, 3.54, 3.06),   // eye
               new THREE.Vector3(0.0, 0.0, 0.0),      // at - looking at the origin
               new THREE.Vector3(0.0, 1.0, 0.0));    // up vector - y axis

// Alternatively, use a helper function to specify the field of
// view, aspect ratio, and near/far clipping planes
var projection = createPerspectiveMatrix(50, 1.5, 0.1, 10);


//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
if (event.which == null) {
 return String.fromCharCode(event.keyCode) // IE
} else if (event.which!=0 && event.charCode!=0) {
 return String.fromCharCode(event.which)   // the rest
} else {
 return null // special key
}
}

function handleKeyPress(event)
{
  var ch = getChar(event);

  // distance from origin
  var e = theObject.position; // returns Vector3
  var distance = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);

  switch (ch)
  {
  // controls


  case 'w':
    theObject.moveForward(0.1);
    break;
  case 'a':
    theObject.moveLeft(0.1);
    break;
  case 's':
    theObject.moveBack(0.1);
    break;
  case 'd':
    theObject.moveRight(0.1);
    break;
  case 'r':
    theObject.moveUp(0.1);
    break;
  case 'f':
    theObject.moveDown(0.1);
    break;
  case 'j':
    theObject.turnLeft(5);
    break;
  case 'l':
    theObject.turnRight(5);
    break;
  case 'i':
    theObject.rotateX(5)
    break;
  case 'k':
    theObject.rotateX(-5);
    break;
  case 'O':
    theObject.lookAt(0, 0, 0);
    break;

    // alternates for arrow keys
  case 'J':
    theObject.orbitRight(5, distance);
    break;
  case 'L':
    theObject.orbitLeft(5, distance);
    break;
  case 'I':
    theObject.orbitDown(5, distance);
    break;
  case 'K':
    theObject.orbitUp(5, distance);
    break;

    // axis rotations
  case 'y':
    theObject.rotateY(5);
    break;
  case 'Y':
    theObject.rotateY(-5);
    break;
  case 'z':
    theObject.rotateZ(5);
    break;
  case 'Z':
    theObject.rotateZ(-5);
    break;
  case 'x':
    theObject.rotateX(5); // same as look up
    break;
  case 'X':
    theObject.rotateX(-5); // same as look down
    break;

  }

}


// code to actually render our geometry
function drawCube()
{

  // bind the shader
  gl.useProgram(shader);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(shader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var colorIndex = gl.getAttribLocation(shader, 'a_Color');
  if (colorIndex < 0) {
	    console.log('Failed to get the storage location of a_');
	    return;
	  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(colorIndex);

  // bind buffers for points
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // get the current model Matrix
  let modelMatrix = theObject.getMatrix()

  // set uniform in shader for projection * view * model transformation
  var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(modelMatrix);
  var transformLoc = gl.getUniformLocation(shader, "transform");
  gl.uniformMatrix4fv(transformLoc, false, transform.elements);

  gl.drawArrays(gl.TRIANGLES, 0, 36);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(colorIndex);
  gl.useProgram(null);

}

function drawAxes()
{
  // bind the shader
  gl.useProgram(shader);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(shader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var colorIndex = gl.getAttribLocation(shader, 'a_Color');
  if (colorIndex < 0) {
    console.log('Failed to get the storage location of a_');
    return;
  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(colorIndex);

  //draw axes (not transformed by model transformation)
  gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  //set transformation to projection * view only
  var transformLoc = gl.getUniformLocation(shader, "transform");
  transform = new THREE.Matrix4().multiply(projection).multiply(view);
  gl.uniformMatrix4fv(transformLoc, false, transform.elements);

  //draw axes
  gl.drawArrays(gl.LINES, 0, 6);

  //unbind shader and "disable" the attribute indices
  //(not really necessary when there is only one shader)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(colorIndex);
  gl.useProgram(null);
}


function draw(theObject)
{
  // clear the framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

  drawCube();
  drawAxes();
}

// entry point when page is loaded
function main() {

 // basically this function does setup that "should" only have to be done once,
  // while draw() does things that have to be repeated each time the canvas is
  // redrawn

// get graphics context
  gl = getGraphicsContext("theCanvas");

    // key handlers
  window.onkeypress = handleKeyPress;

  // create model data
  var cube = makeCube();

  // load and compile the shader pair
  shader = createShaderProgram(gl, vshaderSource, fshaderSource);

  // load the vertex data into GPU memory
  vertexBuffer = createAndLoadBuffer(cube.vertices);

  // buffer for vertex colors
  vertexColorBuffer = createAndLoadBuffer(cube.colors);

  // axes
  axisBuffer = createAndLoadBuffer(axisVertices);

  // buffer for axis colors
  axisColorBuffer = createAndLoadBuffer(axisColors);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.9, 0.9, 0.9, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // define an animation loop
  var animate = function() {
    draw(theObject);
    // request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}