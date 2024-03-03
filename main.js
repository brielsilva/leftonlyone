const { app, BrowserWindow } = require('electron')

function initWindow() {
	let window = new BrowserWindow({
		// frame: false,
		// minimizable: true,
		// maximizable: false,
		// titleBarStyle: 'hiddenInset',
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	})
	window.setMenuBarVisibility(false)
	window.loadFile('index.html')
}

app.on('ready', initWindow)
