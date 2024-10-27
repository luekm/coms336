//
// Lighting, continued. Same as Lighting2.js except we define
// a 3x3 matrix for material properties and a 3x3 matrix for light
// properties that are passed to the fragment shader as uniforms.
//
// Edit the light/material matrices in the global variables to experiment.
// Edit main to choose a model and select face normals or vertex normals.
//
// NOTE: if you use a model loaded from an .obj file, you need to:
// a) be running a local server.  See the resources page for ideas.
//   (You can also just rely on the previewer in VSCode.)
// b) Have the OBJLoader.js file available in your workspace along 
//   with three.js.

// if a filename is given, that will be used by the loader
// to initialize 'theModel'
//modelFilename = "../models/teapot.obj";
//modelFilename = "../models/cube_tex.obj";
//modelFilename = "../models/vw.obj";

// Warning, the .obj file for the bunny is 7 MB
//modelFilename = "../models/bunny.obj";

//modelFilename = "../models/dragon.obj";  // 74 MB
//modelFilename = "../models/hairball.obj";  // 236 MB


// vertex shader for lighting
const vLightingShaderSource = `
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

  // add the components together
  gl_FragColor = specularColor * specularFactor + diffuseColor * diffuseFactor + ambientColor;
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


const vNormalShader = `
uniform mat4 transform;
attribute vec4 a_Position;
uniform float scale;
void main()
{
  gl_Position = transform * a_Position;

}

`;

const fNormalShader = `
void main()
{
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
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

// light and material properties, remember this is column major

// generic white light
var lightPropElements = new Float32Array([
  0.2, 0.2, 0.2,
  0.7, 0.7, 0.7,
  0.7, 0.7, 0.7
]);

// blue light with red specular highlights (because we can)
// var lightPropElements = new Float32Array([
// 0.2, 0.2, 0.2,
// 0.0, 0.0, 0.7,
// 0.7, 0.0, 0.0
// ]);

// shiny green plastic
var matPropElements = new Float32Array([
  0.3, 0.3, 0.3,
  0.0, 0.8, 0.0,
  0.8, 0.8, 0.8
]);
var shininess = 30;

// shiny brass
// var matPropElements = new Float32Array([
// 0.33, 0.22, 0.03,
// 0.78, 0.57, 0.11,
// 0.99, 0.91, 0.81
// ]);
// var shininess = 28.0;

// very fake looking white, useful for testing lights
// var matPropElements = new Float32Array([
// .8, .8, .8,
// .8, .8, .8,
// .8, .8, .8,
// ]);
// var shininess = 20.0;

// clay or terracotta
// var matPropElements = new Float32Array([
// 0.75, 0.38, 0.26,
// 0.75, 0.38, 0.26,
// 0.25, 0.20, 0.15 // weak specular highlight similar to diffuse color
// ]);
// var shininess = 10.0;

// the OpenGL context
var gl;

// our model data
var theModel;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;
var faceNormalBuffer;

var axisBuffer;
var axisColorBuffer;

var normalLineBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;
var colorShader;
var normalShader;

var axis = 'y';
var paused = false;
var useFaceNormals = false;

var lineScale;

var normalsData;
var otherData;

var normalLineData;
var faceNormalsData;

var flagged = false;
var flagLine = false;
// transformation matrices
var model = new THREE.Matrix4();

//*** instead of model and view matrices, use a Camera
var camera = new Camera();

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

//handler for key press events will choose which axis to
// rotate around
function handleKeyPress(event) {
  var ch = getChar(event);
  // *** pass char to camera, in case it's a camera control
  if (camera.keyControl(ch)) {
    return;
  }

  switch (ch) {
    case 't':
      shininess += 1;
      console.log("exponent: " + shininess);
      break;
    case 'T':
      shininess -= 1;
      console.log("exponent: " + shininess);
      break;
    case ' ':
      paused = !paused;
      break;
    case 'n':
      useFaceNormals = !useFaceNormals;
      flagged = true;
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
  if (useFaceNormals) {
    gl.bindBuffer(gl.ARRAY_BUFFER, faceNormalBuffer);
  }
  else {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  }
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // get view and projection matrices from camera
  let view = camera.getView();
  let projection = camera.getProjection();

  // set uniform in shader for projection * view * model transformation
  var loc = gl.getUniformLocation(lightingShader, "model");
  gl.uniformMatrix4fv(loc, false, model.elements);
  loc = gl.getUniformLocation(lightingShader, "view");
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(lightingShader, "projection");
  gl.uniformMatrix4fv(loc, false, projection.elements);
  loc = gl.getUniformLocation(lightingShader, "normalMatrix");
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(model, view));

  // set a light position at (2, 4, 2)
  loc = gl.getUniformLocation(lightingShader, "lightPosition");
  gl.uniform4f(loc, 2.0, 4.0, 2.0, 1.0);

  // *** light and material properties
  loc = gl.getUniformLocation(lightingShader, "lightProperties");
  gl.uniformMatrix3fv(loc, false, lightPropElements);
  loc = gl.getUniformLocation(lightingShader, "materialProperties");
  gl.uniformMatrix3fv(loc, false, matPropElements);
  loc = gl.getUniformLocation(lightingShader, "shininess");
  gl.uniform1f(loc, shininess);

  gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(normalIndex);


  // bind the shader for drawing axes
  gl.useProgram(colorShader);

  // get the index for the a_Position attribute defined in the vertex shader
  positionIndex = gl.getAttribLocation(colorShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  var colorIndex = gl.getAttribLocation(colorShader, 'a_Color');
  if (colorIndex < 0) {
    console.log('Failed to get the storage location of a_Color');
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




  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.disableVertexAttribArray(colorIndex);


  gl.useProgram(normalShader);

  positionIndex = gl.getAttribLocation(normalShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  gl.enableVertexAttribArray(positionIndex);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalLineBuffer);

  if (flagged && useFaceNormals == true) {

   gl.bindBuffer(gl.ARRAY_BUFFER,normalLineBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, otherData, gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER,null); 


    flagged = false;
  } else if (flagged && useFaceNormals == false) {

    gl.bindBuffer(gl.ARRAY_BUFFER, normalLineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalsData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,null); 

  
    flagged = false;
  }

  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  loc = gl.getUniformLocation(normalShader, "transform");
  transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(model);
  gl.uniformMatrix4fv(loc, false, transform.elements);
  loc = gl.getUniformLocation(normalShader, "scale");

  if(flagLine == true && useFaceNormals == true) {
    lineScale = logText;
    getData();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalLineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,otherData,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
    flagLine = false;
  } else if (flagLine == true && useFaceNormals == false) {
    lineScale = logText;
    getData();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalLineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,normalsData,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,null);
    flagLine = false;
  }


  gl.uniform1f(loc, lineScale);


  gl.drawArrays(gl.LINES, 0, 2 * theModel.numVertices);

  gl.disableVertexAttribArray(positionIndex);


  gl.useProgram(null);

}

function getData() {

  for (let i = 0; i < theModel.numVertices; i++) {

    normalLineData[(6 * i)] = theModel.vertices[(3 * i)];

    normalLineData[(6 * i) + 1] = theModel.vertices[(3 * i) + 1];

    normalLineData[(6 * i) + 2] = theModel.vertices[(3 * i) + 2];

    normalLineData[(6 * i) + 3] = theModel.vertices[(3 * i)] + theModel.vertexNormals[(3 * i)] * lineScale;

    normalLineData[(6 * i) + 4] = theModel.vertices[(3 * i) + 1] + theModel.vertexNormals[(3 * i) + 1] * lineScale;

    normalLineData[(6 * i) + 5] = theModel.vertices[(3 * i) + 2] + theModel.vertexNormals[(3 * i) + 2] * lineScale;


    faceNormalsData[(6 * i)] = theModel.vertices[(3 * i)];

    faceNormalsData[(6 * i) + 1] = theModel.vertices[(3 * i) + 1];

    faceNormalsData[(6 * i) + 2] = theModel.vertices[(3 * i) + 2];

    faceNormalsData[(6 * i) + 3] = theModel.vertices[(3 * i)] + theModel.normals[(3 * i)] * lineScale;

    faceNormalsData[(6 * i) + 4] = theModel.vertices[(3 * i) + 1] + theModel.normals[(3 * i) + 1] * lineScale;

    faceNormalsData[(6 * i) + 5] = theModel.vertices[(3 * i) + 2] + theModel.normals[(3 * i) + 2] * lineScale;

  }


}

function logText() {
  flagLine = true;
    lineScale = document.getElementById("theTextBox").value;
}



// entry point when page is loaded

async function main() {

  lineScale = document.getElementById("theTextBox").value;
  var aaa = document.getElementById("theTextBox");
  aaa.onchange = logText;

  //theModel = await loadOBJPromise(modelFilename);

  // *** choose a model
  // basic sphere
  //theModel = getModelData(new THREE.SphereGeometry(1));

  // sphere with more faces
  //theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));

  // torus knot
  theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16));

  normalLineData = new Array(theModel.numVertices);
  faceNormalsData = new Array(theModel.numVertices);
  getData();
  normalsData = new Float32Array(normalLineData);
  otherData = new Float32Array(faceNormalsData);


  // get graphics context
  gl = getGraphicsContext("theCanvas");

  // key handlers
  window.onkeypress = handleKeyPress;

  // load and compile the shaders
  lightingShader = createShaderProgram(gl, vLightingShaderSource, fLightingShaderSource);
  colorShader = createShaderProgram(gl, vColorShaderSource, fColorShaderSource);

  normalShader = createShaderProgram(gl, vNormalShader, fNormalShader);

  // load the vertex data into GPU memory
  vertexBuffer = createAndLoadBuffer(theModel.vertices);

  // load both face normals AND vertex normals into buffers
  // so we can select at draw time
  faceNormalBuffer = createAndLoadBuffer(theModel.normals);
  vertexNormalBuffer = createAndLoadBuffer(theModel.vertexNormals);

  normalLineBuffer = createAndLoadBuffer(normalsData);

  // buffer for axis vertices
  axisBuffer = createAndLoadBuffer(axisVertices)

  // buffer for axis colors
  axisColorBuffer = createAndLoadBuffer(axisColors)

  // specify a fill color for clearing the framebuffer
  gl.clearColor(0.0, 0.2, 0.2, 1.0);

  gl.enable(gl.DEPTH_TEST);

  // *** set initial camera parameters
  camera.setPosition(5, 5, 5);
  camera.lookAt(0, 0, 0);
  camera.setAspectRatio(1.5);

  // define an animation loop
  var animate = function () {
    draw();

    // increase the rotation by 1 degree, depending on the axis chosen
    if (!paused) {
      switch (axis) {
        case 'x':
          model = new THREE.Matrix4().makeRotationX(toRadians(0.5)).multiply(model);
          axis = 'x';
          break;
        case 'y':
          axis = 'y';
          model = new THREE.Matrix4().makeRotationY(toRadians(0.5)).multiply(model);
          break;
        case 'z':
          axis = 'z';
          model = new THREE.Matrix4().makeRotationZ(toRadians(0.5)).multiply(model);
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