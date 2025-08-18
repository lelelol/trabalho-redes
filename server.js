import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
console.log('aguardando conexões na porta 8080.');

const clients = new Map();

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
        console.log(`${disconnectedUserId} desconectou.`);

        broadcast({ type: 'info', message: `${disconnectedUserId} saiu do chat.` });
    });
});