const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('chat.proto', {});
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

const server = new grpc.Server();
// Enhanced rooms structure to include user streams
const rooms = {}; // Example: { roomId: { messages: [], users: { userId: call } } }
const games = {};

server.addService(chatProto.ChatService.service, {
    CreateRoom: (call, callback) => {
        console.log(call.request);
        const { roomId, userId } = call.request; // Changed to camelCase
        // Initialize room with no messages and an empty users object
        if (!rooms[roomId]) {
            rooms[roomId] = { messages: [], users: { [userId]: null } }; // Room Chat
            games[roomId] = { board: {}, users: { [userId]: null } }; // Room Game
            console.log(`Room ${roomId} created by User ${userId}`); // Changed to camelCase
            return callback(null, { roomId: roomId });
        } else {
            return callback({ code: grpc.status.ALREADY_EXISTS, message: "Room already exists" });
        }

    },
    JoinRoom: (call, callback) => {
        const { roomId, userId } = call.request; // Changed to camelCase
        console.log(roomId)
        if (!rooms[roomId]) { // Changed to camelCase
            return callback(new Error("Room does not exist."));
        }
        console.log("aqui")
        if (!rooms[roomId].users[userId]) { // Changed to camelCase
            // console.log("Aqui dentro")
            // // Add the user's call to the room
            // console.log(rooms[roomId].users[userId])
            rooms[roomId].users[userId] = null; // Changed to camelCase
            // console.log(rooms[roomId].users[userId])
            games[roomId].users[userId] = null;
            // // Notify other users in the room
            // const joinMessage = {
            //     userId: "System", // Changed to camelCase
            //     roomId: roomId, // Changed to camelCase
            //     message: userId,
            // };
            // for (let currentUserId in rooms[roomId].users) {
            //     if (currentUserId !== userId) {
            //         console.log(currentUserId)
            //         rooms[roomId].users[currentUserId].write(joinMessage);
            //     }
            // }
            // let host;
            console.log(rooms[roomId]);
            Object.entries(rooms[roomId].users).forEach(([user, userCall]) => {
                if (user !== userId && userCall) { // Check if the current userId is not the sender's ID
                    host = user;
                    userCall.write({ userId: "System" })
                }
            });
            callback(null, { success: true, host: host, roomId: roomId });
        }
    },
    Chat: (call) => {
        call.on('data', (message) => {
            console.log("Calling .write on client?");
            console.log(message);
            const { roomId, userId, message: chatMessage } = message;

            // Ensure the room exists
            if (!rooms[roomId]) {
                console.error(`Room ${roomId} does not exist.`);
                return;
            }

            // If this is the first time the user sends a message in this room, set their stream
            if (!rooms[roomId].users[userId]) {
                console.log(message);
                if (userId === "System") {
                    return;
                }
                rooms[roomId].users[userId] = call;
                console.log(`User ${userId} added to room ${roomId}.`);
                // Broadcast that the user has joined, excluding the new user
                broadcastMessage(roomId, { userId: "System", message: userId }, userId);
            }

            // Broadcast the received message to all users in the room except the sender
            console.log("broadcastMessage");
            broadcastMessage(roomId, message, userId);
        });

        call.on('end', () => {
            // Handle user leaving (you need to track which room and user ID this call is associated with)
            console.log(`Stream ended`);
            // Assuming you've tracked the room and user, you can now broadcast the user has left, excluding the user
            // This requires additional logic to identify the correct roomId and userId on stream end
        });
    }
});

function broadcastMessage(roomId, message, senderId) {

    const room = rooms[roomId];

    console.log(room);

    if (!room) return;

    Object.entries(room.users).forEach(([userId, userCall]) => {
        console.log(userId)
        if (userId !== senderId && userCall) { // Check if the current userId is not the sender's ID
            console.log("WRITING");
            userCall.write(message);
        }
    });
}


function broadcastMove(roomId, move) {
    // Transmite o movimento para todos os ouvintes na stream de movimentação
    games[roomId].streams.move.forEach(call => call.write(move));
}

function broadcastGiveUp(roomId, giveUpMessage) {
    // Transmite a desistência para todos os ouvintes na stream de desistência
    games[roomId].streams.giveUp.forEach(call => call.write(giveUpMessage));
}

function defineTurn(ports) {
    return Math.random() < 0.5 ? ports[0] : ports[1];
}

function switchTurn(currentTurn, users) {
    // Get all user IDs in the game
    const userIds = Object.keys(users);

    // Assuming there are only two players in each game,
    // find the other player's ID and return it.
    const nextTurn = userIds.find(userId => userId !== currentTurn);

    return nextTurn;
}

server.addService(chatProto.GameService.service, {

    StartGame: (call) => {
        let roomId;
        call.on('data', (request) => {
            roomId = request.roomId; // Assume the request has roomId
            const userId = request.userId; // Assume the request has userId

            if (!games[roomId]) {
                console.error(`Room ${roomId} does not exist.`);
                call.write({ success: false, message: "Room does not exist." });
                call.end();
                return;
            }

            // Verify both players are part of the room
            if (Object.keys(games[roomId].users).includes(userId)) {
                // Initialize player's stream for game updates
                games[roomId].users[userId] = call;

                console.log(`Player ${userId} is ready to start the game in room ${roomId}`);

                // Check if both players are connected and ready
                games[roomId].board = {
                    cols: [
                        { rows: [null, null, 0, 0, 0, null, null,] },
                        { rows: [null, null, 0, 0, 0, null, null,], },
                        { rows: [0, 0, 0, 0, 0, 0, 0,], },
                        { rows: [0, 0, 0, 0, 1, 1, 0,], },
                        { rows: [0, 0, 0, 0, 0, 0, 0,], },
                        { rows: [null, null, 0, 0, 0, null, null,], },
                        { rows: [null, null, 0, 0, 0, null, null,], }
                    ]
                }
                // games[roomId].board = {
                //     cols: [
                //         { rows: [null, null, 1, 1, 1, null, null,] },
                //         { rows: [null, null, 1, 1, 1, null, null,], },
                //         { rows: [1, 1, 1, 1, 1, 1, 1,], },
                //         { rows: [1, 1, 1, 0, 1, 1, 1,], },
                //         { rows: [1, 1, 1, 1, 1, 1, 1,], },
                //         { rows: [null, null, 1, 1, 1, null, null,], },
                //         { rows: [null, null, 1, 1, 1, null, null,], }
                //     ]
                // }
                games[roomId].status = "waiting";
                if (Object.values(games[roomId].users).every(user => user !== null)) {
                    const ports = []
                    Object.entries(games[roomId].users).forEach(([userId, userCall]) => { ports.push(userId) })
                    const turn = defineTurn(ports)
                    games[roomId].turn = turn

                    // Notify both players to start the game with the initial board state
                    Object.values(games[roomId].users).forEach(playerCall => {
                        games[roomId].status = "playing";
                        playerCall.write({ success: true, board: games[roomId].board, turn: games[roomId].turn });
                    });
                }
            } else {
                console.error(`Player ${userId} is not part of room ${roomId}.`);
                call.write({ success: false, message: "Player is not part of the room." });
                call.end();
            }
        });

        call.on('end', () => {
            // Handle disconnection
            console.log(`Player stream ended for game in room ${roomId}`);
            // Optionally, you can handle cleanup or game pause logic here
        });
    },

    verifyStatus: (call, callback) => {
        console.log(!games[call.request.roomId]);
        console.log(games[call.request.roomId])
        if (games[call.request.roomId]) {
            console.log(games[call.request.roomId]);
            if (games[call.request.roomId].status === "waiting") {
                return callback(null, { success: true })
            }
            return callback(null, { success: false })
        }
    },

    SendTurn: (call, callback) => {
        const { roomId, nextUserId, userId } = call.request;
        if (games[roomId]) {
            games[roomId].currentTurn = nextUserId;
            callback(null, { success: true, message: "Turno atualizado." });
        } else {
            callback(new Error("Jogo não encontrado."));
        }
    },

    sendMove: (call, callback) => {
        console.log("Sending Move");
        const { roomId, userId, board } = call.request;
        console.log(games[roomId])
        if (!games[roomId]) {
            console.error(`Room ${roomId} does not exist.`);
            callback(null, { success: false, message: "Room does not exist." });
            return;
        }

        if (!Object.keys(games[roomId].users).includes(userId)) {
            console.error(`Player ${userId} is not part of room ${roomId}.`);
            callback(null, { success: false, message: "Player is not part of the room." });
            return;
        }

        if (games[roomId].turn !== userId) {
            console.error(`It's not player ${userId}'s turn.`);
            callback(null, { success: false, message: "Not your turn." });
            return;
        }

        console.log("ALL CHECKED");

        // Update the game board
        games[roomId].board = board;

        console.log("Att Board");

        // Switch turns
        games[roomId].turn = switchTurn(games[roomId].turn, games[roomId].users);
        console.log("New Turn");
        console.log(games[roomId].turn)

        // Broadcast the new board state to all players
        Object.values(games[roomId].users).forEach(playerCall => {
            playerCall.write({ success: true, board: games[roomId].board, turn: games[roomId].turn });
        });

        callback(null, { success: true, message: "Move successful.", board: games[roomId].board });
    },

    giveGame: (call, callback) => {

        const { roomId, userId, board } = call.request;
        console.log(games[roomId])
        if (!games[roomId]) {
            console.error(`Room ${roomId} does not exist.`);
            callback(null, { success: false, message: "Room does not exist." });
            return;
        }

        if (!Object.keys(games[roomId].users).includes(userId)) {
            console.error(`Player ${userId} is not part of room ${roomId}.`);
            callback(null, { success: false, message: "Player is not part of the room." });
            return;
        }

        if (games[roomId].turn !== userId) {
            console.error(`It's not player ${userId}'s turn.`);
            callback(null, { success: false, message: "Not your turn." });
            return;
        }

        console.log("ALL CHECKED");

        // Update the game board
        games[roomId].board = {
            cols: [
                { rows: [null, null, 0, 0, 0, null, null,] },
                { rows: [null, null, 0, 0, 0, null, null,], },
                { rows: [0, 0, 0, 0, 0, 0, 0,], },
                { rows: [0, 0, 0, 0, 0, 0, 0,], },
                { rows: [0, 0, 0, 0, 0, 0, 0,], },
                { rows: [null, null, 0, 0, 0, null, null,], },
                { rows: [null, null, 0, 0, 0, null, null,], }
            ]
        }
        games[roomId].turn = switchTurn(userId, games[roomId].users);


        // Broadcast the new board state to all players
        Object.values(games[roomId].users).forEach(playerCall => {
            playerCall.write({ success: true, board: games[roomId].board, turn: games[roomId].turn, checkVictory: true });
        });

    },

    GiveUpStream: (call) => {
        call.on('data', (giveUp) => {
            const { roomId } = giveUp;
            broadcastGiveUp(roomId, giveUp);
            // Handle give up logic here
        });
        call.on('end', () => {
            call.end();
        });
    }
});


server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
    console.log('Server running at http://0.0.0.0:50051');
    server.start();
});
