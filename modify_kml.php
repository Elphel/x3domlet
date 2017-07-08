<?php
/*
*! -----------------------------------------------------------------------------**
*! FILE NAME  : modify_kml.php
*! REVISION   : 1.0
*! DESCRIPTION: save changes to a file.
*! Copyright (C) 2011 Elphel, Inc.
*!
*! -----------------------------------------------------------------------------**
*!  This program is free software: you can redistribute it and/or modify
*!  it under the terms of the GNU General Public License as published by
*!  the Free Software Foundation, either version 3 of the License, or
*!  (at your option) any later version.
*!
*!  This program is distributed in the hope that it will be useful,
*!  but WITHOUT ANY WARRANTY; without even the implied warranty of
*!  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*!  GNU General Public License for more details.
*!
*!  You should have received a copy of the GNU General Public License
*!  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*!
*!  It means that the program's users have the four essential freedoms:
*!
*!   * The freedom to run the program, for any purpose (freedom 0).
*!   * The freedom to study how the program works, and change it to make it do what you wish (freedom 1).
*!     Access to the source code is a precondition for this.
*!   * The freedom to redistribute copies so you can help your neighbor (freedom 2).
*!   * The freedom to distribute copies of your modified versions to others (freedom 3).
*!
*!  By doing this you can give the whole community a chance to benefit from your changes.
*!  Access to the source code is a precondition for this.
*! -----------------------------------------------------------------------------**
*/

require_once("call_filter.php");

$target_filename = $_GET['kml'];

if (!is_file($target_filename)){
  die("-1");
}else{
  if (substr($target_filename,-4,4)!=".kml"){
    die("-2");
  }
}

$target_xml  = simplexml_load_file($target_filename);
$changes_xml = simplexml_load_file('php://input');

$new_PhotoOverlay = $changes_xml->Document->PhotoOverlay;
$old_PhotoOverlay = $target_xml->Document->PhotoOverlay;

foreach ($new_PhotoOverlay as $new_node) {
    foreach ($old_PhotoOverlay as $old_node) {
	$old_str = "{$old_node->Icon->href}";
	$new_str = "{$new_node->Icon->href}";
	//if ("{$new_node->Icon->href}"=="{$old_node->Icon->href}") {
	if (strstr($new_str,$old_str)!=false) {
	    $old_node->name              = $new_node->name;
	    $old_node->description       = $new_node->description;
	    $old_node->visibility        = $new_node->visibility;
            if (!isset($old_node->Camera)) $old_node->Camera= $new_node->Camera;
	    $old_node->Camera->latitude  = $new_node->Camera->latitude;
	    $old_node->Camera->longitude = $new_node->Camera->longitude;
	    $old_node->Camera->altitude  = $new_node->Camera->altitude;
	    $old_node->Camera->heading   = $new_node->Camera->heading;
	    $old_node->Camera->tilt      = $new_node->Camera->tilt;
	    $old_node->Camera->roll      = $new_node->Camera->roll;
            if (!isset($old_node->ExtendedData) && isset($old_node->ExtendedData)) $old_node->ExtendedData= $new_node->ExtendedData;
            if (isset($new_node->ExtendedData->Visibility3d->v3Range)) {
	      $old_node->ExtendedData->Visibility3d   = $new_node->ExtendedData->Visibility3d;
/*
	      for ($nr=0; $nr<$new_node->ExtendedData->Visibility3d->v3Range->count();$nr++) {
	        $old_node->ExtendedData->Visibility3d->v3Range[$nr]=      $new_node->ExtendedData->Visibility3d->v3Range[$nr];
	        if (isset($new_node->ExtendedData->Visibility3d->v3Range[$nr]->from)) $old_node->ExtendedData->Visibility3d->v3Range[$nr]->from=$new_node->ExtendedData->Visibility3d->v3Range[$nr]->from;
	        if (isset($new_node->ExtendedData->Visibility3d->v3Range[$nr]->to))$old_node->ExtendedData->Visibility3d->v3Range[$nr]->to=  $new_node->ExtendedData->Visibility3d->v3Range[$nr]->to;
	      }
*/
	      $nr=0;
	      foreach ($new_node->ExtendedData->Visibility3d->children() as $child) {
	        $old_node->ExtendedData->Visibility3d->v3Range[$nr]=      $child;
	        if (isset($child->from)) $old_node->ExtendedData->Visibility3d->v3Range[$nr]->from=$child->from;
	        if (isset($child->to))$old_node->ExtendedData->Visibility3d->v3Range[$nr]->to=     $child->to;
	        $nr++;
	      }
	    }
	    break;
	}
    }
}

file_put_contents($target_filename, $target_xml->asXML());

echo "ok";

?>
