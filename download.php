<?php
/*

  Copyright (C) 2017 Elphel Inc.

  SPDX-License-Identifier: AGPL-3.0+

  https://www.elphel.com

*/

// https://stackoverflow.com/questions/1061710/php-zip-files-on-the-fly
// * solution for ZipArchive worked only from a command line
// * solution that worked: command line zip

// contstants
$TEXTURE_EXTENSIONS = ['png','jpeg','jpg','tif','tiff','gif'];

// check if file parameter is specified
if (!isset($_GET['file'])) die("-1");

$file = $_GET['file'];
$filestring = $file;

$patterns = ['/(\.)+\//','/^\//'];
$replacements = ['',''];

// check if file exists
if (!is_file($file)) die("-2");
if (substr($file,-4)!=".x3d") die("-3");

$pathinfo = pathinfo($file);
$path = $pathinfo['dirname'];

$tmp = explode("/",$path);

$zipfile =  (array_slice($tmp,-2)[0])."_".(array_slice($tmp,-1)[0]).".zip";

// alright, there's this file
$contents = file_get_contents($file);

// extract file list
preg_match_all('/url="([^\s]+('.implode('|',$TEXTURE_EXTENSIONS).'))"/i',$contents,$matches);

// make a string
foreach($matches[1] as $v){
//	$filestring .= " \\\n$path/$v"; // split lines do not help, limit is for the php string length in shell_exec()
  $filestring .= " $path/$v";
}

// add obj
$objfile = substr($file,0,-3)."obj";
if (is_file($objfile)) $filestring .= " $objfile";

// add mtl
$mtlfile = substr($file,0,-3)."mtl";
if (is_file($mtlfile)) $filestring .= " $mtlfile";

$zipped_data = `zip -qj - $filestring `;
if (strlen($zipped_data) == 0){
	$filestring=$path."/*.*"; // too long filestring, just compress everything in the model directory
	$zipped_data = `zip -qj - $filestring `;
}

header('Content-type: application/zip');
header('Content-Disposition: attachment; filename="'.$zipfile.'"');
echo $zipped_data;

?>