<?php

if (isset($_GET['basepath'])){
  $base = $_GET['basepath'];
}else{
  $base = "models/all";
}

$THUMBNAME = "thumb.jpeg";
$RATINGFILE = "rating.txt";
$READMENAME = "README.txt";

// for htaccess
$SECRET_PATTERN = "/# public access/";

$showall = false;
$rating = false;

if (isset($_GET['rating'])){
  $rating = intval($_GET['rating']);
}

$rating = get_allowed_rating($rating);

if (isset($_GET['showall'])){
  $showall = true;
}

$models = selective_scandir($base,false,$rating);

$res = "";

foreach($models as $model){

    $model_path = "$base/$model";
    $thumb = "$model_path/$THUMBNAME";

    $f1 = is_file("$model_path/$THUMBNAME");
    $f2 = is_file("$model_path/$RATINGFILE");
    $f3 = is_file("$model_path/$model.kml");

    if (!($f1||$f2||$f3)){

      $group_path = selective_scandir($model_path,false,$rating);
      foreach($group_path as $group_item){
        $model_path = "$base/$model/$group_item";
        $thumb = "$model_path/$THUMBNAME";

        $model_rating = get_model_rating("$model_path/$RATINGFILE");
        if ($model_rating>=$rating){

          $versions = selective_scandir($model_path,$showall,0);
          // create thumb
          create_thumbnail($model_path,$versions,$thumb);

          if (!is_file($thumb)){$thumb="";}

          $res .= "<model name='$group_item' group='$model' thumb='$thumb'>\n";
          // read kml
          $res .= "\t<map>\n".parse_kml("$model_path/$group_item.kml")."\t</map>\n";
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

      }

    }else{

      $model_rating = get_model_rating("$model_path/$RATINGFILE");
      if ($model_rating>=$rating){

        $versions = selective_scandir($model_path,$showall,0);
        // create thumb
        create_thumbnail($model_path,$versions,$thumb);

        if (!is_file($thumb)){$thumb="";}

        $res .= "<model name='$model' group='' thumb='$thumb'>\n";
        // read kml
        $res .= "\t<map>\n".parse_kml("$model_path/$model.kml")."\t</map>\n";
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

    }

}

return_xml($res);

//functions

function selective_scandir($path,$showall,$rating=5){

    $results = Array();

    $contents = scandir($path);
    $contents = array_diff($contents, [".", ".."]);

    foreach($contents as $item){
        if ($item!="jp4"&&is_dir("$path/$item")){
            if ($showall){
              array_push($results,$item);
            }else{
              // hidden directories
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

function get_model_rating($file){

  if (is_file($file)){
    $r = intval(trim(file_get_contents($file)));
  }else{
    $r = 0;
  }
  return $r;

}

function get_allowed_rating($r){

  global $SECRET_PATTERN;

  if (is_file(".htaccess")) {

    $htaccess = file_get_contents(".htaccess");

    $m = preg_match($SECRET_PATTERN,$htaccess);

    // restrict to 1
    if ($m) {
      $r = max(1,$r);
    }

  }

  return $r;

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
