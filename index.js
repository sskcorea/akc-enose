'use strict';

var Enose = require('./enose.js').Enose;
var enose = new Enose(1, 0x10);

var Gpio = require('onoff').Gpio;
var gpio = new Gpio(128, 'in', 'rising');

var Config = require('./config.json');

// azure cloud
var connectionString = Config['connection_string'];
var Mqtt = require('azure-iot-device-mqtt').Mqtt;
var DeviceClient = require('azure-iot-device').Client
var Message = require('azure-iot-device').Message;
var client = DeviceClient.fromConnectionString(connectionString, Mqtt);

// artik cloud
var ArtikCloud = require('artikcloud-js');
var akc_client = ArtikCloud.ApiClient.instance;
var artikcloud_oauth = akc_client.authentications['artikcloud_oauth'];
    artikcloud_oauth.accessToken = Config['device_token'];
var api = new ArtikCloud.MessagesApi();
var akc_message = new ArtikCloud.Message();

var data = {
    "temperature": 0,
    "humidity": 0,
    "amine": 0,
    "acetone": 0,
    "toluene1": 0,
    "toluene2": 0,
};

function printResultFor(op) {
    return function printResult(err, res) {
        if (err) console.log('<azure ' + op + ' error: ' + err.toString());
        if (res) console.log('<azure ' + op + ' status: ' + res.constructor.name);
    };
}

var callback = function(err, data, resp) {
    if (err)
        console.error('<akc ' + err);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function senddata2akc(enose) {
    data.temperature = enose.temperature;
    data.humidity = enose.humidity;
    data.acetone = enose.acetone;
    data.toluene1 = enose.toluene1;
    data.toluene2 = enose.toluene2;

    akc_message['data'] = data;
    akc_message['sdid'] = Config['device_id'];

    console.log('akc> send message: ' + JSON.stringify(akc_message));
    api.sendMessage(akc_message, callback);
}

function senddata2azure(enose) {
    var data = JSON.stringify({ temperature: enose.temperature, humidity: enose.humidity, acetone: enose.acetone, toluene: enose.toluene1 });
    var azure_message = new Message(data);
    console.log('azure> send message: ' + azure_message.getData());
    client.sendEvent(azure_message, printResultFor('send'));
}

async function demo() {
    await sleep(2000);
    enose.init();
    enose.read();
    senddata2akc(enose);
    senddata2azure(enose);
    enose.clear();
}

process.on('SIGINT', function () {
    console.log('SIGINT!');
    gpio.unexport();
    enose.close();
});

gpio.watch(function (err, value) {
    if (err)
        throw err;

    console.log('gpio: ' + value);

    if (value)
        demo();
});

enose.init();
enose.clear();
