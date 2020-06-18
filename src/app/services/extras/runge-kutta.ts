import { Vector3 } from 'three';

export class RungeKutta {

    static step(state: State): number {
        // Charge (q) to momemtum (p) ratio in SI units
        const qop: number = state.q / (state.unitC * state.p);

        // Runge-Kutta integrator state
        let h2: number, half_h: number;
        let B_middle: Vector3, B_last: Vector3, k2: Vector3, k3: Vector3, k4: Vector3;

        // First Runge-Kutta point (at current position)
        const B_first: Vector3 = Field.get(state.pos);
        const k1: Vector3 = state.dir.clone().cross(B_first).multiplyScalar(qop);

        const tryRungeKuttaStep = (h: number) => {
            h2 = h * h;
            half_h = h / 2;

            // Second Runge-Kutta point
            // state.pos + state.dir * half_h + k1 * (h2 / 8)
            const pos1: Vector3 = state.pos.clone().add(state.dir.clone().multiplyScalar(half_h)).add(k1.clone().multiplyScalar(h2 / 8));
            B_middle = Field.get(pos1);
            // (state.dir + k1 * half_h).cross(B_middle) * qop
            k2 = state.dir.clone().add(k1.clone().multiplyScalar(half_h)).cross(B_middle).multiplyScalar(qop);

            // Third Runge-Kutta point
            // (state.dir + k2 * half_h).cross(B_middle) * qop
            k3 = state.dir.clone().add(k2.clone().multiplyScalar(half_h)).cross(B_middle).multiplyScalar(qop);

            // Last Runge-Kutta point
            // state.pos + state.dir * h + k3 * (h2 / 2)
            const pos2: Vector3 = state.pos.clone().add(state.dir.clone().multiplyScalar(h)).add(k3.clone().multiplyScalar(h2 / 2));
            B_last = Field.get(pos2);
            // (state.dir + k3 * h).cross(B_last) * qop
            k4 = state.dir.clone().add(k3.clone().multiplyScalar(h)).cross(B_last).multiplyScalar(qop);

            // (k1 - k2 - k3 + k4)
            const returnVec = k1.clone().sub(k2).sub(k3).add(k4);
            // h * (k1 - k2 - k3 + k4).lpNorm()
            return h * (Math.abs(returnVec.x) + Math.abs(returnVec.y) + Math.abs(returnVec.z));
        };

        let error_estimate: number = tryRungeKuttaStep(state.stepSize);
        while (error_estimate > 0.0002) {
            state.stepSize = 0.5 * state.stepSize;
            error_estimate = tryRungeKuttaStep(state.stepSize);
        }

        let fh: number = state.stepSize;
        let fh2: number = fh * fh;

        // Update position and momentum
        // state.pos += state.dir * fh + (k1 + k2 + k3) * (fh2 /6)
        state.pos.add(state.dir.clone().multiplyScalar(fh)).add(k1.clone().add(k2).add(k3).multiplyScalar(fh2 / 6));
        // state.dir += (k1 + k2 * 2 + k3 * 2 + k4) * (fh / 6)
        state.dir.add(k1.clone().add(k2.clone().multiplyScalar(2)).add(k3.clone().multiplyScalar(2)).add(k4).multiplyScalar(fh / 6));
        state.dir = RungeKutta.normalizeVector(state.dir);

        return state.stepSize;
    }

    static propagate(startPos: Vector3, startDir: Vector3, p: number, q: number,
        mss: number = -1, plength: number = 1000.0): { pos: Vector3, dir: Vector3 }[] {
        let rkState: State = new State();
        rkState.pos = startPos;
        rkState.dir = startDir;
        rkState.p = p;
        rkState.q = q;
        rkState.maxStepSize = mss;

        let result: { pos: Vector3, dir: Vector3 }[] = [];

        while (rkState.pathLength < plength) {
            rkState.pathLength += RungeKutta.step(rkState);
            let copiedState = JSON.parse(JSON.stringify(rkState));
            result.push({
                pos: copiedState.pos,
                dir: copiedState.dir
            });
        }

        return result;
    }

    static normalizeVector(vector: Vector3): Vector3 {
        const imag = 1 / Math.sqrt(vector.x * vector.x * + vector.y * vector.y + vector.z * vector.z);
        vector.x *= imag;
        vector.y *= imag;
        vector.z *= imag;
        return vector;
    }

}


class State {
    pos: Vector3 = new Vector3(0, 0, 0);
    dir: Vector3 = new Vector3(0, 0, 0);
    p: number = 0.0;
    q: number = 1;
    unitC: number = 0.15;
    stepSize: number = 1000.0;
    maxStepSize: number = 10.0;
    pathLength: number = 0.0;
}


// Resets the vector for now but might be used to change the field vector
class Field {
    static get(field: Vector3): Vector3 {
        return new Vector3(0, 0.0, 2.0);
    }
}