#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vFragPos;
in vec2 vTexCoord;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uViewPosition;

uniform sampler2D uDiffuseTexture;
uniform float uOpacity;

out vec4 fragColor;

void main()
{
    vec3 normal = normalize(vNormal);

    // luz simple
    vec3 lightDir = normalize(uLightPosition - vFragPos);
    float diff = max(dot(normal, lightDir), 0.0);

    vec3 ambient = 0.3 * uLightColor;
    vec3 color = texture(uDiffuseTexture, vTexCoord).rgb;

    vec3 result = (ambient + diff * uLightColor) * color;

    // outline shader hace el efecto de bordeado
    fragColor = vec4(result, uOpacity);
}