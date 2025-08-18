
const arrayBufferToBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToArrayBuffer = (base64) => Uint8Array.from(atob(base64), c => c.charCodeAt(0));

async function importKey(base64Key) {
    const rawKey = base64ToArrayBuffer(base64Key);
    return await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

async function encryptMessage(key, message) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedMessage = new TextEncoder().encode(message);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedMessage);
    return `${arrayBufferToBase64(iv)}:${arrayBufferToBase64(ciphertext)}`;
}

async function decryptMessage(key, encryptedData) {
    try {
        const [ivBase64, ciphertextBase64] = encryptedData.split(':');
        if (!ivBase64 || !ciphertextBase64) return "Erro nos dados criptografados.";
        const iv = base64ToArrayBuffer(ivBase64);
        const ciphertext = base64ToArrayBuffer(ciphertextBase64);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Falha ao decifrar:", e);
    }
}


const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const button = form.querySelector('button');

let groupKey = null;
let userId = null;

function addMessage(text, sender, isMyMessage = false) {
    const container = document.createElement('div');
    container.classList.add('message-container');
    const content = document.createElement('div');
    content.classList.add('content');
    if (sender === 'info') {
        container.classList.add('info');
        content.textContent = text;
    } else {
        const senderElem = document.createElement('div');
        senderElem.classList.add('sender');
        senderElem.textContent = sender;
        content.appendChild(senderElem);
        content.append(text);
    }
    container.classList.add(isMyMessage ? 'my-message' : 'other-message');
    container.appendChild(content);
    messages.appendChild(container);
    messages.scrollTop = messages.scrollHeight;
}


const socket = new WebSocket('ws://localhost:8080');

socket.addEventListener('open', () => {
    addMessage('Conectado ao servidor.', 'info');
});

socket.addEventListener('message', async (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'set-key':
            groupKey = await importKey(data.key);
            if (data.userId) {
                userId = data.userId;
                addMessage(`Você entrou como ${userId}.`, 'info');
            }
            addMessage('Chave configurada', 'info');
            input.disabled = false;
            button.disabled = false;
            break;

        case 'chat':
            if (data.sender !== userId) {
                const decryptedMessage = await decryptMessage(groupKey, data.payload);
                addMessage(decryptedMessage, data.sender);
            }
            break;

        case 'info':
            addMessage(data.message, 'info');
            break;
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (input.value && groupKey) {
        const message = input.value;
        const encryptedPayload = await encryptMessage(groupKey, message);
        socket.send(JSON.stringify({
            type: 'chat',
            payload: encryptedPayload
        }));

        addMessage(message, 'Você', true);
        input.value = '';
    }
});