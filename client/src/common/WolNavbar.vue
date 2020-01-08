<template>
	<div class="wol-navbar">
		<wol-nav-btn
		v-show="MODULES.includes('wol')"
		:icon="'directions_run'"
		:class="{'active': current == 'wol'}"
		:link="'/'"
		:text="'Weeks of Life'"
		></wol-nav-btn>

		<wol-nav-btn
		v-show="MODULES.includes('money')"
		:icon="'monetization_on'"
		:class="{'active': current == 'money'}"
		:link="'/money'"
		:text="'Money'"
		></wol-nav-btn>

		<wol-nav-btn
		v-show="MODULES.includes('msg')"
		:icon="'message'"
		:class="{'active': current == 'msg'}"
		:link="'/msg'"
		:text="'Messages'"
		></wol-nav-btn>

		<wol-nav-btn
		v-show="current == 'wol' && MODULES.includes('travel')"
		:icon="'location_on'"
		:link="'javascript:;'"
		v-on:clicked="showMapDialog()"
		:text="'Travel'"
		></wol-nav-btn>

		<wol-nav-btn
		v-show="current == 'wol' || current == 'money'"
		:icon="'exit_to_app'"
		:link="'javascript:;'"
		v-on:clicked="logout()"
		:text="'Log out'"
		></wol-nav-btn>	
  	</div>
</template>

<script>
	import WolNavBtn from "./WolNavBtn";

	export default {
		props: ["current"],

		components: { WolNavBtn },

		data() {
			return {
				MODULES: window.$server.MODULES
			};
		},

		methods: {
			showMapDialog() {
				this.$emit("show-map-dialog");
			},

			logout() {
				this.$emit("logout");
			}
		}
	};
</script>