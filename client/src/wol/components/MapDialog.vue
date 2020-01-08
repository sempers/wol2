<template>
	<md-dialog id="mapDialog" :md-active.sync="store.shownMapDialog">
		<md-dialog-content>
			<div id="map" />
		</md-dialog-content>
		<md-dialog-actions>
			<md-button @click="store.shownMapDialog = false">Закрыть</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>

<script>
import $store from "../store.js"
import $bus from "../../bus.js"

export default {
	data() {
        return {
            store: $store
        }
    }
}
</script>