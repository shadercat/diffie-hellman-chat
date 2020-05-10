const express = require('express');
const app = express();
const generator = require('./functions');


app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index')
});

server = app.listen(3000);

//socket.io instantiation
const io = require("socket.io")(server);

const publicSecret = configurePublicKeys();
let clients = new Set();

//listen on every connection
io.on('connection', (socket) => {
    console.log('New user connected');
    socket.emit('get_public_key', publicSecret);

    clients.add(socket);
    let s = shareKeys();

    //default username
    socket.username = "Anonymous";

    //listen on change_username
    socket.on('change_username', (data) => {
        socket.username = data.username;
    });

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        console.log(socket.username + "  " + data.message);
        io.sockets.emit('new_message', {message: data.message, username: socket.username});
    });

    //listen on typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', {username: socket.username});
    });

    socket.on('disconnect', () => {
        io.sockets.emit('disconnected', {message: `${socket.username} disconnected...`, username: 'server'});
        clients.delete(socket);
    })
});

async function shareKeys() {
    for (let client of clients) {
        let middleMess = undefined;
        for (let middle of clients) {
            if (client !== middle) {
                await compute(middle, middleMess).then((data) => {
                    middleMess = data;
                });
            }
        }
        if(middleMess !== undefined){
            client.emit('send_mess', middleMess);
        }
    }
    return Promise.resolve(1);
}

function compute(socket, middleMess) {
    return new Promise((resolve, reject) => {
        let timer;
        socket.once('get_mess', responseHandler);
        function responseHandler(data) {
            clearTimeout(timer);
            resolve(data);
        }
        timer = setTimeout(() => {
            reject("Waiting timeout");
        }, 10000);
        socket.emit('get_mess', middleMess);
    })
}

function configurePublicKeys() {
    let prime = generator.randomPrime();
    let g = generator.gGenerator(prime);
    console.log("Configure public keys end.");
    return {
        p: prime,
        g: g
    }
}