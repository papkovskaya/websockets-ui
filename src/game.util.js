import { players, rooms, games } from './db.js';

export function getPlayersWSById(roomIndex, index) {
    return players[rooms[roomIndex].roomUsers[index].index].ws;
}

export function getPlayersWSByRoomId(roomId, index) {
    const roomIndex = rooms.findIndex((item) => item.roomId === roomId);
    return getPlayersWSById(roomIndex, index);
}

export function getPlayerByGameId(gameId, index) {
    const roomId = games.find((game) => game.idGame === gameId).roomId;
    const roomIndex = rooms.findIndex((item) => item.roomId === roomId);
    return players[rooms[roomIndex].roomUsers[index].index];
}

export function isUserIsNotInTheRoom(roomIndex, currentUserIndex) {
    return rooms[roomIndex].roomUsers[0].index !== currentUserIndex;
}

export function getRoomIndexFromMessage(jsonMessage) {
    return rooms.findIndex((r) => r.roomId === JSON.parse(jsonMessage.data).indexRoom);
}

export function getCurrentPlayerIndex(ws) {
    return players.findIndex((player) => player.ws === ws);
}

export function generateShips(jsonShipsData) {
    return jsonShipsData.map((ship) => {
        const positions = [];
        if (ship.direction) {
            for (let i = 0; i < ship.length; i++) {
                positions.push({
                    x: ship.position.x,
                    y: ship.position.y + i,
                    isShooted: false
                });
            }
        } else {
            for (let i = 0; i < ship.length; i++) {
                positions.push({
                    x: ship.position.x + i,
                    y: ship.position.y,
                    isShooted: false
                });
            }
        }
        return {
            positions,
            direction: ship.direction,
            length: ship.length,
            type: ship.type
        }
    });
}

export function areShipsGenerated(currentGameIndex) {
    return Boolean(games[currentGameIndex].idPlayers[0].shipData) && Boolean(games[currentGameIndex].idPlayers[1].shipData);
}

export function getEnemyShips(attackData, firstPlayerGameId, currentGameIndex) {
    return attackData.indexPlayer === firstPlayerGameId ? games[currentGameIndex].idPlayers[1].shipData : games[currentGameIndex].idPlayers[0].shipData;
}

export function getIndexOfShip(ships, attackData) {
    return ships.findIndex((ship) => ship.positions.findIndex((position) => (position.x === attackData.x) && (position.y === attackData.y) && (position.isShooted === false)) !== -1);
}

export function getAlreadyShotIndex(ships, attackData) {
    return ships.findIndex((ship) => ship.positions.findIndex((position) => (position.x === attackData.x) && (position.y === attackData.y) && (position.isShooted === true)) !== -1);
}

export function isGameFinished(ships) {
    const restShips = ships.filter((ship) => {
        const notFinishedIndex = ship.positions.findIndex((position) => position.isShooted === false);
        return notFinishedIndex !== -1;
    });
    return restShips.length === 0;
}

export function makeAttack(ships, foundShipIndex, attackData) {
    const currPositionIndex = ships[foundShipIndex].positions.findIndex((position) => position.x === attackData.x && position.y === attackData.y);
    ships[foundShipIndex].positions[currPositionIndex].isShooted = true;
    return ships[foundShipIndex].positions.some((position) => position.isShooted === false) ? 'shot' : 'killed';
}