function main() {
  var canvas = document.getElementById("myCanvas");
  var gl = canvas.getContext("webgl");

  // Buffer untuk vertices
  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Buffer untuk normals
  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  // Buffer untuk indices
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  // Vertex shader
  var vertexShaderCode = `
        attribute vec3 aPosition;
        attribute vec3 aNormal;
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProj;
        uniform mat3 uNormalMatrix;
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
            vec4 worldPosition = uModel * vec4(aPosition, 1.0);
            vPosition = worldPosition.xyz;
            vNormal = normalize(uNormalMatrix * aNormal);
            gl_Position = uProj * uView * worldPosition;
        }
    `;
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderCode);
  gl.compileShader(vertexShader);

  // Fragment shader dengan pencahayaan
  var fragmentShaderCode = `
        precision mediump float;
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform vec3 uLightPosition;
        uniform vec3 uLightColor;
        uniform vec3 uAmbientColor;
        void main() {
            // Ambient lighting
            vec3 ambient = uAmbientColor;

            // Diffuse lighting
            vec3 lightDir = normalize(uLightPosition - vPosition);
            float diff = max(dot(vNormal, lightDir), 0.0);
            vec3 diffuse = diff * uLightColor;

            // Specular lighting (optional, for shininess)
            vec3 viewDir = normalize(-vPosition);
            vec3 reflectDir = reflect(-lightDir, vNormal);
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
            vec3 specular = spec * uLightColor;

            // Final color
            vec3 color = ambient + diffuse + specular;
            gl_FragColor = vec4(color, 1.0);
        }
    `;
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderCode);
  gl.compileShader(fragmentShader);

  // Program shader
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Bind vertex data
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  var aPosition = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  // Bind normal data
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  var aNormal = gl.getAttribLocation(program, "aNormal");
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);

  // Uniform locations
  var uModel = gl.getUniformLocation(program, "uModel");
  var uView = gl.getUniformLocation(program, "uView");
  var uProj = gl.getUniformLocation(program, "uProj");
  var uNormalMatrix = gl.getUniformLocation(program, "uNormalMatrix");
  var uLightPosition = gl.getUniformLocation(program, "uLightPosition");
  var uLightColor = gl.getUniformLocation(program, "uLightColor");
  var uAmbientColor = gl.getUniformLocation(program, "uAmbientColor");

  // Matrices
  var projMatrix = glMatrix.mat4.create();
  var modMatrix = glMatrix.mat4.create();
  var viewMatrix = glMatrix.mat4.create();
  var normalMatrix = glMatrix.mat3.create();

  glMatrix.mat4.perspective(
    projMatrix,
    glMatrix.glMatrix.toRadian(90), // Field of View (90 derajat)
    canvas.width / canvas.height, // Rasio aspek berdasarkan ukuran kanvas
    0.1, // Near plane (sebelumnya mungkin terlalu besar)
    100.0 // Far plane (pastikan cukup besar untuk objek)
  );

  glMatrix.mat4.lookAt(
    viewMatrix,
    [0.0, 0.0, 0.5],
    [0.0, 0.0, -0.5],
    [0.0, 1.0, 0.0]
  );

  gl.uniformMatrix4fv(uProj, false, projMatrix);
  gl.uniformMatrix4fv(uView, false, viewMatrix);

  // Cahaya
  gl.uniform3fv(uLightPosition, [1.0, 1.0, 1.0]);
  gl.uniform3fv(uLightColor, [1.0, 1.0, 1.0]); // Cahaya putih
  gl.uniform3fv(uAmbientColor, [0.2, 0.2, 0.2]); // Ambient hitam solid

  var angle = glMatrix.glMatrix.toRadian(1);
  function render() {
    // Rotasi objek
    glMatrix.mat4.rotate(modMatrix, modMatrix, angle, [1.0, 0.0, 0.0]);

    // Hitung matriks normal
    glMatrix.mat3.normalFromMat4(normalMatrix, modMatrix);

    // Kirimkan matriks ke shader
    gl.uniformMatrix4fv(uModel, false, modMatrix);
    gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);

    // Clear dan draw
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Latar belakang hitam
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
  }
  render();
}
