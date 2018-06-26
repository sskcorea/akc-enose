var Enose = require('./enose.js').Enose;
var enose = new Enose(1, 0x10);

var Gpio = require('onoff').Gpio;
var gpio = new Gpio(128, 'in', 'rising');

var Config = require('./config.json');
var ArtikCloud = require('artikcloud-js');
var client = ArtikCloud.ApiClient.instance;
var artikcloud_oauth = client.authentications['artikcloud_oauth'];
    artikcloud_oauth.accessToken = Config['device_token'];
var api = new ArtikCloud.MessagesApi();
var message = new ArtikCloud.Message();

var data = {
    "temperature": 0,
    "humidity": 0,
    "amine": 0,
    "acetone": 0,
    "toluene1": 0,
    "toluene2": 0,
};

var callback = function(err, data, resp) {
    if (err)
        console.error('< ' + err);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function senddata(enose) {
    data.temperature = enose.temperature;
    data.humidity = enose.humidity;
    data.acetone = enose.acetone;
    data.toluene1 = enose.toluene1;
    data.toluene2 = enose.toluene2;

    message['data'] = data;
    message['sdid'] = Config['device_id'];

    console.log("> send message: " + JSON.stringify(message));
    api.sendMessage(message, callback);
}

async function demo() {
    await sleep(5000);
    enose.init();
    enose.read();
    senddata(enose);
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