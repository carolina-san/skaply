import { mat4, vec3, vec4 } from 'gl-matrix';

export class Frustum {

    private planes: vec4[] = [
        vec4.create(), // left plane
        vec4.create(), // right plane
        vec4.create(), // bottom plane
        vec4.create(), // top plane
        vec4.create(), // near plane
        vec4.create()  // far plane
    ];

    // extracts the 6 frustum planes from a view-projection matrix (Gribb-Hartmann)
    update(viewProjectionMatrix: mat4): void {
        const m = viewProjectionMatrix;

        vec4.set(this.planes[0], m[3] + m[0],  m[7] + m[4],  m[11] + m[8],  m[15] + m[12]); // left
        vec4.set(this.planes[1], m[3] - m[0],  m[7] - m[4],  m[11] - m[8],  m[15] - m[12]); // right
        vec4.set(this.planes[2], m[3] + m[1],  m[7] + m[5],  m[11] + m[9],  m[15] + m[13]); // bottom
        vec4.set(this.planes[3], m[3] - m[1],  m[7] - m[5],  m[11] - m[9],  m[15] - m[13]); // top
        vec4.set(this.planes[4], m[3] + m[2],  m[7] + m[6],  m[11] + m[10], m[15] + m[14]); // near
        vec4.set(this.planes[5], m[3] - m[2],  m[7] - m[6],  m[11] - m[10], m[15] - m[14]); // far

        // normalize so plane distances are in world units
        for (let i = 0; i < 6; i++) {
            const p = this.planes[i];
            const len = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
            if (len > 0) vec4.scale(p, p, 1.0 / len);
        }
    }

    // returns false if the AABB is completely outside any frustum plane
    intersectsAABB(min: vec3, max: vec3): boolean {
        for (let i = 0; i < 6; i++) {
            const p = this.planes[i];
            // p-vertex: corner most aligned with the plane normal
            const px = p[0] >= 0 ? max[0] : min[0];
            const py = p[1] >= 0 ? max[1] : min[1];
            const pz = p[2] >= 0 ? max[2] : min[2];
            if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) return false;
        }
        return true;
    }
}
