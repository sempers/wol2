<template>
    <md-dialog id="msgDialog" class="msg-dialog" :md-active.sync="store.shownMessageDialog">
        <md-dialog-content>
            <div class="pl md-title">{{store.curWeek.desc}}</div>
            <div class="action-btn" @click="store.shownMessageDialog = false">
                <md-button class="md-icon-button md-dense">
                    <md-icon>clear</md-icon>
                </md-button>
            </div>
            <div style="clear:both;padding-top:12px;padding-bottom:12px">
                <div
                    v-if="!store.curWeek || !store.curWeek.messages || !store.curWeek.messages.length"
                    style="height:150px;text-align:center;vertical-align:middle"
                >
                    <p>Сообщений не найдено</p>
                </div>
                <div class="md-layout md-gutter">
                    <div class="md-layout-item names-column">
                        <md-table>
                            <md-table-row
                                v-for="(chat, index) in store.curWeek.messages"
                                :key="chat.chat"
                                @click="showChat(chat)"
                            >
                                <md-table-cell
                                    style="cursor:pointer"
                                >{{chat.chat}} ({{chat.messages.length}})</md-table-cell>
                            </md-table-row>
                        </md-table>
                    </div>
                    <div class="md-layout-item" v-show="curChat.messages.length > 0">
                        <ul class="chat-column" id="chat_column">
                            <li
                                class="msg"
                                v-for="msg in curChat.messages"
                                :class="{me: !msg.isin}"
                            >
                                <div class="msg-inner">
                                    <div class="msg-header">
                                        <img
                                            class="channel-icon"
                                            :src="'/img/icon/' + msg.chan + '.png'"
                                        />
                                        <span class="msg-sender">{{msg.sndr}}</span>
                                        <span class="msg-date">{{msg.date | fmtDate}}</span>
                                    </div>
                                    <div class="msg-text" v-html="msg.text"></div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </md-dialog-content>
    </md-dialog>
</template>

<script>
import $store from "./store.js";
import $bus from "../bus.js";

export default {
    data() {
        return {
            store: $store,
            curChat: {
                messages: [],
                chat: ""
            }
        };
    },

    methods: {
        showChat(chat) {
            this.curChat = chat;
            document.getElementById("chat_column").scrollTop = 0;
        },

        clearCurChat() {
            this.curChat = { messages: [], chat: "" };
        }
    },
    mounted() {
        $bus.$on("curweek-changed", this.clearCurChat);
    }
};
</script>