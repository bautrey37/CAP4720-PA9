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