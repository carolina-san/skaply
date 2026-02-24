#version 300 es

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vNormal;
out vec3 vFragPos;
out vec2 vTexCoord;

uniform float uOutlinePass;
uniform float uHighlight;

void main() {
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
    vFragPos = worldPos.xyz;

    vNormal = mat3(transpose(inverse(uModelMatrix))) * aNormal;
    vTexCoord = aTexCoord;

    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}