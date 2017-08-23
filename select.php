<?php

$base = "models/_all";

$showall = false;

if (isset($_GET['showall'])){
  $showall = true;
}

$series = selective_scandir($base,false);
$res = "";

foreach($series as $set){

    $models_path = "$base/$set";
    $models = selective_scandir($models_path,$showall);

    $res .= "<set name='$set'>\n";

    foreach($models as $model){

        $res .= "\t<model name='$model'>\n";
        $res .= "\t</model>\n";

    }

    $res .= "</set>\n";

}

return_xml($res);

//functions

function selective_scandir($path,$showall){

    $results = Array();

    $contents = scandir($path);

    foreach($contents as $item){
        if ($item!='.'&&$item!='..'&&is_dir("$path/$item")){
            if ($showall){
              array_push($results,$item);
            }else{
              if (($item[0]!=".")&&($item[0]!="_")){
                array_push($results,$item);
              }
            }

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
