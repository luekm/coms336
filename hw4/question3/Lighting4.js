//
// Lighting, continued. Same as Lighting2.js except we define
// a 3x3 matrix for material properties and a 3x3 matrix for light
// properties that are passed to the fragment shader as uniforms.
//
// Edit the light/material matrices in the global variables to experiment.
// Edit main to choose a model and select face normals or vertex normals.
//

// vertex shader for lighting
const vLightingShaderSource = `
precision mediump float;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec4 lightPosition;

attribute vec4 a_Position;
attribute vec3 a_Normal;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
void main()
{
  // convert position to eye coords
  vec4 positionEye = view * model * a_Position;

  // convert light position to eye coords
  vec4 lightEye = view * lightPosition;

  // vector to light
  fL = (lightEye - positionEye).xyz;

  // transform normal vector into eye coords
  fN = normalMatrix * a_Normal;

  // vector from vertex position toward view point
  fV = normalize(-(positionEye).xyz);

  gl_Position = projection * view * model * a_Position;
}
`;


// fragment shader for lighting
const fLightingShaderSource = `
precision mediump float;

uniform mat3 materialProperties;
uniform mat3 lightProperties;
uniform float shininess;
uniform float cExp;
uniform vec3 D;

uniform mat4 view;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
void main()
{
  // normalize after interpolating
  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
  vec3 V = normalize(fV);

  // reflected vector
  vec3 R = reflect(-L, N);

  // multiply each lighting constant with the corresponding material constant,
  // then grab the three columns to get the ambient, diffuse, and specular components
  mat3 products = matrixCompMult(lightProperties, materialProperties);
  vec4 ambientColor = vec4(products[0], 1.0);
  vec4 diffuseColor = vec4(products[1], 1.0);
  vec4 specularColor = vec4(products[2], 1.0);

  // Lambert's law, clamp negative values to zero
  float diffuseFactor = max(0.0, dot(L, N));

  // specular factor from Phong reflection model
  float specularFactor = pow(max(0.0, dot(V, R)), shininess);

  // spot
  //vec3 Dw = vec3(0.0, -1.0, 0.0); // straight down, in world coords
  //vec3 D = (view * vec4(Dw, 0.0)).xyz;
 // vec3 D = vec3(0.0, -0.707, -0.707);
 vec3 D = (view * vec4(D,0.0)).xyz;

  float spotFactor =  pow(max(0.0, dot(-L, D)), cExp);

  // add the components together
  //gl_FragColor = specularColor * specularFactor + diffuseColor * diffuseFactor + ambientColor;
  gl_FragColor = spotFactor * (specularColor * specularFactor + diffuseColor * diffuseFactor + ambientColor);


  gl_FragColor.a = 1.0;
}
`;

// vertex shader for color only
const vColorShaderSource = `
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


// fragment shader for color only
const fColorShaderSource = `
precision mediump float;
varying vec4 color;
void main()
{
  gl_FragColor = color;
}
`;

// vertex shader for solid color
const vSolidShaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
void main()
{
  gl_Position = transform * a_Position;
}

`;

// fragment shader for solid color
const fSolidShaderSource = `
precision mediump float;
uniform vec4 color;
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

var lightAxisVertices = new Float32Array([
  0.0, 0.0, 0.0,
  0.0, 0.0, -10.0]);

var lightAxisColors = new Float32Array([
  1.0, 1.0, 0.0, 1.0,
  1.0, 1.0, 0.0, 1.0,]);
// A few global variables...

// light and material properties, remember this is column major

// generic white light
var lightPropElements = new Float32Array([
  0.2, 0.2, 0.2,
  0.7, 0.7, 0.7,
  0.7, 0.7, 0.7
]);

// blue light with red specular highlights (because we can)
//var lightPropElements = new Float32Array([
//0.2, 0.2, 0.2,
//0.0, 0.0, 0.7,
//0.7, 0.0, 0.0
//]);

// shiny green plastic
//var matPropElements = new Float32Array([
//0.3, 0.3, 0.3,
//0.0, 0.8, 0.0,
//0.8, 0.8, 0.8
//]);
//var shininess = 30;

// shiny brass
//var matPropElements = new Float32Array([
//0.33, 0.22, 0.03,
//0.78, 0.57, 0.11,
//0.99, 0.91, 0.81
//]);
//var shininess = 28.0;

// very fake looking white, useful for testing lights
var matPropElements = new Float32Array([
  1, 1, 1,
  1, 1, 1,
  1, 1, 1
]);
var shininess = 20.0;
var cExp = 15;

// clay or terracotta
//var matPropElements = new Float32Array([
//0.75, 0.38, 0.26,
//0.75, 0.38, 0.26,
//0.25, 0.20, 0.15 // weak specular highlight similar to diffuse color
//]);
//var shininess = 10.0;

// the OpenGL context
var gl;

// our model data
var theModel;
var planeModel;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;

var vertexBufferPlane;
var vertexNormalBufferPlane;

var axisBuffer;
var axisColorBuffer;

var lightAxisBuffer;
var lightAxisColorBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;
var colorShader;
var solidShader;

// transformation matrices
var model = new THREE.Matrix4();

var axis = 'x';
var paused = false;

// light position and direction, initially looking straight down y axis
var theObject = new CS336Object();
theObject.setPosition(0, 4, 0);
theObject.rotateX(-90);

// transformation matrices
var model = new THREE.Matrix4();

// view matrix
var view = createLookAtMatrix(
  new THREE.Vector3(1.77, 3.54, 3.06),   // eye
  new THREE.Vector3(0.0, 0.0, 0.0),      // at - looking at the origin
  new THREE.Vector3(0.0, 1.0, 0.0));    // up vector - y axis
console.log();
var downVector = new THREE.Vector4(0, -1, 0, 0);
downVector.applyMatrix4(view);
console.log(downVector);

var mm = theObject.rotation;
console.log(mm);
var spotDirModel = new THREE.Vector4(-mm.elements[8], -mm.elements[9], -mm.elements[10], 0);
console.log(spotDirModel);
//spotDirModel.applyMatrix4(mm);
//console.log(spotDirModel);
spotDirModel.applyMatrix4(view);
console.log(spotDirModel);

// Here use aspect ratio 3/2 corresponding to canvas size 600 x 400
//var projection = new Matrix4().setPerspective(30, 1.5, 0.1, 1000);
var projection = createPerspectiveMatrix(30, 1.5, 1, 100);


//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
  if (event.which == null) {
    return String.fromCharCode(event.keyCode) // IE
  } else if (event.which != 0 && event.charCode != 0) {
    return String.fromCharCode(event.which)   // the rest
  } else {
    return null // special key
  }
}

function handleKeyPress(event) {
  var ch = getChar(event);

  // distance from origin
  var e = theObject.position; // returns Vector3
  var distance = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);

  switch (ch) {
    case 'C':
      cExp -= 1;
      console.log("c exponent: " + cExp);
      break;

    case 'c':
      cExp += 1;
      console.log("c exponent: " + cExp);

      break;
    // shininess exponent
    case 't':
      shininess += 1;
      console.log("exponent: " + shininess);
      break;
    case 'T':
      shininess -= 1;
      console.log("exponent: " + shininess);
      break;

    // pause rotation
    case ' ':
      paused = !paused;
      break;

    // motion controls for light
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
      //theObject.lookUp(5);
      theObject.rotateX(5)
      break;
    case 'k':
      //theObject.lookDown(5);
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

  var lightPosition = theObject.position;
  console.log("Light position " + lightPosition);
  var lightDirection = [
    -theObject.rotation.elements[8],
    -theObject.rotation.elements[9],
    -theObject.rotation.elements[10]];
  console.log("Light direction " + lightDirection);

}


// code to actually render our geometry
function draw() {
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

  // set light position
  var lp = theObject.position;
  loc = gl.getUniformLocation(lightingShader, "lightPosition");
  gl.uniform4f(loc, lp.x, lp.y, lp.z, 1.0);

  var D;
  var objZ = new THREE.Vector3(0, 0, -1);

  var newZ = objZ.clone();
  newZ.applyMatrix4(theObject.rotation);

  var eyeNegativeZAxis = newZ.clone();

  var D = eyeNegativeZAxis;



  // light and material properties
  loc = gl.getUniformLocation(lightingShader, "lightProperties");
  gl.uniformMatrix3fv(loc, false, lightPropElements);
  loc = gl.getUniformLocation(lightingShader, "materialProperties");
  gl.uniformMatrix3fv(loc, false, matPropElements);
  loc = gl.getUniformLocation(lightingShader, "shininess");
  gl.uniform1f(loc, shininess);


  //q3 implementation

  loc = gl.getUniformLocation(lightingShader, "cExp");
  gl.uniform1f(loc, cExp);
  loc = gl.getUniformLocation(lightingShader, "D");
  gl.uniform3f(loc, D.x, D.y, -D.z);

  // 



  gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

  // draw the plane
  // bind buffers
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferPlane);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBufferPlane);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // rotate to be parallel to x-z plane and translate 'planeLocation' units down
  var planeLocation = 2;
  var planeModelMatrix = new THREE.Matrix4().makeTranslation(0, -planeLocation, 0)
    .multiply(new THREE.Matrix4().makeRotationX(toRadians(-90)));
  loc = gl.getUniformLocation(lightingShader, "model");
  gl.uniformMatrix4fv(loc, false, planeModelMatrix.elements);
  loc = gl.getUniformLocation(lightingShader, "normalMatrix");
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(planeModelMatrix, view));

  // draw plane
  gl.drawArrays(gl.TRIANGLES, 0, planeModel.numVertices);

  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(normalIndex);


  // draw the flat shadow using the "solid" shader
  gl.useProgram(solidShader);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(solidShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);

  // bind buffer for points for cube
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

  // draw the "flat shadow"


  // get coords of light's current position, which will be center of projection
  var tx = theObject.position.x;
  var ty = theObject.position.y;
  var tz = theObject.position.z;

  // Set up the basic perspective projection matrix.
  // d is total distance from center of projection to plane, so -d will be the
  // y-coordinate of the plane when center of projection is translated to origin
  var d = ty + planeLocation - .01; // make sure shadow is slightly above plane
  var shadowProjection = new THREE.Matrix4();
  shadowProjection.elements[7] = 1 / -d;
  shadowProjection.elements[15] = 0;

  // for this matrix to work, center of projection has to be at origin,
  // so use AMA' pattern to translate to origin
  shadowProjection = new THREE.Matrix4().makeTranslation(tx, ty, tz)
    .multiply(shadowProjection)
    .multiply(new THREE.Matrix4().makeTranslation(-tx, -ty, -tz));
  loc = gl.getUniformLocation(solidShader, "color");
  gl.uniform4f(loc, 0.2, 0.2, 0.2, 1.0); // gray shadow

  // apply the cube's current model transformation, then apply the shadow projection
  // to get the "shadow", then apply the usual view and projection for the scene
  loc = gl.getUniformLocation(solidShader, "transform");
  transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(shadowProjection).multiply(model);
  gl.uniformMatrix4fv(loc, false, transform.elements);

  gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

  gl.disableVertexAttribArray(positionIndex);

  // now draw axes
  // bind the shader
  gl.useProgram(colorShader);

  // get the index for the a_Position attribute defined in the vertex shader
  positionIndex = gl.getAttribLocation(colorShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var colorIndex = gl.getAttribLocation(colorShader, 'a_Color');
  if (colorIndex < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // "enable" the a_position attribute
  gl.enableVertexAttribArray(positionIndex);
  gl.enableVertexAttribArray(colorIndex);

  // draw axes (not transformed by model transformation)
  gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, axisColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set transformation to projection * view only
  loc = gl.getUniformLocation(colorShader, "transform");
  transform = new THREE.Matrix4().multiply(projection).multiply(view);
  gl.uniformMatrix4fv(loc, false, transform.elements);

  // draw axes
  gl.drawArrays(gl.LINES, 0, 6);

  // draw a line representing light direction
  gl.bindBuffer(gl.ARRAY_BUFFER, lightAxisBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, lightAxisColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set transformation to be transformation of the light object
  loc = gl.getUniformLocation(colorShader, "transform");
  transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(theObject.getMatrix());
  gl.uniformMatrix4fv(loc, false, transform.elements);

  // draw line
  gl.drawArrays(gl.LINES, 0, 2);


  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(colorIndex);
  gl.useProgram(null);

}

// entry point when page is loaded
function main() {

  // get graphics context
  gl = getGraphicsContext("theCanvas");

  // key handlers
  window.onkeypress = handleKeyPress;

  // load and compile the shaders
  lightingShader = createShaderProgram(gl, vLightingShaderSource, fLightingShaderSource);
  colorShader = createShaderProgram(gl, vColorShaderSource, fColorShaderSource);
  solidShader = createShaderProgram(gl, vSolidShaderSource, fSolidShaderSource);

  // choose a model
  // cube
  theModel = getModelData(new THREE.BoxGeometry(1, 1, 1))

  // basic sphere
  //theModel = getModelData(new THREE.SphereGeometry(1))

  // sphere with more faces
  //theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));

  // torus knot
  //theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16));

  // load the vertex data into GPU memory
  vertexBuffer = createAndLoadBuffer(theModel.vertices);
  vertexNormalBuffer = createAndLoadBuffer(theModel.vertexNormals);

  // buffers for axes
  axisBuffer = createAndLoadBuffer(axisVertices)
  axisColorBuffer = createAndLoadBuffer(axisColors)

  // buffers for plane
  planeModel = getModelData(new THREE.PlaneGeometry(5, 5));
  vertexBufferPlane = createAndLoadBuffer(planeModel.vertices);
  vertexNormalBufferPlane = createAndLoadBuffer(planeModel.normals);

  // buffers for drawing the yellow light axis
  lightAxisBuffer = createAndLoadBuffer(lightAxisVertices);
  lightAxisColorBuffer = createAndLoadBuffer(lightAxisColors);

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.0, 0.2, 0.2, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // define an animation loop
  var animate = function () {
    draw();

    // increase the rotation by some amount, depending on the axis chosen
    if (!paused) {
      model = new THREE.Matrix4().makeRotationX(toRadians(0.5)).multiply(model);
    }

    // request that the browser calls animate() again "as soon as it can"
    requestAnimationFrame(animate);
  };

  // start drawing!
  animate();


}
