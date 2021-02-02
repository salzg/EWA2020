// register modal component
Vue.component('modal', {
  template: '#modal-template'
})

// start app
const app = new Vue({
    el: "#app",
    data: {
		books: [], // fuer die Daten aus der API
		search: "", // Titel, ISBN, Sprache
		search2: 99.99, // Preisgrenze setzen
		transactions: "", // Startwert fuer Transaktionen
		showModal: false, // Bestätigungsmeldung einblenden
		transferStatus: false, // Status der Buchübertragung
		ip: "ivm108.informatik.htw-dresden.de", // IP des HOST Rechners
		unsereip: "iws107.informatik.htw-dresden.de"
    },
    methods: {
		fetchData(){
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
					const data = JSON.parse(text);
					this.transferStatus = true;
					console.log(data);
				} catch(err) {
				   console.log(text);
				   this.transferStatus = false;
				}
			})
		},
		/*
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
		}
		*/
		revenue(price, quantity) { // berechnet Bestandswerte
			return Math.round(price*quantity*100)/100;
		},
		startInterval() {
		   setInterval(() => {
				this.fetchData();
				this.fetchTransactions();
			}, 1000);
		},
	},
	mounted() {
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