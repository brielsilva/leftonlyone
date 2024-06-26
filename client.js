let grpc = require("grpc");
var protoLoader = require("@grpc/proto-loader");
var readline = require("readline");

//Read terminal Lines
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var proto = grpc.loadPackageDefinition(
    protoLoader.loadSync("game.proto", {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    })
);

const REMOTE_SERVER = "0.0.0.0:3000";

let username;

//Create gRPC client
let client = new proto.gamePackage.GameAndChat(
    REMOTE_SERVER,
    grpc.credentials.createInsecure()
);

//Start the stream between server and client
function startChat() {
    let channel = client.join({ user_id: username, send_to: '3000' });

    channel.on("data", onData);

    rl.on("line", function (text) {
        client.send({ user: username, text: text }, res => { });
    });
}

//When server send a message
function onData(message) {
    console.log(message);
    if (message.user == username) {
        return;
    }
    console.log(`${message.user}: ${message.text}`);
}

//Ask user name than start the chat
rl.question("What's ur name? ", answer => {
    username = answer;

    startChat();
});
