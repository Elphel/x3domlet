var SETTINGS = {
    'basepath': "models",
    'path'   : "1487451413_967079",
    'version': "v1"
}

function parseURL(){
    var parameters=location.href.replace(/\?/ig,"&").split("&");
    for (var i=0;i<parameters.length;i++) parameters[i]=parameters[i].split("=");
    for (var i=1;i<parameters.length;i++) {
        switch (parameters[i][0]) {
            case "path":         SETTINGS.path = parameters[i][1]; break;
            case "ver":          SETTINGS.version = parameters[i][1]; break;
        }
    }
}

$(function(){

    parseURL();
    init();

});

function init(){

    init_resize();

    var x3delement = $("#x3d_id").find("scene");

    var model_url = SETTINGS.basepath+"/"+SETTINGS.path+"/"+SETTINGS.version+"/"+SETTINGS.path+".x3d";

    console.log(model_url);

    var model = $(`
    <group>
        <inline name='mymodel' namespacename='mymodel' url='`+model_url+`'></inline>
    </group>`);

    x3delement.append(model);

    $.getScript("js/x3dom/x3dom-full.debug.js",function(){
        //wait until it DOM is extended
        x3dom.runtime.ready = function(){
            deep_init();
        };
    });

}

var resizeTimer = false;
var FOV = 30*Math.PI/180;

function init_resize(){

    resize();

    //bind resize
    $(window).resize(function(){
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function(){
            resize();
        },100);
    });

}

function resize(){

    var element = document.getElementById('x3d_id');

    var w = $(window).width();
    var h = $(window).height();

    $(element).attr("width",w);
    $(element).attr("height",h);

    var fov = w/h*FOV;

    //fov = Math.PI/2;

    setFoV(fov);

}

function setFoV(val){

    var element = document.getElementById('x3d_id');

    var vp = $(element).find("Viewpoint")[0];
    $(vp).prop("fieldOfView",val);

}

var X3DOM_SCENE_INIT_DONE = false;

function deep_init(){
    /*
    var element = document.getElementById('x3d_id');

    element.runtime.enterFrame = function(){

        // the only <strong> in the document
        var progress_element = $(element).find("strong");
        var progress_counter = $(progress_element).html();
        progress_counter = progress_counter.split(" ");
        cnt = parseInt(progress_counter[1]);

        if (!X3DOM_SCENE_INIT_DONE&&(cnt==0)){

            X3DOM_SCENE_INIT_DONE = true;

        }
    };
    */
}
