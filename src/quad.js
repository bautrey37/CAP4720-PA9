/**
 *
 */
function Quad(gl) {
    // Vertex shader program
    var VSHADER_SOURCE =
        'attribute vec3 position;\n' +
            'attribute vec2 texCoord;\n' +
            'varying vec2 tCoord;\n' +
            'void main() {\n' +
            '  gl_Position = vec4(position,1.0);\n' +
            '  tCoord = texCoord;\n' +
            '}\n';

    // Fragment shader program
    var FSHADER_SOURCE =
        'precision mediump float;\n' +
            'uniform sampler2D tex;\n' +
            'varying vec2 tCoord;\n' +
            'void main() {\n' +
            '  vec3 color = texture2D(tex, tCoord).rgb;\n' +
            '  gl_FragColor = vec4(color,1.0);\n' +
            '}\n';

    // Create the Program from the shader code.
    var program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    if (!program) {
        addMessage('Failed to create program');
        return;
    }
    else addMessage('Shader Program was successfully created.');

    // Get the location/address of the vertex attribute inside the shader program.
    var a_Position = gl.getAttribLocation(program, 'position');
    var a_TexCoord = gl.getAttribLocation(program, 'texCoord');
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_TexCoord);
    var samplerLoc = gl.getUniformLocation(program, 'tex');
    gl.useProgram(program);


    /*function Drawable(attribLocations, vArrays, nElements, nVertices, indexArray, drawMode) {
        // Create a buffer object
        var vertexBuffers = [];
        var nAttributes = attribLocations.length;
        for (var i = 0; i < nAttributes; i++) {
            if (vArrays[i] && (vArrays[i].length == nElements[i] * nVertices)) {
                vertexBuffers[i] = gl.createBuffer();
                if (!vertexBuffers[i]) {
                    console.log('Failed to create the buffer object');
                    return null;
                }
                // Bind the buffer object to an ARRAY_BUFFER target
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[i]);
                // Write date into the buffer object
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vArrays[i]), gl.STATIC_DRAW);
            }
            else {
                console.log('No data');
                vertexBuffers[i] = null;
            }
        }
        //console.log(nElements);
        var indexBuffer = null;
        if (indexArray) {
            indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);
        }
        this.delete = function () {
            if (indexBuffer) gl.deleteBuffer(indexBuffer);
            for (var i = 0; i < nAttributes; i++)
                if (vertexBuffers[i])gl.deleteBuffer(vertexBuffers[i]);
        };
        this.draw = function () {
            for (var i = 0; i < nAttributes; i++) {
                if (vertexBuffers[i]) {
                    gl.enableVertexAttribArray(attribLocations[i]);
                    // Bind the buffer object to target
                    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[i]);
                    // Assign the buffer object to a_Position variable
                    gl.vertexAttribPointer(attribLocations[i], nElements[i], gl.FLOAT, false, 0, 0);
                }
                else {
                    gl.disableVertexAttribArray(attribLocations[i]);
                    if (nElements[i] == 3) gl.vertexAttrib3f(attribLocations[i], 0, 0, 1);
                    else if (nElements[i] == 2) gl.vertexAttrib2f(attribLocations[i], 0, 0);
                    else alert("attribute element size different from 2 and 3");
                }
            }
            if (indexBuffer) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                gl.drawElements(drawMode, indexArray.length, gl.UNSIGNED_SHORT, 0);
            }
            else {
                gl.drawArrays(drawMode, 0, nVertices);
            }
        }
    }*/

    function Drawable(attributes, nVertices) {
        // Create a buffer object
        var attribBuffers = [];
        for (var i = 0; i < attributes.length; i++) {
            attribBuffers[i] = gl.createBuffer();
            if (!attribBuffers[i]) {
                addMessage('Failed to create the buffer object');
                return;
            }
            // Bind the buffer object to an ARRAY_BUFFER target
            gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffers[i]);
            // Write date into the buffer object
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attributes[i]), gl.STATIC_DRAW);
        }
        this.draw = function (attribLocations) {
            for (var i = 0; i < attributes.length; i++) {
                // Bind the buffer object to target
                gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffers[i]);
                // Assign the buffer object to a_Position variable
                gl.vertexAttribPointer(attribLocations[i], 2, gl.FLOAT, false, 0, 0);
            }

            gl.drawArrays(gl.TRIANGLE_FAN, 0, nVertices);
        }
    }

    var quad = new Drawable([
        [-1, -1, 1, -1, 1, 1, -1, 1],
        [-1, -1, 1, -1, 1, 1, -1, 1]
    ], 4);

    function createTexture(imageFileName) {
        var tex = gl.createTexture();
        tex.width = 0;
        tex.height = 0;
        var img = new Image();
        img.onload = function () {
            function isPowerOfTwo(x) {
                return (x & (x - 1)) == 0;
            }

            var nPOT = false; // nPOT: notPowerOfTwo
            console.log(imageFileName + " loaded : " + img.width + "x" + img.height);
            tex.complete = img.complete;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            if (!isPowerOfTwo(img.width) || !isPowerOfTwo(img.height)) nPOT = true;
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
        };
        img.src = imageFileName;
        return tex;
    }

    //var imageFile = '../texture/webGLprimitives.png';
    var imageFile = '../texture/mozilaTexture.png';
    var tex = createTexture(imageFile);

    this.draw = function () {
        gl.useProgram(program); //switches to use this texturing program
        if(tex.complete) {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform1i(samplerLoc, 0);

            quad.draw([a_Position, a_TexCoord]);
        }
        gl.useProgram(null);
    };
}