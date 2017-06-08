<?php

$base = "models";

$models = selective_scandir($base);

$res = "";

foreach($models as $model){

    $model_path = "$base/$model";
    
    $res .= "<model name='$model'>\n";
    //$res .= "\t<name>$model</name>\n";
    
    $versions = selective_scandir($model_path);
    
    foreach($versions as $version){
        
        $res .= "\t\t<version name='$version'></version>";

    }

    $res .= "</model>\n";

    return_xml($res);
    
}

//functions

function selective_scandir($path){

    $results = Array();

    $contents = scandir($path);

    foreach($contents as $item){
        if ($item!='.'&&$item!='..'&&is_dir("$path/$item")){
            array_push($results,$item);
        }
    }
    
    return $results;

}

function return_xml($str){

    $str = "<?xml version='1.0'  standalone='yes'?>\n<Document>\n$str</Document>";

    header("Content-Type: text/xml");
    header("Content-Length: ".strlen($str)."\n");
    header("Pragma: no-cache\n");
    printf($str);

}

?> 
