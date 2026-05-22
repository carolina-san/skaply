import { mat4, vec3 } from 'gl-matrix';

export class Frustum {

    // 6 planes [a, b, c, d] where ax+by+cz+d=0, normal points inward
    private planes: [number, number, number, number][] = [];

    // extracts the 6 frustum planes from a view-projection matrix (Gribb-Hartmann)
    fromViewProjection(vp: mat4): void {
        // gl-matrix is column-major: row i = vp[i], vp[i+4], vp[i+8], vp[i+12]
        const m = vp;
        const r0: [number, number, number, number] = [m[0], m[4], m[8],  m[12]];
        const r1: [number, number, number, number] = [m[1], m[5], m[9],  m[13]];
        const r2: [number, number, number, number] = [m[2], m[6], m[10], m[14]];
        const r3: [number, number, number, number] = [m[3], m[7], m[11], m[15]];

        this.planes = [
            this.add(r3, r0), // left
            this.sub(r3, r0), // right
            this.add(r3, r1), // bottom
            this.sub(r3, r1), // top
            this.add(r3, r2), // near
            this.sub(r3, r2), // far
        ];
    }

    // sphere test — conservative but correct: never culls visible objects
    containsSphere(center: vec3, radius: number): boolean {
        for (const [a, b, c, d] of this.planes) {
            if (a * center[0] + b * center[1] + c * center[2] + d < -radius) {
                return false;
            }
        }
        return true;
    }

    private add(a: [number, number, number, number], b: [number, number, number, number]): [number, number, number, number] {
        return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
    }

    private sub(a: [number, number, number, number], b: [number, number, number, number]): [number, number, number, number] {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
    }
}
