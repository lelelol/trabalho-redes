import { WebSocketServer } from 'ws';
import { randomBytes } from 'crypto';

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map();
let groupKey = generateNewGroupKey();

function generateNewGroupKey() {
    console.log('\nNova chave de grupo gerada\n');
    return randomBytes(32).toString('base64');
}

function broadcast(message) {
    clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(message));
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

    broadcast({ type: 'info', message: `${userId} entrou no chat.` });

    ws.on('message', rawMessage => {
        const message = JSON.parse(rawMessage);
        if (message.type === 'chat') {
            const messageToSend = {
                type: 'chat',
                sender: userId,
                payload: message.payload
            };
            broadcast(messageToSend);
        }
    });

    ws.on('close', () => {
        const disconnectedUserId = clients.get(ws);
        clients.delete(ws);
        console.log(`${disconnectedUserId} desconectou`);

        broadcast({ type: 'info', message: `${disconnectedUserId} saiu do chat.` });

        if (clients.size > 0) {
            groupKey = generateNewGroupKey();

            const keyUpdateMessage = { type: 'set-key', key: groupKey };
            const infoMessage = { type: 'info', message: `chave distribuída` };

            broadcast(keyUpdateMessage);
            broadcast(infoMessage);
        }
    });
});