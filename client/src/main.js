import Vue from "vue"
import VueMaterial from "vue-material"
import WolApp from "./wol/WolApp.vue"
import WolNavbar from "./common/WolNavbar.vue"
import moment from 'moment'

Vue.use(VueMaterial);

Vue.filter("fmtDate", date => moment(date).local().format('DD.MM.YYYY HH:mm:ss'));

window.vm = new Vue({
	el: "#app",

	components: { WolNavbar, WolApp },

	data() {
		return {
			current: "wol"
		};
	},

	template: `
	<div>
		<wol-navbar :current="current"></wol-navbar>
		<wol-app></wol-app>
	</div>
	`
});
