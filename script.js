const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const readline = require('readline');
const packageDefinition = protoLoader.loadSync('./src/chat/chat.proto', {});
const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

const client = new chatProto.ChatService('localhost:50051', grpc.credentials.createInsecure());
const gameClient = new chatProto.GameService('localhost:50051', grpc.credentials.createInsecure());

let room_id;

let user_id;

let messagesContainer;

let chat_stream;

let game_stream;

let host;

function createRoom(roomNumber) {
	client.CreateRoom({ roomId: roomNumber, userId: user_id }, (error, response) => {
		if (error) {
			console.error('Error creating room:', error.message);
		} else {
			console.log(response)
			room_id = response.roomId;
			startChat(user_id, room_id, false);
		}
	});
}

function joinRoom(roomNumber, user_id) {
	client.JoinRoom({ roomId: roomNumber, userId: user_id }, (error, response) => {
		if (error) {
			console.error('Error joining room:', error.message);
		} else if (response.success) {
			host = response.host;
			console.log(`Joined room: ${roomNumber}`);
			startChat(user_id, response.roomId, true);
		}
	});
}

function sendMessage(user_id, room_id, message) {
	console.log("Calling SendMessage");
	console.log({ userId: user_id, roomId: room_id, message })
	chat_stream.write({ userId: user_id, roomId: room_id, message })
}

const portsInGame = [];

let first = false

function startChat(user_id, room_id, second) {
	chat_stream = client.Chat();

	chat_stream.write({ userId: user_id, roomId: room_id, message: "i" })

	chat_stream.on('data', (message) => {
		console.log("RECIEVING INPUT");
		console.log(message);
		if (message.userId === "System") {
			console.log(message)
			generateMenuInit(user_id);
			return;
		}

		console.log(message);
		if (!first && message.message === "i") {
			first = true;
			return;
		}
		processChatInput(message.userId, message.message, messagesContainer)
	});
}


const Peer = require("./Peer");
const uuid = require('uuid');
let table = document.querySelector("#table")
let timeMe = true //true:bottom(black), false: top(white)
let pieceMe = true //true:black, false:white
// console.log(pieces)

let turn;

class Client {
	constructor(port, id, peer) {
		this.port = port;
		this.id = id;
		this.peer = peer;
	}
}

let chatStream; // gRPC chat stream
let boardStream; // gRPC board stream

const proto = grpc.loadPackageDefinition(
	protoLoader.loadSync("game.proto", {
		keepCase: true,
		longs: String,
		enums: String,
		defaults: true,
		oneofs: true
	})
);




let currentClient;
let enemyClient;
function convertBoardToArray(board) {
	const arrayBoard = [];
	for (const col of board.cols) {
		const arrayCol = [];
		for (const row of col.rows) {
			arrayCol.push(row || 0); // Se o valor for nulo, substitui por 0
		}
		arrayBoard.push(arrayCol);
	}
	return arrayBoard;
}

function convertArrayToBoard(arrayBoard) {
	const board = { cols: [] };
	for (const col of arrayBoard) {
		const rows = [];
		for (const cell of col) {
			rows.push(cell); // Adiciona o valor da célula ao array de rows
		}
		board.cols.push({ rows }); // Adiciona o array de rows ao objeto cols
	}
	return board;
}
// Function to start a game
function startGame(roomId, userId) {
	const game_stream = gameClient.StartGame();

	generateChat()
	// Handle incoming messages from the server
	game_stream.on('data', function (response) {
		console.log("response >>>")
		console.log(response);
		if (response.success) {
			initialBoard = convertBoardToArray(response.board)
			if (response.checkWinner) {
				alert(`${turn} venceu`)
				cleanupBoard()
				generateMenu()
				return
			}
			if (response.checkGiveUp) {
				alert(`${turn} venceu, oponente se rendeu`)
				cleanupBoard()
				generateMenu()
				return
			}
			turn = response.turn;
			generateBoard(initialBoard)
		} else {
			console.error("Failed to start game:", response.message);
		}
	});

	// Handle errors
	game_stream.on('error', function (error) {
		console.error("An error occurred:", error.message);
	});

	// Handle stream end - server closes the stream
	game_stream.on('end', function () {
		console.log("Stream ended by the server");
	});

	// Send a request to start the game
	game_stream.write({ roomId: roomId, userId: userId });
}

function generateBtn(portHost, divElement) {
	const divContainer = document.createElement("div");
	divContainer.classList.add("center")
	const initGameBtn = document.createElement("button");
	initGameBtn.type = "button";
	initGameBtn.id = "createServerPortButton";
	initGameBtn.textContent = "Iniciar Jogo - Definir Turno";
	initGameBtn.disabled = user_id === portHost ? false : true;
	initGameBtn.classList.add("btn")
	initGameBtn.addEventListener("click", (e) => {
		console.log("Iniciando Jogo")
		e.preventDefault()
		const turnDefine = defineTurn(portsInGame, room_id)
		startGame(room_id, user_id, turnDefine);
		// gameClient.StartGame({ roomId: room_id, userId: user_id }, (err, response) => {
		// 	let initialBoard = convertBoardToArray(response.board);
		// 	turn = turnDefine;
		// 	generateBoard(initialBoard)
		// 	generateChat()
		// })

		// Criar a Stream do Jogo para o host e o outro cara
		// Vai enviar uma chamada para o server
		// O server vai passar por todos os usuários e gerar uma stream de jogo e retornar para cara um

		//currentClient.peer.broadcastMessage({ type: "turn", message: turnDefine })
		//cleanupBoard()
		// generateBoard(initialBoard)
		// generateChat()
	})
	divContainer.appendChild(initGameBtn)
	divElement.appendChild(divContainer)
}

function generateMenuInit(portHost) {
	const divElement = document.getElementById("table"); //
	while (divElement.firstChild) {
		divElement.removeChild(divElement.firstChild);
	}

	generateBtn(portHost, divElement)
}

let initialBoard = [
	[null, null, 0, 0, 0, null, null,],
	[null, null, 0, 0, 0, null, null,],
	[0, 0, 0, 0, 0, 0, 0,],
	[0, 0, 0, 0, 1, 1, 0,],
	[0, 0, 0, 0, 0, 0, 0,],
	[null, null, 0, 0, 0, null, null,],
	[null, null, 0, 0, 0, null, null,],
]

initialBoard = [
	[null, null, 1, 1, 1, null, null,],
	[null, null, 1, 1, 1, null, null,],
	[1, 1, 1, 1, 1, 1, 1,],
	[1, 1, 1, 0, 1, 1, 1,],
	[1, 1, 1, 1, 1, 1, 1,],
	[null, null, 1, 1, 1, null, null,],
	[null, null, 1, 1, 1, null, null,],
]


function cleanupBoard() {
	const container = document.querySelector('#table')
	const turn = document.querySelector('#turn')
	while (turn.firstChild) {
		turn.removeChild(turn.firstChild)
	}
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
	const chat = document.querySelector('#chat')
	while (chat.firstChild) {
		chat.removeChild(chat.firstChild)
	}
	const giveup = document.querySelector('#giveup')
	while (giveup.firstChild) {
		giveup.removeChild(giveup.firstChild)
	}
}

function cleanupBoardWithoutChat() {
	const container = document.querySelector('#table')
	const turn = document.querySelector('#turn')
	while (turn.firstChild) {
		turn.removeChild(turn.firstChild)
	}
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
	const giveup = document.querySelector('#giveup')
	while (giveup.firstChild) {
		giveup.removeChild(giveup.firstChild)
	}
}


function generateBoard(boardArray) {

	cleanupBoardWithoutChat()

	const turnElement = document.getElementById("turn"); //
	const turnTitle = document.createElement('p')
	turnTitle.textContent = `Turno Atual: ${turn}`

	const playerTitle = document.createElement('p')
	playerTitle.textContent = `Você é: ${user_id}`

	turnElement.appendChild(turnTitle)
	turnElement.appendChild(playerTitle)
	turnElement.classList.add("active")



	for (let row of boardArray) {
		const rowElement = document.createElement('div');
		rowElement.classList.add('row');

		for (let cell of row) {
			const columnElement = document.createElement('div');
			columnElement.classList.add('column');

			if (cell === 1) {
				const pieceElement = document.createElement('div');
				pieceElement.classList.add('piece');
				columnElement.appendChild(pieceElement);
			} else if (cell === 0) {
				const pieceElement = document.createElement('div');
				pieceElement.classList.add('empty');
				columnElement.appendChild(pieceElement);
			} else {
				columnElement.classList.add('black');
			}

			rowElement.appendChild(columnElement);
		}

		table.appendChild(rowElement);
	}

	let pieces = table.querySelectorAll(".piece")
	let emptyPlaces = table.querySelectorAll(".empty")
	let selected = false;
	let lastSelected = ""

	let currentPosSelected
	let newPos

	pieces.forEach(function (piece, index, array) {
		piece.addEventListener("click", function () {
			// pieces.forEach(function(_piece, _index, _array) {
			let parent = piece.parentElement
			let parentClasses = parent.classList
			let parentParent = parent.parentElement

			let row = getChildNumber(parentParent)
			let column = getChildNumber(parent)
			// Aqui dentro vai haver uma função para validar o movimento e caso seja valido executar e fazer o broadcast do novo estado do board para no outro cliente refazer o board.
			if (isPieceItemBoard(row, column, initialBoard)) {
				if (selected) {
					lastSelected.classList.remove("selected")
					lastSelectedParent.remove("selected")
					lastSelected = piece
					lastSelectedParent = parentClasses
					parentClasses.add("selected")
					piece.classList.add("selected")
				}
				if (!selected) {
					lastSelected = piece
					lastSelectedParent = parentClasses
					selected = true;
					currentPosSelected = [row, column]
					parentClasses.add("selected")
					piece.classList.add("selected")
				}
			}
		})
	})
	emptyPlaces.forEach(function (empty, index, array) {
		empty.addEventListener("click", function () {
			console.log("AQUI clicando")
			if (selected) {
				console.log("AQUI")
				let parent2 = empty.parentElement
				let parentClasses2 = parent2.classList
				let parentParent2 = parent2.parentElement

				let row = getChildNumber(parentParent2)
				let column = getChildNumber(parent2)
				console.log("Row, Column")
				console.log(row, column) //

				newPos = [row, column]
				console.log(verifyValidMove(turn, currentPosSelected, newPos))
				if (verifyValidMove(turn, currentPosSelected, newPos)) {
					move(currentPosSelected, newPos)
					currentPosSelected = []
					newPos = []
					selected = false;
				} else {
					selected = false
					currentPosSelected = []
					newPos = []
					lastSelected.classList.remove("selected")
					lastSelectedParent.remove("selected")

					lastSelected = ""
					lastSelectedParent = ""
				}
			}
		})
	})

	const giveup = document.querySelector('#giveup')
	const btnGiveUp = document.createElement('button');
	btnGiveUp.type = "button";
	btnGiveUp.id = "giveupBtn";
	btnGiveUp.textContent = "Desistir";
	btnGiveUp.classList.add("btn")
	btnGiveUp.addEventListener("click", (e) => {
		e.preventDefault()

		gameClient.giveGame({ userId: user_id, roomId: room_id }, (err, response) => {
			alert(`${user_id} desistiu`)
		})

		cleanupBoard()
		initialBoard = [
			[null, null, 1, 1, 1, null, null,],
			[null, null, 1, 1, 1, null, null,],
			[1, 1, 1, 1, 1, 1, 1,],
			[1, 1, 1, 0, 1, 1, 1,],
			[1, 1, 1, 1, 1, 1, 1,],
			[null, null, 1, 1, 1, null, null,],
			[null, null, 1, 1, 1, null, null,],

		]
		generateMenu()
	})
	giveup.appendChild(btnGiveUp)


	return table;
}


function changePlayer() {
	if (timeMe === true) {
		timeMe = false;
	}
	else {
		timeMe = true;
	}
}

function get(board, x, y) {
	return board[x][y]
}

function isPieceItemBoard(x, y, board) {
	let piece = get(board, x, y)
	if (piece == 1) {
		return true;
	}
	return false
}


function getChildNumber(node) {
	return Array.prototype.indexOf.call(node.parentNode.children, node)
}


// Menu
// Id Player => Generate randomly
// NamePlayer => Must be not blank
// StartServer => Starts a game on the port passed
// JoinServer => Recieves the ip of the host
let idPlayer
let namePlayer
let enemyNamePlayer
let enemyIdPlayer

function enableButtons() {
	const namePlayerInput = document.getElementById("namePlayer");
	const createServerButton = document.getElementById("createServerButton");
	const joinServerButton = document.getElementById("joinServerButton");

	if (namePlayerInput.value.trim() !== "") {
		createServerButton.disabled = false;
		joinServerButton.disabled = false;
	} else {
		createServerButton.disabled = true;
		joinServerButton.disabled = true;
	}
}


function defineTurn(ports) {
	return Math.random() < 0.5 ? ports[0] : ports[1];
}

function initGame() {
	const divElement = document.getElementById("table"); //
	while (divElement.firstChild) {
		divElement.removeChild(divElement.firstChild);
	}
	generateBoard(initialBoard)
	generateChat()
}

function createServer(createServerButton, joinServerButton) {

	function enableButton() {
		const portServerInput = document.getElementById("serverPort");
		console.log(portServerInput.value);
		if (portServerInput.value.trim() !== "") {
			createServerBtn.disabled = false;
		}
	}

	// Adicione aqui a lógica para criar o servidor

	// Remover botões e input de nome do jogador
	const form = document.getElementById("serverForm");
	form.removeChild(createServerButton);
	form.removeChild(joinServerButton);

	// Adicionar input para a porta
	const portLabel = document.createElement("label");
	portLabel.setAttribute("for", "serverPort");
	portLabel.textContent = "Número da Sala:";
	form.appendChild(portLabel);

	const serverPortInput = document.createElement("input");
	serverPortInput.type = "text";
	serverPortInput.id = "serverPort";
	serverPortInput.name = "serverPort";
	serverPortInput.addEventListener("input", enableButton)
	form.appendChild(serverPortInput);

	// Adicionar input para a porta
	const userIdLabel = document.createElement("label");
	userIdLabel.setAttribute("for", "serverPort");
	userIdLabel.textContent = "Seu Nome:";
	form.appendChild(userIdLabel);

	const userIdInput = document.createElement("input");
	userIdInput.type = "text";
	userIdInput.id = "userName";
	userIdInput.name = "userName";
	userIdInput.addEventListener("input", enableButton)
	form.appendChild(userIdInput);

	const createServerBtn = document.createElement("button");
	createServerBtn.type = "button";
	createServerBtn.id = "createServerPortButton";
	createServerBtn.textContent = "Criar";
	createServerBtn.disabled = true;
	createServerBtn.classList.add("btn")
	createServerBtn.addEventListener("click", () => {

		const portNumber = serverPortInput.value;
		user_id = userIdInput.value;

		createRoom(portNumber)

		// const intervalo = setInterval(function () {
		// 	if (peer.connections.length !== 0 && peer.knownHosts.length !== 0) {
		// 		generateMenuInit(portNumber);
		// 		createServerBtn.disabled = false;
		// 		rollBack.disabled = true;
		// 		// Remova o intervalo
		// 		clearInterval(intervalo);
		// 	}
		// }, 1000);

		createServerBtn.disabled = true;
		rollBack.disabled = true;


	})
	form.appendChild(createServerBtn);

	const rollBack = document.createElement("button");
	rollBack.type = "button";
	rollBack.id = "rollBack";
	rollBack.textContent = "Voltar";
	rollBack.disabled = false;
	rollBack.classList.add("btn")
	rollBack.addEventListener('click', () => {

		cleanupBoard()
		generateMenu()

		createServerBtn.disabled = false;
		rollBack.disabled = false;
	})
	form.appendChild(rollBack);
}


function joinServer(createServerButton, joinServerButton) {

	function enableButton() {
		const portServerInput = document.getElementById("serverAddress");
		console.log(portServerInput.value);
		if (portServerInput.value.trim() !== "") {
			joinServerBtn.disabled = false;
		}
	}

	// Adicione aqui a lógica para ingressar em um servidor

	// Remover botões e input de nome do jogador
	const form = document.getElementById("serverForm");
	form.removeChild(createServerButton);
	form.removeChild(joinServerButton);

	// Adicionar input para o endereço do servidor
	const addressLabel = document.createElement("label");
	addressLabel.setAttribute("for", "serverAddress");
	addressLabel.textContent = "Número da Sala:";
	form.appendChild(addressLabel);

	const serverAddressInput = document.createElement("input");
	serverAddressInput.type = "text";
	serverAddressInput.id = "serverAddress";
	serverAddressInput.name = "serverAddress";
	serverAddressInput.addEventListener("input", enableButton)
	form.appendChild(serverAddressInput);

	// Adicionar input para o endereço do servidor
	const userIdLabel = document.createElement("label");
	userIdLabel.setAttribute("for", "serverAddress");
	userIdLabel.textContent = "Seu Nome:";
	form.appendChild(userIdLabel);

	const userIdInput = document.createElement("input");
	userIdInput.type = "text";
	userIdInput.id = "userIdInput";
	userIdInput.name = "userIdInput";
	userIdInput.addEventListener("input", enableButton)
	form.appendChild(userIdInput);

	const joinServerBtn = document.createElement("button");
	joinServerBtn.type = "button";
	joinServerBtn.id = "createServerPortButton";
	joinServerBtn.textContent = "Logar";
	joinServerBtn.disabled = true;
	joinServerBtn.classList.add("btn")
	joinServerBtn.addEventListener("click", () => {


		const portNumber = serverAddressInput.value;
		room_id = portNumber;
		user_id = userIdInput.value;

		joinRoom(room_id, user_id);
		const intervalId = setInterval(() => {
			console.log("Intervalo")
			gameClient.verifyStatus({ roomId: room_id }, (err, response) => {
				console.log(response);
				if (err) {
					console.error('Error verifying status:', err);
					// Optionally clear the interval if an error occurs or under certain conditions
					// clearInterval(intervalId);
				} else if (response.success) {
					startGame(room_id, user_id);
					// If you want to stop verifying after success, clear the interval like this:
					clearInterval(intervalId);
				}
			});
		}, 4000); // 1000 milliseconds = 1 second

		generateMenuInit(host);




	})
	form.appendChild(joinServerBtn);

	const rollBack = document.createElement("button");
	rollBack.type = "button";
	rollBack.id = "rollBack";
	rollBack.textContent = "Voltar";
	rollBack.disabled = false;
	rollBack.classList.add("btn")
	rollBack.addEventListener('click', () => {
		cleanupBoard()
		generateMenu()
	})
	form.appendChild(rollBack);
}
function generateMenu() {

	const form = document.createElement("form");
	form.classList.add("menu")
	form.id = "serverForm";

	const createServerButton = document.createElement("button");
	createServerButton.type = "button";
	createServerButton.id = "createServerButton";
	createServerButton.textContent = "Criar Servidor";
	createServerButton.classList.add("btn")
	form.appendChild(createServerButton);

	const joinServerButton = document.createElement("button");
	joinServerButton.type = "button";
	joinServerButton.id = "joinServerButton";
	joinServerButton.textContent = "Ingressar em um Servidor";
	joinServerButton.classList.add("btn")

	createServerButton.addEventListener("click", () => createServer(createServerButton, joinServerButton));
	joinServerButton.addEventListener("click", () => joinServer(createServerButton, joinServerButton));


	form.appendChild(joinServerButton);

	table.appendChild(form);

}



function processChatInput(id, chatInput, chatElement) {
	const messageElement = document.createElement('div');
	messageElement.classList.add('message');
	const messageContent = document.createElement('span');
	messageContent.textContent = `${id}: ${chatInput}`
	if (user_id !== id) {
		messageContent.classList.add('enemy')
	} else {
		messageContent.classList.add('player')
	}
	messageElement.appendChild(messageContent)
	chatElement.appendChild(messageElement)
	chatElement.scrollTop = chatElement.scrollHeight;
}

// pieces.forEach(function(piece, index, array) {
function generateChat() {

	const chat = document.querySelector("#chat")
	const chatContainer = document.createElement('div');
	chatContainer.classList.add('chat');

	messagesContainer = document.createElement('div');
	messagesContainer.classList.add('messages-container');


	const chatInput = document.createElement("input");
	chatInput.type = "text";
	chatInput.id = "chatInput";
	chatInput.name = "Chat Input";
	chatInput.placeholder = "Escreva Aqui"; // Adiciona o texto de ajuda

	// Adiciona um evento para escutar o pressionar do ENTER
	// Aqui dentro vai ter uma função para fazer o broadcast da mensagem para aparecer no outro cliente
	chatInput.addEventListener("keypress", function (event) {
		if (event.key === "Enter") {
			event.preventDefault();

			console.log(user_id)
			console.log(room_id);
			console.log(chatInput.value);
			sendMessage(user_id, room_id, chatInput.value);
			processChatInput(user_id, chatInput.value, messagesContainer);
			chatInput.value = ""; // Limpa o campo de entrada após o processamento
		}
	});
	chatContainer.appendChild(messagesContainer);
	chatContainer.appendChild(chatInput);

	chat.appendChild(chatContainer)
}


function verifyWinner() {
	let sum = 0
	initialBoard.forEach((value) => {
		value.forEach((piece) => {
			if (piece == 0 || piece == 1) {
				sum += piece
			}
		})
	})
	console.log(sum)
	if (sum == 1) {
		return true;
	}
}

//generateBoard(initialBoard)

//generateChat()

function move(currentPos, newPos) {
	// Move horizontally
	if (currentPos[0] - newPos[0] == 0) {
		const index = (((currentPos[1] - newPos[1]) > 0) ? -1 : 1);
		const intermediate = currentPos[1] + (index);
		if ((initialBoard[currentPos[0]][intermediate] == 1) && (initialBoard[newPos[0]][newPos[1]] == 0)) {
			update(currentPos, newPos, [currentPos[0], intermediate]) // Move the piece and remove the jumped piece
		}
	}

	// Move vertically
	if (currentPos[1] - newPos[1] == 0) {
		const index = ((currentPos[0] - newPos[0]) > 0) ? -1 : 1;
		const intermediate = currentPos[0] + (index);
		if ((initialBoard[intermediate][newPos[1]] == 1) && (initialBoard[newPos[0]][newPos[1]] == 0)) {
			update(currentPos, newPos, [intermediate, currentPos[1]]) // Move the piece and remove the jumped piece
		}
	}
}

function update(currentPos, newPos, intermediate) {

	initialBoard[currentPos[0]][currentPos[1]] = 0;
	initialBoard[newPos[0]][newPos[1]] = 1;
	initialBoard[intermediate[0]][intermediate[1]] = 0;

	if (verifyWinner()) {
		gameClient.sendVictory({ roomId: room_id, userId: user_id, winner: user_id, board: convertArrayToBoard(initialBoard) }, (err, response) => { })
		cleanupBoard()
		generateMenu()
		return;
	}

	gameClient.sendMove({ roomId: room_id, userId: user_id, board: convertArrayToBoard(initialBoard) }, (err, response) => { })
	return;

}

function verifyValidMove(turn, currentPos, newPos) {
	console.log("VERIFICANDO MOVIMENTO")
	console.log(turn)
	if (parseInt(user_id) !== parseInt(turn)) {
		return false;
	}
	console.log("Passou")
	if (currentPos[0] - newPos[0] == 0) {
		const index = (((currentPos[1] - newPos[1]) > 0) ? -1 : 1);
		const intermediate = currentPos[1] + (index);
		console.log(intermediate)
		console.log((initialBoard[currentPos[0]][intermediate] == 1) && (initialBoard[newPos[0]][newPos[1]] == 0))
		if ((initialBoard[currentPos[0]][intermediate] == 1) && (initialBoard[newPos[0]][newPos[1]] == 0)) {
			return true;
		}
		console.log("Retornando Invalido movimento")
		return false;
	}

	// Move vertically
	if (currentPos[1] - newPos[1] == 0) {
		const index = ((currentPos[0] - newPos[0]) > 0) ? -1 : 1;
		const intermediate = currentPos[0] + (index);
		if ((initialBoard[intermediate][newPos[1]] == 1) && (initialBoard[newPos[0]][newPos[1]] == 0)) {
			return true;
		}
		console.log("Retornando Invalido movimento")
		return false;
	}
}

generateMenu();

