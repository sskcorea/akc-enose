var i2c = require('i2c-bus');

const cmd1 = [
  [0x62, 0x08, 0x4e], // AFE div
  [0x80, 0x16, 0xff], [0x80, 0x17, 0x3f], // OSC_VALUE_SEL_OSC
  [0X80, 0x18, 0x01], [0X80, 0x19, 0x00], // OSC_VALUE_EN_OSC1
  [0X80, 0x1a, 0xfd], [0X80, 0x1b, 0x3f], // OSC_VALUE_EN_OSC0
  [0X80, 0x1c, 0x04], [0X80, 0x1d, 0x00], // OSC_VALUE_RST_CNT1
  [0X80, 0x1e, 0x05], [0X80, 0x1f, 0x00], // OSC_VALUE_RST_CNT0
  [0X80, 0x20, 0x08], [0X80, 0x21, 0x00], // OSC_VALUE_EN_CNT1
  [0X80, 0x22, 0xfa], [0X80, 0x23, 0x3f], // OSC_VALUE_EN_CNT0
  [0X80, 0x24, 0xfb], [0X80, 0x25, 0x3f], // OSC_VALUE_EOC1
  [0X80, 0x26, 0xfc], [0X80, 0x27, 0x3f], // OSC_VALUE_EOC0
  [0X80, 0x78, 0x8f], // EN_DLY
  [0X80, 0x79, 0x01], // NS mode
  [0X80, 0x7a, 0xa8], [0X80, 0x7b, 0xfd], [0X80, 0x7c, 0x09], // CIC_DECIRATE
  [0X80, 0x70, 0x01], // Data ready Int. enable
  [0Xa0, 0x00, 0x20], // PMU enable
  [0Xa0, 0x00, 0x21]  // One-shot
];

const cmd2 = [
  //read OSC data
  [0x80, 0x30], [0x80, 0x32], [0x80, 0x34], [0X80, 0x36],
  [0x80, 0x3a], [0x80, 0x3c], [0x80, 0x3e], [0X80, 0x40],
  [0x80, 0x44], [0x80, 0x46], [0x80, 0x48], [0X80, 0x4a],
  [0x80, 0x4e], [0x80, 0x50], [0x80, 0x52], [0X80, 0x54],
  [0x80, 0x58], [0x80, 0x5a], [0X80, 0x5c], [0x80, 0x5e],
  [0x80, 0x62], [0x80, 0x64], [0X80, 0x66], [0X80, 0x68]
];

var i2c_bus, addr;

var cal = function (buf) {
    var r = new Array(6);
    var c = new Array(6);

    r[0] = buf.readInt32LE(0);
    r[1] = buf.readInt32LE(8);
    r[2] = buf.readInt32LE(16);
    r[3] = buf.readInt32LE(24);
    r[4] = buf.readInt32LE(32);
    r[5] = buf.readInt32LE(40);

    c[1] = r[1] - 4 * r[0] + 370477345;
    c[2] = r[2] - 1 * r[0] + 2496750;
    c[3] = r[3] - 2.7 * r[0] + 194832000;
    c[4] = r[4] - 3.5 * r[0] + 293796000;
    c[5] = r[5] - 3.5 * r[0] + 293586000;

    Enose.prototype.temperature = -0.000281611 * r[0] + 35200;
    Enose.prototype.humidity = 0.00065114 * c[1] + 50;
    Enose.prototype.acetone = 0.001 * c[3] - 0.00006 * c[1];
    Enose.prototype.toluene1 = 0.001 * c[4] - 0.00024 * c[1];
    Enose.prototype.toluene2 = 0.001 * c[5] - 0.00024 * c[1];
}

var Enose = function (bus, id) {
    i2c_bus = i2c.openSync(bus);
    addr = id;
}

Enose.prototype.init = function () {
    cmd1.forEach(e => {
        buf = Buffer.from(e);
        i2c_bus.i2cWriteSync(addr, 3, buf);
    });
}

Enose.prototype.read = function () {
    var buf1 = Buffer.alloc(2);
    var buf2 = Buffer.alloc(48);

    cmd2.forEach((e, i) => {
        var buf = Buffer.from(e);
        i2c_bus.i2cWriteSync(addr, 2, buf);
        i2c_bus.i2cReadSync(addr, 2, buf1);
        buf2.fill(buf1, i * 2);
    });

    cal(buf2);
}

Enose.prototype.clear = function () {
    var buf = Buffer.from([0x80, 0x72, 0x01]);
    i2c_bus.i2cWriteSync(addr, 3, buf);
}

Enose.prototype.close = function () {
    i2c_bus.closeSync();
}

exports.Enose = Enose;