import Vue from "vue"
import VueMaterial from "vue-material"
import VueRouter from "vue-router"
import WolApp from "./wol/WolApp.vue"
import MoneyApp from "./money/MoneyApp.vue"
import WolNavbar from "./common/WolNavbar.vue"
import moment from 'moment'

Vue.use(VueMaterial);
Vue.use(VueRouter);

const router = new VueRouter({
	routes: [
		{
			path: "/",
			component: WolApp
		},
		{
			path: "/money",
			component: MoneyApp
		}
	]
});

Vue.filter("fmtDate", date => moment(date).local().format('DD.MM.YYYY HH:mm:ss'));

window.vm = new Vue({
	el: "#app",

	template: `
	<div>
		<wol-navbar :current="current"></wol-navbar>
		<router-view></router-view>
	</div>
	`,

	components: {
		WolNavbar,
		WolApp,
		MoneyApp
	},

	data() {
		return {
			current: "wol"
		};
	},

	router
});