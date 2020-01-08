new Vue({
    el: "#vwol",

    template: "#t_WolApp",

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
            axios.get(`${$server.BASE_URL}/api/wol/weeks`)
                .then(response => {
                    if (response.data) {
                        LOG('created()', "DATA RECEIVED");
                        let raw_data = response.data;
                        this.initHeader(raw_data);
                        this.initWeeks(raw_data);
                    } else {
                        ERROR('created()', "loading /api/wol/weeks failed")
                    }
                });
        });
    },

    mounted() {
        LOG('mounted()', 'WolApp MOUNTED');
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
                Vue.nextTick(() => {
                    this.initTravels();
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
            axios.get(`${$server.BASE_URL}/api/msg/${week.weekNum}`)
                .then(
                    response => {
                        if (response.data) {
                            week.messages = response.data;
                            week.msgLoading = false;
                            week.msgCount = _.reduce(week.messages, (memo, chat) => chat.messages.length + memo, 0);
                            LOG('loadMessages', `Messages loaded for week ${week.weekNum}, count ${week.msgCount}`);
                        }
                    }
                )
                .catch(error => {
                    this.error(`cannot load messages for week ${week.weekNum}`, error, 'loadMessages');
                });
        },

        /**
         * сохранение инфо недели
         */
        saveWeek() {
            const _week = this.store.curWeek;
            this.store.weeks[_week.weekNum].info = _week.editInfo;

            axios.post(`${$server.BASE_URL}/api/wol/weeks`,
                {
                    name: this.store.name,
                    weekNum: _week.weekNum,
                    info: _week.info,
                    msgCount: _week.msgCount
                })
                .then(response => {
                    if (response.status === 200) {
                        this.success(`Week ${_week.weekNum} saved to DB.`, 'saveWeek');
                        this.tagsUpdate(_week);
                    } else {
                        this.error('error saving week', response, 'saveWeek');
                    }
                }
                ).catch(error => {
                    this.error(`Error saving week:`, error, 'saveWeek');
                });
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
        saveTravel(pos) {
            axios.post(`${$server.BASE_URL}/api/travels`, pos).then(
                response => {
                    if (response.status === 200) {
                        LOG('saveTravel', "coords lat=" + pos.lat + "; lng=" + pos.lng + " successfully saved");
                    } else {
                        console.log(response.status);
                    }
                }).catch(
                    (err) => {
                        this.error("Error saving coords", err, "saveTravel")
                    }
                );
        },

        removeTravel(_id) {
            axios.delete(`${$server.BASE_URL}/api/travels/${_id}`).then(
                response => {
                    if (response.status === 200) {
                        LOG("removeTravel", `travel _id = ${_id} successfully removed`);
                    } else {
                        console.log(response.status);
                    }
                }).catch(
                    (err) => {
                        this.error("Error saving coords: ", err, 'removeTravel');
                    }
                );
        },

        initTravels() {
            LOG("initMap", "start");
            let self = this;
            axios.get(`${$server.BASE_URL}/api/travels`).then(
                response => {
                    let travels = response.data;

                    let map = new google.maps.Map(document.getElementById('map'), {
                        zoom: 4,
                        center: travels[travels.length - 1]
                    });

                    function _createMarker(travel) {
                        let marker = new google.maps.Marker({ position: travel, map });
                        marker._id = travel._id;
                        google.maps.event.addListener(marker, "dblclick", function () {
                            self.removeTravel(marker._id);
                            marker.setMap(null);
                        })
                    }
                    
                    travels.forEach(_createMarker);

                    google.maps.event.addListener(map, 'click', function (event) {
                        _createMarker(event.latLng);
                        self.saveTravel({
                            lat: event.latLng.lat(),
                            lng: event.latLng.lng()
                        });
                    });

                    LOG("initMap", "map loaded");
                })
                .catch(err => LOG('initMap', 'initMap failed:'));
        }
    }
});

