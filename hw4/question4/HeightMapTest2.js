//
// Same as Lighting2.js but uses a height map for the vertex and normal data.
// Edit lines ~98-103 to change the height map function.
//

// vertex shader
const vshaderSource = `
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
  // basic Lambert lighting shader
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
const fshaderSource = `
precision mediump float;
varying vec4 color;
void main()
{
  gl_FragColor = color;
}
`;


// a couple of sample functions for the height map

// try with bounds [-1, 1]
var ripple = function(x, z)
{
  let r = Math.sqrt(x * x + z * z);
  return (1 / 10) * Math.cos(10 * r);
};

// try with bounds [-1, 1]
var hypParaboloid = function(x, z)
{
  return  x * x - z * z;
};

// try with bounds [-1, 1]
var pyramid = function(x, z)
{
  let max = Math.max(Math.abs(x), Math.abs(z));
  return 1 - max;
}

// try with bounds [-1, 1]
var cone = function(x, z)
{
    let r = x * x + z * z;
    return 1 - Math.sqrt(r);
}

// Try with -2.5 < x < 1, -1 < z < 1
// using a larger resolution
var mandelbrot = function(x, z)
{
    // Based on wikipedia psuedo code

    // Height of output mesh
    let maxHeight = 0.5;
    let real = 0.0;
    let imag = 0.0;

    let maxIterations = 50;
    let curIteration;
    for (curIteration = 0;
        curIteration < maxIterations && real * real + imag * imag < 4.0;
        curIteration++)
    {
        let realTemp = real * real - imag * imag + x;
        imag = 2 * real * imag + z;
        real = realTemp;
    }
    let iterPercent = curIteration / maxIterations;
    // The square root makes the small percents stand out a little better
    return maxHeight * Math.sqrt(iterPercent);
}
var heightMap = new HeightMap(ripple, 40, 40, -1, 1, -1, 1);
//var heightMap = new HeightMap(ripple, 40, 40, -1, 1, -1, 1);
//var heightMap = new HeightMap(hypParaboloid, 40, 40, -1, 1, -1, 1);
//heightMap = new HeightMap(pyramid, 40, 40, -1, 1, -1, 1);
//heightMap = new HeightMap(cone, 40, 40, -1, 1, -1, 1);
//heightMap = new HeightMap(mandelbrot, 200, 200, -2.5, 1, -1, 1);


// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;
var indexBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;

// transformation matrices
var model = new THREE.Matrix4();

// view matrix
var view = createLookAtMatrix(
               new THREE.Vector3(1.77, 3.54, 3.06),   // eye
               new THREE.Vector3(0.0, 0.0, 0.0),      // at - looking at the origin
               new THREE.Vector3(0.0, 1.0, 0.0));    // up vector - y axis

// Here use aspect ratio 3/2 corresponding to canvas size 600 x 400
//var projection = new Matrix4().setPerspective(30, 1.5, 0.1, 1000);
var projection = createPerspectiveMatrix(30, 1.5, 1, 100);

var axis = 'y';
var paused = false;

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

//handler for key press events will choose which axis to
// rotate around
function handleKeyPress(event)
{
	var ch = getChar(event);
	switch(ch)
	{
	case ' ':
		paused = !paused;
		break;
	case 'x':
		axis = 'x';
		break;
	case 'y':
		axis = 'y';
		break;
	case 'z':
		axis = 'z';
		break;
	case 'o':
		model.setIdentity();
		axis = 'x';
		break;
		default:
			return;
	}
}



// code to actually render our geometry
function draw()
{
  // clear the framebuffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);

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

  // bind buffers for points
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set uniform in shader for projection * view * model transformation
  var loc = gl.getUniformLocation(lightingShader, "model");
  gl.uniformMatrix4fv(loc, false, model.elements);
  loc = gl.getUniformLocation(lightingShader, "view");
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(lightingShader, "projection");
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(lightingShader, "normalMatrix");
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(model, view));

  loc = gl.getUniformLocation(lightingShader, "lightPosition");
  gl.uniform4f(loc, 2.0, 4.0, 2.0, 1.0);
  loc = gl.getUniformLocation(lightingShader, "u_Color");
  gl.uniform4f(loc, 0.0, 1.0, 0.0, 1.0);

  // bind the index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // draw - note use of function drawElements instead of drawArrays
  gl.drawElements(gl.TRIANGLES, heightMap.numMeshIndices, gl.UNSIGNED_SHORT, 0);

  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(normalIndex);
}

// entry point when page is loaded
function main() {

    // get graphics context
    gl = getGraphicsContext("theCanvas");

    // key handlers
    window.onkeypress = handleKeyPress;

    // load and compile the shader pair
    lightingShader = createShaderProgram(gl, vshaderSource, fshaderSource);

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(heightMap.vertices);

    // buffer for vertex normals
    vertexNormalBuffer = createAndLoadBuffer(heightMap.normals);

    // buffer for indices
    indexBuffer = createAndLoadIndexBuffer(heightMap.meshIndices);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.0, 0.2, 0.2, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // define an animation loop
  var animate = function() {
	draw();

  // increase the rotation by 1 degree, depending on the axis chosen
  if (!paused)
  {
    switch(axis)
    {
    case 'x':
      model = new THREE.Matrix4().makeRotationX(toRadians(0.1)).multiply(model);
      axis = 'x';
      break;
    case 'y':
      axis = 'y';
      model = new THREE.Matrix4().makeRotationY(toRadians(0.1)).multiply(model);
      break;
    case 'z':
      axis = 'z';
      model = new THREE.Matrix4().makeRotationZ(toRadians(0.1)).multiply(model);
      break;
    default:
    }
  }
	// request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}
