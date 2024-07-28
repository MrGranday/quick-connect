const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

server.on('connection', socket => {
    socket.on('message', message => {
        const data = JSON.parse(message);
        
        if (data.offer) {
          
            data.callerId = socket.id || 'osman';
        }
        
        server.clients.forEach(client => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });
});


server.on('request', (request) => {
    if (request.url === '/favicon.ico') {
        request.reject(404); 
    }
});

console.log('Signaling server running on ws://localhost:8080');
