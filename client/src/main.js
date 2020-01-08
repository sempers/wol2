import Vue from "vue"
import VueMaterial from "vue-material"
import WolApp from "./wol/WolApp.vue"
import WolNavbar from "./common/WolNavbar.vue"

Vue.use(VueMaterial);

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
		<wol-navbar :current="current" v-on:show-map-dialog="showMapDialog()" v-on:logout="logout()"></wol-navbar>
		<wol-app></wol-app>
	</div>
	`
});
