import { On, Once, OnceStep } from '@public/core/decorators/event';
import { Inject } from '@public/core/decorators/injectable';
import { Tick, TickInterval } from '@public/core/decorators/tick';
import { emitRpc } from '@public/core/rpc';
import { wait } from '@public/core/utils';
import { ClientEvent, ServerEvent } from '@public/shared/event';
import { WorldObject } from '@public/shared/object';
import { getDistance, Vector3, Vector4 } from '@public/shared/polyzone/vector';
import { DISTANCE_PROPS_LOADING, Game } from '@public/shared/pool-game';
import { RpcServerEvent } from '@public/shared/rpc';

import { Provider } from '../../core/decorators/provider';
import { AnimationService } from '../animation/animation.service';
import { CameraService } from '../camera';
import { PlayerService } from '../player/player.service';
import { ResourceLoader } from '../repository/resource.loader';
import { TargetFactory } from '../target/target.factory';

const racks = [GetHashKey('prop_pool_rack_01'), GetHashKey('prop_pool_rack_02')];
const tables = [GetHashKey('prop_pooltable_02'), GetHashKey('prop_pooltable_3b')];

let cueProp = null;
@Provider()
export class PoolGameProvider {
    @Inject(TargetFactory)
    public targetFactory: TargetFactory;

    @Inject(AnimationService)
    public animationService: AnimationService;

    @Inject(PlayerService)
    public playerService: PlayerService;

    @Inject(CameraService)
    private cameraService: CameraService;

    @Inject(ResourceLoader)
    private resourceLoader: ResourceLoader;

    private allGames: Game[] = [];
    @Once(OnceStep.Start)
    public init() {
        this.targetFactory.createForModel(
            racks,
            [
                {
                    label: 'Prendre une queue de billard',
                    icon: 'c:inventory/ouvrir_la_poubelle.png',
                    action: async (entity: number) => {
                        TaskTurnPedToFaceEntity(PlayerPedId(), entity, 800);
                        await wait(800);
                        const player = this.playerService.getPlayer();
                        player.metadata.isPlayingPool = true;
                        //attacher une queue au ped + mettre le metadata qui dit qu'il a la queue (utile pour pouvoir interagir avec la table de billard après)

                        // Coordonnées de la main du joueur (vous pouvez ajuster ces valeurs)
                        const handCoords = [0.12, -0.1, -0.01];
                        const ped = PlayerPedId();
                        // Créez le prop de queue de billard
                        cueProp = CreateObject(GetHashKey('prop_pool_cue'), 0, 0, 0, true, true, true);

                        // Attachez le prop à la main du joueur
                        SetEntityAsMissionEntity(cueProp, true, true);
                        AttachEntityToEntity(
                            cueProp,
                            ped,
                            GetPedBoneIndex(ped, 28422),
                            handCoords[0],
                            handCoords[1],
                            handCoords[2],
                            0.0,
                            0.0,
                            0.0,
                            true,
                            true,
                            false,
                            true,
                            1,
                            true,
                        );
                    },
                    canInteract: () => {
                        const player = this.playerService.getPlayer();

                        if (!player) {
                            return false;
                        }

                        if (player.metadata.isPlayingPool) {
                            return false;
                        }

                        return true;
                    },
                },
                {
                    label: 'Poser la queue de billard',
                    icon: 'c:inventory/ouvrir_la_poubelle.png',
                    action: async (entity: number) => {
                        TaskTurnPedToFaceEntity(PlayerPedId(), entity, 800);
                        await wait(800);
                        const player = this.playerService.getPlayer();
                        player.metadata.isPlayingPool = false;
                        if (cueProp != null && DoesEntityExist(cueProp)) {
                            DeleteEntity(cueProp);
                        }
                    },
                    canInteract: () => {
                        const player = this.playerService.getPlayer();

                        if (!player) {
                            return false;
                        }

                        if (!player.metadata.isPlayingPool) {
                            return false;
                        }

                        return true;
                    },
                },
            ],
            1.3,
        );

        this.targetFactory.createForModel(
            tables,
            [
                {
                    label: 'Placer les boules',
                    icon: 'c:inventory/ouvrir_la_poubelle.png',
                    action: async (entity: number) => {
                        TaskTurnPedToFaceEntity(PlayerPedId(), entity, 800);
                        await wait(800);
                        const tableCoords = GetEntityCoords(entity) as Vector3;
                        //On démarre une nouvelle partie
                        TriggerServerEvent(ServerEvent.POOL_INIT_GAME, tableCoords);
                    },
                    canInteract: async (entity: number) => {
                        const player = this.playerService.getPlayer();
                        const tableCoords = GetEntityCoords(entity) as Vector3;

                        if (!player) {
                            return false;
                        }

                        if (!player.metadata.isPlayingPool) {
                            return false;
                        }

                        //On ne peut pas replacer les boules si une partie est déjà en cours
                        const currentGame = await this.getGameInProgress(tableCoords);
                        if (currentGame) {
                            return false;
                        }
                        return true;
                    },
                },
                {
                    label: 'Ranger les boules',
                    icon: 'c:inventory/ouvrir_la_poubelle.png',
                    action: async (entity: number) => {
                        const tableCoords = GetEntityCoords(entity) as Vector3;
                        TriggerServerEvent(ServerEvent.POOL_STOP_GAME, tableCoords);
                    },
                    canInteract: async (entity: number) => {
                        const player = this.playerService.getPlayer();
                        const tableCoords = GetEntityCoords(entity) as Vector3;

                        if (!player) {
                            return false;
                        }

                        if (!player.metadata.isPlayingPool) {
                            return false;
                        }

                        //On ne peut pas ranger les boules si pas de partie en cours ou partie pas prête côté serveur ou si quelqu'un va tirer
                        const currentGame = await this.getGameInProgress(tableCoords);
                        if (!currentGame || !currentGame.ready || currentGame.playerSource) {
                            return false;
                        }
                        return true;
                    },
                },
                {
                    label: 'Tirer',
                    icon: 'c:inventory/ouvrir_la_poubelle.png',
                    action: async (entity: number) => {
                        const tableCoords = GetEntityCoords(entity) as Vector3;
                        TriggerServerEvent(ServerEvent.POOL_SET_SOMEONE_PLAYING, tableCoords);
                        //Placer la camera comme il faut au niveau du joueur, queue en avant qui pointe vers la balle blanche
                        //Gérer la souris qui fait bouger la queue de gauche a droite
                        //Gérer l'appuie d'une touche pour récup la puissance du coup
                        //Transmettre la puissance du coup et l'angle de tir au serveur pour qu'il calcul et mette a jour les coordonénes des boules
                    },
                    canInteract: async (entity: number) => {
                        const player = this.playerService.getPlayer();
                        const tableCoords = GetEntityCoords(entity) as Vector3;

                        if (!player) {
                            return false;
                        }

                        if (!player.metadata.isPlayingPool) {
                            return false;
                        }

                        //On ne peut pas tirer si pas de partie en cours ou partie pas prête côté serveur ou si quelqu'un va tirer
                        const currentGame = await this.getGameInProgress(tableCoords);
                        if (!currentGame || !currentGame.ready || currentGame.playerSource) {
                            return false;
                        }
                        return true;
                    },
                },
                {
                    label: 'Lire de livret de règles',
                    icon: 'c:inventory/ouvrir_la_poubelle.png',
                    action: async (entity: number) => {
                        TaskTurnPedToFaceEntity(PlayerPedId(), entity, 800);
                        await wait(800);
                        //faire un petit livret style contrat pour afficher les règles (version simple)
                    },
                },
            ],
            1.3,
        );
    }
    @Once(OnceStep.PlayerLoaded)
    public async loadGames() {
        this.allGames = await this.getAllGames();
    }

    @Tick(TickInterval.EVERY_FRAME)
    public async onTick() {
        const player = PlayerPedId();
        const playerCoords = GetEntityCoords(player) as Vector3;
        for (const game of this.allGames) {
            const playerDistance = getDistance(game.coords, playerCoords);
            if (playerDistance < DISTANCE_PROPS_LOADING) {
                //On charge les props (la position se mettra à jour direct en actualisant bien this.allGames à chaque coup)
                for (const ball of game.balls.filter((b) => !b.pocketed)) {
                    if (ball.prop == null) {
                        const entity = await this.spawnProp(ball.propHash, ball.coords);
                        ball.prop = entity;
                    } else {
                        if (getDistance(ball.coords, GetEntityCoords(ball.prop) as Vector3) != 0) {
                            await this.moveProp(ball.prop, ball.coords);
                        }
                    }
                }
            } else {
                //On delete les props s'ils existent
                for (const ball of game.balls.filter((b) => !b.pocketed && b.prop != null)) {
                    await this.deleteProp(ball.prop);
                }
            }
        }
    }

    @On(ClientEvent.POOL_NEW_GAME)
    public async newGame(newGame: Game) {
        this.allGames.push(newGame);
    }
    @On(ClientEvent.POOL_DELETE_GAME)
    public async deleteGame(gameId: string) {
        this.allGames = this.allGames.filter((g) => g.id !== gameId);
    }
    @On(ClientEvent.POOL_UPDATE_GAME)
    public async updateGame(game: Game) {
        const gameToUpdate = this.allGames.find((g) => g.id === game.id);
        gameToUpdate.balls = game.balls;
        gameToUpdate.ready = game.ready;
        gameToUpdate.playerSource = game.playerSource;
    }
    private async getGameInProgress(tableCoords: Vector3): Promise<Game> {
        return await emitRpc<Game>(RpcServerEvent.POOL_GET_GAME_IN_PROGRESS, tableCoords);
    }
    private async getAllGames(): Promise<Game[]> {
        return await emitRpc<Game[]>(RpcServerEvent.POOL_GET_ALL_GAMES);
    }
    private manageShot(currentGame: Game): void {
        const playerPed = PlayerPedId();
        const cueBall = currentGame.balls.find((b) => b.propHash === GetHashKey('prop_poolball_cue'));
        const cueBallCoords = GetEntityCoords(cueBall.propHash) as Vector3;

        const yaw = 0.0; // Ajustez les angles de caméra selon vos besoins

        SetEntityCoordsNoOffset(playerPed, cueBallCoords[0], cueBallCoords[1], cueBallCoords[2], true, true, true);
        SetEntityHeading(playerPed, yaw);

        const fov = 60.0; // Ajustez le champ de vision (FOV) selon vos besoins
        SetCamFov(GetRenderingCam(), fov); // Utilisez GetRenderingCam() pour la caméra de rendu active

        const poolCueSpeed = 0.5; // Ajustez la vitesse du mouvement de la queue de billard
        // Créez le prop de la queue de billard
        const poolCue = CreateObject(
            GetHashKey('prop_pool_cue'),
            cueBallCoords[0],
            cueBallCoords[1],
            cueBallCoords[2],
            true,
            true,
            true,
        );
        AttachEntityToEntity(poolCue, cueBall.propHash, 0, 0, 0, 0, 0, 0, 0, false, false, false, false, 0, true);
        RenderScriptCams(false, true, 0, true, true);
        const tableCoordsOffset = [
            currentGame.coords[0],
            currentGame.coords[1] - 5.0,
            currentGame.coords[2] + 2.0,
        ] as Vector3;

        //let isCameraActive = true;
        //while (isCameraActive) {
        Wait(0);
        DisableAllControlActions(0);

        // Gérez le déplacement de la queue de billard avec la souris ici
        // Utilisez les coordonnées de la souris pour ajuster la position de la queue de billard

        // Par exemple :
        const mouseX = GetControlNormal(0, 1);
        const mouseY = GetControlNormal(0, 2);
        const poolCueCoords = GetEntityCoords(poolCue) as Vector3;

        poolCueCoords[0] += mouseX * poolCueSpeed;
        poolCueCoords[1] += mouseY * poolCueSpeed;

        SetEntityCoordsNoOffset(poolCue, poolCueCoords[0], poolCueCoords[1], poolCueCoords[2], true, true, true);
        // Mettez à jour la caméra si nécessaire
        this.cameraService.setupCamera(tableCoordsOffset, cueBallCoords);
        //Après le tir on remet isCameraActive a FALSE, fausse condition pour le moment
        /*if (isCameraActive && !poolCue) {
                isCameraActive = false;
            }*/
        //}
    }
    private async spawnProp(model: number, coords: Vector3): Promise<number> {
        if (IsModelValid(model)) {
            await this.resourceLoader.loadModel(model);
        }
        const entity = CreateObjectNoOffset(model, coords[0], coords[1], coords[2], false, false, false);
        this.resourceLoader.unloadModel(model);
        return entity;
    }
    private async moveProp(entity: number, coords: Vector3): Promise<void> {
        if (DoesEntityExist(entity)) {
            SetEntityCoordsNoOffset(entity, coords[0], coords[1], coords[2], true, true, true);
        }
    }
    private async deleteProp(entity: number): Promise<void> {
        if (DoesEntityExist(entity)) {
            DeleteEntity(entity);
        }
    }
}
