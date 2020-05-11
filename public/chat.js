
$(function(){
   	//make connection
	let socket = io.connect('http://localhost:3000');

	//buttons and inputs
	let message = $("#message");
	let username = $("#username");
	let send_message = $("#send_message");
	let send_username = $("#send_username");
	let chatroom = $("#chatroom");
	let feedback = $("#feedback");

	let publicKey = {
		p: 0,
		g: 0
	};

	let secretKey = Math.floor(Math.random() * (1000 - 1)) + 1;
	let sharedSecret = 0;


	socket.on('get_public_key', (data) => {
		publicKey = data;
		console.log('public key');
		console.log(publicKey);
		console.log("secret key: " + secretKey);
	});

	socket.on('get_mess', (data) => {
		let num = 1;
		if(data !== null){
			for(let i = 0; i < secretKey; i++){
				num *= data;
				num %= publicKey.p;
			}
		} else {
			for (let i = 0; i < secretKey; i++){
				num *= publicKey.g;
				num %= publicKey.p;
			}
		}
		socket.emit('get_mess', num);
	});

	socket.on('send_mess', (data) => {
		sharedSecret = 1;
		for(let i = 0; i < secretKey; i++){
			sharedSecret *= data;
			sharedSecret %= publicKey.p;
		}

		console.log(`shared secret: ${sharedSecret}`);
	});

	//Emit message
	send_message.click(function(){
		let text = message.val();
		let encryptedText = CryptoJS.AES.encrypt(text, sharedSecret.toString()).toString();
		socket.emit('new_message', {message : encryptedText});
	});

	//Listen on new_message
	socket.on("new_message", (data) => {
		feedback.html('');
		message.val('');
		let decryptedText = CryptoJS.AES.decrypt(data.message, sharedSecret.toString()).toString(CryptoJS.enc.Utf8);
		chatroom.append("<p class='message'>" + data.username + ": " + decryptedText + "</p>")
	});

	socket.on("disconnected", (data) => {
		chatroom.append("<p class='message'>" + data.username + ": " + data.message + "</p>")
	});

	//Emit a username
	send_username.click(function(){
		socket.emit('change_username', {username : username.val()})
	});

	//Emit typing
	message.bind("keypress", () => {
		socket.emit('typing')
	});

	//Listen on typing
	socket.on('typing', (data) => {
		feedback.html("<p><i>" + data.username + " is typing a message..." + "</i></p>")
	});
});


