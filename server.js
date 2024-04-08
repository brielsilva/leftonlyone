const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const packageDef = protoLoader.loadSync("game.proto", {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const grpcObject = grpc.loadPackageDefinition(packageDef);

const package = grpcObject.gamePackage;

const server = new grpc.Server();

const users = [];

function newBoard(call, callback) {

}

function sendEndTurn(call, callback) {

}

function sendGiveUp(call, callback) {

}

function join(call, callback) {
    users.push(call);
}

//Receive message from client
function send(call, callback) {
    notifyChat(call.request);
}

//Send message to all connected clients
function notifyChat(message) {
    users.forEach(user => {
        user.write(message);
    });
}

// [0, 0, 0, 0, 0, 0, 0,],
//                 [0, 0, 0, 0, 1, 1, 0,],
//                 [0, 0, 0, 0, 0, 0, 0,],
//                 [null, null, 0, 0, 0, null, null,],
//                 [null, null, 0, 0, 0, null, null,],
let initialBoard = [
    [null, null, 0, 0, 0, null, null,],
    [null, null, 0, 0, 0, null, null,],
    [0, 0, 0, 0, 0, 0, 0,],
    [0, 0, 0, 0, 1, 1, 0,],
    [0, 0, 0, 0, 0, 0, 0,],
    [null, null, 0, 0, 0, null, null,],
    [null, null, 0, 0, 0, null, null,],
]
function newGame(call, callback) {
    const response = {
        board: {
            cols: [
                { rows: [null, null, 1, 1, 1, null, null,] },
                { rows: [null, null, 1, 1, 1, null, null,], },
                { rows: [1, 1, 1, 1, 1, 1, 1,], },
                { rows: [1, 1, 1, 0, 1, 1, 1,], },
                { rows: [1, 1, 1, 1, 1, 1, 1,], },
                { rows: [null, null, 1, 1, 1, null, null,], },
                { rows: [null, null, 1, 1, 1, null, null,], }
            ]
        }
    };
    callback(null, response);
}
//Define server with the methods and start it
server.addService(package.GameAndChat.service,
    {
        newBoard: newBoard,
        sendEndTurn: sendEndTurn,
        sendGiveUp: sendGiveUp,
        newGame: newGame,
        join: join,
        send: send,
    }
);



// module.exports = server;

const SERVER_ADDRESS = "0.0.0.0:3000"

server.bindAsync(SERVER_ADDRESS, grpc.ServerCredentials.createInsecure(), () => {
});

console.log("Server started on Port 3000");
