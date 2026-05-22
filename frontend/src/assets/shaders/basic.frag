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
uniform vec3          uViewPosition;
uniform sampler2D     uDiffuseTexture;
uniform float         uOpacity;

// Point light
uniform vec3          uLightPosition;
uniform vec3          uLightColor;
uniform float         uAttA0;
uniform float         uAttA1;
uniform float         uAttA2;

// Directional light
uniform vec3          uLightDirection;
uniform vec3          uLightAmbient;
uniform vec3          uLightDiffuse;
uniform vec3          uLightSpecular;

out vec4 fragColor;

void main()
{
    vec3 normal   = normalize(vNormal);
    vec3 viewDir  = normalize(uViewPosition - vFragPos);
    vec3 texColor = texture(uDiffuseTexture, vTexCoord).rgb;

    // --- Point light ---
    vec3  lightVec   = uLightPosition - vFragPos;
    vec3  lightDir   = normalize(lightVec);
    float d          = length(lightVec);
    float atten      = 1.0 / (uAttA0 + uAttA1 * d + uAttA2 * d * d);

    vec3 pAmbient  = uMaterial.ambient * uLightColor * texColor;

    float pDiff    = max(dot(normal, lightDir), 0.0);
    vec3  pDiffuse = uMaterial.diffuse * pDiff * uLightColor * texColor * atten;

    vec3  pReflect  = reflect(-lightDir, normal);
    float pSpec     = pow(max(dot(viewDir, pReflect), 0.0), uMaterial.shininess);
    vec3  pSpecular = uMaterial.specular * pSpec * uLightColor * atten;

    // --- Directional light ---
    vec3 dirLight  = normalize(-uLightDirection);

    vec3 dAmbient  = uMaterial.ambient * uLightAmbient * texColor;

    float dDiff    = max(dot(normal, dirLight), 0.0);
    vec3  dDiffuse = uMaterial.diffuse * dDiff * uLightDiffuse * texColor;

    vec3  dReflect  = reflect(-dirLight, normal);
    float dSpec     = pow(max(dot(viewDir, dReflect), 0.0), uMaterial.shininess);
    vec3  dSpecular = uMaterial.specular * dSpec * uLightSpecular;

    vec3 color = pAmbient + pDiffuse + pSpecular
               + dAmbient + dDiffuse + dSpecular;

    fragColor = vec4(color, uOpacity);
}