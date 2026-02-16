#version 300 es
precision highp float;

// Inputs from vertex shader
in vec2 vVertexTextureCoordinates;
in vec3 vVertexNormal;
in vec3 vFragmentPosition;

// Output color
out vec4 fragmentColor;

// Uniforms for material
uniform sampler2D uDiffuseTexture;

// Uniforms for light
uniform vec3 uLightPosition;
uniform vec3 uLightColor;

void main() {
    vec3 fragmentNormal = normalize(vVertexNormal);
    vec3 lightDirection = normalize(uLightPosition - vFragmentPosition);
    float diff = max(dot(fragmentNormal, lightDirection), 0.0);

    vec3 diffuse = diff * uLightColor;
    vec3 textureColor = texture(uDiffuseTexture, vVertexTextureCoordinates).rgb;

    fragmentColor = vec4(textureColor * diffuse, 1.0);
}
