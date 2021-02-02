<?php
use \Psr\Http\Message\ServerRequestInterface as Request;
use \Psr\Http\Message\ResponseInterface as Response;
use Stripe\Stripe;
require('C:\xampp20\htdocs\ewa\G10\datenadm\stripe-php-master\init.php');

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

$app->post('/buecher/createCustomerSession', function(Request $request, Response $response){
    $public_key_for_js="pk_test_51IAvUZI6i9IbqLeIEOBBOuG3kNykPJeDCdYvdL1jh39fus51WED08YPAfbii8O3oCHtRjAanzM2pYTbHAkwGa1GX00RX1dDYId";
    \Stripe\Stripe::setApiKey('sk_test_51IAvUZI6i9IbqLeIycz6g0kACG4sWLbaNKkhnKqkBBYAqUT4bPOo4XZwwTc4av1MwB5DG4SJuLdLuyU75DiuHBsc00nlCR9PAY');
    
    /* db check

    //get price from db, get name from db
    $line = $request->getParam('line_items');
    
    //dont forget to set currency on each line item

    $sql = "SELECT PreisBrutto, Produktitel FROM buecher WHERE ProduktID";
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
    */
    try{
        $session = \Stripe\Checkout\Session::create([
            'payment_method_types' => ['card'],
            'line_items' => $request->getParam('line_items'),
            'success_url' => $request->getParam('success_url'),
            'cancel_url' => $request->getParam('cancel_url'),
            'mode' => 'payment',
        ]);
        return $response->withJson([ 'id' => $session->id ])->withStatus(200);

    }
    catch (\Stripe\Exception\ApiErrorException $e){
        echo "Error in Session::create() ";
        echo $e;
    }

});

$app->post('/buecher/createTraderSession', function(Request $request, Response $response){
    $public_key_for_js="pk_test_aLcPqdtG2FDzxPWu5N9OBNOs00Yt0nKnhS";
    \Stripe\Stripe::setApiKey('sk_test_cFnCai0Ye9NM8Tn9CMo6k0fn00P0R9pt9u');
    
    //get price from db, get name from db
    //$line = $request->getParam('line_items');

    /* start of code to insure price is actually price from trader
    // https://ivm108.informatik.htw-dresden.de/vue20/restful/api/books
    try{
        // get data from trader 
        $trader = file_get_contents("https://ivm108.informatik.htw-dresden.de/vue20/restful/api/books");
        $traderdata = json_decode($trader,null,512,0);
        $price=100*$traderdata["price"];
        $line = json_decode($line);
        for($i=0;i)
        $line["price_data"]["currency"]="eur";
        $line["price_data"]["unit_amount"]=$price
        
    } catch(Exception $e){
        echo '{"error": {"text": '.$e->getMessage().'}';
    }
    */
    try{
        $session = \Stripe\Checkout\Session::create([
            'payment_method_types' => ['card'],
            'line_items' => $request->getParam('line_items'),
            'success_url' => $request->getParam('success_url'),
            'cancel_url' => $request->getParam('cancel_url'),
            'mode' => 'payment',
        ]);
        return $response->withJson([ 'id' => $session->id ])->withStatus(200);

    }
    catch (\Stripe\Exception\ApiErrorException $e){
        echo "Error in Session::create() ";
        echo $e;
    }

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
    $mwst = 7;
    $priceBrutto=$price*(1+($mwst/100));
    $sql = "INSERT INTO buecher (ProduktID, Produkttitel, Autorname, Produktcode, Verlagsname, PreisNetto, Mwstsatz, PreisBrutto) VALUES
    (:bid, :title, :author, :isbn, :publisher, :price, :mwst, :priceBrutto)";
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
        $stmt->bindParam(':mwst', $mwst);
        $stmt->bindParam(':priceBrutto', $priceBrutto);
        $stmt->execute();
        echo '{"notice": {"text": "Buch übertragen"}';
    } catch(PDOException $e){
        echo '{"error": {"text": '.$e->getMessage().'}';
    }
});

// Buch vom Großhändler in lokales Lager aufnehmen
$app->post('/buecher/order', function(Request $request, Response $response){
    $isbn = $request->getParam('isbn');
	$quantity = $request->getParam('quantity');
    
    $sql = "UPDATE buecher SET Lagerbestand=Lagerbestand+:quantity WHERE Produktcode=:isbn";
    try{
        // Get DB Object
        $db = new db();
        // Connect
        $db = $db->connect();
        $stmt = $db->prepare($sql);
		$stmt->bindParam(':isbn', $isbn);
        $stmt->bindParam(':quantity', $quantity);
        $stmt->execute();
        echo '{"notice": {"text": "Buch im Lager aufgestockt"}';
    } catch(PDOException $e){
        echo '{"error": {"text": '.$e->getMessage().'}';
    }
});