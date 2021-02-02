
var einkaufDict = [];

// register modal component
Vue.component('modal', {
    template: '#modal-template'
})

var app = new Vue({
    el: "#app",
    data: {
        products: [],
        search: "", // Titel, ISBN, Sprache
        search2: 99.99, // Preisgrenze setzen
        transactions: "", // Startwert fuer Transaktionen
        showModal: false, // Bestätigungsmeldung einblenden
        transferStatus: false, // Status der Buchübertragung
        timestamp : "",
        sum: 0,
        shoptitel: "Buchshop G03",
        dict: [],
        bestandDict: []
    },
    methods: {
        fetchData(){
            fetch("../datenadm/restshop/api/buecher")
            .then(response => response.json())
            .then((data) => {
                this.products = data;
                this.initBestand();
            })
        },
        
        initBestand(){
            for(var i=0; i < this.products.length; i++){
                this.bestandDict.push({id: this.products[i].ProduktID, bestand: this.products[i].Lagerbestand});
            }
            //console.log(this.bestandDict);
        },
        
        getCodeById(id){
            for(var i=0; i < this.products.length; i++){
                if(this.products[i].ProduktID == id){
                    return this.products[i].Produktcode;
                };
            }
        },
        
        getElDictInd(id){
            for(var i=0; i < this.dict.length; i++){
                if(this.dict[i].id == id){
                    return i;
                }
            }
            return -1;
        },
                        
        getElEinkaufDictInd(id){
            for(var i=0; i < einkaufDict.length; i++){
                if(einkaufDict[i].id == id){
                    return i;
                }
            }
            return -1;
        },
        
        getElTitle(id){
            for(var i=0; i < this.products.length; i++){
                if(this.products[i].ProduktID == id){
                    return this.products[i].Produkttitel;
                }
            }
            return 0;
        },
        
        getProdIndById(id){
            for(var i=0; i < this.products.length; i++){
                if(this.products[i].ProduktID == id){
                    return i;
                }
            }
            return -1;
        },
        
        calcCart(){
            let su = 0
            for(var i=0; i < this.dict.length; i++){
                su = su + Number(this.dict[i].price);
            }
            su = su.toFixed(2);
            //console.log(su);
            return su;
        },
        
        increase(prodId){
            let ind = this.getElDictInd(prodId);
            let einkaufInd = this.getElEinkaufDictInd(prodId);
            let prodInd = this.getProdIndById(prodId);
            let tit = this.products[prodInd].Produkttitel;
            let pri = this.products[prodInd].PreisBrutto;
            let lagerbestand = this.products[prodInd].Lagerbestand;
            if(lagerbestand > 0){
                if(ind >= 0){
                    this.dict[ind].num = this.dict[ind].num + 1;
                    this.dict[ind].price = (this.dict[ind].num * pri).toFixed(2);
                    einkaufDict[einkaufInd].item.quantity = this.dict[ind].num;
                }
                else{
                    if(tit != 0){					
                        this.dict.push({id: prodId, title: tit, num: 1, price: pri});
                        //{price_data: {currency: 'usd', product_data: {name: 'T-Shirt'} ,unit_amount: '2000'},quantity: '1'}
                        einkaufDict.push({id: prodId, item: {price_data: {currency: 'usd', product_data: {name: tit} ,unit_amount: pri},quantity: 1}, code: this.getCodeById(prodId)});
                    }
                }
                this.products[prodInd].Lagerbestand = lagerbestand - 1;
            }
            //console.log(this.products[prodInd].Lagerbestand);
            //console.log(this.dict);
            this.sum = this.calcCart();
        },
        decrease(prodId){
            let ind = this.getElDictInd(prodId);
            let einkaufInd = this.getElEinkaufDictInd(prodId);
            let prodInd = this.getProdIndById(prodId);
            let pri = this.products[prodInd].PreisBrutto;
            let lagerbestand = this.products[prodInd].Lagerbestand;
            if(ind >= 0){
                if(this.dict[ind].num > 0){
                    this.dict[ind].num = this.dict[ind].num - 1;
                    this.dict[ind].price = (this.dict[ind].num * pri).toFixed(2);
                    einkaufDict[einkaufInd].item.quantity = this.dict[ind].num;
                    einkaufDict[einkaufInd].price = (this.dict[ind].num * pri).toFixed(2);
                }
            }
            if(this.bestandDict[prodInd].bestand > lagerbestand){
                this.products[prodInd].Lagerbestand = lagerbestand + 1;
            }
            //console.log(this.products[prodInd].Lagerbestand)
            this.sum = this.calcCart();
        },
        now(){
            const today = new Date();
            const date = today.getDate()
                            + '.'+(today.getMonth()+1)
                            + '.'+today.getFullYear();
            const time = today.getHours() 
                            + ":" + today.getMinutes()
                            + ":" + today.getSeconds();
            const dateTime = "Datum: " + date +' Uhrzeit: '+ time;
            this.timestamp  = dateTime;
        }
    },
    created () {
            setInterval(this.now, 1000);
    },
    mounted () {
            this.fetchData();
    },
    
    computed: {
        filteredBooks(){ // Suchfilter mit zwei Eingabefeldern search und search2
            return this.products.filter((product) => {
                //console.log(this.products[0].Produkttitel)
                return (product.Produkttitel.match(new RegExp(this.search, 'i')))
                && (product.PreisBrutto <= parseFloat(this.search2));
            });
        }
    }
});

// Create an instance of the Stripe object with your publishable API key
var stripe = Stripe('pk_test_aLcPqdtG2FDzxPWu5N9OBNOs00Yt0nKnhS');
var checkoutButton = document.getElementById('checkout-button');

checkoutButton.addEventListener('click', function() {
    // Create a new Checkout Session using the server-side endpoint you
    // created in step 3.
    var data = {};
    var lineitems = [];
    
    //data = [['card'],[{price_data: {currency: 'usd', product_data: {name: 'T-Shirt'} ,unit_amount: '2000'},quantity: '1'},{price_data: {currency: 'usd', product_data: {name: 'T-Shirt2'} ,unit_amount: '4000'},quantity: '5'}],'payment','http://success.php', 'http://cancel.php'];		
    
    console.log(einkaufDict);
    
    for(var i=0; i < einkaufDict.length; i++){
        if(einkaufDict[i].item.quantity > 0){
            einkaufDict[i].item.quantity = String(einkaufDict[i].item.quantity);
            console.log(einkaufDict[i].item.price_data.unit_amount);
            einkaufDict[i].item.price_data.unit_amount = parseFloat(einkaufDict[i].item.price_data.unit_amount)* 100;
            lineitems.push(einkaufDict[i].item);
        }
    }
    
    console.log(lineitems);
    
    if(lineitems.length > 0){
    
        data = [['card'],lineitems,'payment','https://iws107.informatik.htw-dresden.de/ewa/G03/eigeneVerwaltung/success.php', 'https://iws107.informatik.htw-dresden.de/ewa/G03/eigeneVerwaltung/cancel.php'];		
        
        //Beim Großhändler nachbestellen
        for(var i=0; i < einkaufDict.length; i++){
            nachBestellData = {isbn: einkaufDict[i].code, quantity: parseInt(einkaufDict[i].item.quantity), cid: "03", cname: "G03-Shop"};
            
            
            fetch("https://ivm108.informatik.htw-dresden.de/vue20/restful/api/book/order", {
                body: JSON.stringify(nachBestellData),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            
            })		
            .then(response => response.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    console.log("Großhändlerbestellung");
                    console.log(bestellData);
                } catch(err) {
                    console.log(text);
                }
            })
            
            
            console.log(nachBestellData);
        }

        //Lagerbestand aktualisieren
        for(var i=0; i < einkaufDict.length; i++){
            bestellData = {bestellzahl: parseInt(einkaufDict[i].item.quantity), produktID: einkaufDict[i].id};
            fetch("../datenadm/restshop/api/buecher/bestellung", {
                body: JSON.stringify(bestellData),
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            })
            .then(response => response.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    console.log("Lageraenderung");
                    console.log(bestellData);
                } catch(err) {
                    console.log(text);
                }
            })
        }
        
        
        console.log(JSON.stringify(data));
        fetch('../datenadm/kaufen/api/create-checkout-session', {
            body: JSON.stringify(data),
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then(function(response) {
            console.log("da");
            return response.json();
        })
        .then(function(session) {
            console.log("hier");
            return stripe.redirectToCheckout({ sessionId: session.id });
        })
        .then(function(result) {
            // If `redirectToCheckout` fails due to a browser or network
            // error, you should display the localized error message to your
            // customer using `error.message`.
            if (result.error) {
                alert(result.error.message);
            }
                                
        })
        .catch(function(error) {
            console.error('Error:', error);
        });
    }			
});