<template>
    <md-dialog id="editDialog" :md-active.sync="store.shownEditDialog">
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
                    <li
                        class="colored-flag"
                        v-for="cf in store.curWeek.colored_flags"
                        :style="'background-color:' + cf.color" :key="cf.name"
                    >{{cf.name}}</li>
                </ul>
            </div>
            <div class="tag-icons" v-if="tagicons.length > 0">
                <div class="wi-icon-placeholder" v-for="tagicon in tagicons" :class="tagicon" :key="tagicon"></div>
            </div>
            <md-field>
                <label>Описание</label>
                <md-textarea
                    id="week_info_textarea"
                    ref="wita"
                    v-model="store.curWeek.editInfo"
                    @keydown="onKeydown($event)"
                    md-autogrow
                ></md-textarea>
            </md-field>
        </md-dialog-content>
        <md-dialog-actions>
            <md-button @click="onShowMessages()" :disabled="!store.curWeek.msgCount">
                Cообщения
                <span v-show="store.curWeek.msgLoading">...</span>
                <span v-show="store.curWeek.msgCount">({{store.curWeek.msgCount}})</span>
            </md-button>
            <md-button @click="onSave(false)">Сохранить</md-button>
            <md-button @click="onSave(true)">Сохранить и закрыть</md-button>
        </md-dialog-actions>
    </md-dialog>
</template>

<style lang="less">
#editDialog .md-dialog-content:first-child {
    padding-top: 22px;
    width: 800px !important;
}

@media (max-width:1080px) {
    #editDialog .md-dialog-content:first-child {
        padding-top: 22px;
        width: 600px !important;
    }

    .hide-mobile {
        display: none;
    }
}

#week_info_textarea {
    font-size: 14px;
    line-height: 26px;
    min-height: 78px;
    padding-bottom: 6px;
}

.md-field .md-textarea {
    max-height: 240px;
}

.colored-flag {
    display: inline-flex;
    margin-right: 4px;
    justify-content: center;
    border-radius: 4px;
    color: black;
    font-size: 12px;
    align-items: center;
    box-sizing: border-box;
    padding: 0 4px;
}

.colored-flags {
    float: right;
    position: relative;
    top: -2px;
    margin-right: 5px;
}

.tag-icons {
    float: right;
    display: inline-flex;
    height: 20px;
    align-items: center;
    background-color: #f0f0f0;
    margin-right: 4px;
    padding: 0 4px 0 4px;
}

.action-btn {
    float: right;
    position: relative;
    top: -8px;
}

.action-btn button {
    margin: 2px;
}

.action-btn .md-button .md-ripple {
    padding-left: 8px;
    padding-right: 8px;
    padding-top: 4px;
    display: inline-block;
    margin: 0;
}
</style>

<script>
import $store from "./store.js";
import $bus from "../bus.js";
import UAParser from "UAParser";

export default {
    data() {
        return {
            store: $store,
            isMobile: false
        }
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
        let device = new UAParser().getDevice();
        this.isMobile = device && (device.type == "mobile" || device.type == "tablet");
    },

    methods: {
        onKeydown(event) {
            if (
                !this.isMobile &&
                event.key == "Enter" &&
                !event.altKey &&
                !event.shiftKey &&
                !event.ctrlKey
            ) {
                event.preventDefault();
                this.onSave(true);
            } else {
                if (event.keyCode == 39 && event.ctrlKey) {
                    //right arrow
                    this.goNext();
                }
                if (event.keyCode == 37 && event.ctrlKey) {
                    //left arrow
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
            if (this.store.curWeek.weekNum > 1) $bus.$emit("prev-week");
        },

        goNext() {
            $bus.$emit("next-week");
        },

        onSave(exit) {
            $bus.$emit("week-saved");
            if (exit) {
                this.store.shownEditDialog = false;
            }
        },

        onShowMessages() {
            if (this.store.curWeek.messages.length)
                $bus.$emit("show-messages", this.store.curWeek.messages);
        }
    }
};
</script>