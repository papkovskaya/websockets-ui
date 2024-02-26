export const players = [];
export const rooms = [];
export const winners = [];
export const games = [];
export let activeGamePlayerId;

export function addPlayer(jsonMessage, ws) {
    players.push({ ws, data: JSON.parse(jsonMessage.data) });
}

export function createRoom(ws) {
    const currentUserIndex = players.findIndex((player) => player.ws === ws);
    rooms.push({
        roomId: Math.random(),
        roomUsers: [{
            name: players[currentUserIndex].data.name,
            index: currentUserIndex
        }]
    });
}

export function createGameData(roomIndex) {
    const game = {
        idGame: Math.random(),
        roomId: rooms[roomIndex].roomId,
        idPlayers: [
            {
                gameId: Math.random(),
                currentUserIndex: rooms[roomIndex].roomUsers[0].index,
                shipData: null
            },
            {
                gameId: Math.random(),
                currentUserIndex: rooms[roomIndex].roomUsers[1].index,
                shipData: null
            }
        ]
    };
    games.push(game);
    return game;
}

export function addUserInActiveRoom(roomIndex, currentUserIndex) {
    rooms[roomIndex].roomUsers.push({
        name: players[currentUserIndex].data.name,
        index: currentUserIndex
    });
}

export function updateWinnersData(winPlayer) {
    const alreadyExistId = winners.findIndex((win) => win.id === activeGamePlayerId);
    if (alreadyExistId >= 0) {
        winners[alreadyExistId].wins += 1;
    } else {
        winners.push({
            wins: 1,
            name: winPlayer.data.name,
            id: activeGamePlayerId
        })
    }
}

export function updateActiveId(id) {
    activeGamePlayerId = id;
}