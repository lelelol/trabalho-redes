const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const button = form.querySelector('button');

function addMessage(text) {
    const item = document.createElement('div');
    item.classList.add('info');
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
}

const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('open', () => {
    addMessage('Conectado ao servidor.');
});

socket.addEventListener('message', (event) => {
    console.log('Mensagem recebida do servidor:', event.data);
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value) {
        input.value = '';
    }
});