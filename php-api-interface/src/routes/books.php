<?php
use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;
$app = new \Slim\App;

$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});
$app->add(function ($req, $res, $next) {
    $response = $next($req, $res);
    return $response
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
});


// Vergügbaren Bücher im lokalen Shop anzeigen
$app->get('/buecher', function(Request $request, Response $response){
    $sql = "SELECT * FROM buecher";
    try{
        // Get DB Object
        $db = new db();
        // Connect
        $db = $db->connect();
        $stmt = $db->query($sql);
        $books = $stmt->fetchAll(PDO::FETCH_OBJ);
        $db = null;
        echo json_encode($books);
    } catch(PDOException $e){
        echo '{"error": {"text": '.$e->getMessage().'}';
    }
});

// Buch vom Großhändler in den lokalen Shop übertragen
$app->post('/buecher/transfer', function(Request $request, Response $response){
    $bid = $request->getParam('bid');
	$title = $request->getParam('title');
    $author = $request->getParam('author');
    $isbn = $request->getParam('isbn');
    $publisher = $request->getParam('publisher');
    $language = $request->getParam('language');
    $price = $request->getParam('price');
    $sql = "INSERT INTO buecher (ProduktID, Produkttitel, Autorname, Produktcode, Verlagsname, PreisNetto) VALUES
    (:bid, :title, :author, :isbn, :publisher, :price)";
    try{
        // Get DB Object
        $db = new db();
        // Connect
        $db = $db->connect();
        $stmt = $db->prepare($sql);
		$stmt->bindParam(':bid', $bid);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':author', $author);
        $stmt->bindParam(':isbn', $isbn);
        $stmt->bindParam(':publisher', $publisher);
        $stmt->bindParam(':price', $price);
        $stmt->execute();
        echo '{"notice": {"text": "Buch übertragen"}';
    } catch(PDOException $e){
        echo '{"error": {"text": '.$e->getMessage().'}';
    }
});
