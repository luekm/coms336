//
// Demo of 3D rotations about the coordinate axes.
//

// vertex shader
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


// Test data
  // two triangles, yellow one at z = -1/2 and cyan one at z = 1/2
var vertices = new Float32Array([
.75, -.75, -0.5,
0.0, .75, -0.5,
-.75, -.75, -0.5,
.75, -.75, 0.5,
0.0, .75, 0.5,
-.75, -.75, 0.5]);

var colors = new Float32Array([
1.0, 1.0, 0.0, 1.0,  // yellow
1.0, 1.0, 0.0, 1.0,
1.0, 1.0, 0.0, 1.0,
0.0, 1.0, 1.0, 1.0,  // cyan
0.0, 1.0, 1.0, 1.0,
0.0, 1.0, 1.0, 1.0]);

var linesVertices = new Float32Array([
-0.8, 0.0, 0.0,
0.8, 0.0, 0.0,
0.0, -0.8, 0.0,
0.0, 0.8, 0.0,
0.0, 0.0, -0.8,
0.0, 0.0, 0.8]);

var axisColors = new Float32Array([
//var linesColors = new Float32Array([
0.0, 0.0, 0.0, 1.0,
0.0, 0.0, 0.0, 1.0,
0.0, 0.0, 0.0, 1.0,
0.0, 0.0, 0.0, 1.0,
0.0, 0.0, 0.0, 1.0,
0.0, 0.0, 0.0, 1.0]);

var axisVertices = new Float32Array([
0.0, 0.0, 0.0,
1.5, 0.0, 0.0,
0.0, 0.0, 0.0,
0.0, 1.5, 0.0,
0.0, 0.0, 0.0,
0.0, 0.0, 1.5]);

var linesColors = new Float32Array([
//var axisColors = new Float32Array([
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
var linesBuffer;
var linesColorBuffer;
var axisBuffer;
var axisColorBuffer;

// handle to the compiled shader program on the GPU
var shader;

// Transformation matrices.
var model = new THREE.Matrix4();

// Set up a "view point" by translating 5 units out the z axis, rotating 45 degrees
// cw about the x axis, and then rotating 30 ccw about the y axis.  This creates a
// new frame for our "camera".  To get the coordinates of the vertices w.r.t this
// frame, use the matrix that is the inverse of how we got here, that is, the
// inverse of rotateY(30) * rotateX(-45) * Translate(0, 0, 5)
var cameraHead = 30;
var cameraPitch = -45;

var rotationIncrement = 5;

// helper function to create a view matrix given head and pitch angles
// for the camera
function makeView()
{
  var v = new THREE.Matrix4().makeTranslation(0, 0, -5)
      .multiply(new THREE.Matrix4().makeRotationX(toRadians(-cameraPitch)))
      .multiply(new THREE.Matrix4().makeRotationY(toRadians(-cameraHead)));
      return v;
}
var view = makeView();

// projection matrix
var projection = createPerspectiveMatrix(30, 1, 1, 10);

// display string
var transformations = "";

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

//handler for key press events will update modelMatrix based
//on key press and radio button state
function handleKeyPress(event)
{
	var m = new THREE.Matrix4();
	var ch = getChar(event);
	var text = "I";
  var rotationIncrement = parseFloat(document.getElementById("incrementBox").value);
	switch(ch)
	{

// This should (approximately) un-do RotateY(-45)*RotateX(-45) using
// ZYZ order for Euler angles.  Press p, then q, then r in "intrinsic" mode
// after doing RotateY(-45)*RotateX(-45)

// ORIGINAL CASES

//   case 'p':
//   m.makeRotationZ(toRadians(-35));
//   text = "P";
//   break;
//   case 'q':
//   m.makeRotationY(toRadians(60));
//   text = "Q";
//   break;
//   case 'r':
//   m.makeRotationZ(toRadians(55));
//   text = "R";
//   break;

// Similar, for YZY
  // case 'p':
  // m.makeRotationY(toRadians(90));
  // text = "P";
  // break;
  // case 'q':
  // m.makeRotationZ(toRadians(45));
  // text = "Q";
  // break;
  // case 'r':
  // m.makeRotationY(toRadians(-45));
  // text = "R";
  // break;


  // ------------------------------------

  // TODO - INSERT YOUR HW3 SOLUTIONS HERE


// A) XZX
//   case 'p':
//     m.makeRotationX(toRadians(-35));
//     text = "P";
//     break;
//     case 'q':
//     m.makeRotationZ(toRadians(60));
//     text = "Q";
//     break;
//     case 'r':
//     m.makeRotationX(toRadians(55));
//     text = "R";
//     break;

    //DONE!

//-----------------------------------------

// B) XYX
// case 'p':
//     m.makeRotationX(toRadians(55));
//     text = "P";
//     break;
//     case 'q':
//     m.makeRotationY(toRadians(60));
//     text = "Q";
//     break;
//     case 'r':
//     m.makeRotationX(toRadians(-35));
//     text = "R";
//     break;

    //DONE!

//-----------------------------------------



// C) ZXY
// case 'p':
//     m.makeRotationZ(toRadians(35));
//     text = "P";
//     break;
//     case 'q':
//     m.makeRotationX(toRadians(30));
//     text = "Q";
//     break;
//     case 'r':
//     m.makeRotationY(toRadians(35));
//     text = "R";
//     break;

    //DONE!? looks like 1 degree off?

//-----------------------------------------


// D) XZY
case 'p':
    m.makeRotationX(toRadians(35));
    text = "P";
    break;
    case 'q':
    m.makeRotationZ(toRadians(30));
    text = "Q";
    break;
    case 'r':
    m.makeRotationY(toRadians(55));
    text = "R";
    break;

    //DONE!!

  // ------------------------------------
  


  // key controls for moving the point of view
  case('d'):
  cameraHead += 15;
  view = makeView();
  break;
  case('D'):
  cameraHead -= 15;
  view = makeView();
  break;
  case('e'):
  if (cameraPitch == -45)
  {
    cameraPitch = 0;
  }
  else {
    cameraPitch = -45;
  }
  view = makeView();
  break;



	case 'x':
		m.makeRotationX(toRadians(rotationIncrement));
		text = "X";
		break;
	case 'y':
		m.makeRotationY(toRadians(rotationIncrement));
		text = "Y";
		break;
	case 'z':
		m.makeRotationZ(toRadians(rotationIncrement));
		text = "Z";
		break;
	case 'X':
		m.makeRotationX(toRadians(-rotationIncrement));
		text = "X<sup>-1</sup>"
		break;
	case 'Y':
		m.makeRotationY(toRadians(-rotationIncrement));
		text = "Y<sup>-1</sup>"
		break;
	case 'Z':
		m.makeRotationZ(toRadians(-rotationIncrement));
		text = "Z<sup>-1</sup>"
		break;
	case 'o':
		model.identity();
    cameraHead = 30;
    cameraPitch = -45;
    view = makeView();
		transformations = "";
		break;
		default:
			return;
	}

  if (ch != 'd' && ch != 'D' && ch != 'e')
  {
	  if (document.getElementById("checkIntrinsic").checked)
	  {
		  // add current text to end of string
		  transformations += text;
	  }
	  else
	  {
		  // add to beginning of string
		  transformations = text + transformations;
	  }
  }

	  // update output window
	  var outputWindow = document.getElementById("displayMatrices");
	  outputWindow.innerHTML = transformations;
	  console.log(transformations);

	  // update current matrix
	  if (document.getElementById("checkIntrinsic").checked)
	  {
		  // multiply on right by m
		  model.multiply(m);
	  }
	  else
	  {
		  // multiply on the left by m
		  model = m.multiply(model);
	  }
}



// code to actually render our geometry
function draw()
{
  // clear the framebuffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

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

  // set uniform in shader for projection * view * model transformation
  var transformLoc = gl.getUniformLocation(shader, "transform");
  var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(model);
  gl.uniformMatrix4fv(transformLoc, false, transform.elements);

  // draw triangles
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // bind buffers for lines
  gl.bindBuffer(gl.ARRAY_BUFFER, linesBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, linesColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);

  // draw lines (using same transformation)
  gl.drawArrays(gl.LINES, 0, 6);

  // draw axes (not transformed by model transformation)
  gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set transformation to projection * view only
  transform = new THREE.Matrix4().multiply(projection).multiply(view);
  gl.uniformMatrix4fv(transformLoc, false, transform.elements);

  // draw axes
  gl.drawArrays(gl.LINES, 0, 6);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(colorIndex);
  gl.useProgram(null);

}

// entry point when page is loaded
function main() {

  // basically this function does setup that "should" only have to be done once,
  // while draw() does things that have to be repeated each time the canvas is
  // redrawn
// get graphics context
  gl = getGraphicsContext("theCanvas");

   // key handler
  window.onkeypress = handleKeyPress;

  // load and compile the shader pair
  shader = createShaderProgram(gl, vshaderSource, fshaderSource);

  // load the vertex data into GPU memory
  vertexBuffer = createAndLoadBuffer(vertices);

  // another buffer for the lines
  linesBuffer =createAndLoadBuffer(linesVertices);

  // axes
  axisBuffer = createAndLoadBuffer(axisVertices);

  // buffer for vertex colors
  vertexColorBuffer = createAndLoadBuffer(colors);

  // another buffer for the line color
  linesColorBuffer = createAndLoadBuffer(linesColors);

  // buffer for axis colors
  axisColorBuffer = createAndLoadBuffer(axisColors);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.9, 0.9, 0.9, 1.0);

  gl.enable(gl.DEPTH_TEST);

//	transform.setIdentity();
//	transform.multiply(projection).multiply(view).multiply(model);


  // define an animation loop
  var animate = function() {
	draw();
	// request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}
