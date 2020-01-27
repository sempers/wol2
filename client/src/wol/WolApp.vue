<template>
<div class="app-layout">
    <wol-navbar :current="'wol'"></wol-navbar>
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
                    <tr v-for="(year_weeks, year, index) in store.years" :key="year">
                        <td class="yeartd year-header" valign="middle">{{year}}<span class="uninfoed" v-if="countUninfoed(year_weeks)">({{countUninfoed(year_weeks)}})</span></td>
                        <td class="yeartd year-weeks" valign="middle">
                            <div class="week-placeholder" v-if="index === 0" :style="'width:' + store.firstYearPlaceHolderWidth + 'px'"></div>
                            <week-item v-for="week in year_weeks" :key="week.weekNum" :week="week"></week-item>
                        </td>
                    </tr>
                </table>
                <div class="tag-bar">
                    <div class="tag-bar-item" v-for="ti in c_tags" :key="ti.tag">
                        <div :class="'wi-outer wi-inner ' + ti.tag.replace('#','')" v-if="getTagIcons().includes(ti.tag)"></div>
                        <a href="" @click.prevent="setTagged(ti)" class="tag-link" :class="{'strong': ti.weekNums.length>20, 'tag-selected': ti.tag == store.curTag}">{{ti.tag}}<small>&nbsp;</small>({{ti.weekNums.length}})&nbsp;&nbsp;&nbsp; </a>
                    </div>
                    <md-field>
                        <label>Поиск</label>
                        <md-input type="text" v-model="store.searchedWord" style="width:300px" />
                    </md-field>
                    <div style="text-align:center">
                        <md-button type="button" @click="searchWord()">Искать в описаниях</md-button>
                    </div>
                </div>                        
            </div>
        </div>
        </div>
    </transition>
    <edit-dialog></edit-dialog>
    <map-dialog></map-dialog>
    <message-dialog></message-dialog>
    <pills-dialog></pills-dialog>
    </div>
</template>

<script>
import { LOG, ERROR, FIX_TIME } from '../utils/logging.js'
import { TRY_AUTH, LOGOUT } from '../utils/fb.js'
import WeekModel from './WeekModel.js'
import _ from 'underscore'
import axios from 'axios'
import $bus from '../bus.js'
import $store from './store.js'
import WolSpinner from '../common/WolSpinner.vue'
import WeekItem from './WeekItem.vue'
import EditDialog from './EditDialog.vue'
import MapDialog from './MapDialog.vue'
import MessageDialog from './MessageDialog.vue'
import PillsDialog from './PillsDialog.vue'

export default {
    data() {
        return {
            store: $store
        }
    },

    components: {WeekItem, EditDialog, MessageDialog, PillsDialog, MapDialog, WolSpinner},

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
        //TRY_AUTH(this.init);
        this.init();
    },

    mounted() {
        LOG("mounted()", 'WolApp MOUNTED');
        $bus.$on("week-created", this.createWeek);
        $bus.$on("week-clicked", this.editWeek);
        $bus.$on("wit", this.checkWiTime);
        $bus.$on("show-map-dialog", this.showMapDialog);
        $bus.$on("show-pills-dialog", this.showPillsDialog);
        $bus.$on("show-messages", this.showMessages);
        $bus.$on("week-saved", this.saveWeek);
        $bus.$on("prev-week", this.prevWeek);
        $bus.$on("next-week", this.nextWeek);
        $bus.$on("logout", this.logout);
    },

    updated() {
        if (this.store.loading) {
            this.store.loading = false;
            const avg = this.store.test.wiTimes.reduce((memo, num) => memo + num, 0) / this.store.test.wiTimes.length;
            LOG('updated()', `WolApp RENDERED. Avg week-item render time: ${avg/1000} ms`);
        }
    },

    methods: {
        async init() {
            LOG('created()', "DATA REQUESTED");
            try {
                const response = await axios.get(`${$server.BASE_URL}/api/wol/weeks`);
                if (response.data) {
                    LOG('created()', "DATA RECEIVED");
                    this.initData(response.data);
                    LOG('created()', "DATA_INITIALIZED, START RENDERING");
                } else {
                    ERROR('created()', "loading /api/wol/weeks failed")
                }
            } catch (err) {
                ERROR('created()', "loading /api/wol/weeks failed");
            }
        },

        getTagIcons() {
            return ['#ng', '#dr', '#buy', '#mov', '#games', '#major', '#interview', '#buh', '#acid', '#meet', '#crush', '#love', '#breakup', '#ill', '#exam', '#death', '#bad', '#sea', '#abroad'];
        },

        checkWiTime(time) {
            this.store.test.wiTimes.push(time);
        },

        error(msg, response, fname) {
            if (fname)
                ERROR(fname, `[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            else
                FIX_TIME(`[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            toastr.error(msg);
        },

        success(msg, fname) {
            fname ? LOG(fname, `[SUCCESS]: ${msg}`) : FIX_TIME(`[SUCCESS]: ${msg}`);
            toastr.success(msg);
        },

        checkGoogleMapsLoaded() {
            this.store.googleMapsLoaded = true;
        },

        logout() {
            this.store.loading = true;
            LOGOUT();
            window.location.replace('/login');
        },

        initData(data) {
            // --- initHeader() ----
            //подготавливаем спаны для ускорения
            data.spans.forEach(span => {
                span.startTime = (new Date(span.start)).getTime();
                span.endTime = (new Date(span.end)).getTime();
            });

            const NOWTIME = (new Date()).getTime();
            const birthTime = (new Date(data.birthdate)).getTime(); //время, когда родился (принимается за 00:00) <int>
            const deathTime = (new Date(data.deathdate)).getTime(); //смерть <int>
            const whereIsNow = Math.min(deathTime, NOWTIME); //"текущая дата жизни" = смерть или текущая дата <int>

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

            //---- initWeeks() ----
            let weekNum = 0; //текущий номер недели в жизни
            // начало недели, когда родился <int>
            let startMoment = moment(data.birthdate).startOf("week"); //начало недели
            const weeks = [];
            while (startMoment._d.getTime() < deathTime) {
                weekNum++; //номер недели
                let endMoment = startMoment.clone().add(1, 'week').subtract(1, 'second'); //конец недели
                let dbWeek = data.weekInfo[weekNum];
                let week = new WeekModel(startMoment, endMoment, weekNum, (dbWeek ? dbWeek.info : ""), data.spans);
                //инициализация первого холдера
                if (weekNum === 1 && week.yearNum > 1) {
                    this.store.firstYearPlaceHolderWidth = (week.yearNum - 1) * 20 - 3;
                }
                weeks.push(week);
                endMoment.add(1, 'second');
                startMoment = endMoment;
            }

            this.tagsUpdateAll(weeks);
            this.store.years = _.groupBy(weeks, 'year');
            this.store.weeks = weeks;

            //текущая неделя
            this.store.curWeek = {
                info: "",
                weekNum: -1
            };
        },

        //------------------------------Показ диалогов-----------------------------------------------------------
        //показ диалога с сообщениями
        showMessages() {
            this.store.shownMessageDialog = true;
            this.store.curMessages = this.store.curWeek.messages;
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
                this.$nextTick(() => {
                    this.initTravels();
                });
            }
        },

        showPillsDialog() {
            if (!this.store.shownPillsDialog) {
                this.store.shownPillsDialog = true;
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
        createWeek(week) {
            this.store.weeks[week.weekNum] = week;
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
        async loadMessages(week, forced) {
            if (week.messages.length && !forced)
                return;
            week.msgLoading = true;
            try {
                const response = await axios.get(`${$server.BASE_URL}/api/msg/${week.weekNum}`);
                if (response.data) {
                    week.messages = response.data;
                    week.msgLoading = false;
                    week.msgCount = week.messages.reduce((memo, chat) => chat.messages.length + memo, 0);
                    LOG('loadMessages', `Messages loaded for week ${week.weekNum}, count ${week.msgCount}`);
                }
            } catch (err) {
                this.error(`cannot load messages for week ${week.weekNum}`, err, 'loadMessages');
            };
        },

        /**
         * сохранение инфо недели
         */
        async saveWeek() {
            const week = this.store.curWeek;
            this.store.weeks[week.weekNum].info = week.editInfo;
            try {
                const response = await axios.post(`${$server.BASE_URL}/api/wol/weeks`, {
                    name: this.store.name,
                    weekNum: week.weekNum,
                    info: week.info,
                    msgCount: week.msgCount
                });
                if (response.status === 200) {
                    this.success(`Week ${week.weekNum} saved to DB.`, 'saveWeek');
                    this.tagsUpdate(week);
                } else {
                    this.error('Error saving week:', response, 'saveWeek');
                }
            } catch (err) {
                this.error(`Error saving week:`, err, 'saveWeek');
            };
        },

        //-------------------------- Навигация в режиме неделек ------------------------------------------------------
        /**
         * предыдущая неделя
         */
        prevWeek() {
            if (!this.store.curWeek && this.store.curWeek.weekNum === 1) {
                return;
            }
            const week = this.store.weeks.find(week => week.weekNum == this.store.curWeek.weekNum - 1);
            if (week)
                this.editWeek(week);
        },

        /**
         * следующая неделя
         */
        nextWeek() {
            if (!this.store.curWeek) {
                return;
            }
            const week = this.store.weeks.find(week => week.weekNum == this.store.curWeek.weekNum + 1);
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
            const week = this.store.weeks.find(week => week.yearNum == this.store.curWeek.yearNum && week.year == this.store.curWeek.year + 1);
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
            const week = this.store.weeks.find(week => week.yearNum == this.store.curWeek.yearNum && week.year == this.store.curWeek.year - 1);
            if (week) {
                this.editWeek(week);
            }
        },

        //--------------------- Тэги ---------------------------------------------------------------------------------
        tagsUpdateAll(weeks) {
            const stats = [];
            weeks.forEach(week => {
                week.getTags().forEach(tag => {
                    const ti = stats.find(ti => ti.tag == tag);
                    if (!ti) {
                        stats.push({
                            tag: tag,
                            weekNums: [week.weekNum]
                        });
                    } else {
                        ti.weekNums.push(week.weekNum);
                    }
                })
            });
            //добавляем картинкотаги (0)
            this.getTagIcons().forEach(tag => {
                if (!stats.find(ti => ti.tag == tag)) {
                    stats.push({
                        tag: tag,
                        weekNums: []
                    });
                }
            })
            this.store.tags.stats = stats;
        },

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
        async saveTravel(pos, cb) {
            try {
                const response = await axios.post(`${$server.BASE_URL}/api/travels`, pos);
                if (response.status === 200) {
                    LOG('saveTravel', "coords lat=" + pos.lat + "; lng=" + pos.lng + " successfully saved");
                    pos._id = response.data._id;
                    cb(pos);
                } else {
                    console.log(response.status);
                }
            } catch (err) {
                this.error("Error saving coords", err, "saveTravel")
            }
        },

        async removeTravel(_id) {
            try {
                const response = await axios.delete(`${$server.BASE_URL}/api/travels/${_id}`);
                if (response.status === 200) {
                    LOG("removeTravel", `travel _id = ${_id} successfully removed`);
                } else {
                    console.log(response.status);
                }
            } catch (err) {
                this.error("Error deleting travel: ", err, 'removeTravel');
            }
        },

        async initTravels() {
            LOG("initMap", "start");
            const self = this;
            try {
                const response = await axios.get(`${$server.BASE_URL}/api/travels`);

                const travels = response.data.filter(t => t._id);
                const map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 4,
                    center: travels[travels.length - 1]
                });

                function _createMarker(travel) {
                    const marker = new google.maps.Marker({
                        position: travel,
                        map
                    });
                    marker._id = travel._id;
                    google.maps.event.addListener(marker, "dblclick", function () {
                        self.removeTravel(marker._id);
                        marker.setMap(null);
                    })
                }

                travels.forEach(_createMarker);
                google.maps.event.addListener(map, 'click', function (event) {
                    self.saveTravel({
                        lat: event.latLng.lat(),
                        lng: event.latLng.lng()
                    }, function (newTravel) {
                        _createMarker(newTravel);
                    });
                });
                LOG("initMap", "map loaded");

            } catch (err) {
                LOG('initMap', 'initMap failed:');
            }
        }
    }
}
</script>