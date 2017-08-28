<?php

$base0 = "models";
$base = "$base0/_all";

$showall = false;

if (isset($_GET['showall'])){
  $showall = true;
}

if ($_GET['cmd']=='copy'){

  $kml_template = file_get_contents('php://input');

  $set = $_GET['set'];
  $model = $_GET['model'];

  $path_from = "$base/$set/$model/*";
  $path_to = "$base0/$model/v0";

  if (!is_dir($path_to)){
    $old = umask(0);
    $res = mkdir($path_to,0777,true);
    umask($old);
    if (!$res){
      die("FAIL: $set/$model: check 'w' rights on models/");
    }
  }

  exec("cp -r $path_from $path_to");

  //generate default kml
  $ts = str_replace("_",".",$model);
  $kml = "$base0/$model/$model.kml";

  if (!is_file($kml)){
    if ($kml_template==""){
      $kml_data = generate_default_kml($model,$ts);
    }else{
      $kml_data = $kml_template;
    }
    file_put_contents($kml,$kml_data);
  }

  //gen thumbnail
  $thumb_src = "$base0/$model/v0/$model-00-D0.0.jpeg";
  $thumb_res = "$base0/$model/thumb.jpeg";

  if (!is_file($thumb_res)){
    if (is_file($thumb_src)){
        create_thumbnail($thumb_src,$thumb_res);
    }
  }

  die("DONE: $set/$model was copied to models/");

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

function generate_default_kml($name,$ts){

  $kml = <<<TXT
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://earth.google.com/kml/2.2">
<Document>
<PhotoOverlay>
	<name>$name</name>
	<visibility>1</visibility>
	<shape>rectangle</shape>
	<TimeStamp>
		<when>$ts</when>
	</TimeStamp>
	<Camera>
		<longitude>-111.9328843</longitude>
		<latitude>40.7233861</latitude>
		<altitude>1305.1</altitude>
		<heading>65</heading>
		<tilt>90</tilt>
		<roll>00</roll>
	</Camera>
	<Icon>
		<href>x3d/$name.x3d</href>
	</Icon>
	<ExtendedData>
		<OriginalData>
			<longitude>-111.9328843</longitude>
			<latitude>40.7233861</latitude>
			<altitude>1305.1</altitude>
			<heading>65</heading>
			<tilt>90</tilt>
			<roll>0</roll>
		</OriginalData>
	</ExtendedData>
</PhotoOverlay>
</Document>
</kml>
TXT;

return $kml;

}

function create_thumbnail($path,$thumbname){

    $file = $path;

    if (extension_loaded('imagick')){

        $imagick = new Imagick($file);

        $imagick->trimImage(0);

        $w = $imagick->getImageWidth();
        $h = $imagick->getImageHeight();

        //$imagick->borderImage('black', 100, 100);

//         $imagick->cropImage($w/2, $h/4, $w/4, $h/4);

        //$imagick->thumbnailImage(200, 100, true, true);
        $imagick->cropThumbnailImage(198, 98);

        $imagick->borderImage('gray', 1, 1);

        $imagick->writeImage($thumbname);

    }else{

        echo "Extension imagick is no loaded.\n";

    }

    return 0;

}

?>
