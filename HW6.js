/*


HW6 OPTION 1
Group:
Lucas Metcalf
Jacob Butler


*/
const vLightingShaderSource = `
#define MAX_LIGHTS 3

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
// uniform vec4 u_Color;
uniform mat3 normalMatrix;
// uniform vec4 lightPosition;

varying vec2 a_TexCoord;
varying vec2 fTexCoord;

attribute vec4 a_Position;
attribute vec3 a_Normal;

// position for each light
uniform vec4 lightPosition[MAX_LIGHTS];


// // we'll have an L vector pointing to each light
varying vec3 fL[MAX_LIGHTS];
varying vec3 fN;
varying vec3 fV;

varying vec4 color;
void main()
{
  // simple Gouraud shading
  // float ambientFactor = 0.3;
  // vec3 lightDirection = normalize((view * lightPosition - view * model * a_Position).xyz);
  // vec3 normal = normalize(normalMatrix * a_Normal);
  // float diffuseFactor = max(0.0, dot(lightDirection, normal));
  // color = u_Color * diffuseFactor + u_Color * ambientFactor;
  // color.a = 1.0;
  // gl_Position = projection * view * model * a_Position;

  // convert position to eye coords
  vec4 positionEye = view * model * a_Position;

  // vector to light, computed once per light
  for (int i = 0; i < MAX_LIGHTS; ++i)
  {
    // convert light position to eye coords
    vec4 lightEye = view * lightPosition[i];
    fL[i] = (lightEye - positionEye).xyz;
  }

  // transform normal matrix into eye coords
  fN = normalMatrix * a_Normal;

  // vector from vertex position toward view point
  fV = normalize(-(positionEye).xyz);

  fTexCoord = a_TexCoord;

  gl_Position = projection * view * model * a_Position;
}
`;


// fragment shader
const fLightingShaderSource = `
#define MAX_LIGHTS 3
precision mediump float;
// varying vec4 color;

varying vec2 fTexCoord;
uniform sampler2D sampler;


precision mediump float;

uniform mat3 materialProperties;
uniform mat3 lightProperties[MAX_LIGHTS];
uniform float shininess;

varying vec3 fL[MAX_LIGHTS];
varying vec3 fN;
varying vec3 fV;
// helper method does lighting calculation for one light
// and returns the resulting color
vec4 getLightContribution(vec3 fL, mat3 lightProp, vec3 N, vec3 V)
{
  vec3 L = normalize(fL);

  // reflected vector
  vec3 R = reflect(-L, N);

  vec4 color = texture2D(sampler, fTexCoord);

  mat3 products = matrixCompMult(lightProp, materialProperties);
 vec4 ambientColor = vec4(products[0], 1.0);
//vec4 ambientColor = color;
//vec4 diffuseColor = color;
  vec4 diffuseColor = vec4(products[1], 1.0);
  vec4 specularColor = vec4(products[2], 1.0);

  // Lambert's law, clamp negative values to zero
  float diffuseFactor = max(0.0, dot(L, N));

  // specular factor from Phong reflection model
  float specularFactor = pow(max(0.0, dot(V, R)), shininess);

  // add the components together
  vec4 ret = specularColor * specularFactor + diffuseColor * diffuseFactor + ambientColor;

  return ret;
}

void main()
{
  //gl_FragColor = color;
  // normalize after interpolating
  vec3 N = normalize(fN);
  vec3 V = normalize(fV);

  // add in the contribution from each light
  vec4 sum = vec4(0.0, 0.0, 0.0, 0.0);
  for (int i = 0; i < MAX_LIGHTS; ++i)
  {
    sum += getLightContribution(fL[i], lightProperties[i], N, V);
  }

  // usually need to rescale somehow after adding
  gl_FragColor = sum / 2.0; //float(MAX_LIGHTS);
  gl_FragColor.a = 1.0;
}
`;
//end shaders

// vertex shader for skybox
const vshaderSource = `
precision mediump float;
uniform mat4 transform;
attribute vec4 a_Position;
varying vec3 fTexVector;

void main()
{
  // texture coordinate for cube map is just a normalized vector pointing
  // to the vertex
  fTexVector = normalize((a_Position).xyz);
  gl_Position = transform * a_Position;
}
`;

// vertex shader for model with reflection
const vshaderForReflectionSource = `
precision mediump float;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec4 viewPoint;
attribute vec4 a_Position;
attribute vec3 a_Normal;
varying vec3 fTexVector;
uniform float reflact;

// attribute vec2 a_TexCoord;
// uniform sampler2D samplerDecal;

// varying vec2 fTexCoord;

void main()
{
  // vector pointing towards camera position, in world coordinates
  vec4 positionWorld = model * a_Position;
  vec3 E = normalize((viewPoint - positionWorld).xyz);

  // In this example, normalMatrix is the inverse transpose
  // of the model matrix, not view*model, because we want N
  // in world coordinates
  vec3 N = normalize(normalMatrix * a_Normal);

  // Reflected vector
  vec3 R = reflect(-E, N);

  if(reflact > 0.0){
    // Or, try refraction.  .66 is the approx 'eta' value for air/glass
    vec3 R = refract(-E, N, reflact);
  }
  

  fTexVector = R;
  // if(a_TexCoord) { fTexCoord = a_TexCoord; }
  gl_Position = projection * view * model * a_Position;
}
`;

// fragment shader is the same in both cases
const fshaderSource = `
precision mediump float;
uniform samplerCube sampler;
varying vec3 fTexVector;

// uniform sampler2D samplerDecal;
// varying vec2 fTexCoord;

void main()
{
  // sample from the texture at the interpolated texture vector,
  // and use the value directly as the surface color
  vec4 color = textureCube(sampler, fTexVector);
 

  // if(fTexCoord){
  //   vec4 decal = texture2D(samplerDecal, fTexCoord);
  //   color = 0.5 * color + 0.5 * decal
  // }

  gl_FragColor = color;
}
`;

const newvLightingShaderSource = `
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;
uniform vec4 lightPosition;

attribute vec4 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_TexCoord;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
varying vec2 fTexCoord;

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

  fTexCoord = a_TexCoord;
  gl_Position = projection * view * model * a_Position;
}
`;

// fragment shader for lighting
const newfLightingShaderSource = `
precision mediump float;

uniform mat3 materialProperties;
uniform mat3 lightProperties;
uniform float shininess;
uniform sampler2D sampler;

varying vec3 fL;
varying vec3 fN;
varying vec3 fV;
varying vec2 fTexCoord;

void main()
{
  // normalize after interpolating
  vec3 N = normalize(fN);
  vec3 L = normalize(fL);
  vec3 V = normalize(fV);

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
   //vec4 color = texture2D(sampler, fTexCoord);
   vec4 color = texture2D(sampler, vec2(fTexCoord.s * 4.0, fTexCoord.t * 4.0));

  // (1) use the value directly as the surface color and ignore the material properties
  ambientSurface = color;
  diffuseSurface = color;
  //diffuseSurface = .5 * color + .5 * diffuseSurface;

  // (2) modulate intensity of surface color (or of any component)
  //float m = (color.r + color.g + color.b) / 3.0;
  // ambientSurface *= m;
  //diffuseSurface *= m;
  //specularSurface *= m;

  // (3) blend texture using its alpha value (try this with "steve.png")
  //float m = color.a;
  //ambientSurface = (1.0 - m) * ambientSurface + m * color;
  //diffuseSurface = (1.0 - m) * diffuseSurface + m * color;
  //specularSurface = (1.0 - m) * specularSurface + m * color;
  

  // lighting factors as usual

  // Lambert's law, clamp negative values to zero
  float diffuseFactor = max(0.0, dot(L, N));

  // specular factor from Phong reflection model
  float specularFactor = pow(max(0.0, dot(V, R)), shininess);

  // add the components together, note that vec4 * vec4 is componentwise multiplication,
  // not a dot product
  vec4 ambient = ambientLight * ambientSurface;
  vec4 diffuse = diffuseFactor * diffuseLight * diffuseSurface;
  vec4 specular = specularFactor * specularLight * specularSurface;
  //gl_FragColor = ambient + diffuse + specular;
  gl_FragColor = color;
  gl_FragColor.a = 1.0;
}
`;

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

const texvshaderSource = `
uniform mat4 transform;
attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec2 a_TexCoord;
varying vec2 fTexCoord;
varying vec4 fColor;
void main()
{
  // pass through so the value gets interpolated
  fTexCoord = a_TexCoord;
  fColor = a_Color;
  gl_Position = transform * a_Position;
}

`;

// fragment shader for texture
const texfshaderSource = `
precision mediump float;
uniform sampler2D sampler;
uniform float colorFactor;
varying vec2 fTexCoord;
varying vec4 fColor;
void main()
{
  // sample from the texture at the interpolated texture coordinate,
  // use the texture's alpha to blend with given color
  vec4 texColor = texture2D(sampler, fTexCoord);
  float alpha = texColor.a;
  texColor *= colorFactor;
  gl_FragColor = (1.0 - alpha) * fColor + alpha * texColor;
  gl_FragColor.a = 1.0;
}
`;



var theModel;
var theModel2;
var imageNames;
var theSphere;
var moonTex;

// use a cube for the cube map...
var cube = getModelData(new THREE.BoxGeometry(1, 1, 1));

// choose a geometry
theModel2 = getModelData(new THREE.CylinderGeometry(1, 1, 1));
// theModel = getModelData(new THREE.SphereGeometry(1, 8, 8));
// theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));
// theModel = getModelData(new THREE.TorusKnotGeometry(1, .4, 128, 16));
theModel = getModelData(new THREE.SphereGeometry(1, 48, 24));

// choose image file for texture, if we're not making a skybox
//var imageFilename = "../images/check64.png";
//var imageFilename = "../images/check64border.png";
//var imageFilename = "../images/clover.jpg";
//var imageFilename = "../images/brick.png";
//var imageFilename = "../images/marble.png";
//var imageFilename = "../images/steve.png";
//var imageFilename = "../images/tarnish.jpg";

// we can use the same image in all 6 directions...
// imageNames = [
//               imageFilename,
//               imageFilename,
//               imageFilename,
//               imageFilename,
//               imageFilename,
//               imageFilename,
//               ];

// ... or use 6 different images to make a skybox
var path = "cloudy/";
imageNames = [
         path + "yellowcloud_ft.jpg",
         path + "yellowcloud_bk.jpg",
         path + "yellowcloud_up.jpg",
         path + "yellowcloud_dn.jpg",
         path + "yellowcloud_rt.jpg",
         path + "yellowcloud_lf.jpg"
         ];

var moonName = "images/moonmap.png";



// A few global variables...

// the OpenGL context
var gl;

// To make a "lens" like thing, use the higher-quality sphere, choose
// vertex normals, and scale the model to make it flattened
//var modelScale = new THREE.Matrix4().makeScale(1, 1, 0.5);
var modelScale = new THREE.Matrix4();

// make the cube large to act as a skybox
var cubeScale = new THREE.Matrix4().makeScale(100, 100, 100);
var planeScale = new THREE.Matrix4().makeScale(100,1,100);

// handle to a buffer on the GPU
var vertexBufferCube;
var vertexBuffer;
var vertexNormalBuffer;
var vertexBuffer2;
var vertexNormalBuffer2;
var texCoordBuffer;
var texCoordBuffer2;
var vertexColorBuffer;
var cubeBuffer;
var cubeNormalBuffer;

var sphere = getModelData(new THREE.SphereGeometry());
var sphereVertexBuffer;
var sphereNormalVertexBuffer;

// handle to the compiled shader program on the GPU
var shader;
var reflectionShader;
var lightingShader;
var newShader;
var colorShader;
var textureShader;


var planetemp = new THREE.PlaneGeometry();
planetemp.rotateX(90);


var plane = getModelData(planetemp);
var planeVertexBuffer;
var planeNormalVertexBuffer;

var bunny;
var modelFilename = "images/bunny.obj";

var fbos = [];
var OFFSCREEN_WIDTH = 2048;
var OFFSCREEN_HEIGHT = 2048

var aDummy = new CS336Object();
var torso = new CS336Object(drawCube);
torso.setPosition(4,-0.8,1);
torso.rotateY(16);
torso.setScale(0.7,1,0.7);
aDummy.addChild(torso);

var lArm = new CS336Object(drawCube);
lArm.setPosition(0,0.4,0.7);
lArm.rotateX(-330)
lArm.setScale(0.7,0.8,0.5);
torso.addChild(lArm);

var rArm = new CS336Object(drawCube);
rArm.setPosition(0,0.1,-0.7);
rArm.setScale(0.7,0.8,0.5);
torso.addChild(rArm);

var headDummy = new CS336Object();
var head = new CS336Object(drawCube);
head.setPosition(0,0.6,0);
head.setScale(1.4,0.5,1);
torso.addChild(head);

var lEye = new CS336Object(drawCube);
lEye.setScale(0.2,0.2,0.2);
lEye.setPosition(-0.5,0.2,0.3)
head.addChild(lEye);

var rEye = new CS336Object(drawCube);
rEye.setScale(0.2,0.2,0.2);
rEye.setPosition(-0.5,0.2,-0.3)
head.addChild(rEye);

var lLeg = new CS336Object(drawCube);
lLeg.setPosition(0,-0.8,-0.3);
lLeg.rotateX(5);
lLeg.setScale(0.7,0.8,0.5);
torso.addChild(lLeg);

var rLeg = new CS336Object(drawCube);
rLeg.setPosition(0,-0.8,0.3);
rLeg.rotateX(-5);
rLeg.setScale(0.7,0.8,0.5);
torso.addChild(rLeg);

var atomDummy = new CS336Object();


var nucleus = new CS336Object(drawSphere);
nucleus.setPosition(-4,2,-4);
atomDummy.addChild(nucleus);

var nucleusDummy0 = new CS336Object();
nucleus.addChild(nucleusDummy0);

var nucleusDummy1 = new CS336Object();
nucleus.addChild(nucleusDummy1);

var orbiter0 = new CS336Object(drawSphere);
orbiter0.setPosition(3,0,0);
orbiter0.setScale(0.3,0.3,0.3);
nucleusDummy0.addChild(orbiter0);

var orbiter0dummy = new CS336Object();
orbiter0.addChild(orbiter0dummy);

var orbiter1 = new CS336Object(drawSphere);
orbiter1.setPosition(0,1.5,0);
orbiter1.setScale(0.3,0.3,0.3);
nucleusDummy1.addChild(orbiter1);

var littleGuy = new CS336Object(drawSphere);
littleGuy.setPosition(0,0,2);
littleGuy.setScale(0.2,0.2,0.2);
orbiter0dummy.rotateX(45);
orbiter0dummy.addChild(littleGuy);

// red light
var lightPropElements0 = new Float32Array([
  0.2, 0.2, 0.2,
  0.7, 0.0, 0.0,
  0.7, 0.0, 0.0
  ]);
  
  // green light
  var lightPropElements1 = new Float32Array([
  0.2, 0.2, 0.2,
  0.0, 0.7, 0.0,
  0.0, 0.7, 0.0
  ]);
  
  // blue light
  var lightPropElements2 = new Float32Array([
  0.2, 0.2, 0.2,
  0.0, 0.0, 0.7,
  0.0, 0.0, 0.7
  ]);
  
  // very fake looking white, useful for testing lights
  var matPropElements = new Float32Array([
  1, 1, 1,
  1, 1, 1,
  1, 1, 1
  ]);
  var shininess = 20.0;



// handle to the texture object on the GPU
var textureHandle;
var moonHandle;
var decalHandle;

// transformation matrices
var model = new THREE.Matrix4();

var model2 = new THREE.Matrix4().setPosition(-1.5,-1.5,-1.5);

var planemat = new THREE.Matrix4().setPosition(0,-2,0);

// instead of view and projection matrices, use a Camera
var camera = new Camera(30, 1.5);

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
  if (camera.keyControl(ch))
  {
    return;
  }

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

    // experiment with texture parameters
  case '1':
    gl.bindTexture(gl.TEXTURE_2D, moonHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    break;
  case '2':
    gl.bindTexture(gl.TEXTURE_2D, mooonHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    break;
  case '3':
    gl.bindTexture(gl.TEXTURE_2D, moonHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    break;
  case '4':
    gl.bindTexture(gl.TEXTURE_2D, moonHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    break;
  case '5':
    gl.bindTexture(gl.TEXTURE_2D, moonHandle);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    break;

	default:
		return;
	}
}

function makeCube()
{
//vertices of cube
  var rawVertices = new Float32Array([
-0.5, -0.5, 0.5,
0.5, -0.5, 0.5,
0.5, 0.5, 0.5,
-0.5, 0.5, 0.5,
-0.5, -0.5, -0.5,
0.5, -0.5, -0.5,
0.5, 0.5, -0.5,
-0.5, 0.5, -0.5]);

  var rawColors = new Float32Array([
1.0, 0.0, 0.0, 1.0,  // red
0.0, 1.0, 0.0, 1.0,  // green
0.0, 0.0, 1.0, 1.0,  // blue
1.0, 1.0, 0.0, 1.0,  // yellow
1.0, 0.0, 1.0, 1.0,  // magenta
0.0, 1.0, 1.0, 1.0,  // cyan
]);

  var rawNormals = new Float32Array([
0, 0, 1,
1, 0, 0,
0, 0, -1,
-1, 0, 0,
0, 1, 0,
0, -1, 0 ]);

  var rawTangents = new Float32Array([
1, 0, 0,  // z face
0, 0, -1,  // +x face
-1, 0, 0,  // -z face
0, 0, 1,  // -x face
1, 0, 0,  // + y face
-1, 0, 0  // -y face
]);

  var rawTexCoords = new Float32Array([
0, 0,
1, 0,
1, 1,
0, 0,
1, 1,
0, 1
]);

  var indices = new Uint16Array([
0, 1, 2, 0, 2, 3,  // z face
1, 5, 6, 1, 6, 2,  // +x face
5, 4, 7, 5, 7, 6,  // -z face
4, 0, 3, 4, 3, 7,  // -x face
3, 2, 6, 3, 6, 7,  // + y face
4, 5, 1, 4, 1, 0   // -y face
]);

  var verticesArray = [];
  var colorsArray = [];
  var normalsArray = [];
  var tangentsArray = [];
  var texCoordsArray = [];

  for (var i = 0; i < 36; ++i)
  {
//  for each of the 36 vertices...
    var face = Math.floor(i / 6);
    var index = indices[i];

//  (x, y, z): three numbers for each point
    for (var j = 0; j < 3; ++j)
    {
      verticesArray.push(rawVertices[3 * index + j]);
    }

//  two numbers for each point
    for (var j = 0; j < 2; ++j)
    {
      texCoordsArray.push(rawTexCoords[2 * (i % 6) + j]);
    }


//  (r, g, b, a): four numbers for each point
    for (var j = 0; j < 4; ++j)
    {
      colorsArray.push(rawColors[4 * face + j]);
    }

//  three numbers for each point
    for (var j = 0; j < 3; ++j)
    {
      normalsArray.push(rawNormals[3 * face + j]);
    }

//  three numbers for each point
    for (var j = 0; j < 3; ++j)
    {
      tangentsArray.push(rawTangents[3 * face + j]);
    }
  }

  return {
    vertices: new Float32Array(verticesArray),
    colors: new Float32Array(colorsArray),
    normals: new Float32Array(normalsArray),
    tangents: new Float32Array(tangentsArray),
    texCoords: new Float32Array(texCoordsArray),
    numVertices: 36
  };
};


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
	  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
	  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
	  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalBuffer);
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


function initFramebufferObject(gl) {
  var framebuffer, texture, depthBuffer;

  // Define the error handling function
  var error = function() {
    if (framebuffer) gl.deleteFramebuffer(framebuffer);
    if (texture) gl.deleteTexture(texture);
    if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
    return null;
  }

  // Create a frame buffer object (FBO)
  framebuffer = gl.createFramebuffer();
  if (!framebuffer) {
    console.log('Failed to create frame buffer object');
    return error();
  }

  // Create a texture object and set its size and parameters
  texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log('Failed to create texture object');
    return error();
  }
  gl.bindTexture(gl.TEXTURE_2D, texture); // Bind the object to target
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  framebuffer.texture = texture; // Store the texture object

  // Create a renderbuffer object and Set its size and parameters
  depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
  if (!depthBuffer) {
    console.log('Failed to create renderbuffer object');
    return error();
  }
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

  // Attach the texture and the renderbuffer object to the FBO
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  // Check if FBO is configured correctly
  var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (gl.FRAMEBUFFER_COMPLETE !== e) {
    console.log('Frame buffer object is incomplete: ' + e.toString());
    return error();
  }

  // Unbind the buffer object
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);

  return framebuffer;
}

function drawCubeFBO(useTexture, fbo, colorFactor)
{
  var currentShader;
  if (useTexture)
  {
    currentShader = textureShader;
  }
  else
  {
    currentShader = colorShader;

  }
  gl.useProgram(currentShader);

//get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(currentShader, 'a_Position');
  if (positionIndex < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  gl.enableVertexAttribArray(positionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);

  var colorIndex = gl.getAttribLocation(currentShader, 'a_Color');
  if (colorIndex < 0) {
    console.log('Failed to get the storage location of a_');
    return;
  }
  gl.enableVertexAttribArray(colorIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(colorIndex, 4, gl.FLOAT, false, 0, 0);

  if (useTexture)
  {
    var texCoordIndex = gl.getAttribLocation(currentShader, 'a_TexCoord');
    if (texCoordIndex < 0) {
      console.log('Failed to get the storage location of a_TexCoord');
      return;
    }
    gl.enableVertexAttribArray(texCoordIndex);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);


//  Bind the texture object to the target
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


//  sampler value in shader is set to index for texture unit
    var loc = gl.getUniformLocation(currentShader, "sampler");
    gl.uniform1i(loc, 0);

    var colorFactorLoc = gl.getUniformLocation(currentShader, "colorFactor");
    gl.uniform1f(colorFactorLoc, colorFactor);
}

//set uniform in shader for projection * view * model transformation
  var projection = camera.getProjection();
  var view = camera.getView();
  var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(model);
  var transformLoc = gl.getUniformLocation(currentShader, "transform");
  gl.uniformMatrix4fv(transformLoc, false, transform.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 36);

//unbind shader and "disable" the attribute indices
//(not really necessary when there is only one shader)
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.disableVertexAttribArray(positionIndex);
  if (useTexture)
  {
    gl.disableVertexAttribArray(texCoordIndex);
  }
  gl.useProgram(null);
}

// draw cube to dstFbo, using srcFbo as texture, if useTexture is true
function drawToFbo(useTexture, srcFbo, dstFbo, colorFactor)
{
  gl.bindFramebuffer(gl.FRAMEBUFFER, dstFbo );              // Change the drawing destination to FBO
  gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);  // Set a viewport for FBO

  gl.enable(gl.DEPTH_TEST);

  // draw the image with a transparent background
  
  //drawCubeFBO(useTexture, srcFbo, colorFactor);

  // set texture parameters and create new mipmaps for next time
  // we use the texture
  gl.bindTexture(gl.TEXTURE_2D, dstFbo.texture);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

}

// draw cube to screen, using given fbo.texture as texture
function drawToScreen(fbo, colorFactor)
{
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, 600, 600);
  gl.enable(gl.DEPTH_TEST);

 // drawCubeFBO(true, fbo, colorFactor);
}


// helps to render a sphere
function drawSphere(matrix)
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
	  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexBuffer);
	  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
	  gl.bindBuffer(gl.ARRAY_BUFFER, sphereNormalVertexBuffer);
	  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
	  gl.bindBuffer(gl.ARRAY_BUFFER, null);


    projection = camera.getProjection();
    view = camera.getView();
	  var loc = gl.getUniformLocation(lightingShader, "view");
	  gl.uniformMatrix4fv(loc, false, view.elements);
	  loc = gl.getUniformLocation(lightingShader, "projection");
	  gl.uniformMatrix4fv(loc, false, projection.elements);
	  loc = gl.getUniformLocation(lightingShader, "u_Color"); // TODO replace with mat props from other window
	  gl.uniform4f(loc, 1.0, 1.0, 1.0, 1.0);
    var loc = gl.getUniformLocation(lightingShader, "lightPosition");
    gl.uniform4f(loc, 5.0, 10.0, 5.0, 1.0);

	  var modelMatrixloc = gl.getUniformLocation(lightingShader, "model");
	  var normalMatrixLoc = gl.getUniformLocation(lightingShader, "normalMatrix");

	  gl.uniformMatrix4fv(modelMatrixloc, false, matrix.elements);
	  gl.uniformMatrix3fv(normalMatrixLoc, false, makeNormalMatrixElements(matrix, view));

    // // light and material properties
    loc = gl.getUniformLocation(lightingShader, "materialProperties");
    gl.uniformMatrix3fv(loc, false, matPropElements);
    loc = gl.getUniformLocation(lightingShader, "shininess");
    gl.uniform1f(loc, shininess);


    // // passing data to an array of uniforms for the light information

    // // Option 1: one element at a time
    // one light upper right, other light upper left, other center
    loc = gl.getUniformLocation(lightingShader, "lightPosition[0]");
    gl.uniform4f(loc, 2.0, 4.0, 2.0, 1.0);
    loc = gl.getUniformLocation(lightingShader, "lightPosition[1]");
    gl.uniform4f(loc, -2.0, 0.0, -2.0, 1.0);
    loc = gl.getUniformLocation(lightingShader, "lightPosition[2]");
    gl.uniform4f(loc, 0.0, -4.0, 2.0, 1.0);

    // // Option 1: one matrix at a time
    loc = gl.getUniformLocation(lightingShader, "lightProperties[0]");
    gl.uniformMatrix3fv(loc, false, lightPropElements0);
    loc = gl.getUniformLocation(lightingShader, "lightProperties[1]");
    gl.uniformMatrix3fv(loc, false, lightPropElements1);
    loc = gl.getUniformLocation(lightingShader, "lightProperties[2]");
    gl.uniformMatrix3fv(loc, false, lightPropElements2);

	  gl.drawArrays(gl.TRIANGLES, 0, sphere.numVertices); // arbitrarily high

	  gl.useProgram(null);
}

var roto = 1;

// code to actually render our geometry
function draw()
{
  // clear the framebuffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BIT);
  nucleusDummy0.rotateY(-1);
  nucleusDummy1.rotateZ(-3);
  orbiter0dummy.rotateY(-15);
    lArm.rotateX(-roto);
    roto+=2;
  lArm.rotateX(-roto);
  atomDummy.render(new THREE.Matrix4());
  aDummy.render(new THREE.Matrix4());

  var texCoordIndex = gl.getAttribLocation(newShader, 'a_TexCoord');


  //--------- render the skybox ----------
  // bind the shader
  gl.useProgram(shader);

  // get the index for the a_Position attribute defined in the vertex shader
  var positionIndex = gl.getAttribLocation(shader, 'a_Position');
  gl.enableVertexAttribArray(positionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferCube);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // set uniform in shader for projection * view * model transformation
  var projection = camera.getProjection();
  var view = camera.getView();
  var transform = new THREE.Matrix4().multiply(projection).multiply(view).multiply(cubeScale);
  var transformLoc = gl.getUniformLocation(shader, "transform");
  gl.uniformMatrix4fv(transformLoc, false, transform.elements);

  // need to choose a texture unit, then bind the texture to TEXTURE_2D for that unit
  var textureUnit = 0;
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureHandle);

  // sampler value in shader is set to index for texture unit
  var loc = gl.getUniformLocation(shader, "sampler");
  gl.uniform1i(loc, textureUnit);

  // draw, specifying the type of primitive to assemble from the vertices
  gl.drawArrays(gl.TRIANGLES, 0, cube.numVertices);
  


  //--------- render a sphere -----------
  // gl.useProgram(multiLightShader);
  

  //--------- render the reflactive models ----------
  // bind the shader
  gl.useProgram(reflectionShader);

 // get the index for the a_Position attribute defined in the vertex shader
  positionIndex = gl.getAttribLocation(reflectionShader, 'a_Position');
  gl.enableVertexAttribArray(positionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  normalIndex = gl.getAttribLocation(reflectionShader, 'a_Normal');
  gl.enableVertexAttribArray(normalIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  // set uniforms in shader for projection, view, and model
  projection = camera.getProjection();
  view = camera.getView();
  loc = gl.getUniformLocation(reflectionShader, "model");
  var current = new THREE.Matrix4().multiply(model).multiply(modelScale);
  gl.uniformMatrix4fv(loc, false, current.elements);
  loc = gl.getUniformLocation(reflectionShader, "view");
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(reflectionShader, "projection");
  gl.uniformMatrix4fv(loc, false, projection.elements);

  // calculation is done in world coordinates, so normal matrix
  // is based on model transformation only
  loc = gl.getUniformLocation(reflectionShader, "normalMatrix");
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(current, new THREE.Matrix4()));

  // set view point
  var e = camera.position;
  loc = gl.getUniformLocation(reflectionShader, "viewPoint");
  gl.uniform4f(loc, e.x, e.y, e.z, 1.0);

  // need to choose a texture unit, then bind the texture to TEXTURE_2D for that unit
  var textureUnit = 0;
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureHandle);

  // sampler value in shader is set to index for texture unit
  loc = gl.getUniformLocation(reflectionShader, "sampler");
  gl.uniform1i(loc, textureUnit);

  // draw, specifying the type of primitive to assemble from the vertices
  gl.drawArrays(gl.TRIANGLES, 0, theModel.numVertices);

  // NEW set reflect ( < 0 ) vs refract ( > 0 ), refract will correspond to "eta"
  loc = gl.getUniformLocation(reflectionShader, "reflact");
  gl.uniform1f(loc, 0.66);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  // gl.useProgram(null);

  // NOW THE CUBE

  positionIndex = gl.getAttribLocation(reflectionShader, 'a_Position');
  gl.enableVertexAttribArray(positionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer2);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  normalIndex = gl.getAttribLocation(reflectionShader, 'a_Normal');
  gl.enableVertexAttribArray(normalIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer2);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  // set uniforms in shader for projection, view, and model
  projection = camera.getProjection();
  view = camera.getView();
  loc = gl.getUniformLocation(reflectionShader, "model");
  var current = new THREE.Matrix4().multiply(model2).multiply(modelScale);
  gl.uniformMatrix4fv(loc, false, current.elements);
  loc = gl.getUniformLocation(reflectionShader, "view");
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(reflectionShader, "projection");
  gl.uniformMatrix4fv(loc, false, projection.elements);

  // calculation is done in world coordinates, so normal matrix
  // is based on model transformation only
  loc = gl.getUniformLocation(reflectionShader, "normalMatrix");
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(current, new THREE.Matrix4()));

  // set view point
  var e = camera.position;
  loc = gl.getUniformLocation(reflectionShader, "viewPoint");
  gl.uniform4f(loc, e.x, e.y, e.z, 1.0);

  // need to choose a texture unit, then bind the texture to TEXTURE_2D for that unit
  var textureUnit = 0;
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, textureHandle);

  // sampler value in shader is set to index for texture unit
  loc = gl.getUniformLocation(reflectionShader, "sampler");
  gl.uniform1i(loc, textureUnit);

  // textureUnit = 1;
  // gl.activeTexture(gl.TEXTURE0 + textureUnit);
  // gl.bindTexture(gl.TEXTURE_2D, decalHandle);
  // loc = gl.getUniformLocation(reflectionShader, "samplerDecal");
  // gl.uniform1i(loc, textureUnit);

  // var texCoordIndex = gl.getAttribLocation(reflectionShader, "a_TexCoord");
  //   if (texCoordIndex < 0) {
  //     console.log('Failed to get the storage location of a_TexCoord');
  //     return;
  //   }

  // gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  // gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);


  // draw, specifying the type of primitive to assemble from the vertices
  gl.drawArrays(gl.TRIANGLES, 0, theModel2.numVertices);

  gl.useProgram(null);

  gl.useProgram(newShader);
  gl.enableVertexAttribArray(texCoordIndex);

  positionIndex = gl.getAttribLocation(reflectionShader, 'a_Position');
  gl.enableVertexAttribArray(positionIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, planeVertexBuffer);
  gl.vertexAttribPointer(positionIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  normalIndex = gl.getAttribLocation(reflectionShader, 'a_Normal');
  gl.enableVertexAttribArray(normalIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, planeNormalVertexBuffer);
  gl.vertexAttribPointer(normalIndex, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);


  // set uniforms in shader for projection, view, and model
  projection = camera.getProjection();
  view = camera.getView();
  loc = gl.getUniformLocation(newShader, "model");
  var current = new THREE.Matrix4().multiply(planemat).multiply(planeScale);
  gl.uniformMatrix4fv(loc, false, current.elements);
  loc = gl.getUniformLocation(newShader, "view");
  gl.uniformMatrix4fv(loc, false, view.elements);
  loc = gl.getUniformLocation(newShader, "projection");
  gl.uniformMatrix4fv(loc, false, projection.elements);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer2);
  gl.vertexAttribPointer(texCoordIndex, 2, gl.FLOAT, false, 0, 0);

  // calculation is done in world coordinates, so normal matrix
  // is based on model transformation only
  loc = gl.getUniformLocation(newShader, "normalMatrix");
  gl.uniformMatrix3fv(loc, false, makeNormalMatrixElements(current, new THREE.Matrix4()));

  

  // need to choose a texture unit, then bind the texture to TEXTURE_2D for that unit
  var textureUnit = 0;
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, moonHandle);

  // sampler value in shader is set to index for texture unit
  loc = gl.getUniformLocation(newShader, "sampler");
  gl.uniform1i(loc, textureUnit);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  // draw, specifying the type of primitive to assemble from the vertices
  gl.drawArrays(gl.TRIANGLES, 0, plane.numVertices);

  // NEW set reflect ( < 0 ) vs refract ( > 0 ), refract will correspond to "eta"
  loc = gl.getUniformLocation(newShader, "reflact");
  gl.uniform1f(loc, -1.0);

  // unbind shader and "disable" the attribute indices
  // (not really necessary when there is only one shader)
  gl.disableVertexAttribArray(positionIndex);
  gl.useProgram(null);


  drawToFbo(false, null, fbos[0], 1.0);

  // for the rest, draw each one to fbo, sampling from previous image
  // "colorfactor" darkens the color slightly so we can see the cubes
  // against each other
  var count = 8;
  var src = 0;
  var colorFactor = 1.0;
  for (var i = 0; i < count; ++i)
  {
    drawToFbo(true, fbos[src], fbos[1 - src], colorFactor);
    src = 1 - src;
    colorFactor  *= 0.99;
  }

  // finally, draw the scene for real, using the last drawn fbo as texture
  drawToScreen(fbos[src], colorFactor);

}

// entry point
async function main() {

  // load six image files
  let images = [];
  for (let i = 0; i < 6; ++i)
  {
    images[i] = await loadImagePromise(imageNames[i]);
  }
  var moonMap = await loadImagePromise(moonName);


  bunny = await loadOBJPromise(modelFilename);



  // get graphics context
  gl = getGraphicsContext("theCanvas");
  

  // key handlers
  window.onkeypress = handleKeyPress;

  // load and compile the shaders
  shader = createShaderProgram(gl, vshaderSource, fshaderSource);
  reflectionShader = createShaderProgram(gl, vshaderForReflectionSource, fshaderSource);
  lightingShader = createShaderProgram(gl, vLightingShaderSource, fLightingShaderSource);
  newShader = createShaderProgram(gl, newvLightingShaderSource, newfLightingShaderSource);
  colorShader = createShaderProgram(gl, vColorShaderSource, fColorShaderSource);
  textureShader = createShaderProgram(gl, texvshaderSource, texfshaderSource);
  

  for (var i = 0; i < 2; ++i)
  {
    fbos[i] = initFramebufferObject(gl);
  }

  var cubeA = makeCube();



  // load the vertex data into GPU memory
  vertexBuffer = createAndLoadBuffer(theModel.vertices);
  vertexBuffer2 = createAndLoadBuffer(theModel2.vertices);

  // *** choose face normals or vertex normals
  // vertexNormalBuffer = createAndLoadBuffer(theModel.normals);
  vertexNormalBuffer = createAndLoadBuffer(theModel.vertexNormals);
  vertexNormalBuffer2 = createAndLoadBuffer(theModel2.vertexNormals);
  // vertexNormalBuffer = createAndLoadBuffer(theModel.reflectedNormals);

  // load the vertex data into GPU memory
  vertexBufferCube = createAndLoadBuffer(cube.vertices);

  // create a texture and load the six images
  textureHandle = createAndLoadCubeTexture(images);
  moonHandle = createAndLoadTexture(moonMap);
  // load tex coords for decal
  texCoordBuffer2 = createAndLoadBuffer(plane.texCoords);

  //var sphere = getModelData(new THREE.SphereGeometry());
  sphereVertexBuffer = createAndLoadBuffer(sphere.vertices);
	sphereNormalVertexBuffer = createAndLoadBuffer(sphere.vertexNormals);

  planeVertexBuffer = createAndLoadBuffer(plane.vertices);
  planeNormalVertexBuffer = createAndLoadBuffer(plane.vertexNormals);

  cubeBuffer = createAndLoadBuffer(cubeA.vertices);

  // buffer for vertex normals
  cubeNormalBuffer = createAndLoadBuffer(cubeA.normals);

  

  camera.position[0] = 2;
  camera.position[1] = 2;
  camera.position[2] = 5;
  camera.lookAt(0, 0, 0);
  camera.setFovy(90);



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
      model = new THREE.Matrix4().makeRotationX(toRadians(0.2)).multiply(model);
      axis = 'x';
      break;
    case 'y':
      axis = 'y';
      model = new THREE.Matrix4().makeRotationY(toRadians(0.2)).multiply(model);
      break;
    case 'z':
      axis = 'z';
      model = new THREE.Matrix4().makeRotationZ(toRadians(0.2)).multiply(model);
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
