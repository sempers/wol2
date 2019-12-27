let vm = new Vue({
	el: "#vwol",

	data() {
		return {
			email: "",
			password: "",
			invalidData: false
		}
	},

	template: '#t_Login',

	created() {
		fb.bindAuth(function () { 
			let back = window.location.search.substr(1);
			let goto = back.includes('back=') && back.replace('back=','') ? "/"+back.replace('back=',''): "/";
			window.location.replace(goto); }, 'NO_GO_TO_LOGIN');
	},

	methods: {
		onLoginClick() {
			try {
				fb.authenticate(this.email, this.password);
			} catch (e) {
				this.invalidData = true;
			}
		}
	}
});