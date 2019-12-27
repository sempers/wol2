<template>
<md-dialog id="msgDialog" class="msg-dialog" :md-active.sync="store.shownMessageDialog">
          <md-dialog-content style="max-height:1000px">
            <div class="pl md-title">{{store.curWeek.desc}}</div>
            <div class="close-button" @click="store.shownMessageDialog = false">
              <md-button class="md-icon-button md-dense">
                <md-icon>clear</md-icon>
              </md-button>
            </div>
            <div style="clear:both;padding-top:12px;padding-bottom:12px">
              <div v-if="!store.curMessages.length" style="height:150px;text-align:center;vertical-align:middle">
                <p>Сообщений не найдено</p>
              </div>
              <div style="width:100%;display:block">
              <md-tabs md-alignment="fixed">
                <md-tab v-for="(chat,index) in store.curMessages" :key="chat.chat" :md-label="chat.chat" @click="makeUnvisible(index)">
                  <div class="chat-cntnr" v-show="index === store.curMsgTab" :class="{'col2': chat.messages.length >= 20 && chat.messages.length < 40, 'col3':chat.messages.length >= 40 && chat.messages.length < 60, 'col4': chat.messages.length >= 60 && chat.messages.length < 80, 'col5': chat.messages.length >= 80 }" >
                    <ul class="chat-column">
                      <li class="msg" v-for="msg in chat.messages" :class="{me: !msg.isin}" >
                        <div class="msg-inner">
                          <div class="msg-header">
                            <img class="channel-icon" :src="'/img/icon/' + msg.chan + '.png'" />
                            <span class="msg-sender">{{msg.sndr}}</span>
                            <span class="msg-date">{{msg.date | fmtDate}}</span>
                          </div>
                          <div class="msg-text" v-html="msg.text" />
                        </div>
                      </li>
                    </ul>
                  </div>
                </md-tab>
              </md-tabs>
              </div>
            </div>
          </md-dialog-content>
		    </md-dialog>
</template>
<script>
import $store from '../store.js';

export default {
    props: [],
    data() {
        return {
            store: $store
        };
    },

    methods: {
        makeUnvisible(index) {
            this.store.curMsgTab = index;
        }
    },

    filters: $store.filters
}
</script>