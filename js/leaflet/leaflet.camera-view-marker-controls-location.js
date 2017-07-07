
(function (window, document, undefined) {
    "use strict";

    L.Control.CameraViewMarkerControlsLocation = L.Control.extend({

        onAdd: function(map){

            var name = "leaflet-control-heel";

            var div = L.DomUtil.create('div', name+' leaflet-bar');

            L.DomEvent.disableClickPropagation(div);

            var title = "Camera approximate location control";

            //var label = "&#9760";
            //var label = "&#128681";
            var label = "&#9971";
            //var label = "+";
            //var label = "&#54629";

            var a = L.DomUtil.create('a','leaflet-control-zoom-in leaflet-interactive');

            a.innerHTML = label;
            a.title = title;

            this._div = div;
            this._button = a;
            this._state = false;

            div.appendChild(a);

            this._registerEvents();

            return div;
        },

        onRemove: function(){
            // Nothing to do here
        },

        getState: function(){
            return this._state;
        },

        _registerEvents: function(){

            var self = this;

            L.DomEvent.on(this._button, 'click', function(){
                self._state = !self._state;
                self._buttonColor();
            }, this._button);

        },

        _buttonColor: function(){

            if (this._state){
                this._button.style.backgroundColor = "rgba(136,255,136,1)";
            }else{
                this._button.removeAttribute("style");
            }

        }

    });

    L.control.cameraViewMarkerControlsLocation = function (options) {
        return new L.Control.CameraViewMarkerControlsLocation(options);
    };

}(this,document));