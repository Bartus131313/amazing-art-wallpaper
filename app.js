var canvas = document.getElementById("wallpaper-canvas");

var fpsLabel = document.querySelector(".fps-label");

var default_vertexShaderText = 
`precision mediump float;

attribute vec2 vertPosition;
varying vec2 fragCoord;

void main() {
    fragCoord = vertPosition * 0.5 + 0.5; // Normalize to [0, 1] range
    gl_Position = vec4(vertPosition, 0.0, 1.0);
}`;

var default_fragmentShaderText0 = 
`precision mediump float;

uniform vec3 iResolution; // Canvas resolution (width, height, depth)
uniform float iTime;      // Elapsed time

varying vec2 fragCoord;`;

var default_fragmentShaderText1 = 
`void main() {
    mainImage(gl_FragColor, fragCoord * iResolution.xy);
}`;

var fragmentShaderTextMain = `
vec3 palette( float t )
{
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    
    return a + b * cos(6.28318 * (c * t + d));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    
    for (float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * 1.5) - 0.5;
    
        float d = length(uv) * exp(-length(uv0));
    
        vec3 col = palette(length(uv0) + i * 0.4 + iTime * 0.4);
    
        d = sin(d * 8.0 + iTime) / 8.0;
        d = abs(d);
    
        d = pow(0.01 / d, 2.0);
    
        finalColor += col * d;
    }
    
    fragColor = vec4(finalColor, 1.0);
}
`;

// Rectangle data for full-screen quad
var rectangleVertices = [
    -1.0,  1.0, // Top-left
    -1.0, -1.0, // Bottom-left
     1.0, -1.0, // Bottom-right
     1.0,  1.0  // Top-right
];

var rectangleIndices = [0, 1, 2, 0, 2, 3];

var gl, program, startTime;
var lastUpdateTime;

let lastFrameTime = performance.now();
let fps = 0;
let frames = 0;

function CompileShader() {
    // Combine wrapper shader with client-provided shader
    var fragmentShaderText = default_fragmentShaderText0 + "\n" + fragmentShaderTextMain + "\n" + default_fragmentShaderText1;

    // Create shaders
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, default_vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("ERROR compiling vertex shader!", gl.getShaderInfoLog(vertexShader));
        return null;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("ERROR compiling fragment shader!", gl.getShaderInfoLog(fragmentShader));
        return null;
    }

    // Create program
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("ERROR linking program!", gl.getProgramInfoLog(program));
        DisplayError("ERROR linking program!", gl.getProgramInfoLog(program));
        return null;
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error("ERROR validating program!", gl.getProgramInfoLog(program));
        DisplayError("ERROR validating program!", gl.getProgramInfoLog(program));
        return null;
    }

    // Create and bind vertex buffer
    var rectangleVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rectangleVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectangleVertices), gl.STATIC_DRAW);

    // Create and bind index buffer
    var rectangleIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rectangleIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(rectangleIndices), gl.STATIC_DRAW);

    return program
}

function RenderFrame() {
    var currentTime = (Date.now() - startTime) / 1000.0; // Time in seconds
    var resolution = [canvas.clientWidth, canvas.clientHeight, 1.0];

    // Clear canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    try {
        // Use program and set uniforms
        gl.useProgram(program);

        var iResolutionLocation = gl.getUniformLocation(program, "iResolution");
        var iTimeLocation = gl.getUniformLocation(program, "iTime");

        if (iResolutionLocation) gl.uniform3fv(iResolutionLocation, resolution);
        if (iTimeLocation) gl.uniform1f(iTimeLocation, currentTime);

        // Define attribute pointers
        var positionAttribLocation = gl.getAttribLocation(program, "vertPosition");
        gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, gl.FALSE, 0, 0);
        gl.enableVertexAttribArray(positionAttribLocation);

        // Draw rectangle
        gl.drawElements(gl.TRIANGLES, rectangleIndices.length, gl.UNSIGNED_SHORT, 0);
    } catch (error) {
        
    }

    frames++;
    if ((Date.now() - lastUpdateTime) / 1000.0 >= 1.0) {
        fps = frames;
        frames = 0;
        lastUpdateTime = Date.now()
        console.log(`FPS: ${fps}`)
        fpsLabel.innerHTML = `FPS: ${fps}`
    }

    // Request next frame
    requestAnimationFrame(RenderFrame);
}

function updateFPS() {
    // fps = frames
    // frames = 0
    // // lastUpdateTime = Date.now()

    // // Update the label
    // fpsLabel.innerHTML = `FPS: ${Math.round(fps)}`;
}

function InitWallpaper() {
    // Resize canvas
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl = canvas.getContext("webgl");

    if (!gl) {
        console.log("WebGL not supported, falling back on experimental-webgl");
        gl = canvas.getContext("experimental-webgl");
    }

    if (!gl) {
        alert("Your browser does not support WebGL.");
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    program = CompileShader();

    // Update FPS every 1000 ms (1 second)
    setInterval(updateFPS, 1000);

    // Start render loop
    startTime = Date.now();
    lastUpdateTime = startTime;
    RenderFrame();
}