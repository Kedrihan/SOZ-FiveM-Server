import { Vector3 } from './polyzone/vector';
export const DISTANCE_PROPS_LOADING = 200;
export const BALL_RADIUS = 10;
export const TABLE_ELASTICITY = 0.8;
export type Ball = {
    coords: Vector3;
    velocityX: number;
    velocityY: number;
    id: number;
    propHash: number;
    prop: number;
    pocketed: boolean;
};
export type Game = {
    id: string;
    coords: Vector3;
    balls: Ball[];
    ready: boolean;
    playerSource: number;
    propsSpawned: boolean;
};

export const INITIAL_COORDS: Vector3[] = [
    //Boule blanche
    [0.0, 0.0, 0.1],

    //Rangée supérieure
    [0.0, -0.11, 0.1],
    [0.04, 0.055, 0.1],
    [-0.04, 0.055, 0.1],

    //Rangée du milieu
    [0.0, -0.22, 0.1],
    [0.08, -0.055, 0.1],
    [-0.08, -0.055, 0.1],
    [0.12, 0.055, 0.1],
    [-0.12, 0.055, 0.1],

    //Rangée inférieure
    [0.0, -0.33, 0.1],
    [0.12, -0.11, 0.1],
    [-0.12, -0.11, 0.1],
    [0.16, 0.055, 0.1],
    [-0.16, 0.055, 0.1],
];

export const BALLS_MODELS: string[] = [
    'prop_poolball_cue',
    'prop_poolball_1',
    'prop_poolball_2',
    'prop_poolball_3',
    'prop_poolball_4',
    'prop_poolball_5',
    'prop_poolball_6',
    'prop_poolball_7',
    'prop_poolball_8',
    'prop_poolball_9',
    'prop_poolball_10',
    'prop_poolball_11',
    'prop_poolball_12',
    'prop_poolball_13',
    'prop_poolball_14',
    'prop_poolball_15',
];
