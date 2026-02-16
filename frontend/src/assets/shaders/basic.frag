#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vFragPos;
in vec2 vTexCoord;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uViewPosition;
uniform sampler2D uDiffuseTexture;

out vec4 fragColor;

void main() {

    vec3 normal = normalize(vNormal);

    // Luz difusa
    vec3 lightDir = normalize(uLightPosition - vFragPos);
    float diff = max(dot(normal, lightDir), 0.0);

    // Luz ambiente suave tipo showroom
    float ambientStrength = 0.4;
    vec3 ambient = ambientStrength * uLightColor;

    // Especular suave
    vec3 viewDir = normalize(uViewPosition - vFragPos);
    vec3 reflectDir = reflect(-lightDir, normal);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    float specularStrength = 0.25;
    vec3 specular = specularStrength * spec * uLightColor;

    vec3 lighting = ambient + diff * uLightColor + specular;

    vec3 texColor = texture(uDiffuseTexture, vTexCoord).rgb;

    vec3 result = lighting * texColor;

    fragColor = vec4(result, 1.0);
}