/**
*
* @Name : ChessDesktop/script.js
* @Version : 1.0
* @Programmer : Max
* @Date : 2019-05-23
* @Released under : https://github.com/BaseMax/ChessDesktop/blob/master/LICENSE
* @Repository : https://github.com/BaseMax/ChessDesktop
*
**/
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

let currentClient;
let enemyClient;


let initialBoard = [
	[null, null, 1, 1, 1, null, null,],
	[null, null, 1, 1, 1, null, null,],
	[1, 1, 1, 1, 1, 1, 1,],
	[1, 1, 1, 0, 1, 1, 1,],
	[1, 1, 1, 1, 1, 1, 1,],
	[null, null, 1, 1, 1, null, null,],
	[null, null, 1, 1, 1, null, null,],
]


function generateBoard(boardArray) {

	const divElement = document.getElementById("table"); //
	while (divElement.firstChild) {
		divElement.removeChild(divElement.firstChild);
	}

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

	console.log(emptyPlaces)
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
	portLabel.textContent = "Porta do Servidor:";
	form.appendChild(portLabel);

	const serverPortInput = document.createElement("input");
	serverPortInput.type = "text";
	serverPortInput.id = "serverPort";
	serverPortInput.name = "serverPort";
	serverPortInput.addEventListener("input", enableButton)
	form.appendChild(serverPortInput);

	const createServerBtn = document.createElement("button");
	createServerBtn.type = "button";
	createServerBtn.id = "createServerPortButton";
	createServerBtn.textContent = "Criar";
	createServerBtn.disabled = true;
	createServerBtn.classList.add("btn")
	createServerBtn.addEventListener("click", () => {

		function onConnection(socket) {
			currentClient.peer.broadcastMessage({ type: "init", id: currentClient.id, message: currentClient.id, myPort: currentClient.port })
			// Adicionar idPLayer enemy
		}

		// Receber e exibir mensagem recebida
		function onData(socket, data) {
			const { remoteAddress } = socket;
			const { type, id, message, myPort } = data;


			if (type === "message") {
				processChatInput(id, message, currentClient.chatContainer)
				console.log(`\n[Message from ${remoteAddress}:${myPort}]: ${message}`);
			}

			if (type === "move") {
				console.log("MOVE AQUI")
				console.log("TURNO AGORA")
				console.log(turn)

				console.log("MEU ID")
				console.log(currentClient.id)
				if (turn === currentClient.id) {
					turn = id
				} else {
					turn = currentClient.id
				}
				generateBoard(message)
			}

			if (type === "init") {
				enemyIdPlayer = message
			}
		}

		const portNumber = serverPortInput.value;
		const peer = new Peer(portNumber)
		currentClient = new Client(portNumber, uuid.v4(), peer)
		turn = currentClient.id;

		peer.onData = onData
		peer.onConnection = onConnection

		const intervalo = setInterval(function () {
			console.log(peer.connections)
			console.log(peer.knownHosts)
			if (peer.connections.length !== 0 && peer.knownHosts.length !== 0) {
				initGame();

				// Remova o intervalo
				clearInterval(intervalo);
			}
		}, 1000);


	})
	form.appendChild(createServerBtn);

	const rollBack = document.createElement("button");
	rollBack.type = "button";
	rollBack.id = "rollBack";
	rollBack.textContent = "Voltar";
	rollBack.disabled = false;
	rollBack.classList.add("btn")
	rollBack.addEventListener('click', () => {
		form.removeChild(portLabel)
		form.removeChild(serverPortInput)
		form.removeChild(createServerBtn)

		form.appendChild(nameLabel);
		form.appendChild(nameInput)
		form.appendChild(createServerButton);
		form.appendChild(joinServerButton);
		form.removeChild(rollBack)
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


	const clientAddressLabel = document.createElement("label");
	clientAddressLabel.setAttribute("for", "clientAddress");
	clientAddressLabel.textContent = "Porta do Cliente:";
	form.appendChild(clientAddressLabel);

	const clientAddressInput = document.createElement("input");
	clientAddressInput.type = "text";
	clientAddressInput.id = "clientAddress";
	clientAddressInput.name = "clientAddress";
	clientAddressInput.addEventListener("input", enableButton)
	form.appendChild(clientAddressInput);

	// Adicionar input para o endereço do servidor
	const addressLabel = document.createElement("label");
	addressLabel.setAttribute("for", "serverAddress");
	addressLabel.textContent = "Endereço do Servidor:";
	form.appendChild(addressLabel);

	const serverAddressInput = document.createElement("input");
	serverAddressInput.type = "text";
	serverAddressInput.id = "serverAddress";
	serverAddressInput.name = "serverAddress";
	serverAddressInput.addEventListener("input", enableButton)
	form.appendChild(serverAddressInput);

	const joinServerBtn = document.createElement("button");
	joinServerBtn.type = "button";
	joinServerBtn.id = "createServerPortButton";
	joinServerBtn.textContent = "Logar";
	joinServerBtn.disabled = true;
	joinServerBtn.classList.add("btn")
	joinServerBtn.addEventListener("click", () => {


		function onConnection(socket) {
			currentClient.peer.broadcastMessage({ type: "init", id: currentClient.id, message: currentClient.id, myPort: currentClient.port })
		}

		// Receber e exibir mensagem recebida
		function onData(socket, data) {
			const { remoteAddress } = socket;
			const { type, id, message, myPort } = data;


			if (type === "message") {
				processChatInput(id, message, currentClient.chatContainer)
				console.log(`\n[Message from ${remoteAddress}:${myPort}]: ${message}`);
			}

			if (type === "move") {
				console.log("MOVE AQUI")
				console.log("TURNO AGORA")
				console.log(turn)

				console.log("MEU ID")
				console.log(currentClient.id)
				if (turn === currentClient.id) {
					turn = enemyIdPlayer
				} else {
					turn = currentClient.id
				}
				generateBoard(message)
			}

			if (type === "init") {
				enemyIdPlayer = message
			}
		}

		const portNumber = clientAddressInput.value;
		const peer = new Peer(portNumber)
		currentClient = new Client(portNumber, uuid.v4(), peer)
		const host = serverAddressInput.value;


		peer.connectTo(host)


		peer.onData = onData
		peer.onConnection = onConnection

		const intervalo = setInterval(function () {
			if (peer.connections !== 0 || peer.knownHosts !== 0) {
				initGame();

				// Remova o intervalo
				clearInterval(intervalo);
			}
		}, 1000);

	})
	form.appendChild(joinServerBtn);

	const rollBack = document.createElement("button");
	rollBack.type = "button";
	rollBack.id = "rollBack";
	rollBack.textContent = "Voltar";
	rollBack.disabled = false;
	rollBack.classList.add("btn")
	rollBack.addEventListener('click', () => {
		form.removeChild(addressLabel)
		form.removeChild(serverAddressInput)
		form.removeChild(joinServerBtn)

		form.appendChild(nameLabel);
		form.appendChild(nameInput)
		form.appendChild(createServerButton);
		form.appendChild(joinServerButton);
		form.removeChild(rollBack)
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
	messageContent.textContent = chatInput
	if (currentClient.id !== id) {
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

	const messagesContainer = document.createElement('div');
	messagesContainer.classList.add('messages-container');

	currentClient.chatContainer = messagesContainer

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

			console.log(currentClient)
			console.log(currentClient.peer)
			processChatInput(currentClient.id, chatInput.value, messagesContainer);
			currentClient.peer.broadcastMessage({ type: "message", id: currentClient.id, message: chatInput.value, myPort: currentClient.port })
			chatInput.value = ""; // Limpa o campo de entrada após o processamento
		}
	});
	chatContainer.appendChild(messagesContainer);
	chatContainer.appendChild(chatInput);

	chat.appendChild(chatContainer)
}


//generateBoard(initialBoard)

//generateChat()

function move(currentPos, newPos) {
	// Move horizontally
	if (currentPos[0] - newPos[0] == 0) {
		const index = (((currentPos[1] - newPos[1]) > 0) ? -1 : 1);
		const intermediate = currentPos[1] + (index);
		console.log(intermediate)
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
	console.log("ATUALIZANDO BOARD")

	initialBoard[currentPos[0]][currentPos[1]] = 0;
	initialBoard[newPos[0]][newPos[1]] = 1;
	initialBoard[intermediate[0]][intermediate[1]] = 0;

	currentClient.peer.broadcastMessage({ type: "move", message: initialBoard, id: currentClient.id, myPort: currentClient.port })

	generateBoard(initialBoard)
}

function verifyValidMove(turn, currentPos, newPos) {
	console.log("VERIFICANDO MOVIMENTO")
	console.log(currentPos)
	console.log(newPos)
	console.log("QUEM TÁ FAZENDO O MOVIMENTO")
	console.log(currentClient.id)

	console.log("TURNO")
	console.log(turn)
	if (currentClient.id !== turn) {
		return false;
	}
	if (currentPos[0] - newPos[0] == 0) {
		const index = (((currentPos[1] - newPos[1]) > 0) ? -1 : 1);
		const intermediate = currentPos[1] + (index);
		console.log(intermediate)
		if ((initialBoard[currentPos[0]][intermediate] == 1) && (initialBoard[newPos[0]][newPos[1]] == 0)) {
			return true;
		}
		return false;
	}

	// Move vertically
	if (currentPos[1] - newPos[1] == 0) {
		const index = ((currentPos[0] - newPos[0]) > 0) ? -1 : 1;
		const intermediate = currentPos[0] + (index);
		if ((initialBoard[intermediate][newPos[1]] == 1) && (initialBoard[newPos[0]][newPos[1]] == 0)) {
			return true;
		}
		return false;
	}
}

generateMenu();

