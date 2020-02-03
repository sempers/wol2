<template>
	<md-dialog class="map-dialog" :md-active.sync="store.shownMapDialog">
		<md-dialog-content>
			<div id="map" />
		</md-dialog-content>
		<md-dialog-actions>
			<md-button @click="store.shownMapDialog = false">Закрыть</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>
<style lang="less">
/* MAP DIALOG */
.map-dialog {
    width: 800px;
    height: 600px;
    background-color: grey;
}
</style>
<script>
import $store from "./store.js"
import $bus from "../bus.js"

export default {
	data() {
        return {
            store: $store
        }
    }
}
</script>