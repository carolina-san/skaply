#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vFragPos;
in vec2 vTexCoord;

uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uViewPosition;
uniform sampler2D uDiffuseTexture;

uniform float uHighlight;
uniform vec3 uHighlightColor;
uniform float uIsUnlit;
uniform vec3 uUnlitColor;
uniform float uOutlinePass;

out vec4 fragColor;

void main() {
    if (uOutlinePass > 0.5) {
        if (uHighlight > 0.5) {
            fragColor = vec4(1.0); // Output solid white to mask texture
        } else {
            discard; // Ignore non-highlighted objects in mask FBO
        }
        return;
    }

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

    // Combine lighting components
    vec3 lighting = ambient + diff * uLightColor + specular;

    // Decode texture from sRGB to linear space
    vec3 texColor = pow(texture(uDiffuseTexture, vTexCoord).rgb, vec3(2.2));

    // Calculate final linear color
    vec3 result = lighting * texColor;

    // Apply gamma correction (compress to sRGB for display)
    result = pow(result, vec3(1.0 / 2.2));

    if (uIsUnlit > 0.5) {
        result = uUnlitColor;
    }

    fragColor = vec4(result, 1.0);
}