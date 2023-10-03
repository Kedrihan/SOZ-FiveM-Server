import { Once, OnceStep } from '@public/core/decorators/event';
import { Inject } from '@public/core/decorators/injectable';
import { emitRpc } from '@public/core/rpc';
import { wait } from '@public/core/utils';
import { computeBinId } from '@public/shared/job/garbage';
import { Ball } from '@public/shared/pool-game';
import { RpcServerEvent } from '@public/shared/rpc';

import { Provider } from '../../core/decorators/provider';
import { AnimationStopReason } from '../../shared/animation';
import { AnimationService } from '../animation/animation.service';
import { PlayerService } from '../player/player.service';
import { TargetFactory } from '../target/target.factory';

const racks = [GetHashKey('prop_pool_rack_01'), GetHashKey('prop_pool_rack_02')];
const tables = [GetHashKey('prop_pooltable_02'), GetHashKey('prop_pooltable_3b')];
const cue = GetHashKey('prop_pool_cue');
const ballsProps = [
    GetHashKey('prop_poolball_cue'),
    GetHashKey('prop_poolball_1'),
    GetHashKey('prop_poolball_2'),
    GetHashKey('prop_poolball_3'),
    GetHashKey('prop_poolball_4'),
    GetHashKey('prop_poolball_5'),
    GetHashKey('prop_poolball_6'),
    GetHashKey('prop_poolball_7'),
    GetHashKey('prop_poolball_8'),
    GetHashKey('prop_poolball_9'),
    GetHashKey('prop_poolball_10'),
    GetHashKey('prop_poolball_11'),
    GetHashKey('prop_poolball_12'),
    GetHashKey('prop_poolball_13'),
    GetHashKey('prop_poolball_14'),
    GetHashKey('prop_poolball_15'),
];
const balls: Ball[] = [];
const props = [];
@Provider()
export class PoolGameProvider {
    @Inject(TargetFactory)
    public targetFactory: TargetFactory;

    @Inject(AnimationService)
    public animationService: AnimationService;

    @Inject(PlayerService)
    public playerService: PlayerService;

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
            1.3
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
                        //Placement initial des boules sur la table (entity) + synchro avec tous les joueurs
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
            1.3
        );
    }

    private createBallProp(ball: Ball) {
        const prop = CreateObject(
            GetHashKey(ball.propName),
            ball.coords[0],
            ball.coords[1],
            ball.coords[2],
            true,
            true,
            true
        );
        SetEntityCollision(prop, false, false);
        SetEntityNoCollisionEntity(prop, PlayerPedId(), true);
        props.push(prop);
    }
    private placeBallsInTriangle() {
        const triangleSide = 10.0; // Longueur du côté du triangle
        let yOffset = 0.0; // Décalage vertical des boules

        // Boule 1
        const ball1: Ball = {
            coords: [0.0, 0.0 + yOffset, 0.0],
            velocityX: 0.0,
            velocityY: 0.0,
            id: 1,
            propName: '',
        };
        balls.push(ball1);
        this.createBallProp(ball1);

        // Boules 2 à 10
        let ballId = 2;
        for (let i = 1; i <= 4; i++) {
            let xOffset = -triangleSide / 2 + i * (triangleSide / 2);
            for (let j = 1; j <= i; j++) {
                const ball: Ball = {
                    coords: [xOffset, -triangleSide + yOffset, 0.0],
                    velocityX: 0.0,
                    velocityY: 0.0,
                    id: ballId,
                    propName: '',
                };
                balls.push(ball);
                this.createBallProp(ball);
                ballId++;
                xOffset = xOffset + triangleSide;
            }
            yOffset = yOffset - 1.0;
        }
    }
    /* 


    -- Fonction pour placer les boules en triangle
local function placeBallsInTriangle()
    local triangleSide = 10.0 -- Longueur du côté du triangle
    local yOffset = 0.0 -- Décalage vertical des boules
    
    -- Boule 1
    local ball1 = {
        x = 0.0,
        y = 0.0 + yOffset,
        z = 0.0,
        velocityX = 0.0,
        velocityY = 0.0,
        id = 1
    }
    table.insert(balls, ball1)
    createBallProp(ball1)
    
    -- Boules 2 à 10
    local ballId = 2
    for i = 1, 4 do
        local xOffset = -triangleSide / 2 + i * (triangleSide / 2)
        for j = 1, i do
            local ball = {
                x = xOffset,
                y = -triangleSide + yOffset,
                z = 0.0,
                velocityX = 0.0,
                velocityY = 0.0,
                id = ballId
            }
            table.insert(balls, ball)
            createBallProp(ball)
            ballId = ballId + 1
            xOffset = xOffset + triangleSide
        end
        yOffset = yOffset - 1.0
    end
end
    




Collision et tout

local balls = {} -- Tableau pour stocker les informations sur les boules
local props = {} -- Tableau pour stocker les props correspondants aux boules

-- Fonction pour créer un prop correspondant à une boule
local function createBallProp(ball)
    local prop = CreateObject(GetHashKey("prop_pooltable_ball"), ball.x, ball.y, ball.z, true, true, true)
    SetEntityCollision(prop, false, false)
    SetEntityNoCollisionEntity(prop, GetPlayerPed(-1), true)
    table.insert(props, prop)
end

-- Fonction pour mettre à jour la position des props des boules
local function updateBallProps()
    for i, ball in ipairs(balls) do
        local prop = props[i]
        if DoesEntityExist(prop) then
            SetEntityCoordsNoOffset(prop, ball.x, ball.y, ball.z, true, true, true)
        end
    end
end

-- Mettre à jour la position des boules
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        for i, ball in pairs(balls) do
            -- Appliquer la friction (résistance au roulement)
            ball.velocityX = ball.velocityX * 0.98
            ball.velocityY = ball.velocityY * 0.98
            
            -- Mettre à jour la position de la boule
            ball.x = ball.x + ball.velocityX
            ball.y = ball.y + ball.velocityY
            
            -- Gestion des collisions avec les bords de la table (simplifié)
            if ball.x < -100 then
                ball.velocityX = -ball.velocityX
                ball.x = -100
            elseif ball.x > 100 then
                ball.velocityX = -ball.velocityX
                ball.x = 100
            end
            
            if ball.y < -50 then
                ball.velocityY = -ball.velocityY
                ball.y = -50
            elseif ball.y > 50 then
                ball.velocityY = -ball.velocityY
                ball.y = 50
            end

            -- Vérifier les collisions avec les autres boules
            for j, otherBall in pairs(balls) do
                if i ~= j then
                    checkCollision(ball, otherBall)
                end
            end
        end

        -- Mettre à jour la position des props correspondants aux boules
        updateBallProps()
    end
end)

-- Événement pour créer les boules de billard et leurs props correspondants
RegisterNetEvent("billard:createBalls")
AddEventHandler("billard:createBalls", function()
    for i = 1, 15 do
        local ball = {
            x = 0, -- Position initiale
            y = 0,
            z = 0,
            velocityX = 0, -- Vitesse initiale
            velocityY = 0,
            id = i
        }
        table.insert(balls, ball)
        createBallProp(ball) -- Créer le prop correspondant
    end
end)
    */
}
