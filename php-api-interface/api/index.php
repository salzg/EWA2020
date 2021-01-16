<?php
require '../vendor/autoload.php';
require '../src/config/db.php';

$app = new \Slim\App;

// Bookshop Routes
require '../src/routes/books.php';
$app->run();