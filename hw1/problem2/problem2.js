// Same as GL_example1 but the js file moves the boilerplate
// code into CS336util.js.

// vertex shader
const vshaderSource = `
attribute vec4 a_Position;
void main() {
  gl_Position =  0.8 * a_Position;
}
`;

// fragment shader
const fshaderSource = `
void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`;

var newVert;

// Raw data for some point positions - this will be a square, consisting
// of two triangles.  We provide two values per vertex for the x and y coordinates
// (z will be zero by default).
var numPoints = 6;
 //var vertices = new Float32Array([
// -0.5, -0.5,
// 0.5, -0.5,
// 0.5, 0.5,
// -0.5, -0.5,
// 0.5, 0.5,
// -0.5, 0.5
// ]
// );
var vertices = new Float32Array([
  //   -0.5,-0.5,
  //   0.5, -0.5,
  //  0.0, 0.5
  1.0,0,
  Math.cos(2*Math.PI/5), Math.sin(2*Math.PI/5),
  Math.cos(2*(2*Math.PI/5)), Math.sin(2*(2*Math.PI/5)),
  Math.cos(3*(2*Math.PI/5)), Math.sin(3*(2*Math.PI/5)),
  Math.cos(4*(2*Math.PI/5)), Math.sin(4*(2*Math.PI/5)),
  Math.cos(5*(2*Math.PI/5)), Math.sin(5*(2*Math.PI/5)),
]);



// A few global variables...

// the OpenGL context
var gl;

// handle to a buffer on the GPU
var vertexbuffer;

// handle to the compiled shader program on the GPU
var shader;

// code to actually render our geometry
function draw(numPoints)
{
  // clear the framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT);

  // bind the shader
  gl.useProgram(shader);

  // bind the buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexbuffer);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(shader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);

  // associate the data in the currently bound buffer with the a_position attribute
  // (The '2' specifies there are 2 floats per vertex in the buffer.  Don't worry about
  // the last three args just yet.)
  gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

  // we can unbind the buffer now (not really necessary when there is only one buffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // draw, specifying the type of primitive to assemble
  // (do this in two steps to try out Spector.js)
  

  gl.drawArrays(gl.TRIANGLE_FAN, 0, numPoints);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.useProgram(null);

}

function logPts() {
  numPoints = document.getElementById("myList").value;

  let points = parseInt(numPoints);
  newVert = [];
  newVert.push(1.0);
  newVert.push(0.0);
  let iter = 1;
  let theta = (2 * Math.PI) / points;
  for (let i = 1; i < (points + 1); i++){ 
 

    newVert.push(Math.cos(iter * theta));

    newVert.push(Math.sin(iter * theta));
   iter++;

    

  }
 // var verty = new Float32Array(newVert);
  vertices = new Float32Array(newVert);
  


    vertexbuffer = createAndLoadBuffer(vertices);

   




}


// entry point when page is loaded
function main() {

var dropdown = document.getElementById('myList');
//   switch (dropdown.value)
//   {
//     case 3 :
//         break;
//     case 4 :
//         break;
//     case 5 :
//       break;
//     case 6 :
//         numPoints = 6; break;
//     case 7 :
//         numPoints = 7; break;
//     case 8 :
//         numPoints = 8; break;
//     case 9 :
//         numPoints = 9; break;
//     case 10 :
//         numPoints = 10; break;
//     case 11 :
//         numPoints = 11; break;
//     case 12 :
//         numPoints = 12; break;

//   }
  //dropdown.onchange = logPts;

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

  // define an animation loop
  var animate = function() {


	  draw(numPoints);

    dropdown.onchange = logPts;



	  // request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}