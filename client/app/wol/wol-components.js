Vue.component("WeekItem", {
    props: ['week'],

    computed: {
        tags() {
            return this.week.getTags({stripped: true, asstring: true});
        }
    },

    template: `<div class='wi' :class='{selected: week.selected, infoed: !!week.info, tagged: week.tagged}' @click='onClick()' >
				<div class='wi-inner' :class='week.future'>
					<div class="wi-bg" :style="{'background-color': week.bgcolor}"></div>
					<div class="wi-bg2" :style="{'border-bottom': '12px solid '+ week.bgcolor2}" v-if="week.bgcolor2 && !week.future"></div>
					<div class='wi-icon' :class='tags'></div>
                    <div class='wi-popup-tri' ></div>
                    <div class='wi-popup md-elevation-3' >
                        <span class='desc-desc' v-once>{{week.desc}}</span>&nbsp;
                        <div class='desc-flags' v-once>{{week.flags}}</div><br/>
                        <div class='desc-info'>{{week.info}}</div>
                    </div>
				</div>
			   </div>`,

    methods: {
        onClick() {
            this.$emit("week-clicked", this.week)
        }
    },

    mounted() {
        if (!this.mounted) {
            this.$emit("week-mounted", this.week);
        }
    }
});

Vue.component("MapDialog", {
    data() {
        return {
            store: $store
        };
    },
    template: `
		<md-dialog id="mapDialog" :md-active.sync='store.shownMapDialog'>
			<md-dialog-content>
				<div id="map" />
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click='store.shownMapDialog = false'>Закрыть</md-button>
			</md-dialog-actions>
		</md-dialog>
	`
});

Vue.component("EditDialog", {
    data() {
        return {
            store: $store,
            isMobile: false
        }
    },

    computed: {
        tagicons() {
            if (this.store.curWeek.getTags)
                return this.store.curWeek.getTags({stripped: true, asstring: false, hasPng: true});
            else
                return [];
        }
    },

    template: `
	<md-dialog id="editDialog" :md-active.sync="store.shownEditDialog" >
			<md-dialog-content>
                <div class="pl md-title">{{store.curWeek.desc}}</div>
                <div class="close-button" @click="store.shownEditDialog = false">
                    <md-button class="md-icon-button md-dense">
                        <md-icon>clear</md-icon>
                    </md-button>
                </div>
                <div class="close-button" @click="goNext()">
                    <md-button class="md-icon-button md-dense">
                        <md-icon>arrow_forward</md-icon>
                    </md-button>
                </div>
                <div class="close-button" @click="goPrevious()">
                    <md-button class="md-icon-button md-dense">
                        <md-icon>arrow_back</md-icon>
                    </md-button>
                </div>
                <div class="colored-flags">
                    <ul style="margin:0">
                        <li class="colored-flag" v-for="cf in store.curWeek.colored_flags" :style="'background-color:' + cf.color">{{cf.name}}</li>
                    </ul>
                </div>
                <div class="tag-icons" v-if="tagicons.length > 0">
                    <div class="wi-icon-placeholder" v-for="tagicon in tagicons" :class="tagicon"></div>
                </div>
				<md-field>
					<label>Описание</label>
					<md-textarea id="week_info_textarea" ref="week_info_textarea" v-model="store.curWeek.editInfo" @keydown="onKeydown($event)" md-autogrow></md-textarea>
				</md-field>
			</md-dialog-content>
			<md-dialog-actions>
				<md-button @click="onShowMessages()" :disabled="!store.curWeek.msgCount">Cообщения <span v-show="store.curWeek.msgLoading">...</span><span v-show="store.curWeek.msgCount">({{store.curWeek.msgCount}})</span></md-button>
				<md-button @click="onSave(false)">Сохранить</md-button>
				<md-button @click="onSave(true)">Сохранить и закрыть</md-button>
			</md-dialog-actions>
		</md-dialog>
	`,

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
            }
        },

        adjustArea() {
            Vue.nextTick(() => {
                let el = document.getElementById("week_info_textarea");
                if (!el)
                    return;
                el.style.height = "1px";
                el.style.height = `${el.scrollHeight + 6}px`;
                el.scrollTop = 0;
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
});

Vue.component("MessageDialog", {
    data() {
        return {
            store: $store
        };
    },

    template: `
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
                      <li class="msg" v-for="msg in chat.messages" :class="{me: !msg.isin}">
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
    `,
    
    methods: {
        makeUnvisible(index) {
            this.store.curMsgTab = index;
        }
    },

    filters: $store.filters
});