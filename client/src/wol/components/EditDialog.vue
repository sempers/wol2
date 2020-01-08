<template>
	<md-dialog id="editDialog" :md-active.sync="store.shownEditDialog" >
		<md-dialog-content>
			<div class="pl md-title">{{store.curWeek.desc}}</div>
					<div class="action-btn" @click="store.shownEditDialog = false">
						<md-button class="md-icon-button md-dense">
							<md-icon>clear</md-icon>
						</md-button>
					</div>
					<div class="action-btn hide-mobile" @click="goNext()">
						<md-button class="md-icon-button md-dense">
							<md-icon>arrow_forward</md-icon>
						</md-button>
					</div>
					<div class="action-btn hide-mobile" @click="goPrevious()">
						<md-button class="md-icon-button md-dense">
							<md-icon>arrow_back</md-icon>
						</md-button>
					</div>
					<div class="colored-flags hide-mobile">
						<ul style="margin:0">
							<li class="colored-flag" v-for="cf in store.curWeek.colored_flags" :style="'background-color:' + cf.color">{{cf.name}}</li>
						</ul>
					</div>
					<div class="tag-icons" v-if="tagicons.length > 0">
						<div class="wi-icon-placeholder" v-for="tagicon in tagicons" :class="tagicon"></div>
					</div>
					<md-field>
						<label>Описание</label>
						<md-textarea id="week_info_textarea" ref="wita" v-model="store.curWeek.editInfo" @keydown="onKeydown($event)" md-autogrow></md-textarea>
					</md-field>
		</md-dialog-content>
		<md-dialog-actions>
			<md-button @click="onShowMessages()" :disabled="!store.curWeek.msgCount">Cообщения <span v-show="store.curWeek.msgLoading">...</span><span v-show="store.curWeek.msgCount">({{store.curWeek.msgCount}})</span></md-button>
			<md-button @click="onSave(false)">Сохранить</md-button>
			<md-button @click="onSave(true)">Сохранить и закрыть</md-button>
		</md-dialog-actions>
	</md-dialog>
</template>

<script>
import $store from "../store.js"
import $bus from "../../bus.js"
import UAParser from "UAParser"

export default {
  data() {
    return {
      store: $store,
      isMobile: false
    };
  },

	computed: {
	tagicons() {
      if (this.store.curWeek.getTags)
        return this.store.curWeek.getTags({
          stripped: true,
          asstring: false,
          hasPng: true
        });
      else return [];
    }
  },

  mounted() {
        $bus.$on("curweek-changed", this.adjustArea);
        let device = (new UAParser()).getDevice();
        this.isMobile = device && (device.type == 'mobile' || device.type == 'tablet');
    },

    methods: {
        onKeydown(event) {
            if (!this.isMobile && event.key == "Enter" && !event.altKey && !event.shiftKey && !event.ctrlKey) {
                event.preventDefault();
                this.onSave(true);
            } else {
                if (event.keyCode == 39 && event.ctrlKey) { //right arrow
                    this.goNext();
                }
                if (event.keyCode == 37 && event.ctrlKey) { //left arrow
                    this.goPrevious();
                }
            }
        },

        adjustArea() {
            this.$nextTick(() => {
                let el = document.getElementById("week_info_textarea");
                if (el) {
                    el.style.height = "1px";
                    el.style.height = `${Math.round(el.scrollHeight) + 6}px`;
                }
            });            
        },

        goPrevious() {
            if (this.store.curWeek.weekNum > 1)            
                this.$emit("prev-week");
        },

        goNext() {
            this.$emit("next-week");
        },

        onSave(exit) {
            this.$emit("week-saved");
            if (exit) {
                this.store.shownEditDialog = false;
            }
        },

        onShowMessages() {
            if (this.store.curWeek.messages.length)
                this.$emit("show-messages", this.store.curWeek.messages);
        }
    }
}
</script>