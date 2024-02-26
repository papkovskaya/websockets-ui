import { WebSocketServer } from 'ws';
import {
    addPlayer, players, rooms, games, winners, activeGamePlayerId,
    updateWinnersData, createRoom, addUserInActiveRoom, createGameData,
    updateActiveId
} from './db.js';
import {
    areShipsGenerated, getPlayersWSByRoomId, isUserIsNotInTheRoom, getPlayersWSById,
    getAlreadyShotIndex, getRoomIndexFromMessage, getCurrentPlayerIndex, generateShips,
    getEnemyShips, getIndexOfShip, makeAttack, isGameFinished, getPlayerByGameId
} from './game.util.js';

const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const jsonMessage = JSON.parse(message);

        switch (jsonMessage.type) {
            case 'reg':
                addPlayer(jsonMessage, ws);
                createPlayer(jsonMessage, ws);
                updateRoom(ws);
                updateWinners(ws);
                break;
            case 'create_room':
                createRoom(ws);
                players.forEach((player) => {
                    updateRoom(player.ws);
                });
                break;
            case 'add_user_to_room':
                const roomIndex = getRoomIndexFromMessage(jsonMessage);
                const currentUserIndex = getCurrentPlayerIndex(ws);
                if (isUserIsNotInTheRoom(roomIndex, currentUserIndex)) {
                    addUserInActiveRoom(roomIndex, currentUserIndex);
                    players.forEach((player) => {
                        updateRoom(player.ws);
                    });
                    const game = createGameData(roomIndex);
                    createGame(getPlayersWSById(roomIndex, 0), game.idGame, game.idPlayers[0].gameId);
                    createGame(getPlayersWSById(roomIndex, 1), game.idGame, game.idPlayers[1].gameId);
                }
                break;
            case 'add_ships':
                const shipData = JSON.parse(jsonMessage.data);
                const currentGameIndex = games.findIndex((game) => game.idGame === shipData.gameId);
                const currentPlayerIndex = games[currentGameIndex].idPlayers.findIndex((playerData) => playerData.gameId === shipData.indexPlayer);
                const parsedShips = generateShips(shipData.ships);
                games[currentGameIndex].idPlayers[currentPlayerIndex].shipData = parsedShips;
                games[currentGameIndex].idPlayers[currentPlayerIndex].rawShipsData = shipData.ships;

                if (areShipsGenerated(currentGameIndex)) {
                    const roomId = games[currentGameIndex].roomId;
                    startGame(getPlayersWSByRoomId(roomId, 0), games[currentGameIndex].idPlayers[0].rawShipsData, games[currentGameIndex].idPlayers[0].gameId);
                    startGame(getPlayersWSByRoomId(roomId, 1), games[currentGameIndex].idPlayers[1].rawShipsData, games[currentGameIndex].idPlayers[1].gameId);
                    updateActiveId(games[currentGameIndex].idPlayers[0].gameId);
                    turn(getPlayersWSByRoomId(roomId, 0), activeGamePlayerId);
                    turn(getPlayersWSByRoomId(roomId, 1), activeGamePlayerId);
                }
                break;
            case 'attack':
                const attackData = JSON.parse(jsonMessage.data);
                const gameIndex = games.findIndex((game) => game.idGame === attackData.gameId);
                const roomId = games[gameIndex].roomId;
                const firstPlayerGameId = games[gameIndex].idPlayers[0].gameId;
                const secondPlayerGameId = games[gameIndex].idPlayers[1].gameId;
                updateActiveId(attackData.indexPlayer);

                const ships = getEnemyShips(attackData, firstPlayerGameId, gameIndex);
                const foundShipIndex = getIndexOfShip(ships, attackData);
                const alreadyShotIndex = getAlreadyShotIndex(ships, attackData);

                if (foundShipIndex >= 0) {
                    const currentStatus = makeAttack(ships, foundShipIndex, attackData);
                    attack(getPlayersWSByRoomId(roomId, 0), activeGamePlayerId, currentStatus, { x: attackData.x, y: attackData.y });
                    attack(getPlayersWSByRoomId(roomId, 1), activeGamePlayerId, currentStatus, { x: attackData.x, y: attackData.y });

                    if (currentStatus === 'killed' && isGameFinished(ships)) {
                        const winPlayer = activeGamePlayerId === firstPlayerGameId ? getPlayerByGameId(attackData.gameId, 0) : getPlayerByGameId(attackData.gameId, 1);
                        finish(getPlayersWSByRoomId(roomId, 0), activeGamePlayerId);
                        finish(getPlayersWSByRoomId(roomId, 1), activeGamePlayerId);
                        updateWinnersData(winPlayer);
                        updateWinners(getPlayersWSByRoomId(roomId, 0));
                        updateWinners(getPlayersWSByRoomId(roomId, 1));
                    }
                } else if (alreadyShotIndex < 0) {
                    attack(getPlayersWSByRoomId(roomId, 0), activeGamePlayerId, 'miss', { x: attackData.x, y: attackData.y });
                    attack(getPlayersWSByRoomId(roomId, 1), activeGamePlayerId, 'miss', { x: attackData.x, y: attackData.y });
                    updateActiveId(attackData.indexPlayer === firstPlayerGameId ? secondPlayerGameId : firstPlayerGameId);
                }
                turn(getPlayersWSByRoomId(roomId, 0), activeGamePlayerId);
                turn(getPlayersWSByRoomId(roomId, 1), activeGamePlayerId);
                break;
            case 'randomAttack':
                // generate x, y
                // call attack
                break;
            default:
                break;
        }
    })
});

function createPlayer(jsonMessage, ws) {
    ws.send(JSON.stringify({
        type: "reg",
        data: JSON.stringify({
            name: JSON.parse(jsonMessage.data).name,
            index: players.length - 1,
            error: false,
            errorText: '',
        }),
        id: 0,
    }));
}

function updateRoom(ws) {
    ws.send(JSON.stringify({
        type: "update_room",
        data: JSON.stringify(rooms.filter((room => room.roomUsers.length === 1))),
        id: 0
    }));
}

function updateWinners(ws) {
    ws.send(JSON.stringify({
        type: "update_winners",
        data: JSON.stringify(winners),
        id: 0
    }));
}

function createGame(ws, idGame, idPlayer) {
    ws.send(JSON.stringify({
        type: "create_game",
        data: JSON.stringify({ idGame, idPlayer }),
        id: 0
    }));
}

function startGame(ws, ships, currentPlayerIndex) {
    ws.send(JSON.stringify({
        type: "start_game",
        data: JSON.stringify({ ships, currentPlayerIndex }),
        id: 0
    }));
}

function turn(ws, currentPlayer) {
    ws.send(JSON.stringify({
        type: "turn",
        data: JSON.stringify({ currentPlayer }),
        id: 0
    }));
}

function attack(ws, currentPlayer, status, position) {
    ws.send(JSON.stringify({
        type: "attack",
        data: JSON.stringify({ currentPlayer, status, position }),
        id: 0
    }));
}

function finish(ws, winPlayer) {
    ws.send(JSON.stringify({
        type: "finish",
        data: JSON.stringify({ winPlayer }),
        id: 0
    }));
}