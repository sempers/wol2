let $store = new Vuex.Store({
	state: {
		config: $FB_CONFIG,
		statistics: [],
		user: null,
		isAnonymous: false,
		firebaseApp: $FB_APP
	},
	
	mutations: {
		setUser(state, value) {
			state.user = value;
		}
	},
	
	actions: {
		createUser ({state}, {email, password}) {
			state.firebaseApp.auth().createUserWithEmailAndPassword(email, password).catch(error => {console.log(error.code, error.message)});
		},
		
		authenticate({state}, {email, password}) {
			state.firebaseApp.auth().signInWithEmailAndPassword(email, password);
		},
		
		logout ({state}) {
			state.firebaseApp.auth().signOut();
		},
		
		bindAuth ({commit, state}, {proceed}) {
			state.firebaseApp.auth().onAuthStateChanged((user) => {
				//commit('setUser', user);
				if (user && proceed)
					proceed();
			});
		}
	}
});