import { Vector3 } from './polyzone/vector';

export type Ball = {
    coords: Vector3;
    velocityX: number;
    velocityY: number;
    id: number;
    propName: string;
};
