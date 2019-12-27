let fb = {
	app: firebase.initializeApp({
		apiKey: "AIzaSyC4wu4kOWMplv-BssOEcqyxqfEcMtutFoU",
		authDomain: "vwol-d6f21.firebaseapp.com",
		databaseURL: "https://vwol-d6f21.firebaseio.com",
		projectId: "vwol-d6f21",
		storageBucket: "vwol-d6f21.appspot.com",
		messagingSenderId: "1085346704805"
	}),

	bindAuth(continueLoading, backView) {
		this.app.auth().onAuthStateChanged((user) => {
			if (user) {
				LOG('AUTH', `User ${user.email} is already authenticated, last logged in at ${(new Date(+user.toJSON().lastLoginAt)).toString()}`);
				continueLoading();
			} else {
				LOG('AUTH', 'User not authenticated');
				if (!backView)
					window.location.replace('/login');
			}
		});
	},

	authenticate(email, password) {
		this.app.auth().signInWithEmailAndPassword(email, password);
	},

	logout() {
		this.app.auth().signOut();
		LOG('LOGOUT', 'Logged out');
	}
};