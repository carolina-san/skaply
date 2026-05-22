#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vFragPos;
in vec2 vTexCoord;

struct Material {
    vec3  ambient;
    vec3  diffuse;
    vec3  specular;
    float shininess;
};

uniform Material      uMaterial;
uniform vec3          uLightPosition;
uniform vec3          uLightColor;
uniform vec3          uViewPosition;
uniform sampler2D     uDiffuseTexture;
uniform float         uOpacity;

out vec4 fragColor;

void main()
{
    vec3 normal   = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vFragPos);
    vec3 viewDir  = normalize(uViewPosition  - vFragPos);
    vec3 texColor = texture(uDiffuseTexture, vTexCoord).rgb;

    // Ambient
    vec3 ambient  = uMaterial.ambient  * uLightColor * texColor;

    // Diffuse
    float diff    = max(dot(normal, lightDir), 0.0);
    vec3 diffuse  = uMaterial.diffuse  * diff * uLightColor * texColor;

    // Specular (Phong)
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec      = pow(max(dot(viewDir, reflectDir), 0.0), uMaterial.shininess);
    vec3 specular   = uMaterial.specular * spec * uLightColor;

    fragColor = vec4(ambient + diffuse + specular, uOpacity);
}