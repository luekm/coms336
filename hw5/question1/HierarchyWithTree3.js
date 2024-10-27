//
// Hierarchical object using recursion.  Uses dummy objects in a way that is
// Similar to HierarchyWithTree2, but is based on a version of CS336Object.js.
//


// vertex shader
const vLightingShaderSource = `
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform vec4 u_Color;
uniform mat3 normalMatrix;
uniform vec4 lightPosition;

attribute vec4 a_Position;
attribute vec3 a_Normal;

varying vec4 color;
void main()
{
  // simple Gouraud shading
  float ambientFactor = 0.1;
  vec3 lightDirection = normalize((view * lightPosition - view * model * a_Position).xyz);
  vec3 normal = normalize(normalMatrix * a_Normal);
  float diffuseFactor = max(0.0, dot(lightDirection, normal));
  color = u_Color * diffuseFactor + u_Color * ambientFactor;
  color.a = 1.0;
  gl_Position = projection * view * model * a_Position;
}
`;


// fragment shader
const fLightingShaderSource = `
precision mediump float;
varying vec4 color;
void main()
{
  gl_FragColor = color;
}
`;


// A few global variables...

// the OpenGL context
var gl;
var stop = false;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;

var scale = 1.0;

var baseDummy = new CS336Object();

var base = new CS336Object(drawCyl);
base.setScale(1.7,20,1.7);
baseDummy.addChild(base);

var housingDummy = new CS336Object();
var housing = new CS336Object(drawCyl);
baseDummy.addChild(housingDummy);
housing.setPosition(0,11,0);
housing.setScale(2.1,8,1.8);
housing.rotateX(90);
housingDummy.addChild(housing);

var turnyDummy = new CS336Object();
turnyDummy.setPosition(0,10.8,4.5);
var turny = new CS336Object(drawCyl);
housingDummy.addChild(turnyDummy);
turny.rotateX(90);
//turny.setPosition(0,10.8,4.5);
turny.setScale(1.5,4,1.5);
turnyDummy.addChild(turny);

var propA = new CS336Object(drawSphere);
propA.setPosition(0,-5,0);
propA.setScale(1,5.4,1.5);
propA.rotateY(45);
turnyDummy.addChild(propA);

var propB = new CS336Object(drawSphere);
propB.setPosition(0,5,0);
propB.setScale(1,5.4,1.5);
propB.rotateY(-45);
turnyDummy.addChild(propB);

var nose = new CS336Object(drawSphere);
nose.setPosition(0,0,-0.5);
nose.setScale(1.6,1.6,5);
turnyDummy.addChild(nose);

// create the objects

// var torsoDummy = new CS336Object();

// var torso = new CS336Object(drawCube);

// torso.setScale(10, 10, 5);
// torsoDummy.addChild(torso);

// var shoulderDummy = new CS336Object();
// shoulderDummy.setPosition(6.5, 4, 0);
// torsoDummy.addChild(shoulderDummy);

// var shoulder = new CS336Object(drawCube);
// shoulder.setPosition(0, -2, 0);
// shoulder.setScale(3, 5, 2);
// shoulderDummy.addChild(shoulder);

// var armDummy = new CS336Object();
// armDummy.setPosition(0, -4.5, 1.0);
// shoulderDummy.addChild(armDummy);

// //var arm = new CS336Object(drawCube);
// var arm = new CS336Object(drawCyl);
// arm.setPosition(0, -2.5, -1.0);
// arm.setScale(2, 6, 2);
// armDummy.addChild(arm);

// var hand = new CS336Object(drawCube);
// hand.setPosition(0, -6.5, -1.0);
// hand.setScale(1, 3, 3);
// armDummy.addChild(hand);

// var head = new CS336Object(drawSphere);
// head.setPosition(0, 7, 0);
// head.setScale(4, 4, 4);
// torsoDummy.addChild(head);



// view matrix
var view = createLookAtMatrix(
               new THREE.Vector3(40, 40, 40),   // eye
               new THREE.Vector3(0.0, 0.0, 0.0),      // at - looking at the origin
               new THREE.Vector3(0.0, 1.0, 0.0));    // up vector - y axis


// Here use aspect ratio 3/2 corresponding to canvas size 600 x 400
//var projection = new Matrix4().setPerspective(30, 1.5, 0.1, 1000);
var projection = createPerspectiveMatrix(30, 1.5, 1, 100);

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

// handler for key press events adjusts object rotations
function handleKeyPress(event)
{
	var ch = getChar(event);
	switch(ch)
	{
	case 'p':
	case 'P':
		stop = !stop;
		break;
	case 't':
	  housingDummy.rotateY(15);
		break;
	case 'T':
	  housingDummy.rotateY(-15);
		break;
	case 's':
	  propA.rotateY(-15);
	  propB.rotateY(15)
		break;
	case 'S':
		propA.rotateY(15);
		propB.rotateY(-15);
		break;
	case 'a':
	  armDummy.rotateX(-15);
		break;
	case 'A':
	  armDummy.rotateX(15);
		break;
	case 'h':
	  hand.rotateY(15);
		break;
	case 'H':
	  hand.rotateY(-15);
		break;
	case 'l':
	  head.rotateY(15);
 		break;
	case 'L':
	  head.rotateY(-15);
 		break;

  case 'g':
    scale *= 1.25;
    baseDummy.setScale(scale, scale, scale);
    break;
  case 'G':
    scale *= 0.8;
    baseDummy.setScale(scale, scale, scale);
    break;
	default:
			return;
	}
}

// helper function renders the cube based on the given model transformation
function drawCube(matrix)
{
	  // bind the shader
	  gl.useProgram(lightingShader);

	  // get the index for the a_Position attribute defined in the vertex shader
	  var positionIndex = gl.getAttribLocation(lightingShader, 'a_Position');
	  if (positionIndex < 0) {
	    console.log('Failed to get the storage location of a_Position');
	    return;
	  }

	  var normalIndex = gl.getAttribLocation(lightingShader, 'a_Normal');
	  if (normalIndex < 0) {
		    console.log('Failed to get the storage location of a_Normal');
		    return;
		  }

	  // "enable" the a_position attribute
	  gl.enableVertexAttribArray(positionIndex);
	  gl.enableVertexAttribArray(normalIndex);

	  // bind data for points and normals
	  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
	  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
	  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
	  gl.bindBuffer(gl.ARRAY_BUFFER, null);

	  var loc = gl.getUniformLocation(lightingShader, "view");
	  gl.uniformMatrix4fv(loc, false, view.elements);
	  loc = gl.getUniformLocation(lightingShader, "projection");
	  gl.uniformMatrix4fv(loc, false, projection.elements);
	  loc = gl.getUniformLocation(lightingShader, "u_Color");
	  gl.uniform4f(loc, 0.0, 1.0, 0.0, 1.0);
    var loc = gl.getUniformLocation(lightingShader, "lightPosition");
    gl.uniform4f(loc, 5.0, 10.0, 5.0, 1.0);

	  var modelMatrixloc = gl.getUniformLocation(lightingShader, "model");
	  var normalMatrixLoc = gl.getUniformLocation(lightingShader, "normalMatrix");

	  gl.uniformMatrix4fv(modelMatrixloc, false, matrix.elements);
	  gl.uniformMatrix3fv(normalMatrixLoc, false, makeNormalMatrixElements(matrix, view));

	  gl.drawArrays(gl.TRIANGLES, 0, 36);

	  gl.useProgram(null);
}

function drawSphere(matrix) {
	// Assuming you have a sphere geometry
	var sphereGeometry = new THREE.SphereGeometry(1, 10, 900); // Adjust parameters as needed
  
	// Extract the vertices and normals from the geometry
	var vertices = new Float32Array(sphereGeometry.attributes.position.array);
	var normals = new Float32Array(sphereGeometry.attributes.normal.array);
  
	// Bind the shader
	gl.useProgram(lightingShader);
  
	// Get the index for the a_Position attribute defined in the vertex shader
	var positionIndex = gl.getAttribLocation(lightingShader, 'a_Position');
	if (positionIndex < 0) {
	  console.log('Failed to get the storage location of a_Position');
	  return;
	}
  
	var normalIndex = gl.getAttribLocation(lightingShader, 'a_Normal');
	if (normalIndex < 0) {
	  console.log('Failed to get the storage location of a_Normal');
	  return;
	}
  
	// Enable the a_position attribute
	gl.enableVertexAttribArray(positionIndex);
	gl.enableVertexAttribArray(normalIndex);
  
	// Bind data for points and normals
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  
	var vertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
	gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
	// Set view, projection, color, and light position uniforms
	var loc = gl.getUniformLocation(lightingShader, 'view');
	gl.uniformMatrix4fv(loc, false, view.elements);
	loc = gl.getUniformLocation(lightingShader, 'projection');
	gl.uniformMatrix4fv(loc, false, projection.elements);
	loc = gl.getUniformLocation(lightingShader, 'u_Color');
	gl.uniform4f(loc, 0.0, 1.0, 0.0, 1.0);
	loc = gl.getUniformLocation(lightingShader, 'lightPosition');
	gl.uniform4f(loc, 5.0, 10.0, 5.0, 1.0);
  
	// Set model and normal matrices
	var modelMatrixloc = gl.getUniformLocation(lightingShader, 'model');
	var normalMatrixLoc = gl.getUniformLocation(lightingShader, 'normalMatrix');
	gl.uniformMatrix4fv(modelMatrixloc, false, matrix.elements);
	gl.uniformMatrix3fv(normalMatrixLoc, false, makeNormalMatrixElements(matrix, view));
  
	// Draw the sphere
	gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);
  
	// Unbind the shader program
	gl.useProgram(null);
  }
  

  function drawCyl(matrix) {
	// Assuming you have a sphere geometry
	var cylGeometry = new THREE.CylinderGeometry(1,1,1,16,900); // Adjust parameters as needed
  
	// Extract the vertices and normals from the geometry
	var vertices = new Float32Array(cylGeometry.attributes.position.array);
	var normals = new Float32Array(cylGeometry.attributes.normal.array);
  
	// Bind the shader
	gl.useProgram(lightingShader);
  
	// Get the index for the a_Position attribute defined in the vertex shader
	var positionIndex = gl.getAttribLocation(lightingShader, 'a_Position');
	if (positionIndex < 0) {
	  console.log('Failed to get the storage location of a_Position');
	  return;
	}
  
	var normalIndex = gl.getAttribLocation(lightingShader, 'a_Normal');
	if (normalIndex < 0) {
	  console.log('Failed to get the storage location of a_Normal');
	  return;
	}
  
	// Enable the a_position attribute
	gl.enableVertexAttribArray(positionIndex);
	gl.enableVertexAttribArray(normalIndex);
  
	// Bind data for points and normals
	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  
	var vertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
	gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
	// Set view, projection, color, and light position uniforms
	var loc = gl.getUniformLocation(lightingShader, 'view');
	gl.uniformMatrix4fv(loc, false, view.elements);
	loc = gl.getUniformLocation(lightingShader, 'projection');
	gl.uniformMatrix4fv(loc, false, projection.elements);
	loc = gl.getUniformLocation(lightingShader, 'u_Color');
	gl.uniform4f(loc, 0.0, 1.0, 0.0, 1.0);
	loc = gl.getUniformLocation(lightingShader, 'lightPosition');
	gl.uniform4f(loc, 5.0, 10.0, 5.0, 1.0);
  
	// Set model and normal matrices
	var modelMatrixloc = gl.getUniformLocation(lightingShader, 'model');
	var normalMatrixLoc = gl.getUniformLocation(lightingShader, 'normalMatrix');
	gl.uniformMatrix4fv(modelMatrixloc, false, matrix.elements);
	gl.uniformMatrix3fv(normalMatrixLoc, false, makeNormalMatrixElements(matrix, view));
  
	// Draw the sphere
	gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);
  
	// Unbind the shader program
	gl.useProgram(null);
  }


// code to actually render our geometry
function draw()
{
  // clear the framebuffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

	if(!stop) {
	turnyDummy.rotateZ(1);
	}
	

	// recursively render everything in the hierarchy
	baseDummy.render(new THREE.Matrix4());
}

// entry point when page is loaded
function main() {

    // get graphics context
    gl = getGraphicsContext("theCanvas");

    // key handlers
    window.onkeypress = handleKeyPress;

    // create model data
    var cube = makeCube();

    // load and compile the shader pair
    lightingShader = createShaderProgram(gl, vLightingShaderSource, fLightingShaderSource);

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(cube.vertices);

    // buffer for vertex normals
    vertexNormalBuffer = createAndLoadBuffer(cube.normals);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.9, 0.9, 0.9, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // define an animation loop
  var animate = function() {
	draw();


    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}