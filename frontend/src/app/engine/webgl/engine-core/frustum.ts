import { mat4, vec3, vec4 } from 'gl-matrix';

export class Frustum {
    private planes: vec4[] = [
        vec4.create(), // Plano izquierdo
        vec4.create(), // Plano derecho
        vec4.create(), // Plano inferior
        vec4.create(), // Plano superior
        vec4.create(), // Plano cercano
        vec4.create()  // Plano lejano
    ];

    update(viewProjectionMatrix: mat4): void {
        const m = viewProjectionMatrix;

        // Plano izquierdo
        vec4.set(this.planes[0], m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
        // Plano derecho
        vec4.set(this.planes[1], m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
        // Plano inferior
        vec4.set(this.planes[2], m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
        // Plano superior
        vec4.set(this.planes[3], m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
        // Plano cercano
        vec4.set(this.planes[4], m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
        // Plano lejano
        vec4.set(this.planes[5], m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);

        // Normalizar
        for (let i = 0; i < 6; i++) {
            const p = this.planes[i];
            const length = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
            if (length > 0) {
                vec4.scale(p, p, 1.0 / length);
            }
        }

    }


    intersectsAABB(min: vec3, max: vec3): boolean {
        for (let i = 0; i < 6; i++) {
            const p = this.planes[i];

            const px = p[0] >= 0 ? max[0] : min[0];
            const py = p[1] >= 0 ? max[1] : min[1];
            const pz = p[2] >= 0 ? max[2] : min[2];

            if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) {
                return false;
            }
        }
        return true;
    }
}
