/*
 *
 * Copyright (C) 2017 Elphel Inc.
 * License: GPLv3
 *
 */

var X3L = function(options){

    var defaults = {
        x: 0,
        y: 0,
        z: 0,

        latitude: 0,
        longitude: 0,
        altitude: 0,

        heading: 0,
        tilt: 90,
        roll: 0,

        fov: 0,

        color: "#1f1",
        size: 2,
    };

    this._data = $.extend(defaults,options);

    this.x = this._data.x;
    this.y = this._data.y;
    this.z = this._data.z;

    this.longitude = this._data.longitude;
    this.latitude = this._data.latitude;
    this.altitude = this._data.altitude;

    this.heading = this._data.heading;
    this.tilt = this._data.tilt;
    this.roll = this._data.roll;

    this.fov = this._data.fov;

    this.color = this._data.color;
    this.size = this._data.size;

};

