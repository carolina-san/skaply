#version 300 es
precision highp float;

// Vertex attributes
layout(location = 0) in vec3 aVertexPosition;               // local vertex position
layout(location = 1) in vec3 aVertexNormal;                 // local vertex normal
layout(location = 2) in vec2 aVertexTextureCoordinates;

// Outputs to fragment shader
out vec2 vVertexTextureCoordinates;
out vec3 vVertexNormal;         // world coordinates
out vec3 vFragmentPosition;              // world coordinates

// Uniforms
uniform mat4 uModelMatrix;      // world coordinates
uniform mat4 uViewMatrix;       // camera coordinates
uniform mat4 uProjectionMatrix; // screen coordinates

void main() {
    vTexCoord = aVertexTextureCoordinates;
    vNormal = mat3(transpose(inverse(uModelMatrix))) * aVertexNormal;
    vFragmentPosition = vec3(uModelMatrix * vec4(aVertexPosition, 1.0));
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
}