var app = new Vue({
    el: "#app",
    data: {
		kunde: true,
		products: [],
		filteredproducts: [],
		timestamp : "",
		shoptitel : "Flourish & Blotts",
		activeFilter : null,
		shoppingCart: [],
		ourIp: "iws107.informatik.htw-dresden.de",
		shippingCosts: 0,
		blockOrdering: false,
		modalMessage: null,
		modalError: false,
		currentSortOrder: 'ProduktTitel',

		books: [], // fuer die Daten aus der API
          search: "", // Titel, ISBN, Sprache
          search2: 99.99, // Preisgrenze setzen
          transactions: "", // Startwert fuer Transaktionen
          showModal: false, // BestÃ¤tigungsmeldung einblenden
          transferStatus: false, // Status der BuchÃ¼bertragung
          ip: "ivm108.informatik.htw-dresden.de" // IP des HOST Rechners
    },
    methods: {
		fetchData(){
			return fetch("https://iws107.informatik.htw-dresden.de/ewa/G06/datenadm/restshop/api/buecher")
			.then(response => response.json())
			.then((data) => {
			  let dataWithOrder = data.map(d => {return {...d, "orderAmount": 0}});
			  this.products = dataWithOrder;
			  this.filteredproducts = this.products;
			  this.updateShoppingCart();
			})
		},
		sortBy(value){
			if(value){
				this.currentSortOrder = value;
			}
			let sortValue = this.currentSortOrder;

			this.filteredproducts.sort((a,b)=> {

				var nameA = a[sortValue];
				var nameB = b[sortValue];
				if(Number.isNaN(+nameA)){
					nameA = nameA.toUpperCase(); // Groß-/Kleinschreibung ignorieren
					nameB = nameB.toUpperCase()
				}else{
					nameA = +nameA
					nameB = +nameB
				}

				if (nameA < nameB) {
					return -1;
				}
				if (nameA > nameB) {
					return 1;
				}

  				// Namen müssen gleich sein
  				return 0;
			});
		},
		updateLocalData(){
			let orders = this.products.filter(book => book.orderAmount > 0).map(book => {return {isbn: book.ProduktCode, orderAmount: book.orderAmount}});

			this.fetchData().then(() => this.restoreShoppingCart(orders));
		},
		restoreShoppingCart(orders){
			let notEnough = [];
			orders.forEach(orderItem => {
				let book = this.products.find(book => book.ProduktCode == orderItem.isbn);
				if(book.Lagerbestand >= orderItem.orderAmount){
					book.orderAmount = orderItem.orderAmount;
					book.Lagerbestand -= orderItem.orderAmount;
				}else{
					notEnough.push({title: book.ProduktTitel, supply: book.Lagerbestand, wanted: orderItem.orderAmount})
				}
			});
			if(notEnough.length){
				let changeString = notEnough.map(el => `Buch: ${el.title} - Sie wollten: ${el.wanted} - leider nur noch ${el.supply} verfügbar!
				`).join('')
				this.modalMessage = `Ihr Warenkorb wurde aktualisiert, da wir nun weniger Produkte verfügbar sind, als Sie ausgewählt haben!
				 ${changeString}`;
			}
			this.updateShoppingCart();

		},
		emptyShoppingCart(){
			this.products.forEach(prod => prod.orderAmount = 0);
			this.updateShoppingCart();
		},
		removeCookieNotice(){
			console.log(`remove`)
			document.querySelector('#cookieNotice').remove();
		},
		orderFromGrossHandler(submitEvent){
			let formValues = submitEvent.target.elements;

			let isbn = formValues.isbn.value;
			let quantity = formValues.quantity.value;
			let cid = formValues.cid.value;
			let cname = formValues.cname.value;

			let post = {
				isbn, quantity, cid, cname
			}

			const requestOptions = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(post)
			  };
			  fetch("https://ivm108.informatik.htw-dresden.de/vue20/restful/api/book/order", requestOptions)
				.then(response => response.json())
				.then(data => console.log(data));

			  fetch("https://"+this.ourIp+"/ewa/G06/datenadm/restshop/api/buecher/order", requestOptions)
				.then(response => {
					return response.json()})
				.then(data => {
					console.warn(data);
					this.modalMessage = `Erfolgreich ${data.quantity} Bücher mit der ISBN: ${isbn} bestellt`;
					this.modalError = false;
					if(data.error){
						this.modalMessage = `Fehler! ${data.error}`;
						this.modalError = true;
					}
				});

		},
		switchUser(){
			this.kunde = !this.kunde;
			if(this.kunde){
				this.updateLocalData();
			}
		},
		updateFilter(){
			let matchingTitles = this.products.filter(book => {
				if(this.activeFilter){
					return book.Autorname.toLowerCase().includes(this.activeFilter.toLowerCase())
				} else{
					return true;
				}
			});

			let matchingAuthors= this.products.filter(book => {
				if(this.activeFilter){
					return book.ProduktTitel.toLowerCase().includes(this.activeFilter.toLowerCase())
				} else{
					return true;
				}
			});

			let verlag = this.products.filter(book => {
				if(this.activeFilter){
					return book.Verlagsname.toLowerCase().includes(this.activeFilter.toLowerCase())
				} else{
					return true;
				}
			});

			let matchingPrice = this.products.filter(book => {
				if(this.activeFilter && !Number.isNaN(+this.activeFilter)){
					let bounds = [
						+book.Preis_Brutto + 0.1 * +book.Preis_Brutto,
						+book.Preis_Brutto - 0.1 * +book.Preis_Brutto
					];

					let inBounds = +this.activeFilter < bounds[0] && +this.activeFilter >  bounds[1];
					let sameEuro = Math.floor(+this.activeFilter) === Math.floor(+book.Preis_Brutto);
					return inBounds || sameEuro;
				} else{
					return false;
				}
			});
			
			let concatList = matchingTitles.concat(matchingAuthors).concat(matchingPrice).concat(verlag);

			this.filteredproducts = Array.from(new Set(concatList));
			this.sortBy();
		},
		addToShoppingCart(id){
			const product = this.products.find( prod => prod.ProduktID === id);
			if(product.Lagerbestand > 0){
			product.Lagerbestand--;
			product.orderAmount++;
			}
			
			this.updateShoppingCart();
		},
		removeFromShoppingCart(id){
			const product = this.products.find( prod => prod.ProduktID === id);
			if(product.orderAmount > 0){
				product.Lagerbestand++;
				product.orderAmount--;
			}

			this.updateShoppingCart();
		},
		updateShoppingCart(){
			this.shoppingCart = this.products.filter(book => book.orderAmount > 0);
			this.updateFilter();
			this.calculateShipping();
			this.sortBy();
		},

		sendOrderToBackend(){
			let orderData = this.shoppingCart.map(book => {
				return {
					isbn: book.ProduktCode,
					quantity: book.orderAmount
				}
			});

			const requestOptions = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(orderData)
			  };
			  fetch("https://"+this.ourIp+"/ewa/G06/datenadm/restshop/api/order", requestOptions)
				.then(response => response.json())
				.then(data => console.log(data));
		},

		calculateShipping(){
			let weight = this.shoppingCart.reduce((acc, curr) => acc + curr.orderAmount * (+curr.Gewicht), 0);
			let shippingCosts = 0;
			
			if(weight >= 7000) {
				this.blockOrdering = true;
				this.shippingCosts = 0;
				return;
			}

			if(weight < 7000) shippingCosts = 6.99;
			if(weight < 5000 ) shippingCosts = 4.99;
			if(weight < 2000) shippingCosts = 1;

			this.blockOrdering = false;

			this.shippingCosts = shippingCosts;
		},

		now(){
			const today = new Date();
			const date = today.getDate()
							+ '.'+(today.getMonth()+1)
							+ '.'+today.getFullYear();
			const seconds = today.getSeconds() < 10 ? "0"+today.getSeconds() : today.getSeconds();
			const minutes = today.getMinutes() < 10 ? "0"+today.getMinutes() : today.getMinutes();
			const time = today.getHours() 
							+ ":" + minutes
							+ ":" + seconds;
			const dateTime = "Datum: " + date +' Uhrzeit: '+ time;
			this.timestamp  = dateTime;
		},
		fetchGrosshasendlerData(){
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
		transferBook(book) {
			const data = {
				bid:book.bid, title:book.title, author:book.author, isbn:book.isbn,
				publisher:book.publisher, language:book.language,
				price:book.price.replace(/\,/g, '.')  // Komma in Punkt umwandeln
			};
			console.log(data)
			fetch("https://"+this.ourIp+"/ewa/G06/datenadm/restshop/api/buecher/transfer", {
				
			  body: JSON.stringify(data),
			  method: "POST",
			  headers: {
				"Content-Type": "application/json",
			  },
			})
			.then(response => {
				return response.text()})
			.then(text => {
				try {
					const responseData = JSON.parse(text);
					this.modalMessage = `Daten zum Buch ${book.title} wurde erfolgreich in unseren Shop importiert!`;
					this.modalError = false;
				} catch(err) {
					this.modalMessage = "Bei diesem Import ist etwas schief gegangen!";
					this.modalError = true;
					console.error(err);
				}
			})
		},
		revenue(price, quantity) { // berechnet Bestandswerte
			return Math.round(price*quantity*100)/100;
		},
		startInterval() {
		   setInterval(() => {
				this.fetchGrosshasendlerData();
				this.fetchTransactions();
			}, 1000);

			setInterval(() => this.updateLocalData(), 5000);
		},
	},
	created () {
			setInterval(this.now, 1000);
	},
	mounted () {
			this.fetchData();
			this.startInterval();
	},
	computed: {
		filteredBooks(){ // Suchfilter mit zwei Eingabefeldern search und search2
			return this.books.filter((book) => {
				return (book.title.match(new RegExp(this.search, 'i')) ||
				book.isbn.match(new RegExp(this.search, 'i')) ||
				book.language.match(new RegExp(this.search, 'i')))
				&& (book.price <= parseFloat(this.search2));
			});
		},

	}
});

Vue.filter('str_limit', function (value, size) {
	if (!value) return '';
	value = value.toString();
  
	if (value.length <= size) {
	  return value;
	}
	return value.substr(0, size) + '...';
  });