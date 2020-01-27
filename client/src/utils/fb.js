import { LOG } from "./logging.js";

const fbConfig = {
	apiKey: "AIzaSyC4wu4kOWMplv-BssOEcqyxqfEcMtutFoU",
	authDomain: "vwol-d6f21.firebaseapp.com",
	databaseURL: "https://vwol-d6f21.firebaseio.com",
	projectId: "vwol-d6f21",
	storageBucket: "vwol-d6f21.appspot.com",
	messagingSenderId: "1085346704805"
};

const fbApp = firebase.initializeApp(fbConfig);

export function TRY_AUTH(toContinue, noGoToLogin) {
	fbApp.auth().onAuthStateChanged(user => {
		if (user) {
			LOG("TRY_AUTH()", `User ${user.email} is already authenticated, last logged in at ${new Date(+user.toJSON().lastLoginAt).toString()}`);
			toContinue();
		} else {
			LOG("TRY_AUTH()", "User was not authenticated");
			if (!noGoToLogin) window.location.replace("/login");
		}
	});
}

export function AUTHENTICATE(email, password) {
	fbApp.auth().signInWithEmailAndPassword(email, password);
}

export function LOGOUT() {
	fbApp.auth().signOut();
	LOG("LOGOUT()", "Logged out");
	window.location.replace("/login");
}
