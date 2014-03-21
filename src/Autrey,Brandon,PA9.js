"use strict";
//This function gets called when reading a JSON file. It stores the current xml information.

var newModelFlag = true;
var dollyRequired = 0;
var rotateFlag = false;
var stencilFlag = true;
var newCubeMapFlag = false;

function toggleRotateFlag() {
    rotateFlag = !rotateFlag;
}
function toggleStencilFlag() {
    stencilFlag = !stencilFlag;
}

function addMessage(message) {
    console.log(message);
}

function main() {
    // ... global variables ...
    var gl, model, camera, program, canvas;

    canvas = document.getElementById("myCanvas1");
    //addMessage(((canvas)?"Canvas acquired":"Error: Can not acquire canvas"));
    canvas.width = window.innerWidth - 249; //subtracts the toolbar width
    canvas.height = window.innerHeight;

    //Disable debugging; enable stencil buffer
    gl = canvas.getContext("experimental-webgl", {stencil:true});

    var angle = 0;
    program = createShaderProgram(gl);
    var samplerLoc = gl.getUniformLocation(program,"texUnit");
    var eyeLoc = gl.getUniformLocation(program,"eyePosition");

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST);
    gl.stencilMask(0xFF); //0xFF is default

    var quad = new Quad(gl);
    var texObj = newCubeMap(); //initialize cube map
    var reflectionMatrix = new Matrix4();
    newModel();

    draw();
    return 1;

    function draw() {
        if (newModelFlag)
            newModel();
        if (dollyRequired) {
            camera.dolly(0.05 * dollyRequired);
            dollyRequired = 0;
        }
        if(newCubeMapFlag) {
            texObj = newCubeMap(); //replace cube map
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //drawModel();

        //create stencil
        gl.colorMask(false, false, false, false);
        gl.depthMask(false);
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF); // (OP, refv, mask)
        gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE); // (stencilFail, depthFail, depthPass)
        drawModel();

        //draw inside stencil
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);
        gl.stencilFunc(gl.EQUAL, 1, 0xFF); // (OP, refv, mask)
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // (stencilFail, depthFail, depthPass)
        drawModel();

        //draw outside stencil
        gl.stencilFunc(gl.EQUAL, 0, 0xFF); // (OP, refv, mask)
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // (stencilFail, depthFail, depthPass)
        quad.draw();

        if (rotateFlag) {
            angle++;
            if (angle > 360) angle -= 360;
        }

        window.requestAnimationFrame(draw);

        function drawModel() {
            gl.useProgram(program);

            if(texObj.complete) {
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texObj);
                gl.uniform1i(samplerLoc,1);
                var newEye = camera.getRotatedCameraPosition(angle);

                var projMatrix = camera.getProjMatrix();
                gl.uniformMatrix4fv(program.uniformLocations["projT"], false, projMatrix.elements);
                var viewMatrix = camera.getRotatedViewMatrix(angle);
                gl.uniformMatrix4fv(program.uniformLocations["viewT"], false, viewMatrix.elements);
                gl.uniform3f(eyeLoc,newEye[0],newEye[1],newEye[2]);
                model.draw();
                gl.uniform3f(eyeLoc,-newEye[0],-newEye[1],-newEye[2]);
                model.draw(reflectionMatrix);

            }
            gl.useProgram(null);
        }
    }

    function newModel(path) {
        function getCurrentModelPath() {
            return document.getElementById("modelList").value;
            //return pathname;
        }

        if (model) model.delete();
        if (!path) path = getCurrentModelPath();
        console.log(path);
        model = new JsonRenderable(gl, program, "../model/" + path + "/models/", "model.json");
        if (!model)alert("No model could be read");
        else newModelFlag = false;
        var bounds = model.getBounds();
        camera = new Camera(gl, bounds, [0, 1, 0]);
        var N = [0,1,0];
        var Q = model.getBounds().min; //a point on plane
        var NdotQ = dot(N,Q);

        reflectionMatrix.elements = new Float32Array([
            1-2*N[0]*N[0],-2*N[1]*N[0],-2*N[2]*N[0],0,
            -2*N[0]*N[1],1-2*N[1]*N[1],-2*N[2]*N[1],0,
            -2*N[0]*N[2],-2*N[1]*N[2],1-2*N[2]*N[2],0,
            2*NdotQ*N[0],2*NdotQ*N[1],2*NdotQ*N[2],1
        ]);
    }

    function newCubeMap() {
        var path = document.getElementById("mapList").value;
        console.log(path);
        var tex = gl.createTexture();
        tex.complete = false;
        loadACubeFaces(tex, '../cubeMap/' + path + '/',
            ['negx.jpg', 'posx.jpg', 'negy.jpg', 'posy.jpg', 'negz.jpg', 'posz.jpg']);

        newCubeMapFlag = false;
        return tex;
    }

    function isPowerOfTwo(x) {
        return (x & (x - 1)) == 0;
    }

    function nextHighestPowerOfTwo(x) {
        --x;
        for (var i = 1; i < 32; i <<= 1) {
            x = x | x >> i;
        }
        return x + 1;
    }

    function loadACubeFaces(tex, cubemappath, texturefiles) {
        var imgs = [];
        var count = 6;
        for (var i = 0; i < 6; i++) {
            var img = new Image();
            imgs[i] = img;
            img.onload = function () {
                if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height)) {
                    // Scale up the texture to the next highest power of two dimensions.
                    var canvas = document.createElement("canvas");
                    canvas.width = nextHighestPowerOfTwo(img.width);
                    canvas.height = nextHighestPowerOfTwo(img.height);
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    img = canvas;
                }
                console.log(cubemappath + texturefiles[i] + " loaded : " + img.width + "x" + img.height);
                count--;
                if (count == 0) {
                    tex.complete = true;
                    var directions = [
                        gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                        gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                        gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                    ];
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
                    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    for (var dir = 0; dir < 6; dir++)
                        gl.texImage2D(directions[dir], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgs[dir]);
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                }
            };
            imgs[i].src = cubemappath + texturefiles[i];
        }
    }
}

function dot(N,Q) {
    var res = 0;
    for(var i = 0; i < 3; i++) {
        res = res + N[i] * Q[i];
    }
    return res;
}

