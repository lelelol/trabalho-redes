import { WebSocketServer } from 'ws';
import { randomBytes } from 'crypto';

const wss = new WebSocketServer({ port: 8080 });
console.log('Servidor WebSocket iniciado na porta 8080.');

const clients = new Map();
let groupKey = generateNewGroupKey();

function generateNewGroupKey() {
    console.log('Nova chave de grupo gerada.');
    return randomBytes(32).toString('base64');
}

function broadcast(message, senderWs = null) {
    clients.forEach((userId, clientWs) => {
        if (clientWs !== senderWs && clientWs.readyState === 1) {
            clientWs.send(JSON.stringify(message));
        }
    });
}

wss.on('connection', ws => {
    const userId = `User-${Math.floor(Math.random() * 1000)}`;
    clients.set(ws, userId);
    console.log(`${userId} conectou-se.`);

    ws.send(JSON.stringify({
        type: 'set-key',
        key: groupKey,
        userId: userId
    }));

    broadcast({ type: 'info', message: `${userId} entrou no chat.` }, ws);
    ws.send(JSON.stringify({ type: 'info', message: `Você entrou no chat como ${userId}.` }));

    ws.on('message', rawMessage => {
        const message = JSON.parse(rawMessage);
        if (message.type === 'chat') {
            const messageToSend = {
                type: 'chat',
                sender: userId,
                payload: message.payload
            };
            broadcast(messageToSend, ws);
        }
    });

    ws.on('close', () => {
        const disconnectedUserId = clients.get(ws);
        clients.delete(ws);
        console.log(`${disconnectedUserId} desconectou`);

        const infoMessage = { type: 'info', message: `${disconnectedUserId} saiu do chat.` };
        broadcast(infoMessage);

        if (clients.size > 0) {
            groupKey = generateNewGroupKey();
            const keyUpdateMessage = { type: 'set-key', key: groupKey };
            const rekeyInfoMessage = { type: 'info', message: `nova chave distribuída` };

            broadcast(keyUpdateMessage);
            broadcast(rekeyInfoMessage);
        }
    });
});