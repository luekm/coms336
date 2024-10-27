// Same as GL_example1a but uses a uniform variable in the vertex
// shader to control the left or right shift of the model.  The shift is
// updated in each frame (see the bottom of the main method) to animate
// the model.


// vertex shader
const vshaderSource = `
precision mediump float;
attribute vec4 a_Position;
uniform mat4 transform;
uniform float shift;
uniform float yshift;
void main()
{
  // constructs a vec4 from a float and a vec3
  gl_Position = transform * vec4(a_Position.x + shift, a_Position.y + yshift, a_Position.z, a_Position.w);
}
`;

// fragment shader
const fshaderSource = `
void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`;



var numPoints = 6;
var vertices = new Float32Array([
0.0, 0.0,
0.3, 0.0,
0.3, 0.2,


0.0, 0.0,  // Shared vertex
-0.3, 0.0,  // Shared vertex
-0.3, -0.2  
]
);

// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexbuffer;
var axisbuffer;

// handle to the compiled shader program on the GPU
var shader;


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
  //gl.drawArrays(gl.LINES, 0, numAxisPoints);

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


// code to actually render our geometry
// function draw(shiftValue)
// {
//   // clear the framebuffer
//   gl.clear(gl.COLOR_BUFFER_BIT);

//   // bind the shader
//   gl.useProgram(shader);

//   // bind the buffer
//   gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);

//   // get the index for the a_Position attribute defined in the vertex shader
//   var positionIndex = gl.getAttribLocation(shader, 'a_Position');
//   if (positionIndex < 0) {
//     console.log('Failed to get the storage location of a_Position');
//     return;
//   }

//   // "enable" the a_position attribute
//   gl.enableVertexAttribArray(positionIndex);

//   // associate the data in the currently bound buffer with the a_position attribute
//   // (The '2' specifies there are 2 floats per vertex in the buffer.  Don't worry about
//   // the last three args just yet.)
//   gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

//   // we can unbind the buffer now (not really necessary when there is only one buffer)
//   gl.bindBuffer(gl.ARRAY_BUFFER, null);

//   let index = gl.getUniformLocation(shader, "shift");
//   gl.uniform1f(index, shiftValue);

//   // draw, specifying the type of primitive to assemble from the vertices
//   gl.drawArrays(gl.TRIANGLES, 0, numPoints);

//   // unbind shader and "disable" the attribute indices
//   // (not really necessary when there is only one shader)
//   gl.disableVertexAttribArray(positionIndex);
//   gl.useProgram(null);

// }

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

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.0, 0.8, 0.8, 1.0);

  // we could just call draw() once to see the result, but setting up an animation
  // loop to continually update the canvas makes it easier to experiment with the
  // shaders
  //draw();

//   let shift = -0.2;
//   let increment = 0.01;

  var m = new THREE.Matrix4();

  // example: scale by 3 in the y-direction
  r = new THREE.Matrix4().makeScale(0.5, 3, 1);

  // example: 90 degree counterclockwise rotation
  var m = new THREE.Matrix4().makeRotationZ(0);
  var rotationMat = new THREE.Matrix4();

  // multiply m = m * r (rotate, then scale)
  m.multiply(r);

  let angle = 0;
  let oAngle = 0;
  var rot;
  var radius = 0.005;
  var increment = 0.01;

  // define an animation loop
  var animate = function() {

    

    //TODO look at exam prep last page for ideas


   if (oAngle < 360) {
    oAngle += increment;
   } else {
    oAngle = 0;
   }
   
    var x = radius * Math.cos(oAngle);
    var y = radius * Math.sin(oAngle);
  

     var translatMat = new THREE.Matrix4().makeTranslation(x,y,0);
     m.premultiply(translatMat);



  angle += 0.04;
  if (angle >= 360) {
    angle = 0;
  }

 // let axis = new THREE.Vector3(0, 0, 1).normalize(); 
  var rotationMat = new THREE.Matrix4().makeRotationZ(toRadians(angle));
  //model = new THREE.Matrix4().makeRotationAxis(axis, toRadians(angle));
 


 // rot = new THREE.Matrix4().copy(rotationMat).multiply(model);
 m = m.multiply(rotationMat);


  draw(m.elements);

 requestAnimationFrame(animate);

  };

  // start drawing!
 
animate();

}
