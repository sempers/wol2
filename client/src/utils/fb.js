import {FIX_TIME, LOG, ERROR} from './logging.js';

const config = {
    apiKey: "AIzaSyC4wu4kOWMplv-BssOEcqyxqfEcMtutFoU",
    authDomain: "vwol-d6f21.firebaseapp.com",
    databaseURL: "https://vwol-d6f21.firebaseio.com",
    projectId: "vwol-d6f21",
    storageBucket: "vwol-d6f21.appspot.com",
    messagingSenderId: "1085346704805"
};

const fbApp = firebase.initializeApp(config);

export default {
    bindAuth(continueLoading, noGoToLogin) {
        fbApp.auth().onAuthStateChanged((user) => {
            if (user) {
                ff.LOG('AUTH', `User ${user.email} is already authenticated, last logged in at ${(new Date(+user.toJSON().lastLoginAt)).toString()}`);
                continueLoading();
            } else {
                ff.LOG('AUTH', 'User not authenticated');
                if (!noGoToLogin)
                    window.location.replace('/login');
            }			
        });
    },
    
    authenticate(email, password) {
        fbApp.auth().signInWithEmailAndPassword(email, password);
    },
            
    logout() {
        fbApp.auth().signOut();
        ff.LOG('LOGOUT', 'Logged out');
        window.location.replace('/login');
    }
}