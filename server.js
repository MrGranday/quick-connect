const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

server.on('connection', socket => {
    socket.on('message', message => {
        const data = JSON.parse(message);
        
        if (data.offer) {
            // Add caller ID to the offer
            data.callerId = socket.id || 'osman';
        }
        // Broadcast message to all clients except the sender
        server.clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });
});

// Handle favicon.ico request
server.on('request', (request) => {
    if (request.url === '/favicon.ico') {
        request.reject(404); // Respond with 404 status for favicon.ico requests
    }
});

console.log('Signaling server running on ws://localhost:8080');
