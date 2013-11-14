"use strict";
function createShaderProgram(gl)
{
    /*
    var VSHADER_SOURCE =
        'attribute vec3 position;\n' +
            'attribute vec3 normal;\n' +
            'uniform mat4 pMatrix, vMatrix, mMatrix;\n' +
            'uniform vec3 eyePosition;\n' + // World space coordinate or eye
            'varying vec3 fragNormal;\n' +
            'varying vec3 fragViewDir;\n' +
            'void main() {\n' +
            '  fragNormal = normalize(mMatrix * vec4(normal,0.0)).xyz;\n' + // Frag normal in world space.
            '  fragViewDir = vec3(mMatrix * vec4(position, 1.0)) - eyePosition;\n' +
            '  gl_Position = pMatrix * vMatrix * mMatrix * vec4(position, 1.0);\n' +
            '}\n';

    // Fragment shader program
    var FSHADER_SOURCE =
        'precision mediump float;\n' +
            'uniform samplerCube texUnit;' +
            'varying vec3 fragNormal;' +
            'varying vec3 fragViewDir;\n' +
            'void main() {\n' +
            '  vec3 viewDir = normalize(fragViewDir);\n' +
            '  vec3 normal=normalize(fragNormal);\n' +
            '  vec3 reflectedViewDir  = reflect(viewDir,normal);\n' +
            '  vec3 envColor = textureCube(texUnit, reflectedViewDir).rgb;\n' +
            '  gl_FragColor = vec4(envColor,1.0);\n' +
            '}\n';
*/
    var VSHADER_SOURCE =
        'attribute vec3 position;\n' +
            'attribute vec3 normal;\n' +
            'attribute vec2 texCoord;\n' +
            'uniform mat4 projT, viewT, modelT, normalT;\n'+
            'varying vec2 tCoord;\n'+
            'uniform vec3 eyePosition;\n' +
            'varying vec3 fragPosition, fragNormal;\n'+
            'varying vec3 fragEnvViewDir ;\n'+
            'void main() {\n' +
            //'  fragPosition = (viewT * modelT * vec4(position, 1.0)).xyz;\n' +
            '  fragNormal = normalize((modelT * vec4(normal, 0.0)).xyz);\n' +
            '  tCoord = texCoord;\n'+
            '  fragEnvViewDir = vec3(modelT * vec4(position,1.0)).xyz - eyePosition;\n'+
            '  gl_Position = projT * viewT * modelT * vec4(position,1.0);\n' +
            //'  fragEnvNormal   = normalize((normalT * vec4(normal,0.0)).xyz);\n'+ // Frag normal in world space.

            '}\n';

    // Fragment shader program
    var FSHADER_SOURCE =
        'precision mediump float;\n'+
            'uniform samplerCube texUnit;'+
            'uniform vec3 diffuseCoeff;\n'+
            'uniform sampler2D diffuseTex;\n'+
            'uniform int texturingEnabled;\n'+
            'varying vec2 tCoord;\n'+
            'varying vec3 fragPosition, fragNormal;\n'+
            'varying vec3 fragEnvNormal, fragEnvViewDir ;\n'+
            'void main() {\n' +
            //'  float costheta = max(dot(normalize(-fragPosition),normalize(fragNormal)),0.0);\n'+
            //'  vec3 texColor = (texturingEnabled == 0) ? vec3(1.0) : texture2D(diffuseTex, tCoord).rgb;\n'+
            //'  gl_FragColor = vec4(texColor * diffuseCoeff * costheta,1.0);\n' +
            '  vec3 viewDir = normalize(fragEnvViewDir);\n'+
            '  vec3 normal = normalize(fragNormal);\n'+
            '  vec3 reflectedViewDir  = reflect(viewDir, normal);\n'+
            '  vec3 envColor = textureCube(texUnit, reflectedViewDir).rgb;\n'+
            '  gl_FragColor = vec4(envColor,1.0);\n' +
            '}\n';
    var program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    if (!program) {
        console.log('Failed to create program');
        return false;
    }
    var attribNames = ['position','normal','texCoord'];
    program.attribLocations = {};
    var i;
    for (i=0; i<attribNames.length;i++){
        program.attribLocations[attribNames[i]] = gl.getAttribLocation(program, attribNames[i]);
    }
    var uniformNames = ['modelT', 'viewT', 'projT', 'normalT', 'diffuseCoeff', 'diffuseTex', 'texturingEnabled'];
    program.uniformLocations = {};

    for (i=0; i<uniformNames.length;i++){
        program.uniformLocations[uniformNames[i]] = gl.getUniformLocation(program, uniformNames[i]);
    }
    return program;
}
