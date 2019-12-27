<template>
<div class="app-layout">
            <wol-navbar :current="'wol'" v-on:show-map-dialog="showMapDialog()" v-on:logout="logout()"></wol-navbar>
            <wol-spinner :store="store"></wol-spinner>
            <transition name="fade">
            <div v-show="!store.loading">
                <div class="cntnr">
                    <header style="padding-top:58px">
                        <div>
                            <div class="pl">
                                <strong>Прожито {{store.lived.percentage}}</strong>, недель: <strong>{{store.lived.weeks}}</strong>, дней: <strong>{{store.lived.days}}</strong>, часов: <strong>{{store.lived.hours}}</strong>
                            </div>
                            <div class="pl weeks-infoed">
                                Недель заполнено: <strong>{{c_infoed}} ({{((c_infoed / store.lived.weeks) * 100).toFixed(1) + '%'}})</strong>
                            </div>
                            <div class="pr" style="position:relative;left:-27px">
                                <strong>Осталось {{store.remained.percentage}}</strong>, недель: <strong>{{store.remained.weeks}}</strong>, дней: <strong>{{store.remained.days}}</strong>, часов: <strong>{{store.remained.hours}}</strong>
                            </div>
                        </div>
                    </header>

                    <div style="position:relative">
                        <table class="yeartable clearfix">
                            <tr v-for="(year_weeks, year, index) in store.years">
                                <td class="yeartd year-header" valign="middle">{{year}}<span class="uninfoed" v-if="countUninfoed(year_weeks)">({{countUninfoed(year_weeks)}})</span></td>
                                <td class="yeartd year-weeks" valign="middle">
                                    <div class="week-placeholder" v-if="index === 0" :style="'width:' + store.firstYearPlaceHolderWidth + 'px'"></div>
                                    <week-item v-for="week in year_weeks" :key="week.weekNum" :week="week" v-on:week-clicked="editWeek(week)" v-on:week-mounted="mountWeek(week)"></week-item>
                                </td>
                            </tr>
                        </table>

                        <div class="tag-bar taglist">
                            <a v-for="ti in c_tags" href="" @click.prevent="setTagged(ti)" class="tag-link" v-show="ti.weekNums.length > 0" :class="{'strong': ti.weekNums.length>20, 'tag-selected': ti.tag == store.curTag}">{{ti.tag}}<small>&nbsp;</small>({{ti.weekNums.length}})&nbsp;&nbsp;&nbsp; </a>
                            <md-field>
                                <label>Поиск</label>
                                <md-input type="text" v-model="store.searchedWord" style="width:300px" />
                            </md-field>
                            <div style="text-align:center">
                                <md-button type="button" @click="searchWord()">Искать в описаниях</md-button>
                            </div>
                            <div>
                                    <ul>
                                        <li>
                                            <div class="wi wi-inner ng"></div><div class="wi-icon-legend">#ng</div>
                                            <div class="wi wi-inner dr"></div><div class="wi-icon-legend">#dr</div>
                                            <div class="wi wi-inner buy"></div><div class="wi-icon-legend">#buy</div>
                                            <div class="wi wi-inner mov"></div><div class="wi-icon-legend">#mov</div>
                                            <div class="wi wi-inner games"></div><div class="wi-icon-legend">#games</div>
                                            <div class="wi wi-inner major"></div><div class="wi-icon-legend">#major</div>
                                            <div class="wi wi-inner interview"></div><div class="wi-icon-legend">#interview</div>
                                            <div class="wi wi-inner buh"></div><div class="wi-icon-legend">#buh</div>
                                            <div class="wi wi-inner acid"></div><div class="wi-icon-legend">#acid</div>
                                            <div class="wi wi-inner meet"></div><div class="wi-icon-legend">#meet</div>
                                            <div class="wi wi-inner crush"></div><div class="wi-icon-legend">#crush</div>
                                            <div class="wi wi-inner love"></div><div class="wi-icon-legend">#love, #sex</div>
                                            <div class="wi wi-inner breakup"></div><div class="wi-icon-legend">#breakup</div>
                                            <div class="wi wi-inner ill"></div><div class="wi-icon-legend">#ill</div>
                                            <div class="wi wi-inner exam"></div><div class="wi-icon-legend">#exam</div>
                                            <div class="wi wi-inner death"></div><div class="wi-icon-legend">#death</div>
                                            <div class="wi wi-inner bad"></div><div class="wi-icon-legend">#bad</div>
                                            <div class="wi wi-inner sea"></div><div class="wi-icon-legend">#sea</div>
                                            <div class="wi wi-inner abroad"></div><div class="wi-icon-legend">#abroad</div>
                                        </li>
                                    </ul>
                                   
                                </div>
                        </div>                        
                    </div>
                </div>
                </div>
            </transition>
			<edit-dialog v-on:show-messages = "showMessages()" v-on:week-saved = "saveWeek()" v-on:prev-week = "prevWeek()" v-on:next-week="nextWeek()"></edit-dialog>
			<map-dialog></map-dialog>
			<message-dialog></message-dialog>
		</div>
</template>

<script>
import fb from '../utils/fb.js'
import WeekModel from './components/WeekModel.js'
import _ from 'underscore';
import $bus from '../bus.js'
import $store from './store.js'
import WeekItem from './components/WeekItem.vue'
import WolNavbar from '../components/WolNavbar.vue'
import WolSpinner from '../components/WolSpinner.vue'
import EditDialog from './components/EditDialog.vue'
import MapDialog from './components/MapDialog.vue'
import MessageDialog from './components/MessageDialog.vue'

export default {
    el: "#vwol",

    data() {
        return {
            store: $store
        }
    },

    computed: {
        c_infoed() {
            return _.reduce(this.store.weeks, (memo, w) => +(!!w.info & !w.future) + memo, 0);
        },

        c_tags() {
            return _.sortBy(this.store.tags.stats, ti => ti.tag);
        }
    },

    created() {
        this.store.loading = true;
        LOG('created()', 'checking the auth with firebase');
        fb.bindAuth(() => {
            LOG('created()', "REQUESTING THE DATA");
            axios.get(`${window.$server.BASE_URL}/api/weeks`)
                .then((response) => {
                    if (response.data) {
                        LOG('created()', "DATA RECEIVED");
                        let raw_data = response.data;
                        this.initHeader(raw_data);
                        this.initWeeks(raw_data);
                        this.initMapData(raw_data);
                    } else {
                        ERROR('created()', "loading /api/weeks failed")
                    }
                });
        });
    },

    mounted() {
        LOG('mounted()', 'WolApp MOUNTED');
        window.__googleMapsLoaded = this.checkGoogleMapsLoaded;
    },

    updated() {
        if (this.store.loading) {
            this.store.loading = false;
            LOG('updated()', "WolApp RENDERED");
        }
    },

    methods: {
        error(msg, response, fname) {
            if (fname)
                ERROR(fname, `[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            else
                FIX_TIME(`[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            toastr.error(msg);
        },

        success(msg, fname) {
            if (fname)
                LOG(fname, `[SUCCESS]: ${msg}`);
            else
                FIX_TIME(`[SUCCESS]: ${msg}`);
            toastr.success(msg);
        },

        checkGoogleMapsLoaded() {
            this.store.googleMapsLoaded = true;
        },

        logout() {
            this.store.loading = true;
            fb.logout();
            window.location.replace('/login');
        },

        initHeader(data) {
            //подготавливаем спаны для ускорения
            data.spans.forEach(span => {
                span.startTime = (new Date(span.start)).getTime();
                span.endTime = (new Date(span.end)).getTime();
            });

            const NOWTIME = (new Date()).getTime();

            const birthTime = (new Date(data.birthdate)).getTime(); //время, когда родился (принимается за 00:00) <int>
            //текущая дата <int>
            const deathTime = (new Date(data.deathdate)).getTime(); //смерть <int>
            const whereIsNow = Math.min(deathTime, NOWTIME);        //"текущая дата жизни" = смерть или текущая дата <int>

            //Заполняем списки отжитого/оставшегося
            const daysLived = Math.round((whereIsNow - birthTime) / (1000 * 60 * 60 * 24));
            const daysRemained = Math.max(Math.round((deathTime - NOWTIME) / (1000 * 60 * 60 * 24)), 0);

            this.store.lived = {
                percentage: `${((daysLived / (daysLived + daysRemained)) * 100).toFixed(2)}%`,
                days: daysLived,
                weeks: Math.ceil(daysLived / 7),
                hours: Math.round((whereIsNow - birthTime) / (1000 * 60 * 60))
            };

            this.store.remained = {
                percentage: `${((daysRemained / (daysLived + daysRemained)) * 100).toFixed(2)}%`,
                days: daysRemained,
                weeks: Math.floor(daysRemained / 7),
                hours: daysRemained * 24
            };
        },

        initWeeks(data) {
            let weekNum = 0;    //текущий номер недели в жизни
            // начало недели, когда родился <int>
            let weekStartMoment = moment(data.birthdate).startOf("week");     //текущая дата

            const deathTime = (new Date(data.deathdate)).getTime();					 //смерть <int>

            let weeks = [];
            while (weekStartMoment._d.getTime() < deathTime) {
                weekNum++;

                const dbWeek = data.weekInfo[weekNum];
                const week = dbWeek ?
                    new WeekModel(weekStartMoment, weekNum, dbWeek.info, data.spans) :
                    new WeekModel(weekStartMoment, weekNum, '', data.spans);

                //инициализация первого холдера
                if (weekNum === 1 && week.yearNum > 1) {
                    this.store.firstYearPlaceHolderWidth = (week.yearNum - 1) * 20 - 3;
                }

                weeks.push(week);
                weekStartMoment.add(1, 'week');	//fixed
            }

            LOG('initWeeks', "DATA_INITIALIZED, START RENDERING");
            this.store.years = _.groupBy(weeks, 'year');
            this.store.weeks = weeks;

            this.store.curWeek = {
                info: "",
                weekNum: -1
            };  //текущая неделя
        },

        initMapData(data) {
            this.store.map = data.map;
        },

        //------------------------------Показ диалогов-----------------------------------------------------------
        //показ диалога с сообщениями
        showMessages() {
            this.store.curMessages = this.store.curWeek.messages;
            this.store.shownMessageDialog = true;
        },

        //показ диалога редактирования
        showEditDialog() {
            if (!this.store.shownEditDialog)
                this.store.shownEditDialog = true;
        },

        //показ диалога с картой
        showMapDialog() {
            if (!this.store.shownMapDialog) {
                this.store.shownMapDialog = true;
                Vue.nextTick(() => {
                    this.initMap();
                });
            }
        },

        //---------------------------- Расчеты в режиме недельки -----------------------------------------------------
        //посчитать сколько не заполнено в году
        countUninfoed: year_weeks => _.reduce(year_weeks, (memo, week) => memo + +(!week.info & !week.future), 0),

        //----------------------------Загрузка и сохранение в режиме неделек -----------------------------------------
        /**
         * Добавляем недельку забинженную в компонент
         * @param week
         */
        mountWeek(week) {
            this.store.weeks[week.weekNum] = week;
            this.tagsUpdate(week);
        },

        /**
         * загрузка недельки
         */
        editWeek(week) {
            const _oldWeekNum = this.store.curWeek.weekNum;
            if (_oldWeekNum !== week.weekNum && _oldWeekNum > 0) {
                this.store.weeks[_oldWeekNum].selected = false;
            }
            week.selected = true;
            LOG('editWeek', `Current week is ${week.weekNum}`);
            this.store.curWeek = week;
            this.store.curWeek.editInfo = week.info;
            $bus.$emit("curweek-changed");
            this.showEditDialog();
            this.loadMessages(week);
        },

        /**
         * загрузка сообщений для недельки
         * @param week
         * @param forced
         */
        loadMessages(week, forced) {
            if (week.messages.length && !forced)
                return;
            week.msgLoading = true;
            axios.get(`${window.$server.BASE_URL}/api/msg/${week.weekNum}`)
                .then(
                    response => {
                        if (response.data) {
                            week.messages = response.data;
                            week.msgLoading = false;
                            week.msgCount = _.reduce(week.messages, (memo, chat) => chat.messages.length + memo, 0);
                            LOG('loadMessages', `Messages loaded for week ${week.weekNum}, count ${week.msgCount}`);
                        }
                    },
                    (response) => {
                        this.error(`cannot load messages for week ${week.weekNum}`, response, 'loadMessages');
                    }
                );
        },

        /**
         * сохранение инфо недели
         */
        saveWeek() {
            const _week = this.store.curWeek;
            this.store.weeks[_week.weekNum].info = _week.editInfo;

            axios.post(`${window.$server.BASE_URL}/api/weeks`,
                {
                    name: this.store.name,
                    weekNum: _week.weekNum,
                    info: _week.info,
                    msgCount: _week.msgCount
                })
                .then(
                    response => {
                        if (response.status === 200) {
                            this.success(`Week ${_week.weekNum} saved to DB.`, 'saveWeek');
                            this.tagsUpdate(_week);
                        } else {
                            this.error('error saving week', response, 'saveWeek');
                        }
                    },
                    response => {
                        this.error(`Error saving week:`, response, 'saveWeek');
                    }
                );
        },

        //-------------------------- Навигация в режиме неделек ------------------------------------------------------
        /**
         * предыдущая неделя
         */
        prevWeek() {
            if (!this.store.curWeek && this.store.curWeek.weekNum === 1) {
                return;
            }
            const week = _.findWhere(this.store.weeks, { weekNum: this.store.curWeek.weekNum - 1 });
            this.editWeek(week);
        },


        /**
         * следующая неделя
         */
        nextWeek() {
            if (!this.store.curWeek) {
                return;
            }
            const week = _.findWhere(this.store.weeks, { weekNum: this.store.curWeek.weekNum + 1 });
            if (week && !week.future) {
                this.editWeek(week);
            }
        },


        /**
         * вперед один год
         */
        forwardYear() {
            if (!this.store.curWeek) {
                return;
            }
            const week = _.findWhere(this.store.weeks, { yearNum: this.store.curWeek.yearNum, year: this.store.curWeek.year + 1 });
            if (week && !week.future) {
                this.editWeek(week);
            }
        },


        /**
         * назад один год
         */
        backwardYear() {
            if (!this.store.curWeek) {
                return;
            }
            const week = _.findWhere(this.store.weeks, { yearNum: this.store.curWeek.yearNum, year: this.store.curWeek.year - 1 });
            if (week) {
                this.editWeek(week);
            }
        },


        //--------------------- Тэги ---------------------------------------------------------------------------------
        /**
         * Обновление тэгов, по текущей неделе
         * @param week
         */
        tagsUpdate(week) {
            let _stats = this.store.tags.stats;
            //добавляем только что добавленный тег
            week.getTags().forEach(tag => {
                let ti = _.findWhere(_stats, { tag });
                if (!ti) {
                    _stats.push({
                        tag,
                        weekNums: [week.weekNum]
                    });
                    this.store.tags.updateCache = true;
                }
                if (this.isCurrentTag(ti)) {
                    week.tagged = true;
                }
            });
            //проверяем не нужно ли убрать
            _stats.forEach(ti => {
                const weekInTag = ti.weekNums.indexOf(week.weekNum);
                if (weekInTag >= 0) {
                    if (!week.hasTag(ti.tag)) {
                        ti.weekNums.splice(weekInTag);
                        if (week.tagged && this.isCurrentTag(ti))
                            week.tagged = false;
                    }
                }
                // проверяем не нужно ли добавить
                else {
                    if (week.hasTag(ti.tag)) {
                        ti.weekNums.push(week.weekNum);
                    }
                }
            });
        },


        /**
        * поиск слова в инфо
         */
        searchWord() {
            this.clearTagged();
            const word = this.store.searchedWord.toLowerCase();
            this.store.weeks.forEach(wk => {
                if (wk.info.toLowerCase().includes(word)) {
                    wk.tagged = true;
                }
            });
        },


        /**
         * проверка на текущий тэг
         * @param ti
         * @returns {*|boolean}
         */
        isCurrentTag(ti) {
            return this.store.tags.current && this.store.tags.current.tag === ti.tag;
        },


        /**
         * выбрать с тэгом/сбросить тэг
         * @param ti - tagInfo
         */
        setTagged(ti) {
            let turnoff = this.isCurrentTag(ti);
            this.clearTagged();
            if (turnoff)
                return;
            this.store.tags.current = ti;
            this.store.curTag = ti.tag;
            ti.weekNums.forEach(index => {
                this.store.weeks[index].tagged = true;
            });
        },


        /**
         * сбросить всю подсветку
         */
        clearTagged() {
            this.store.tags.current = undefined;
            this.store.curTag = "";
            this.store.weeks.forEach(wk => {
                if (wk.tagged) {
                    wk.tagged = false;
                }
            });
        },

        //-------------- КАРТЫ -------------------------
        saveMapInfo(pos) {
            axios.post(`${window.$server.BASE_URL}/api/map/${vm.name}`, pos).then(
                (response) => {
                    if (response.status === 200) {
                        LOG('saveMapInfo', "coords lat=" + pos.lat + "; lng=" + pos.lng + " successfully saved");
                    } else {
                        console.log(response.status);
                    }
                },

                (err) => {
                    this.error("Error saving coords", err, "saveMapInfo")
                }
            )
        },

        removeMapInfo(pos) {
            axios.post(`${window.$server.BASE_URL}/api/unmap/${this.store.name}`, pos).then(
                (response) => {
                    if (response.status === 200) {
                        console.log("coords lat=" + pos.lat + "; lng=" + pos.lng + " successfully removed");
                    } else {
                        console.log(response.status);
                    }
                },
                (err) => {
                    this.error("Error saving coords: ", err, 'removeMapInfo');
                }
            )
        },

        initMap() {
            LOG("initMap", "start");
            let self = this;
            let data = this.store;

            const uluru = {
                lat: -25.363,
                lng: 131.044
            };
            if (!data.map.length) {
                data.map.push(uluru);
            }
            let map = new google.maps.Map(document.getElementById('map'), {
                zoom: 4,
                center: data.map[data.map.length - 1]
            });

            function _createMarker(position) {
                let marker = new google.maps.Marker({ position, map });
                google.maps.event.addListener(marker, "dblclick", function () {
                    self.removeMapInfo({
                        lat: marker.getPosition().lat(),
                        lng: marker.getPosition().lng()
                    });
                    marker.setMap(null);
                })
            }

            for (let i = 0; i < data.map.length; i++) {
                var mapPoint = data.map[i];
                _createMarker(mapPoint);
            }

            google.maps.event.addListener(map, 'click', function (event) {
                _createMarker(event.latLng);
                self.saveMapInfo({
                    lat: event.latLng.lat(),
                    lng: event.latLng.lng()
                });
            });

            LOG("initMap", "map loaded");
        }
    }
}
</script>