// creating a variable to determine the browser (chrome, firefox, edge, etc.) and how we will access the db through the window
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

//create a variable db
let db;

//creating request variable that opens our db and trying to find one "budget"
const request = indexedDB.open("budget", 1);

//creating an object store for the db we found
request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

//if we are successful in finding the request we will run the checkDatabase function
request.onsuccess = ({ target }) => {
  db = target.result;
  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

//log an error if it's not found
request.onerror = function (event) {
  console.log("Woops! " + event.target.errorCode);
};

//creating a transaction to read/write that is pending and the record is added to the db for use later
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}

//on success this runs
function checkDatabase() {
  //creating a transaction to read/write that is pending and the record is used now
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");

  //we are getting the data from the db
  //running the bulk api call and everything that was offline will be treated as if online
  const getAll = store.getAll();
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          return response.json();
        })
        .then(() => {
          // delete records if successful
          const transaction = db.transaction(["pending"], "readwrite");
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
}
// listen for app coming back online
window.addEventListener("online", checkDatabase);
