<?php

header("Content-Type: text/html; charset=utf-8");
require("accountdata.php"); // setzt password ==> bitte $password mit Ihrem PW selbst setzen !!! 
$showtable = true; // nur fÃ¼r Tests - Ausschalten fÃ¼r echte JSON-Generierung als Webservice !!!!
$db_link = mysqli_connect ("localhost", "G10", $password ,"g10");

// ##########################################################################
// Neu:  Bitte UTF8 erzwingen bei der DB-Kommunikation (siehe zeilen nach // )  !!!!!
// bei Verwendung nicht UTF8-konformer Daten (Ã¤Ã¶Ã¼ ??) generiert json_encode sonst nichts 
// und gibt nur false statt des JSON-strings zurÃ¼ck  !!!
// Laut PHP-Doku: https://www.php.net/manual/de/function.json-encode.php
// value: ...  Alle Strings mÃ¼ssen in UTF-8 kodiert sein-
//  Dank an Herrn Gailmann  fÃ¼r die Fehlersuche und - behebung
$db_link->query("SET NAMES 'utf8'"); 
$db_link->query("SET CHARACTER SET utf8");  
$db_link->query("SET SESSION collation_connection = 'utf8_unicode_ci'");
// ##########################################################################

echo '<label for="title">Title</label><br>
<input type="text" id="title" name="title"><br>
<label for="author">Author</label><br>
<input type="text" id="author" name="author">
<input type="submit" value="Submit">';

if(isset($_GET['detailID']))
{

    $showtable=false;
    $sqlprodukt = "SELECT * FROM buecher WHERE ProduktID = ".$_GET['detailID']."";
    $db_erg1 = mysqli_query( $db_link, $sqlprodukt );
    while ($zeile = mysqli_fetch_array( $db_erg1))
    {
        echo "bla";
        echo "<table border="1"><tr>";
        echo "<td>". $zeile['ProduktID'] . "</td><td>".$zeile['Produktcode']."</td><td>".$zeile['Produkttitel']."</td><td>".$zeile['Autorname']."</td>";
        echo "<td>".$zeile['Verlagsname']."</td><td>".$zeile['PreisNetto']."</td><td>".$zeile['Mwstsatz']."</td><td>".$zeile['PreisBrutto']."</td>";
        echo "<td>".$zeile['Lagerbestand']."</td><td>".$zeile['Kurzinhalt']."</td><td>".$zeile['Gewicht']."</td><td>".$zeile['LinkGrafikdatei']."</td>";
        echo "</tr></table>";
    }
}
 
$sql = "SELECT * FROM buecher";
 
$db_erg = mysqli_query( $db_link, $sql );
if ( ! $db_erg )
{
  die('UngÃ¼ltige Abfrage: ' . mysqli_error());
}
$dbdaten = array();   // neues Array fÃ¼r JSON-Ausgabe 
 



 
if ($showtable)  echo '<table border="1">';

while ($zeile = mysqli_fetch_array( $db_erg))
{
if ($showtable)
 {echo "<tr>";
  echo "<td>". $zeile['ProduktID'] . "</td>";
  echo "<td><a href='?detailID=" . $zeile['ProduktID'] .  "'>" . $zeile['Produkttitel'] . "</a></td>";
  echo "<td>". $zeile['Lagerbestand'] . "</td>";
  echo "</tr>";
  } 
  $dbdaten[] = $zeile; // DB-Daten zeilenweise komplett in neues Array Ã¼bertragen 
}
if ($showtable) echo "</table>";

/*
// Ausgabe der Daten als JSON 
$dbdaten_as_json = json_encode($dbdaten);
echo $dbdaten_as_json;
// print_r ( $db_erg);

// Optional : Ablage der JSON-Daten in einer Datei auf dem Server fÃ¼r Testzwecke 
// kann deaktiviert werden 
$datei = fopen("dbjson.txt","w"); 
$written =  fwrite($datei, $dbdaten_as_json);
fclose($datei); 
 */

 mysqli_free_result( $db_erg );
?>