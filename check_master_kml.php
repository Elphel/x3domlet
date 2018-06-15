<?php

$path = $_GET['path']."/master_kml.xml";

if (is_file($path)){
  //print("There's master kml");
  $xml  = simplexml_load_file($path);
  print($xml->name);
}else{
  // return empty, don't update
  print(-1);
}

?>
