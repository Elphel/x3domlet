<?php

$base = "models";

$THUMBNAME = "thumb.jpeg";
$READMENAME = "README.txt";

$models = selective_scandir($base);
$res = "";

foreach($models as $model){

    $model_path = "$base/$model";
    $thumb = "$model_path/$THUMBNAME";
    
    $versions = selective_scandir($model_path);
    
    // create thumb
    create_thumbnail($model_path,$versions,$thumb);
    
    if (!is_file($thumb)){
        $thumb="";
    }
    
    $res .= "<model name='$model' thumb='$thumb'>\n";
    
    // read kml
    $res .= "\t<map>\n".parse_kml("$base/$model/$model.kml")."\t</map>\n";
    
    foreach($versions as $version){
        
        $res .= "\t<version name='$version'>\n";
        
        $comments = "-";
        $readme = "$model_path/$version/$READMENAME";
        if (is_file($readme)){
            $comments = trim(file_get_contents($readme),"\t\n\r");
        }
        
        $res .= "\t\t<comments>$comments</comments>\n";
        
        $res .= "\t</version>\n";

    }

    $res .= "</model>\n";
    
}

return_xml($res);

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

function create_thumbnail($path,$vpaths,$thumbname){

    if (!is_file($thumbname)){
    
        if (count($vpaths)>=1){
        
            $srcpath = "$path/{$vpaths[0]}";
            
            $files = scandir($srcpath);
            foreach($files as $file){
            
                $test = preg_match('/(texture-bgnd-ext)/',$file);
            
                if ($test){
                    $file = "$srcpath/$file";
                    
                    if (extension_loaded('imagick')){
                        
                        $imagick = new Imagick($file);
                        
                        $imagick->trimImage(0);
                        
                        $w = $imagick->getImageWidth();
                        $h = $imagick->getImageHeight();
                        
                        $imagick->borderImage('black', 100, 100);
                        
                        //$imagick->cropImage($w/2, $h/4, $w/4, $h/4);
                        
                        $imagick->thumbnailImage(200, 100, true, true);
                        
                        $imagick->writeImage($thumbname);
                        
                    }
                    break;
                }
                
                /*
                $pinfo = pathinfo("$srcpath/$file");
                if ($pinfo['extension']=="jpeg"){
                    $file = "$srcpath/$file";
                    echo "go-go-go with $file";
                    break;
                }
                */
            }
    
        }
    
    }
    
    return 0;

}

function parse_kml($file){

    $res = "";

    if (is_file($file)){
    
        $xml = simplexml_load_file($file);
        
        $recs = $xml->Document->children();
        
        foreach($recs as $rec){
            $res .= "\t".$rec->Camera->asXML()."\n";
        }
        
    }else{
        $res = <<<TEXT
<Camera>
    <longitude>-111.9328843</longitude>
    <latitude>40.7233861</latitude>
    <altitude>1305.1</altitude>
    <heading>0</heading>
    <tilt>90</tilt>
    <roll>00</roll>
</Camera>
TEXT;
    }

    return $res;
    
}

?> 
