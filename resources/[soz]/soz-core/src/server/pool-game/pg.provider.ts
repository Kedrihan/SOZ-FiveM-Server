import { getDistance, Vector3, Vector4 } from '@public/shared/polyzone/vector';
import { Ball, BALL_RADIUS, BALLS_MODELS, Game, INITIAL_COORDS, TABLE_ELASTICITY } from '@public/shared/pool-game';
import { getRandomInt } from '@public/shared/random';

import { OnEvent } from '../../core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { Rpc } from '../../core/decorators/rpc';
import { uuidv4 } from '../../core/utils';
import { ClientEvent, ServerEvent } from '../../shared/event';
import { RpcServerEvent } from '../../shared/rpc';
import { Notifier } from '../notifier';
import { ObjectProvider } from '../object/object.provider';
import { PlayerService } from '../player/player.service';
import { QBCore } from '../qbcore';

@Provider()
export class PoolGameProvider {
    @Inject(QBCore)
    private QBCore: QBCore;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(ObjectProvider)
    private objectProvider: ObjectProvider;

    private gamesInProgress: Game[] = [];

    @OnEvent(ServerEvent.POOL_INIT_GAME)
    public async initGame(source: number, gameTableCoords: Vector3): Promise<void> {
        const newGame: Game = {
            id: uuidv4(),
            balls: [],
            coords: gameTableCoords,
            ready: false,
            playerSource: null,
            propsSpawned: false,
        };
        //Placement initial des boules sur la table
        const ballsPlaced: string[] = [];
        //Balle Blanche d'abord, le reste après
        for (let i = 0; i < INITIAL_COORDS.length; i++) {
            let randomIndex = 0;
            if (i !== 0) {
                randomIndex = getRandomInt(1, INITIAL_COORDS.length);
                while (ballsPlaced.includes(BALLS_MODELS[randomIndex])) {
                    randomIndex = getRandomInt(1, INITIAL_COORDS.length);
                }
            }

            const ball: Ball = {
                id: i,
                coords: this.convertRelativeCoordsToRealCoords(newGame.coords, INITIAL_COORDS[i]),
                propHash: GetHashKey(BALLS_MODELS[randomIndex]),
                velocityX: 0.0,
                velocityY: 0.0,
                pocketed: false,
                prop: null,
            };
            ballsPlaced.push(BALLS_MODELS[randomIndex]);
            newGame.balls.push(ball);
        }
        newGame.ready = true;
        this.gamesInProgress.push(newGame);
        TriggerClientEvent(ClientEvent.POOL_NEW_GAME, -1, newGame);
        this.notifier.notify(source, 'Vous avez lancé une partie.', 'success');
    }
    @OnEvent(ServerEvent.POOL_STOP_GAME)
    public async stopGame(source: number, tableCoords: Vector3): Promise<void> {
        const game = await this.getGameInProgress(source, tableCoords);
        TriggerClientEvent(ClientEvent.POOL_DELETE_GAME, -1, game.id);
        //On delete la game
        this.gamesInProgress = this.gamesInProgress.filter((g) => g.id !== game.id);
        this.notifier.notify(source, 'Vous avez stoppé la partie.', 'success');
    }
    @OnEvent(ServerEvent.POOL_SET_SOMEONE_PLAYING)
    public async setSomeonePlaying(source: number, tableCoords: Vector3, noPlayer: boolean): Promise<void> {
        const game = await this.getGameInProgress(source, tableCoords);
        if (noPlayer) {
            game.playerSource = null;
        } else {
            game.playerSource = source;
        }
        //TrigerClientEvent pour update les Games ?
    }
    @OnEvent(ServerEvent.POOL_SHOOT)
    public async manageShot(source: number, gameId: string, angle: number, power: number) {
        const currentGame = this.gamesInProgress.find((g) => g.id == gameId);
        if (source !== currentGame.playerSource) {
            this.notifier.error(source, "Ce n'est pas à vous de jouer.");
            return;
        }
        while (currentGame.balls.some((b) => b.velocityX > 0 || b.velocityY > 0)) {
            currentGame.balls = this.handleBalls(currentGame.balls, TABLE_ELASTICITY, 0, 0, power, angle);
            TriggerClientEvent(ClientEvent.POOL_UPDATE_GAME, -1, currentGame);
        }
    }

    @Rpc(RpcServerEvent.POOL_GET_GAME_IN_PROGRESS)
    public async getGameInProgress(source: number, tableCoords: Vector3): Promise<Game> {
        return this.gamesInProgress.find(
            (g) => g.coords[0] === tableCoords[0] && g.coords[1] === tableCoords[1] && g.coords[2] === tableCoords[2],
        );
    }
    @Rpc(RpcServerEvent.POOL_GET_ALL_GAMES)
    public async getAllGames(source: number): Promise<Game[]> {
        return this.gamesInProgress;
    }

    private convertRelativeCoordsToRealCoords(tableCoords: Vector3, relativeBallCoords: Vector3): Vector3 {
        const realballCoords: Vector3 = [0, 0, 0];
        realballCoords[0] = tableCoords[0] + relativeBallCoords[0];
        realballCoords[1] = tableCoords[1] + relativeBallCoords[1];
        realballCoords[2] = tableCoords[2] + relativeBallCoords[2];

        return realballCoords;
    }

    // Fonction pour calculer la distance entre deux balles
    private distance(ball1, ball2) {
        const dx = ball2.coords[0] - ball1.coords[0];
        const dy = ball2.coords[1] - ball1.coords[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Fonction pour gérer les collisions entre les balles
    private handleBalls(
        balls: Ball[],
        elasticity: number,
        tableWidth: number,
        tableHeight: number,
        power: number,
        angle: number,
    ): Ball[] {
        // Calcul les composantes de vitesse initiales en fonction de l'angle et de la puissance pour la balle blanche
        const whiteBall = balls.find((b) => b.propHash === GetHashKey('prop_poolball_cue'));
        whiteBall.velocityX = power * Math.cos(angle);
        whiteBall.velocityY = power * Math.sin(angle);
        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];

            // Mettez à jour la position en fonction de la vitesse
            ball.coords[0] += ball.velocityX;
            ball.coords[1] += ball.velocityY;

            // Gestion des rebonds sur les bords de la table
            if (ball.coords[0] - BALL_RADIUS < 0 || ball.coords[0] + BALL_RADIUS > tableWidth) {
                // Inversion de la vitesse en x
                ball.velocityX *= -elasticity;

                // Calcul de l'angle d'incidence par rapport à la normale
                const angleIncidence = Math.atan2(ball.velocityY, ball.velocityX);

                // Calcul de l'angle de réflexion par rapport à la normale (inversion de l'angle d'incidence)
                const angleReflexion = -angleIncidence;

                // Mise à jour de la vitesse en fonction de l'angle de réflexion
                const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
                ball.velocityX = speed * Math.cos(angleReflexion);
                ball.velocityY = speed * Math.sin(angleReflexion);
            }
            if (ball.coords[1] - BALL_RADIUS < 0 || ball.coords[1] + BALL_RADIUS > tableHeight) {
                // Inversion de la vitesse en y
                ball.velocityY *= -elasticity;

                // Calcul de l'angle d'incidence par rapport à la normale
                const angleIncidence = Math.atan2(ball.velocityX, ball.velocityY);

                // Calcul de l'angle de réflexion par rapport à la normale (inversion de l'angle d'incidence)
                const angleReflexion = -angleIncidence;

                // Mise à jour de la vitesse en fonction de l'angle de réflexion
                const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
                ball.velocityX = speed * Math.sin(angleReflexion);
                ball.velocityY = speed * Math.cos(angleReflexion);
            }

            // Mettez à jour la position de la balle sur la table (évitez de sortir de la table)
            ball.coords[0] = Math.max(BALL_RADIUS, Math.min(tableWidth - BALL_RADIUS, ball.coords[0]));
            ball.coords[1] = Math.max(BALL_RADIUS, Math.min(tableHeight - BALL_RADIUS, ball.coords[1]));

            for (let j = i + 1; j < balls.length; j++) {
                const ball1 = balls[i];
                const ball2 = balls[j];
                const dist = getDistance(ball1.coords, ball2.coords);

                if (dist < BALL_RADIUS + BALL_RADIUS) {
                    // Les balles entrent en collision
                    const angle = Math.atan2(ball2.coords[1] - ball1.coords[1], ball2.coords[0] - ball1.coords[0]);
                    const speed1 = Math.sqrt(ball1.velocityX * ball1.velocityX + ball1.velocityY * ball1.velocityY);
                    const speed2 = Math.sqrt(ball2.velocityX * ball2.velocityX + ball2.velocityY * ball2.velocityY);
                    const direction1 = Math.atan2(ball1.velocityY, ball1.velocityX);
                    const direction2 = Math.atan2(ball2.velocityY, ball2.velocityX);

                    // Calcul de l'angle de collision
                    const collisionAngle = Math.atan2(
                        ball2.coords[1] - ball1.coords[1],
                        ball2.coords[0] - ball1.coords[0],
                    );

                    // Calcul des nouvelles vitesses après la collision (lois de conservation de l'impulsion)
                    const newVx1 =
                        (speed1 * Math.cos(direction1 - collisionAngle) * (BALL_RADIUS - BALL_RADIUS)) /
                            (BALL_RADIUS + BALL_RADIUS) +
                        (speed2 * Math.cos(direction2 - collisionAngle) * (2 * BALL_RADIUS)) /
                            (BALL_RADIUS + BALL_RADIUS);

                    const newVx2 =
                        (speed1 * Math.cos(direction1 - collisionAngle) * (2 * BALL_RADIUS)) /
                            (BALL_RADIUS + BALL_RADIUS) +
                        (speed2 * Math.cos(direction2 - collisionAngle) * (BALL_RADIUS - BALL_RADIUS)) /
                            (BALL_RADIUS + BALL_RADIUS);

                    const newVy1 = speed1 * Math.sin(direction1 - collisionAngle);
                    const newVy2 = speed2 * Math.sin(direction2 - collisionAngle);

                    // Mettez à jour les vitesses des balles
                    ball1.velocityX = newVx1;
                    ball1.velocityY = newVy1;
                    ball2.velocityX = newVx2;
                    ball2.velocityY = newVy2;

                    // Évitez que les balles ne restent en collision
                    const overlap = 0.5 * (BALL_RADIUS + BALL_RADIUS - dist + 1);
                    ball1.coords[0] -= overlap * Math.cos(angle);
                    ball1.coords[1] -= overlap * Math.sin(angle);
                    ball2.coords[0] += overlap * Math.cos(angle);
                    ball2.coords[1] += overlap * Math.sin(angle);
                }
            }
        }
        return balls;
    }
}
