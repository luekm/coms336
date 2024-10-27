//
// Test of HeightMap.js renders a wireframe.  Edit lines ~95-100
// to change the height map function.
//

// vertex shader
const vshaderSource = `
precision mediump float;
uniform mat4 transform;
attribute vec4 a_Position;
varying float worldSpaceHeight;
void main()
{
  worldSpaceHeight = a_Position.y;
  gl_PointSize = 2.0;
  gl_Position = transform * a_Position;
}
`;


// fragment shader uses the world space y-value
// to shade the wireframe
const fshaderSource = `
precision mediump float;
uniform float minY;
uniform float maxY;
varying float worldSpaceHeight;

void main()
{
  float fraction = (worldSpaceHeight - minY) / (maxY - minY);
  vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
  vec4 yellow = vec4(1.0, 1.0, 0.0, 1.0);
  vec4 c = fraction * yellow + (1.0 - fraction) * red;
  gl_FragColor = c;
}
`;



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

var heightMap;
// a couple of sample functions for the height map
heightMap = new HeightMap(ripple, 40, 40, -1, 1, -1, 1);
//heightMap = new HeightMap(hypParaboloid, 40, 40, -1, 1, -1, 1);
//heightMap = new HeightMap(pyramid, 40, 40, -1, 1, -1, 1);
//heightMap = new HeightMap(cone, 40, 40, -1, 1, -1, 1);
//heightMap = new HeightMap(mandelbrot, 200, 200, -2.5, 1, -1, 1);


// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexBuffer;
var indexBuffer;


// handle to the compiled shader program on the GPU
var shader;

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
	// rotation controls
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

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);

  // bind buffers for points
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.uniform1f(gl.getUniformLocation(shader, "minY"), heightMap.minY);
  gl.uniform1f(gl.getUniformLocation(shader, "maxY"), heightMap.maxY);

  // set uniform in shader for projection * view * model transformation
  var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(model);
  var transformLoc = gl.getUniformLocation(shader, "transform");
  gl.uniformMatrix4fv(transformLoc, false, transform.elements);

  //gl.drawArrays(gl.POINTS, 0, heightMap.numVertices);

  // bind the index buffer
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // draw - note use of function drawElements instead of drawArrays
  gl.drawElements(gl.LINES, heightMap.numWireframeIndices, gl.UNSIGNED_SHORT, 0);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(positionIndex);
  gl.useProgram(null);
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
  shader = createShaderProgram(gl, vshaderSource, fshaderSource);

  // load the vertex data into GPU memory
  vertexBuffer = createAndLoadBuffer(heightMap.vertices);

  // buffer for vertex normals
  vertexNormalBuffer = createAndLoadBuffer(heightMap.normals);

  // buffer for indices
  indexBuffer = createAndLoadIndexBuffer(heightMap.wireframeIndices);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0, 0, 0, 1.0);

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
