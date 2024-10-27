//
// Same as Transformations1.js, but uses the coordinates for the little
// triangle from homework 2, problem 3.
//
//  Using the three.js Matrix4 type:
//  -------------------------------
//   var m = new THREE.Matrix4(); // identity matrix
//   m.makeTranslate(0.3, 0.0, 0.0);  // make it into a translation matrix
//   var m2 = new THREE.Matrix4();
//   m2.makeRotationZ(Math.PI / 2)  // rotate 90 degrees in x-y plane
//   m.multiply(m2);  // multiply m on right by m2, i.e., m = m * m2;
//   var theRealData = m.elements;  // get the underlying Float32Array
//

// vertex shader
const vshaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
void main()
{
  gl_Position = transform * a_Position;
}
`;


// fragment shader
const fshaderSource = `
precision mediump float;
uniform vec4 color;
void main()
{
  gl_FragColor = color;
}
`;


// A little right triangle in the first quadrant as a test figure
var numPoints = 3;
var vertices = new Float32Array([
0.2, 0.1,
0.3, 0.3,
0.2, 0.3,
]
);

// draw some axes too
var numAxisPoints = 4;
var axisVertices = new Float32Array([
-0.9, 0.0,
0.9, 0.0,
0.0, -0.9,
0.0, 0.9
]);


// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexbuffer;
var axisbuffer;

// handle to the compiled shader program on the GPU
var shader;

// code to actually render our geometry
function draw(modelMatrixElements)
{
  // clear the framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT);

  // bind the shader
  gl.useProgram(shader);

  // bind the buffer for the axes
  gl.bindBuffer(gl.ARRAY_BUFFER, axisbuffer);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(shader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);

  // associate the data in the currently bound buffer with the a_position attribute
  // (The '2' specifies there are 2 floats per vertex in the buffer)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

  // we can unbind the buffer now
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set uniform in shader for color (axes are black)
  var colorLoc = gl.getUniformLocation(shader, "color");
  gl.uniform4f(colorLoc, 0.0, 0.0, 0.0, 1.0);

  // set uniform in shader for transformation ("false" means that
  // the array we're passing is already column-major); for axes
  // use the identity since we don't want them to move
  var transformLoc = gl.getUniformLocation(shader, "transform");
  gl.uniformMatrix4fv(transformLoc, false, new THREE.Matrix4().elements);

  // draw line segments for axes
  gl.drawArrays(gl.LINES, 0, numAxisPoints);

  // bind buffer for points (using the same shader)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);

  // set data for position attribute
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

  // unbind
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set color in fragment shader to red
  gl.uniform4f(colorLoc, 1.0, 0.0, 0.0, 1.0);

  // set transformation to our current model matrix
  gl.uniformMatrix4fv(transformLoc, false, modelMatrixElements);

  // draw triangle
  gl.drawArrays(gl.TRIANGLES, 0, numPoints);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.useProgram(null);

}

// entry point when page is loaded
function main() {

  // basically this function does setup that "should" only have to be done once,
  // while draw() does things that have to be repeated each time the canvas is
  // redrawn

  // get graphics context
  gl = getGraphicsContext("theCanvas");

  // load and compile the shader pair
  shader = createShaderProgram(gl, vshaderSource, fshaderSource);

  // load the vertex data into GPU memory
  vertexbuffer = createAndLoadBuffer(vertices);

  // load the vertex data into GPU memory
  axisbuffer = createAndLoadBuffer(axisVertices);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.0, 0.8, 0.8, 1.0);

  // initialize a "transformation matrix" as a 16-element float array
  // in column-major order, this time using the three.js Matrix4 type.

  // identity
  var m = new THREE.Matrix4();

  // example: scale by 3 in the y-direction
  //m = new THREE.Matrix4().makeScale(1, 3, 1);

  // example: 90 degree counterclockwise rotation
  //var r = new THREE.Matrix4().makeRotationZ(toRadians(90));

  // multiply m = m * r (rotate, then scale)
  //m.multiply(r);

  // Or, multiply m = r * m (scale, then rotate)
  //m.premultiply(r);

  // example: translate .3 to the right
  //var t = new THREE.Matrix4().makeTranslation(.3, 0, 0);

  // multiply m = r * t (translate, then rotate)
  // be careful, this modifies r
  //m = r.multiply(t);

  // define an animation loop
  var animate = function() {

    // 'elements' is the a Matrix4 attribute containing the actual
    // 16 numbers as a Float32Array that we can pass to GPU
    draw(m.elements);

    // request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}