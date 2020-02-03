<template>
	<div class="wol-navbar">
		<wol-navbtn v-show="modules.includes('wol')" :icon="'directions_run'" :class="{'active': current == 'wol'}" :link="'/'" :text="'Weeks of Life'"   ></wol-navbtn>
		<wol-navbtn v-show="modules.includes('money')" :icon="'monetization_on'" :class="{'active': current == 'money'}" :link="'/#/money'" :text="'Money'"  ></wol-navbtn>
		<wol-navbtn v-show="modules.includes('msg')" :icon="'message'" :class="{'active': current == 'msg'}" :link="'/#/msg'" :text="'Messages'"  ></wol-navbtn>
		<wol-navbtn v-show="current == 'wol' && modules.includes('travel')" :icon="'location_on'" :link="'javascript:;'" @click.native.capture="emit('show-map-dialog')" :text="'Travel'" ></wol-navbtn>
		<wol-navbtn v-show="current == 'wol'" :icon="'local_hospital'" :class="{'active': current=='pills'}" @click.native.capture="emit('show-pills-dialog')" :text="'Pills'"></wol-navbtn>
		<wol-navbtn v-show="current == 'wol' || current == 'money'" :icon="'exit_to_app'" :link="'javascript:;'" @click.native.capture="emit('logout')" :text="'Log out'"></wol-navbtn>
    </div>
</template>
<style>
	.wol-nabbar {
		z-index: 1000;
	}
</style>
<script>
	import WolNavBtn from "./WolNavBtn";
	import $bus from "../bus.js"

	export default {
		props: ["current"],

		components: { WolNavBtn },

		data() {
			return {
				modules: window.$server.MODULES
			};
		},

		methods: {
			emit(key) {
            	$bus.$emit(key);
        	}
		}
	}
</script>