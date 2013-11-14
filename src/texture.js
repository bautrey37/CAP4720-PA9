/**
 *
 * @param gl
 * @param option - 0 for model textures, 1 for cube map textures
 */
function loadTexture(gl, option, model) {
    var texObjs;

    if(option == 0) {
        //model texture
        texObjs = loadDiffuseTextures();
    }
    else if(option == 1) {
        //cube map
        var path = document.getElementById("mapList").value;
        texObjs = loadCubemap(gl, '../cubeMap/' + path + '/',
            ['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg']);

        newCubeMapFlag = false;
    }

    return texObjs;


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

    function loadCubemap(gl, cubemappath, texturefiles) {
        var tex = gl.createTexture();
        tex.complete = false;
        loadACubeFaces(tex, cubemappath, texturefiles);
        return tex;
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
                    for (var dir = 0; dir < 6; dir++)gl.texImage2D(directions[dir], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgs[dir]);
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                }
            }
            imgs[i].src = cubemappath + texturefiles[i];
        }
    }

    function loadDiffuseTextures() {
        function setTexture(gl, textureFileName) {
            var tex = gl.createTexture();
            tex.width = 0;
            tex.height = 0;
            var img = new Image();
            //console.log("From Loader: "+textureFileName);
            //imagecount++;
            img.onload =  //function() { imagecount--; console.log(textureFileName+" loaded");createImageBuffer(img, tex, gl.TEXTURE_2D); };

                function () {
                    var nPOT = false; // nPOT: notPowerOfTwo
                    //console.log(textureFileName+" loaded : "+img.width+"x"+img.height);
                    tex.complete = img.complete;
                    //gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    //if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height)) nPOT = true;

                    if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height)) {
                        // Scale up the texture to the next highest power of two dimensions.
                        var canvas = document.createElement("canvas");
                        canvas.width = nextHighestPowerOfTwo(img.width);
                        canvas.height = nextHighestPowerOfTwo(img.height);
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        img = canvas;
                        //console.log(" Scale to POT : "+img.width+"x"+img.height);
                    }

                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
                    //void texImage2D(enum target, int level, enum internalformat, enum format, enum type, Object object);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, (nPOT) ? gl.CLAMP_TO_EDGE : gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, (nPOT) ? gl.CLAMP_TO_EDGE : gl.REPEAT);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, ((nPOT) ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR));
                    if (!nPOT)gl.generateMipmap(gl.TEXTURE_2D);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                    tex.width = img.width;
                    tex.height = img.height;
                    //imagecount--; //console.log("From Loader: "+imagecount);
                };

            img.src = textureFileName;
            return tex;
        }

        var imageDictionary = {};
        var texObjs = [];
        for (var i = 0; i < model.materials.length; i++) {
            if (model.materials[i].diffuseTexture) {
                var filename = model.materials[i].diffuseTexture[0];//.replace(".tga",".jpg");
                if (filename) {
                    console.log(filename);
                    if (imageDictionary[filename] === undefined) {
                        imageDictionary[filename] = setTexture(gl, modelPath + filename);
                    }
                    texObjs[i] = imageDictionary[filename];
                }
                else texObjs[i] = undefined;
            }
        }
        return texObjs;
    }
}