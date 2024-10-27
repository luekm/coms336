//
// Same as Lighting3 but includes a model and a texture.
// Note use of the Camera object, which is a subtype of
// CS336Object that also encapsulates view and projection
// matrices and a function for interpreting key controls.
//
// Edit model and texture filenames below.
// Edit the fragment shader to change how the texture is used.
//

// vertex shader for lighting
const vLightingShaderSource = `
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec4 lightPosition;
uniform vec4 spotPosition;

attribute vec4 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_TexCoord;

varying vec3 fL;
varying vec3 fLSpot;
varying vec3 fN;
varying vec3 fV;
varying vec2 fTexCoord;

void main()
{
  // convert position to eye coords
  vec4 positionEye = view * model * a_Position;

  // convert light position to eye coords
  vec4 lightEye = view * lightPosition;
  vec4 spotEye = view * spotPosition;

  // vector to light
  fL = (lightEye - positionEye).xyz;
  fLSpot = (spotEye - positionEye).xyz;

  // transform normal vector into eye coords
  fN = normalMatrix * a_Normal;

  // vector from vertex position toward view point
  fV = normalize(-(positionEye).xyz);

  fTexCoord = a_TexCoord;
  gl_Position = projection * view * model * a_Position;
}
`;

// fragment shader for lighting
const fLightingShaderSource = `
precision mediump float;

uniform mat3 materialProperties;
uniform mat3 lightProperties;
uniform float shininess;
uniform sampler2D sampler;
uniform sampler2D sampler2;
uniform vec3 spotDirectionEye;
uniform float spotExponent;

varying vec3 fL;
varying vec3 fLSpot;
varying vec3 fN;
varying vec3 fV;
varying vec2 fTexCoord;

void main()
{
  // normalize after interpolating
  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
  vec3 LSpot = normalize(fLSpot);
  vec3 V = normalize(fV);

  // spot factor
  float spotFactor = max(0.0, dot(-LSpot, spotDirectionEye));
  spotFactor = pow(spotFactor, spotExponent);
  
  // reflected vector
  vec3 R = reflect(-L, N);

  // get the columns out of the light and material properties.  We keep the surface
  // properties separate, so we can mess with them using the sampled texture value
  vec4 ambientSurface = vec4(materialProperties[0], 1.0);
  vec4 diffuseSurface = vec4(materialProperties[1], 1.0);
  vec4 specularSurface = vec4(materialProperties[2], 1.0);

  vec4 ambientLight = vec4(lightProperties[0], 1.0);
  vec4 diffuseLight = vec4(lightProperties[1], 1.0);
  vec4 specularLight = vec4(lightProperties[2], 1.0);
  

  // sample from the texture at interpolated texture coordinate
  vec4 color = texture2D(sampler, fTexCoord);
  vec4 color2 = texture2D(sampler2, fTexCoord);

  color2.a = 0.0;

  vec4 finalColor = mix(color, color2 * 5.0, spotFactor);
  

  ambientSurface = color;
  diffuseSurface = color;

  float m = (color2.r + color2.g + color2.b) / 3.0;

  // (3) blend texture using its alpha value (try this with "steve.png")
  float m2 = color2.a;
  ambientSurface = (1.0 - m2) * ambientSurface + m2 * color;
 diffuseSurface = (1.0 - m2) * diffuseSurface + m2 * color;
  specularSurface = (1.0 - m2) * specularSurface + m2 * color;

  // lighting factors as usual

  // Lambert's law, clamp negative values to zero
  float diffuseFactor = max(0.0, dot(L, N));

  // specular factor from Phong reflection model
  float specularFactor = pow(max(0.0, dot(V, R)), shininess);

  // add the components together, note that vec4 * vec4 is componentwise multiplication,
  // not a dot product
  vec4 ambient = ambientLight * ambientSurface;
  vec4 diffuse = diffuseFactor * diffuseLight * finalColor;//diffuseSurface;
  vec4 specular = specularFactor * specularLight * specularSurface;

  gl_FragColor = ambient + diffuse + specular;
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




var modelFilename;

// filename for model (be sure it has texture coordinates)
// - also see the beginning of main()
//modelFilename = "../models/teapot.obj";
//modelFilename = "../models/sphere_tex.obj";


// image file for texture
//var imageFilename = "../images/check64.png";
var imageFilename = "../images/check64border.png";
//var imageFilename = "../images/clover.jpg";
//var imageFilename = "../images/brick.png";
//var imageFilename = "../images/marble.png";
var imageFilename2 = "../images/steve.png";
//var imageFilename = "../images/tarnish.jpg";

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
1.0, 1.0, 0.0, 1.0, ]);

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
// var matPropElements = new Float32Array([
// 0.3, 0.3, 0.3,
// 0.0, 0.8, 0.0,
// 0.8, 0.8, 0.8
// ]);
// var shininess = 30;

// shiny brass
// var matPropElements = new Float32Array([
// 0.33, 0.22, 0.03,
// 0.78, 0.57, 0.11,
// 0.99, 0.91, 0.81
// ]);
// var shininess = 28.0;

// very fake looking white, useful for testing lights
var matPropElements = new Float32Array([
1, 1, 1,
1, 1, 1,
1, 1, 1
]);
var shininess = 20.0;

// clay or terracotta
// var matPropElements = new Float32Array([
// 0.75, 0.38, 0.26,
// 0.75, 0.38, 0.26,
// 0.25, 0.20, 0.15 // weak specular highlight similar to diffuse color
// ]);
// var shininess = 10.0;

// the OpenGL context
var gl;

// our model
var theModel;

// handle to a buffer on the GPU
var vertexBuffer;
var vertexNormalBuffer;
var texCoordBuffer;

var axisBuffer;
var axisColorBuffer;

var lightAxisBuffer;
var lightAxisColorBuffer;

// handle to the compiled shader program on the GPU
var lightingShader;
var colorShader;

// handle to the compiled shader program on the GPU
var shader;

// handle to the texture object on the GPU
var textureHandle;
var textureHandle2;

var axis = 'x';
var paused = false;

// transformation matrices
var model = new THREE.Matrix4();

// instead of view and projection matrices, use a Camera
var camera = new Camera(30, 1.5);
camera.setPosition(0, 2, 5);
camera.lookAt(0, 0, 0);

// spot position and direction
var theObject = new CS336Object();
theObject.setPosition(-2, 1, 2);
theObject.lookAt(0, 0, 0);
var spotExponent = 50;


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
  // if (camera.keyControl(ch))
  // {
  //   return;
  // }
  var e = theObject.position;
  var distance = Math.sqrt(e.x * e.x + e.y * e.y + e.z * e.z);

	switch(ch)
	{
    case 'c':
      spotExponent += 1;
      console.log("spotExponent: " + spotExponent);
      break;
    case 'C':
      spotExponent -= 1;
      console.log("spotExponent: " + spotExponent);
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




	case 's':
		shininess += 1;
		console.log("exponent: " + shininess);
		break;
	case 'S':
		shininess -= 1;
		console.log("exponent: " + shininess);
		break;
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

    // experiment with texture parameters
  case '1':
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    break;
  case '2':
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    break;
  case '3':
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    break;
  case '4':
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    break;
  case '5':
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
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

    var texCoordIndex = gl.getAttribLocation(lightingShader, 'a_TexCoord');
    if (texCoordIndex < 0) {
      console.log('Failed to get the storage location of a_TexCoord');
      return;
    }

    // "enable" the a_position attribute
    gl.enableVertexAttribArray(positionIndex);
    gl.enableVertexAttribArray(normalIndex);
    gl.enableVertexAttribArray(texCoordIndex);


  // bind buffers for points
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);

  // set uniform in shader for projection * view * model transformation
  var projection = camera.getProjection();
  var view = camera.getView();
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
  gl.uniform4f(loc, -2.0, 4.0, 2.0, 1.0);

  // *** light and material properties
  loc = gl.getUniformLocation(lightingShader, "lightProperties");
  gl.uniformMatrix3fv(loc, false, lightPropElements);
  loc = gl.getUniformLocation(lightingShader, "materialProperties");
  gl.uniformMatrix3fv(loc, false, matPropElements);
  loc = gl.getUniformLocation(lightingShader, "shininess");
  gl.uniform1f(loc, shininess);

  // spot direction and exponent
  let spotDirection = [
      -theObject.rotation.elements[8],
      -theObject.rotation.elements[9],
      -theObject.rotation.elements[10]];
  let temp = new THREE.Vector4(spotDirection[0], spotDirection[1], spotDirection[2], 0.0);
  temp = temp.applyMatrix4(view);
  let spotDirEye = new THREE.Vector3(temp.x, temp.y, temp.z).normalize();
  loc = gl.getUniformLocation(lightingShader, "spotDirectionEye");
  gl.uniform3f(loc, spotDirEye.x, spotDirEye.y, spotDirEye.z);
  loc = gl.getUniformLocation(lightingShader, "spotExponent");
  gl.uniform1f(loc, spotExponent);
  loc = gl.getUniformLocation(lightingShader, "spotPosition");
  var lp = theObject.position;
  gl.uniform4f(loc, lp.x, lp.y, lp.z, 1.0);

  // *** need to choose a texture unit, then bind the texture
  // to TEXTURE_2D for that unit
  var textureUnit = 1;
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, textureHandle);
  loc = gl.getUniformLocation(lightingShader, "sampler");
  gl.uniform1i(loc, textureUnit);

  textureUnit = 5;
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, textureHandle2);
  loc = gl.getUniformLocation(lightingShader, "sampler2");
  gl.uniform1i(loc, textureUnit);
  
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
// NOTE: the async keyword is required in order to use await
async function main() {

  // choose a model, possibly loading one from the named file
  //theModel = await loadOBJPromise(modelFilename)

  // or, choose another one
  //theModel = getModelData(new THREE.SphereGeometry(1));
  theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));
  //theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16));

  // load image for texture
  var image = await loadImagePromise(imageFilename);
  var image2 = await loadImagePromise(imageFilename2);

    // get graphics context
    gl = getGraphicsContext("theCanvas");

    // key handlers
    window.onkeypress = handleKeyPress;

    // load and compile the shaders
    lightingShader = createShaderProgram(gl, vLightingShaderSource, fLightingShaderSource);
    colorShader = createShaderProgram(gl, vColorShaderSource, fColorShaderSource);

    // load the vertex data into GPU memory
    vertexBuffer = createAndLoadBuffer(theModel.vertices);

    // *** choose face normals or vertex normals or wacky normals
    //vertexNormalBuffer = createAndLoadBuffer(theModel.normals);
    vertexNormalBuffer = createAndLoadBuffer(theModel.vertexNormals);
    //vertexNormalBuffer = createAndLoadBuffer(theModel.reflectedNormals);

    // load the texture coordinates into GPU memory
    texCoordBuffer = createAndLoadBuffer(theModel.texCoords);

    // ask the GPU to create a texture object
    textureHandle = createAndLoadTexture(image);
    textureHandle2 = createAndLoadTexture(image2);

    // buffer for axis vertices
    axisBuffer = createAndLoadBuffer(axisVertices)

    // buffer for axis colors
    axisColorBuffer = createAndLoadBuffer(axisColors)

    // buffer for spotlight axis vertices
    lightAxisBuffer = createAndLoadBuffer(lightAxisVertices)

    // buffer for spotlight axis colors
    lightAxisColorBuffer = createAndLoadBuffer(lightAxisColors)

    // specify a fill color for clearing the framebuffer
    gl.clearColor(0.0, 0.2, 0.2, 1.0);

    gl.enable(gl.DEPTH_TEST);

    // generate mipmaps for the texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureHandle);
    gl.generateMipmap(gl.TEXTURE_2D);

    // define an animation loop
    var animate = function() {
  	draw();

    // increase the rotation by 1 degree, depending on the axis chosen
    if (!paused)
    {
      switch(axis)
      {
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