<?php
/*
*! -----------------------------------------------------------------------------**
*! FILE NAME  : store_marks.php
*! REVISION   : 1.0
*! DESCRIPTION: save marks for manual position and orientation
*! Copyright (C) 2017 Elphel, Inc.
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

$model = $_GET['model'];

$marks_file = "models/$model/marks.xml";

$contents = file_get_contents('php://input');

if (!preg_match("/\//",$model)){

  $result = file_put_contents($marks_file,$contents);
  if (!$result) {
    die("-1");
  }else{
    die("0");
  }

}else{

  die("-2");

}

?>
