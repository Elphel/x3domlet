<?php

  $path = "";
  $sufx = "D0.0.jpeg";
  $interval = 100;

  if (isset($_GET['path'])) $path = $_GET['path'];
  if (isset($_GET['sufx'])) $sufx = $_GET['sufx'];

  $interval = (isset($_GET['interval']))?$_GET['interval']:"100";

  $files = glob("$path*$sufx");
  $n = count($files);

  $quad_order = array(0,1,3,2);
  $qo = count($quad_order);

  $order = array();
  for($i=0;$i<$n;$i++){
    array_push($order,$quad_order[$i%$qo]+$qo*((int)($i/$qo)));
  }

  $order = "[".implode(',',$order)."]";

?>

<!DOCTYPE HTML>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <title>Loop slideshow</title>

    <!--<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">-->

    <script type='text/javascript' src='js/jquery/jquery-3.1.1.js'></script>
    <script type='text/javascript' src='js/jquery-ui/jquery-ui.js'></script>
    <script type='text/javascript' src='js/playloop.js'></script>

    <link rel='stylesheet' type='text/css' href='js/playloop.css'></link>

  </head>
  <body>

    <div id='rotator'>
    </div>

    <script>

      var SETTINGS = {
        'path'   : "<?php echo $path;?>",
        'sufx'   : "<?php echo $sufx;?>",
        'n'      : <?php echo $n;?>,
        'interval' : <?php echo $interval;?>,
        'order': <?php echo $order."\n";?>
      }

    </script>

  </body>
</html>

