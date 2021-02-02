// register modal component
Vue.component('modal', {
	template: '#modal-template'
})

var app = new Vue({
    el: "#app",
    data: {
		shoptitel: 'Hollas & Söhne',
		products: [],
		customer: true,
		shoppingCart: [],

		products:[], //import from own db
		books:[], //import from store
		transactions: "",
		search: "",
		search2: 99.99,

		transactions: "", // Startwert fuer Transaktionen
		showModal: false, // Bestätigungsmeldung einblenden
		transferStatus: false, // Status der Buchübertragung
		ip: "ivm108.informatik.htw-dresden.de", // IP des HOST Rechners
		unsereip: "iws107.informatik.htw-dresden.de",

		modalMessage: null,
		modalError: false,

		stripeSession: null

    },
    methods: {
		fetchData(){
			fetch("https://iws107.informatik.htw-dresden.de/ewa/G10/datenadm/restshop/api/buecher")
			.then(response => response.json())
			.then((data) => {
			  this.products = data;
			  //console.log(this.filteredproducts);
			  for(let i=0; i<this.products.length;i++){
				  this.products[i].orderAmount=0;
				  console.log(this.products[i].orderAmount);
			  }
			})
		},

		//grosshandel

		fetchTraderData(){
			fetch("https://"+this.ip+"/vue20/restful/api/books") // Api-Request
			.then(response => response.json())
			.then((data) => {
			  this.books = data;
			})
		},

		fetchTransactions(){
			fetch("https://"+this.ip+"/vue20/restful/api/transactions") // Api-Request
			.then(response => response.json())
			.then((data) => {
			  this.transactions = data[0].oid;
			})
		},

		addToShoppingCart(id, amount){
			let p = this.products.find( prod => prod.ProduktID === id );
			if(p.Lagerbestand >= amount){
				p.Lagerbestand-=amount;
				p.orderAmount+=amount;
				this.updateShoppingCart();
			}
		},
		removeFromShoppingCart(id, amount){
			let p = this.products.find( prod => prod.ProduktID === id);
			if(p.orderAmount >= amount){
				p.Lagerbestand+=amount;
				p.orderAmount-=amount;
				this.updateShoppingCart();
			}
			
		},

		updateShoppingCart(){
			this.shoppingCart = this.products.filter(p => p.orderAmount > 0);
		},

		emptyShoppingCart(){
			this.shoppingCart.forEach(p=> {
				this.removeFromShoppingCart(p.ProduktID,p.orderAmount)
			});
			
		},

		switchUser(){
			this.customer=!this.customer;
			this.changeStripeSession();
		},

		changeStripeSession(){
			if(this.customer){
				this.stripeSession = Stripe('pk_test_51IAvUZI6i9IbqLeIEOBBOuG3kNykPJeDCdYvdL1jh39fus51WED08YPAfbii8O3oCHtRjAanzM2pYTbHAkwGa1GX00RX1dDYId');
			}
			else{
				this.stripeSession = Stripe('pk_test_aLcPqdtG2FDzxPWu5N9OBNOs00Yt0nKnhS');
			}

		},

		transferBook(book) {
			data = {
				bid:book.bid, title:book.title, author:book.author, isbn:book.isbn,
				publisher:book.publisher, language:book.language,
				price:book.price.replace(/\,/g, '.')  // Komma in Punkt umwandeln
			};
			fetch("https://iws107.informatik.htw-dresden.de/ewa/G10/datenadm/restshop/api/buecher/transfer", {
			  
			  body: JSON.stringify(data),
			  method: "POST",
			  headers: {
				"Content-Type": "application/json",
			  },
			})
			.then(response => response.text())
			.then(text => {
				try {
					const responseData = JSON.parse(text+"}");
					this.modalMessage = `${book.title} wird nun auch von uns angeboten!`;
					this.transferStatus = true;
					this.modalError=false;
					console.log(data);
				} catch(err) {
				   console.log(text);
				   this.transferStatus = false;
				   this.modalMessage = "ZOMG! Importfehler";
				   this.modalError=true;
				   console.error(err);
				}
			})

		},

		orderFromUs(){
			let data={};
			let line_items_here=[];

			//bring data to stripe structure
			//currency, name is productid
			for(let i=0; i<this.shoppingCart.length;i++){
				var kek={};
				kek.quantity=parseFloat(this.shoppingCart[i].orderAmount);
				kek.price_data={};
				kek.price_data.product_data={};
				kek.price_data.currency='eur';
				kek.price_data.product_data.name=this.shoppingCart[i].ProduktID;
				kek.price_data.product_data.images= ['https://i.imgur.com/SR0YwEv.jpg'];
				kek.price_data.unit_amount=parseFloat(this.shoppingCart[i].PreisBrutto*100);
				line_items_here.push(kek);
			}
			console.log(line_items_here);
			data={payment_method_types: ["card"], line_items:line_items_here, success_url:"https://iws107.informatik.htw-dresden.de/ewa/G10/Beleg/success.php", cancel_url:"https://iws107.informatik.htw-dresden.de/ewa/G10/Beleg/cancel.php"};
			console.log(JSON.stringify(data));

			console.log('beginning fetch post on create session');
			fetch('https://iws107.informatik.htw-dresden.de/ewa/G10/datenadm/restshop/api/buecher/createCustomerSession',{
				body: JSON.stringify(data),
				method: 'POST',
				headers: {
					"Content-Type": "application/json",
				},
			})
			.then(response => response.json())
			.then(session => {
				return this.stripeSession.redirectToCheckout({sessionId: session.id});
			});
			console.log('done fetch post on create session');
			
		},

		orderFromTrader(formSubmitEvent){
			let isbn = formSubmitEvent.target.elements.isbn.value;
			let quantity = formSubmitEvent.target.elements.quantity.value;
			let cid = formSubmitEvent.target.elements.cid.value;
			let cname = formSubmitEvent.target.elements.cname.value;
			
			let requestdata={isbn, quantity,cid,cname};

			fetch("https://ivm108.informatik.htw-dresden.de/vue20/restful/api/book/order", {
				body: JSON.stringify(requestdata),
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			})
			.then(response => response.text())
			.then(data => console.log(data));

			fetch("https://iws107.informatik.htw-dresden.de/ewa/G10/datenadm/restshop/api/buecher/order", {
				body: JSON.stringify(requestdata),
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			})
			.then(response => response.text())
			.then(data => {
				console.warn(data);
				this.modalMessage = `ISBN: ${isbn}: Erfolgreich ${quantity} Bücher bestellt`;
					this.modalError = false;
					if(data.error){
						this.modalMessage = `Fehler lol! ${data.error}`;
						this.modalError = true;
				}
			});

			let data={};
			let line_items_here=[];

			//bring data to stripe structure
			//currency, name is productid
			var kek={};
			kek.quantity=parseFloat(quantity);

			//price is supposed to be fetched through server to insure consistency, just prepare structure
			kek.price_data={};
			kek.price_data.product_data={};
			kek.price_data.currency='eur';
			kek.price_data.product_data.name=isbn;
			kek.price_data.product_data.images= ['https://i.imgur.com/SR0YwEv.jpg'];
			let price =0;
			for(let i=0;i<this.books.length;i++){
				if(this.books[i].isbn===isbn) price=this.books[i].price;
			}
			console.log(price);
			kek.price_data.unit_amount=100*price;
			line_items_here.push(kek);


			console.log(line_items_here);

			data={payment_method_types: ["card"], line_items:line_items_here, success_url:"https://iws107.informatik.htw-dresden.de/ewa/G10/Beleg/success.php", cancel_url:"https://iws107.informatik.htw-dresden.de/ewa/G10/Beleg/cancel.php"};
			console.log(JSON.stringify(data));

			console.log('beginning fetch post on create session');
			fetch('https://iws107.informatik.htw-dresden.de/ewa/G10/datenadm/restshop/api/buecher/createTraderSession',{
				body: JSON.stringify(data),
				method: 'POST',
				headers: {
					"Content-Type": "application/json",
				},
			})
			.then(response => response.json())
			.then(session => {
				console.log(data);
				return this.stripeSession.redirectToCheckout({sessionId: session.id});
			});
			console.log('done fetch post on create session');


		},

		revenue(price, quantity) { // berechnet Bestandswerte
			return Math.round(price*quantity*100)/100;
		},
		startInterval() {
		   setInterval(() => {
				this.fetchData();
				this.fetchTransactions();
			}, 1000);
		}		

	},
	computed: {
		filteredProducts(){
			return this.products.filter((p) =>{
				return (p.Produkttitel.match(new RegExp(this.search, 'i')) ||
				p.Produktcode.match(new RegExp(this.search, 'i'))) //||
				//p.Sprache.match(new RegExp(this.search, 'i')))
				&& (p.PreisBrutto <= parseFloat(this.search2));
			});
		},
		filteredBooks(){
			return this.books.filter((p) =>{
				return (p.title.match(new RegExp(this.search, 'i')) ||
				p.isbn.match(new RegExp(this.search, 'i')) ||
				p.language.match(new RegExp(this.search, 'i')))
				&& (p.price <= parseFloat(this.search2));
			});
		},
		shippingCosts(){
			let shippingCosts = 0.00;			
			if(this.cartCost<25) shippingCosts=3.99;
			return shippingCosts;
		},
		cartCost(){
			let cost=0.0;
			this.shoppingCart.forEach(p => {
				cost+=p.orderAmount*p.PreisBrutto;
			});
			return cost;
		}
	},
	/*created () {
			setInterval(this.now, 1000);
	},*/
	mounted () {
			this.fetchData();
			this.fetchTraderData();
			this.fetchTransactions();
			this.changeStripeSession();
	},
});
/*
var stripe = Stripe('pk_test_aLcPqdtG2FDzxPWu5N9OBNOs00Yt0nKnhS');
var coBtn = document.getElementById('checkoutBtn');
coBtn.addEventListener('click', function(){
	fetch("/create-checkout-session", {
        method: "POST",
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (session) {
          return stripe.redirectToCheckout({ sessionId: session.id });
        })
        .then(function (result) {
          // If redirectToCheckout fails due to a browser or network
          // error, you should display the localized error message to your
          // customer using error.message.
          if (result.error) {
            alert(result.error.message);
          }
        })
        .catch(function (error) {
          console.error("Error:", error);
        });


})*/