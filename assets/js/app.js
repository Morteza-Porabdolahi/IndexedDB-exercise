const $ = document;
const registerForm = $.querySelector(".register-form");

let db = null;

registerForm.addEventListener("submit", createUserData);

window.addEventListener("load", () => {
  initializeDatabase();
});

function initializeDatabase() {
  const dbOpenReq = indexedDB.open("sabzlearn", 1);

  dbOpenReq.onerror = ({ target: { err } }) => {
    if (err) throw err;
  };

  dbOpenReq.onsuccess = e => {
    db = e.target.result;

    getDatas();
  };

  dbOpenReq.onupgradeneeded = e => {
    db = e.target.result;

    console.log(
      `Database Upgraded from version ${e.oldVersion} to ${e.newVersion}`
    );

    if (!db.objectStoreNames.contains("users")) {
      usersObjStore = db.createObjectStore("users", { keyPath: "userId" });
    }
  };
}

function createUserData(e) {
  e.preventDefault();
  const formData = new FormData(registerForm);
  const newUser = Object.fromEntries(formData);

  if (validateFormInputs(newUser)) {
    newUser.userId = Math.floor(Math.random() * 1000);

    insertUserToDatabase(newUser);
  } else {
    alert("Please fill the inputs currectly !!");
  }
}

function validateFormInputs(userObj) {
  const validation = {
    age: false,
    password: false,
    name: false,
    family: false,
    email: false
  };
  let value = null;

  for (let key in userObj) {
    value = userObj[key];
    switch (key) {
      case "age": {
        if (value.trim() !== "" && !isNaN(+value)) validation.age = true;
        break;
      }
      case "name":
      case "family":
      case "city":
      case "password": {
        if (value && value.trim()) {
          validation[key] = true;
        }
        break;
      }
      case "email": {
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value))
          validation.email = true;
        break;
      }
    }
  }
  return !Object.values(validation).some(value => !value);
}

function insertUserToDatabase(newUser) {
  const transaction = createTransaction("users", "readwrite");
  const usersStore = transaction.objectStore("users");
  const userAddRequest = usersStore.add(newUser);

  userAddRequest.onsuccess = () => {
    clearInputs(registerForm);
    getDatas();
  };
}

function createTransaction(storeName = "", mode = "") {
  const transaction = db.transaction(storeName, mode);

  addErrorListenerToRequests(transaction);

  return transaction;
}

function addErrorListenerToRequests(request) {
  request.onerror = ({ target: { error: err } }) => {
    if (err) throw err;
  };
}

function getDatas() {
  const transaction = createTransaction("users", "readonly");
  const getAllDatasReq = transaction.objectStore("users").getAll();

  getAllDatasReq.onsuccess = e => {
    insertDatasIntoDom(e.target.result);
  };
  addErrorListenerToRequests(getAllDatasReq);
}

function insertDatasIntoDom(users) {
  const tableContainer = $.getElementById("usersTable");

  tableContainer.innerHTML = "";
  tableContainer.innerHTML += users
    .map(user => {
      return `<tr>
      <td>${user.userId}</td>
      <td>${user.name}</td>
      <td>${user.family}</td>
      <td>${user.age}</td>
      <td>${user.city}</td>
      <td>
      <span onclick="removeUser(event,${user.userId})" class="remove-btn btn">&times;</span>
      <span onclick="getUser(${user.userId})" class="update-btn btn">&larrlp;</span>
      </td>
    </tr>`;
    })
    .join("");
}

function removeUser(event, userId) {
  const transaction = createTransaction("users", "readwrite");
  const deleteRequest = transaction.objectStore("users").delete(userId);

  deleteRequest.onsuccess = () => event.target.closest("tr").remove();
  addErrorListenerToRequests(deleteRequest);
}

function clearInputs(formEl) {
  formEl.querySelectorAll("input").forEach(elem => (elem.value = ""));
}

function getUser(userId) {
  const transaction = createTransaction("users", "readwrite");
  const usersStore = transaction.objectStore("users");
  const getUserRequest = usersStore.get(userId);

  getUserRequest.onsuccess = e => {
    askForUserEdit(e.target.result, usersStore);
  };
  addErrorListenerToRequests(getUserRequest);
}

function askForUserEdit(user, usersStore) {
  const wannaEdit = prompt(
    `Wanna surely edit the user with id : ${user.userId} (Yes: 1 , No: 0)`
  );
  if (!isNaN(+wannaEdit) && +wannaEdit) {
    changeUserProps(user, usersStore);
  }
}

function changeUserProps(user, usersStore) {
  const whichProp = prompt(
    'What do you want to edit from user? (Name: 1 , Family: 2, Age: 3, City: 4) \n When your done, click "Cancel"'
  );

  if (whichProp && whichProp.trim() !== "" && !isNaN(+whichProp)) {
    const conditionStatus =
      +whichProp === 1
        ? "name"
        : +whichProp === 2 ? "family" : +whichProp === 3 ? "age" : "city";
    const newValueForProp = prompt(
      `Enter the new ${conditionStatus} for the user`
    );

    user[conditionStatus] = newValueForProp;

    if (validateFormInputs(user)) {
      updateUser(user, usersStore);
    } else {
      alert("Please fill the inputs currectly !!");
      changeUserProps(user, usersStore);
    }
  }
}

function updateUser(user, usersStore) {
  const updateUserReq = usersStore.put(user);

  updateUserReq.onsuccess = () => {
    getDatas();
    changeUserProps(user, usersStore);
  };
  addErrorListenerToRequests(updateUserReq);
}
