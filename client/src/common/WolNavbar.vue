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
	.wol-navbar {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		top: 0;
		left: 0;
		padding: 4px 0 0 0;
		z-index: 1000;
	}
</style>

<script>
	import WolNavbtn from "./WolNavbtn.vue";
	import $bus from "../bus.js"

	export default {
		props: ["current"],

		components: { WolNavbtn },

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