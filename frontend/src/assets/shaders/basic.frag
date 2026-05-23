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

struct PointLight {
    vec3  position;
    vec3  color;
    float a0;
    float a1;
    float a2;
};

#define MAX_POINT_LIGHTS 4

uniform Material      uMaterial;
uniform vec3          uViewPosition;
uniform sampler2D     uDiffuseTexture;
uniform float         uOpacity;

// Point lights
uniform PointLight    uPointLights[MAX_POINT_LIGHTS];
uniform int           uPointLightCount;

// Directional light
uniform vec3          uLightDirection;
uniform vec3          uLightAmbient;
uniform vec3          uLightDiffuse;
uniform vec3          uLightSpecular;

// Spot light
uniform int           uSpotEnabled;
uniform vec3          uSpotPosition;
uniform vec3          uSpotDirection;
uniform vec3          uSpotAmbient;
uniform vec3          uSpotDiffuse;
uniform vec3          uSpotSpecular;
uniform float         uSpotInnerCos;
uniform float         uSpotOuterCos;
uniform float         uSpotAttA0;
uniform float         uSpotAttA1;
uniform float         uSpotAttA2;

out vec4 fragColor;

void main()
{
    vec3 normal   = normalize(vNormal);
    vec3 viewDir  = normalize(uViewPosition - vFragPos);
    vec3 texColor = texture(uDiffuseTexture, vTexCoord).rgb;

    vec3 color = vec3(0.0);

    // --- Point lights ---
    for (int i = 0; i < uPointLightCount; i++) {
        vec3  lightVec = uPointLights[i].position - vFragPos;
        vec3  lightDir = normalize(lightVec);
        float d        = length(lightVec);
        float atten    = 1.0 / (uPointLights[i].a0 + uPointLights[i].a1 * d + uPointLights[i].a2 * d * d);

        vec3 ambient  = uMaterial.ambient * uPointLights[i].color * texColor;

        float diff    = max(dot(normal, lightDir), 0.0);
        vec3  diffuse = uMaterial.diffuse * diff * uPointLights[i].color * texColor * atten;

        vec3  reflectDir = reflect(-lightDir, normal);
        float spec       = pow(max(dot(viewDir, reflectDir), 0.0), uMaterial.shininess);
        vec3  specular   = uMaterial.specular * spec * uPointLights[i].color * atten;

        color += ambient + diffuse + specular;
    }

    // --- Directional light ---
    vec3 dirLight = normalize(-uLightDirection);

    vec3 dAmbient = uMaterial.ambient * uLightAmbient * texColor;

    float dDiff    = max(dot(normal, dirLight), 0.0);
    vec3  dDiffuse = uMaterial.diffuse * dDiff * uLightDiffuse * texColor;

    vec3  dReflect  = reflect(-dirLight, normal);
    float dSpec     = pow(max(dot(viewDir, dReflect), 0.0), uMaterial.shininess);
    vec3  dSpecular = uMaterial.specular * dSpec * uLightSpecular;

    color += dAmbient + dDiffuse + dSpecular;

    // --- Spot light ---
    if (uSpotEnabled != 0) {
        vec3  spotVec = uSpotPosition - vFragPos;
        vec3  spotDir = normalize(spotVec);
        float d       = length(spotVec);
        float atten   = 1.0 / (uSpotAttA0 + uSpotAttA1 * d + uSpotAttA2 * d * d);

        float theta     = dot(spotDir, normalize(-uSpotDirection));
        float intensity = smoothstep(uSpotOuterCos, uSpotInnerCos, theta);

        vec3 sAmbient = uMaterial.ambient * uSpotAmbient * texColor;

        float sDiff   = max(dot(normal, spotDir), 0.0);
        vec3  sDiffuse = uMaterial.diffuse * sDiff * uSpotDiffuse * texColor * atten * intensity;

        vec3  sReflect  = reflect(-spotDir, normal);
        float sSpec     = pow(max(dot(viewDir, sReflect), 0.0), uMaterial.shininess);
        vec3  sSpecular = uMaterial.specular * sSpec * uSpotSpecular * atten * intensity;

        color += sAmbient + sDiffuse + sSpecular;
    }

    fragColor = vec4(color, uOpacity);
}
