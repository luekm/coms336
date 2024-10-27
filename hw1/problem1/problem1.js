// Same as GL_example1a but uses a uniform variable in the vertex
// shader to control the left or right shift of the model.  The shift is
// updated in each frame (see the bottom of the main method) to animate
// the model.


var scale = 1.0;
// vertex shader
const vshaderSource = `
precision mediump float;
attribute vec4 a_Position;
uniform transform;
uniform float shiftX;
//uniform float scale;
uniform float shiftY;

void main()
{
  // constructs a vec4 from a float and a vec3
  gl_Position = vec4(transform * a_Position.x + shiftX, * a_Position.y + shiftY, a_Position.zw);
}
`;


// fragment shader
const fshaderSource = `
void main() {
    gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
  }
`;

// Raw data for some point positions - this will be a square, consisting
// of two triangles.  We provide two values per vertex for the x and y coordinates
// (z will be zero by default).
var numPoints = 3;
var vertices = new Float32Array([
  -0.1, -0.1,
  0.1, -0.1,
  0.0, 0.1
]
);


// A few global variables...

// the OpenGL context
var gl;


// handle to a buffer on the GPU
var vertexbuffer;

// handle to the compiled shader program on the GPU
var shader;

//var scaleFac;


// code to actually render our geometry


function draw(shiftYValue, shiftXValue, scaleValue) {

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

let indexe = gl.getUniformLocation(shader, "shiftY");
gl.uniform1f(indexe, shiftYValue);


let xLocation = gl.getUniformLocation(shader, "shiftX");
gl.uniform1f(xLocation, shiftXValue);


gl.uniform1f(gl.getUniformLocation(shader,"scale"), scale);

// draw, specifying the type of primitive to assemble from the vertices
gl.drawArrays(gl.TRIANGLES, 0, numPoints);

// unbind shader and "disable" the attribute indices
// (not really necessary when there is only one shader)
gl.disableVertexAttribArray(positionIndex);

//let index = gl.getUniformLocation(shader, "shiftX");
//gl.uniform2f(index,shiftXValue);


gl.useProgram(null);

}

function logScale() {
  scale = parseFloat(document.getElementById("scaleBox").value);
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

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.9, 0.85, 0.3, 1.0);

  // we could just call draw() once to see the result, but setting up an animation
  // loop to continually update the canvas makes it easier to experiment with the
  // shaders
  //draw();



  let degree = 0;
  let shiftX = 0;
  let shiftY = -0.0;
  let increment = 1;
  let incrementY = 0.01;
  let scaleBox = document.getElementById("scaleBox");
  scaleBox.onchange = logScale;

  

  // define an animation loop
  var animate = function() {


  	//draw(shiftX);
    //draw(shiftY);
   // if (shiftX < -0.8 || shiftX > 0.8) // increment = -increment;
    shiftX = 0.8 * Math.cos(degree);

    degree += 0.01;
    

    draw(shiftY,shiftX);
    shiftY = 0.8 * Math.sin(degree);

    //if(shiftY < -0.1 || shiftY > 0.1) incrementY = -incrementY;
    //shiftY+= incrementY;
    

    //draw()
    

  	// request that the browser calls animate() again "as soon as it can"
      requestAnimationFrame(animate);
  };

  

  // start drawing!
  animate();

}
