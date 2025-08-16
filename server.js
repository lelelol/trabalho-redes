const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const rooms = new Map();

wss.on('connection', ws => {
    console.log("conectou!");

    ws.on('close', () => {
        console.log('desconectado');
    });
});