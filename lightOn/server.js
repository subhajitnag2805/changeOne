var express = require('express');
const SerialPort = require('serialport');
var mongoose = require('mongoose');
const Readline = SerialPort.parsers.Readline;
const serialport = new SerialPort('/dev/ttyACM0', {
	baudRate: 115200
});

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const parser = serialport.pipe(new Readline({ delimiter: '\r\n' }));

var Test = require('./models/test');
var TestOne = require('./models/testOne');

var interval;

//connect to mongodb
// mongoose.connect('mongodb://127.0.0.1:27017/EdgeTemp');

// mongoose.connect('mongodb://chatUser:password@ds211558.mlab.com:11558/ionic_chat');

//on successful connection
mongoose.connection.on('connected', () => {
	console.log('Connected to mongodb!!');
});

//on error
mongoose.connection.on('error', (err) => {
	if (err) {
		console.log('Error in db is :' + err);
	}
});

let array = [];

io.on('connection', function (client) {
	console.log("Socket connected !");

	client.on("start", function (data) {
		let status = data.status;
		if (status == "START") {
			interval = setInterval(function () {
				var buffer = new Buffer(1);
				buffer.writeInt8(5);
				serialport.write(buffer);
			}, 500);
		}
	});

	client.on("stop", function (data) {
		let status = data.status;
		if (status == "STOP") {
			clearInterval(interval);
			var buffer = new Buffer(1);
			buffer.writeInt8(6);
			serialport.write(buffer);
		}
	});

	parser.on('data', function (data) {
		if (data == 0) {
			client.emit('arduino_Stop', { "value_Stop": "Temparature Reading stopped by user." });
		} else {
			// let dataOne = new Test({
			// 	value: data[0]
			// }).save(function (error, result) {
			// 	if (error) {
			// 		console.log(error);
			// 	} else if (result) {
			// 		console.log(result);
			// 	}
			// });

			/** push data into array */
			// array.push(data[0]);

			/**Send data to server */
			// let dataTwo = new TestOne({
			// 	valueOne: array
			// }).save(function (error, result) {
			// 	if (error) {
			// 		console.log(error);
			// 	} else if (result) {
			// 		console.log("Sendind data to server");
			// 	}
			// });
			client.emit('arduino', { "value": data });
		}
	});

});

const PORT = 7000;
server.listen(PORT, function () {
	console.log("Server started");
});

