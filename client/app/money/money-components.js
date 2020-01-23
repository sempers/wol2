//BALANCE
Vue.component("balance", {
    props: ["amount", "currency", "category", "secondary"],

    template: `
    <div class="balance-container">
        <div class="currency-code" v-if="currency">{{currency}}</div>
        <div class="account-balance">
            <div class="amount" :class='{"income": amount >= 0 && (currency != "%"), "expense": amount < 0 && (currency !="%")}'>
                <span>{{amount | fmtAmount(options)}}</span>
            </div>
        </div>
        <div class="secondary-amount" v-if="secondary  && amount !== 0">{{secondary_amount | fmtAmount({places: 0})}}&nbsp;&nbsp;{{secondary}}</div>
    </div>`,

    data() {
        return {
            store: $store
        }
    },

    computed: {
        options() {
            switch (this.category) {
                case "crypto":
                    return {
                        places: 4
                    };
                case "2d":
                    return {
                        places: 2
                    };
                case "1d":
                    return {
                        places: 1
                    };
                case "rouble":
                    return {
                        places: 0
                    };
                case "currency":
                    return {
                        places: 0
                    };
                default:
                    return {
                        places: 0
                    };
            }
        },

        secondary_amount() {
            return this.store.convert(this.amount, this.currency, this.secondary); //OK
        },

        btc_amount() {
            return this.store.convert(this.amount, this.currency, "BTC");
        }
    },

    created() {
        this.currency = this.currency || "RUB";
        this.category = this.category || "rouble";
    }
});

//AMOUNT
Vue.component("amount", {
    props: ["amount", "type", "category", "options"],
    template: `<div class="amount" :class='{"income": amount > 0 && (!type || type=="income"), "expense": amount < 0 && (!type || type=="expense"), "transfer": (type=="transfer" || type=="transfer-fix"), "balance_reset": type == "balance_reset"}'>{{amount | fmtAmount(c_options)}}</div>`,
    computed: {
        c_options() {
            let options = this.options || {};
            if (!this.category)
                return options;
            else {
                switch (this.category) {
                    case "crypto":
                        return Object.assign({
                            places: 4,
                            type: "crypto"
                        }, options);
                    case "2d":
                        return Object.assign({
                            places: 2
                        }, options);
                    case "1d":
                        return Object.assign({
                            places: 1
                        }, options);
                    default:
                        return Object.assign({
                            places: 0
                        }, options);
                }
            }
        }
    }
});

Vue.component("cat-icon", {
    props: ["category", "currency"],
    template: `<div class="cat-icon" :class="category"><span><i :class="categoryClass"></i></span></div>`,
    computed: {
        categoryClass() {
            switch (this.currency) {
                case "RUB":
                    return ["fa", "fa-ruble-sign"];
                case "USD":
                    return ["fa", "fa-dollar-sign"];
                case "EUR":
                    return ["fa", "fa-euro-sign"];
                case "BTC":
                    return ["fab", "fa-btc"];
                case "ETH":
                    return ["fab", "fa-ethereum"];
                case "BNB":
                    return ["fab", "fa-bnb"];
            }

            switch (this.category) {
                case "rouble":
                    return ["fa", "fa-ruble-sign"];
                case "currency":
                    return ["fa", "fa-dollar-sign"];
                case "securities":
                    return ["fa", "fa-coins"];
                case "crypto":
                    return ["fab", "fa-btc"];
                case "flat":
                    return ["fa", "fa-home"];
                case "mortgage":
                    return ["fa", "fa-hand-holding-usd"];
                case "items":
                    return ["fa", "fa-car"];
                default:
                    return "";
            }
        }
    }
});

// ACCOUNTS

Vue.component("account-item", {
    props: ["account"],

    data() {
        return {
            store: $store,
            edited: false,
            oldName: "",
            oldHidden: false
        };
    },

    template: `
    <div class="acc-item" @click.ctrl.prevent="toggle()" @click.right.prevent="edit()" @click="select()" :class="{'active': store.cur.account && store.cur.account.name == account.name, 'hidden':account.hidden}" >
        <cat-icon :category="account.category" :currency="account.currency"></cat-icon>
        <div class="account-name" v-show="!edited">{{account.name}}</div>
        <md-field style="width:70px;" v-show="edited">
            <md-input v-model.lazy="account.name" @keydown="onKeyDown($event)" ></md-input>
        </md-field>
        <md-field style="width:25px;" v-show="edited">
            <md-input v-model.number.lazy="account.sort" @keydown="onKeyDown($event)"></md-input>
        </md-field>
        <md-checkbox class="hide-checkbox" v-model="account.hidden" v-show="edited">Hide</md-checkbox>
        <balance v-show="!edited" :amount="account.balance" :currency="account.currency" :category="account.category" v-if="account.currency == 'RUB'"></balance>
        <balance v-show="!edited" :amount="account.balance" :currency="account.currency" :category="account.category" :secondary="'RUB'" v-else></balance>
    </div>
    `,

    methods: {
        edit() {
            if (this.edited) {
                this.edited = false;
                this.account.name = this.oldName;
            } else {
                this.edited = true;
                this.oldName = this.account.name;
                this.oldHidden = this.account.hidden;
            }
        },

        onKeyDown(event) {
            if (event.key == "Enter" && !event.altKey && !event.shiftKey && !event.ctrlKey) {
                event.preventDefault();
                this.save();
            }
        },

        save() {
            $bus.$emit("account-saved", this.account);
            if (this.oldName != this.account.name) {
                this.edited = false;
                $bus.$emit("account-renamed", {
                    oldName: this.oldName,
                    newName: this.account.name
                });
            }
            this.edited = false;
        },

        toggle() {
            $bus.$emit("account-toggled", this.account);
        },

        select() {
            if (this.store.cur.account && this.store.cur.account.name == this.account.name)
                return;
            $bus.$emit("account-selected", this.account);
        }
    }
});

Vue.component("accounts-list", {
    template: `
    <div id="left-col">
        <div class="item">
            <md-button class="md-icon-button md-dense" @click="showChart()" style="margin:0;position:relative;top:-8px;">
                <md-icon>show_chart</md-icon>
            </md-button>
        </div>
        <div class="accounts-list">
            <div class="acc-item" :class="{'active': store.cur.account === null}" style="font-weight:bold" @click="selectAll()">
                <div class="account-name">Баланс</div>
                <balance style="font-size:16px" :amount="store.stats.totalBalance" :currency="'RUB'" :secondary="'USD'" :category="'rouble'"></balance>
            </div>
            <account-item v-for="account in accounts" :account="account" :key="account.id"></account-item>
        </div>
    </div>
    `,

    data() {
        return {
            store: $store
        };
    },

    computed: {
        accounts() {
            return _.sortBy(_.filter(this.store.accounts, acc => !acc.special && acc._id),
                acc => {
                    let sort = +acc.sort;
                    if (acc.hidden)
                        sort *= 1000;
                    return sort;
                });
        }
    },

    methods: {
        selectAll() {
            $bus.$emit("account-selected", null);
        },
        showChart() {
            $bus.$emit("show-chart");
        }
    }
});


//TRANSACTIONS-ITEM
Vue.component("tx-item", {
    props: ["tx"],

    data() {
        return {
            store: $store,
            old: null
        };
    },

    computed: {
        rate() {
            let n = this.tx;
            if (!n.dst_amount || !n.amount)
                return 1.0;
            else
                return n.dst_amount / n.amount;
        },

        tags() {
            return _.sortBy(_.pluck(this.store.base_tags, "name"));
        },

        accounts() {
            return _.pluck(this.store.normal_accounts(), "name");
        },

        amount() {
            if (this.store.no_acc()) { //когда не выбран аккаунт
                if (this.tx.type === "transfer") {
                    if (this.store.acc_currency(this.tx.src) === "RUB")
                        return this.tx.amount;
                    else if (this.store.acc_currency(this.tx.dst) === "RUB")
                        return this.tx.dst_amount;
                }
                return this.store.convertTxAmount(this.tx, "RUB"); //OK
            }
            if (this.store.is_acc_current(this.tx.src)) {
                return this.tx.amount;
            }
            if (this.store.is_acc_current(this.tx.dst)) {
                return this.tx.dst_amount;
            } 
        },

        balance() {
            if (this.store.no_acc()) { //когда не выбран аккаунт
                return "";
            }
            if (this.store.is_acc_current(this.tx.src)) { //если текущий аккаунт - исходный
                return this.tx.src_balance;
            }
            if (this.store.is_acc_current(this.tx.dst)) {
                return this.tx.dst_balance;
            }
        },

        category() {
            if (this.store.cur.account === null) { //когда не выбран аккаунт
                return "";
            }
            if (this.store.is_acc_current(this.tx.src)) {
                return this.store.acc_category(this.tx.src);
            }
            if (this.store.is_acc_current(this.tx.dst)) {
                return this.store.acc_category(this.tx.dst);
            }
        },

        show_date() {
            return moment(this.tx.date).format("ddd DD");
        },

        special_date() {
            return moment(this.tx.date).format("DD.MM.YYYY");
        },

        tag_color() {
            return this.store.tag_color(this.tx.tag);
        }
    },

    template: `
    <div class="tx-item" @click="edit()" :class='{"income": tx.type == "income", "expense": tx.type == "expense", "transfer": tx.type=="transfer", "balance_reset": tx.type == "balance_reset"}'>
        <div class="viewed" v-show="!tx.isEdited" @click="edit()">
            <div class="tx-amount">
                <div class="tx-id">{{tx.f41_id}}</div>
                <amount :amount="amount" :type="tx.type" :category="category"></amount>
            </div>
            <div class="tx-tags-text" v-if="tx.type != 'balance_reset' && tx.tag" :style="{'background-color': tag_color}">{{tx.tag}}</div>
            <div class="tx-tags-text-blank" v-if="!(tx.type != 'balance_reset' && tx.tag)"></div>
            <div class="tx-name" v-if="tx.desc">{{tx.desc}}</div>
            <div class="tx-difference" v-if="store.cur.account && tx.type=='balance_reset'">
                <amount :amount="tx.difference" :category="category" :type="'balance_reset'"></amount>
            </div>
            <div class="tx-delete">
                <md-button class="md-icon-button md-dense show-hovered" @click.stop="tryremove()" style="margin:0">
                    <md-icon>clear</md-icon>
                </md-button>
            </div>
            <div class="tx-date" v-if="!store.is_acc_special() && store.cur.isMonthView">{{show_date}}</div>
            <div class="tx-date" v-else>{{special_date}}</div>

            <div class="tx-balance" v-if="store.cur.account && !store.is_acc_special()">
                <amount class="account-balance" :amount="balance" :category="category"></amount>
            </div>

            <div class="tx-account" v-if="!store.cur.account && tx.dst">{{tx.dst}}</div>
            <div class="tx-account" v-if="!store.cur.account" :class="{'tar': tx.dst}">{{tx.src}} <div v-if="tx.dst" style="text-decoration:none;float:right">&#8594;</div></div>
            <div class="tx-account" v-if="store.cur.account && tx.type=='transfer' && tx.src == store.cur.account.name">&#8594; {{tx.dst}}</div>
            <div class="tx-account" v-if="store.cur.account && tx.type=='transfer' && tx.dst == store.cur.account.name">&#8592; {{tx.src}}</div>
            <div class="tx-trade-icon" v-if="tx.trade" :class="tx.trade">{{tx.trade}}</div>
        </div>
        <div v-if="tx.isRemoved" class="btn-item">
            <div class="btn-item-title">Удалить транзакцию?</div>
            <md-button class="md-raised md-accent md-dense" @click.stop="remove()">Да</md-button>
            <md-button class="md-raised md-dense" @click.stop="tx.isRemoved = false">Нет</md-button>
        </div>
        <div v-if="tx.isEdited" class="edited-tx">
            <div style="width:100%">
                <div class="md-layout md-gutter">
                    <div class="md-layout-item" style="max-width:110px">
                        <md-field class="mb0">
                            <md-input class="tar" v-model="tx.amount" v-on:keyup.13.stop="save()"/>
                        </md-field>
                        <md-field class="mb0" v-if="tx.type == 'transfer'">
                            <md-input class="tar" v-model="tx.dst_amount" v-on:keyup.13.stop="save()"/>
                        </md-field>
                    </div>
                    <div class="md-layout-item" style="max-width:130px">
                        <md-autocomplete class="mb0" name="tags" v-model="tx.tag" :md-options="tags" md-dense></md-autocomplete>
                        <div class="tx-rate" v-if="tx.type=='transfer'">
                            <md-chip>{{rate.toFixed(3)}} / {{(1/rate).toFixed(3)}}</md-chip>
                        </div>
                    </div>
                    <div class="md-layout-item">
                        <md-field>
                            <md-input name="desc" v-model="tx.desc" v-on:keyup.13.stop="save()"/>
                        </md-field>
                    </div>
                    <div class="md-layout-item" style="max-width:130px">
                        <md-autocomplete class="mb0" name="src" v-model="tx.src" :md-options="accounts" md-dense></md-autocomplete>
                        <md-autocomplete name="dst" v-model="tx.dst" v-if="tx.type=='transfer'" :md-options="accounts" md-dense></md-autocomplete>
                    </div>
                    <div class="md-layout-item">
                        <md-datepicker name="date" v-model="tx.date" md-dense md-immediately></md-datepicker>
                    </div>
                </div>
            </div>
            <div class="btn-item">
                <!--<div class="tx-balance-detail" v-if="!store.is_acc_special">{{tx.src}}: {{tx.src_balance_before.toFixed(0)}} &#8594; {{tx.src_balance.toFixed(0)}}</div>
                <div class="tx-balance-detail" v-if="!store.is_acc_special && tx.dst">{{tx.dst}}: {{tx.dst_balance_before.toFixed(0)}} &#8594; {{tx.dst_balance.toFixed(0)}}</div>-->
                <div class="tx-balance-detail" style="padding-left:16px">order: {{tx.order}}</div>
                <md-button class="md-raised md-primary md-dense" @click.stop="save()">ОК</md-button>
                <md-button class="md-raised md-dense" @click.stop="cancel()">Отмена</md-button>
            </div>
        </div>
    </div>
    `,

    methods: {
        edit() {
            this.tx.isEdited = true;
            this.old = {
                type: this.tx.type,
                amount: this.tx.amount,
                dst_amount: this.tx.dst_amount,
                src: this.tx.src,
                tag: this.tx.tag,
                dst: this.tx.dst,
                desc: this.tx.desc,
                date: this.tx.date,
                rate: this.tx.rate
            }
        },

        save() {
            this.tx.rate = this.rate;
            $bus.$emit("tx-saved", this.tx);
            this.tx.isEdited = false;
        },

        cancel() {
            if (this.old) {
                this.tx.type = this.old.type;
                this.tx.amount = this.old.amount;
                this.tx.dst_amount = this.old.dst_amount;
                this.tx.src = this.old.src;
                this.tx.dst = this.old.dst;
                this.tx.taq = this.old.tag;
                this.tx.desc = this.old.desc;
                this.tx.date = this.old.date;
                this.tx.rate = this.old.rate;
                this.old = null;
            }
            this.tx.isEdited = false;
        },

        tryremove() {
            this.tx.isRemoved = true;
        },

        remove() {
            $bus.$emit("tx-removed", this.tx);
        }
    }
});


Vue.component("transactions-list", {
    data() {
        return {
            store: $store
        };
    },

    computed: {
        category() {
            if (this.store.no_acc()) {
                return "rouble";
            } else
                return this.store.acc_category(this.store.cur.account.name);
        },

        minHeight() {
            return Math.max((this.store.cur.tx.length) * 51, 15 * 51);
        },

        curMonthText() {
            const MONTHS = this.store.MONTHS;
            return (this.store.cur.year === (new Date()).getFullYear()) ? MONTHS[this.store.cur.month] : `${MONTHS[this.store.cur.month]} ${this.store.cur.year}`;
        },

        transactions() {
            return _.sortBy(this.store.cur.tx, tx => -tx.order);
        }
    },

    template: `
    <div id="middle-col">
        <div class="txlist-header">
            <div style="width:300px">
                <md-button class="md-icon-button md-dense" :class="{'md-accent': !store.cur.isMonthView}" @click="toggleView()" style="margin:0">
                    <md-icon>date_range</md-icon>
                    <md-tooltip>Период месяц/год</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" @click="move('first')" style="margin:0">
                    <md-icon>first_page</md-icon>
                    <md-tooltip>На самое начало</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" @click="move('prev')" style="margin:0">
                    <md-icon>chevron_left</md-icon>
                    <md-tooltip>Предыдущий период</md-tooltip>
                </md-button>
                <div class="txlist-header-month" v-if="store.cur.isMonthView">{{curMonthText}}</div>
                <div class="txlist-header-month" v-else><strong>{{store.cur.year}}</strong></div>
                <md-button class="md-icon-button md-dense" @click="move('next')" style="margin:0">
                    <md-icon>chevron_right</md-icon>
                    <md-tooltip>Следующий период</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" @click="move('today')" style="margin:0">
                    <md-icon>last_page</md-icon>
                    <md-tooltip>Сегодня</md-tooltip>
                </md-button>
            </div>
            <template v-if="!store.is_acc_special()">
                <div>
                    <md-icon>looks_one</md-icon>
                </div>
                <div style="width:80px">
                    <amount :amount="store.cur.begin" :category="category" :options="{bug: 1}"></amount>
                    <md-tooltip>На начало месяца</md-tooltip>
                </div>
                <div>
                    <md-icon>looks_two</md-icon>
                </div>
                <div style="width:80px">
                    <amount :amount="store.cur.end" :category="category" :options="{bug: 1}"></amount>
                    <md-tooltip>На конец месяца</md-tooltip>
                </div>
                <div>
                    <md-icon>change_history</md-icon>
                </div>
                <div style="width:120px">
                    <amount :amount="store.cur.delta" :category="category" :options="{bug: 1}"></amount>
                    <md-tooltip>Абсолютный прирост периода (относительный прирост в %)</md-tooltip>
                    <amount class="delta-pct" v-if="!isNaN(store.cur.deltaPercent)" :amount="store.cur.deltaPercent" :options="{delta: 1, places: 1, prefix: '(', suffix:'%)', max_n: 10000}"></amount>
                </div>
                <div v-if="true || store.cur.txType || store.cur.tag">
                    <md-icon>functions</md-icon>
                </div>
                <div style="width:120px" v-if="true || store.cur.txType || store.cur.tag">
                    <amount :amount="store.cur.viewNet" :type="store.cur.txType == 'transfer' ? 'transfer': ''" :category="category" :options="{bug: 1}"></amount>
                    <md-tooltip>Нетто по показанным транзакциям (курсовая разница)</md-tooltip>
                    <amount :amount="store.cur.rateNet" v-if="!store.cur.account && store.cur.rateNet && !(store.cur.txType || store.cur.tag)" :type="'transfer-fix'" class="delta-pct" :options="{delta: 1, prefix:'(', suffix: ')', places:0, t: 'rate'}"></amount>
                </div>
            </template>
            <template v-else>
                <div style="width:50px">Баланс:</div>
                <div style="width:100px">
                    <amount :amount="store.cur.begin" :type="''" :category="''"></amount>
                </div>
            </template>
        </div>
        <div class="txlist-list" :style="{'min-height': minHeight}">
            <div class="no-transactions" v-if="!store.cur.tx.length">Транзакции отсутствуют</div>
            <tx-item v-else v-for="tx in transactions" :tx="tx" :key="tx.f41_id"></tx-item>
        </div>
        <div class="txlist-below" >
            <div v-show="store.cur.tag && store.cur.avgRateBuy">
                <md-icon>compare_arrows</md-icon>
                Покупка: <amount :amount="store.cur.avgRateBuy" :type="''" :options="{places: 2}"></amount>
                Продажа: <amount :amount="store.cur.avgRateSell" :type="''" :options="{places: 2}"></amount>
            </div>
        </div>
    </div>    
    `,

    methods: {
        move(where) {
            $bus.$emit("move", where);
        },

        toggleView() {
            this.store.cur.isMonthView = !this.store.cur.isMonthView;
            $bus.$emit("month-view-toggled");
        }
    }
});

Vue.component("stats-list", {
    data() {
        return {
            store: $store
        };
    },

    computed: {
        last_updated_time() {
            let d = this.store.lastUpdated;
            if (!(d instanceof Date))
                return "n/a";
            return moment(d).format("DD.MM.YYYY HH:mm:ss");
        }
    },

    template: `
    <div id="stats-col">
        <div class="item stats-net-worth">
            <div class="account-name">NET WORTH</div>
            <balance :amount="store.stats.net_worth" :currency="'RUB'" :secondary="'USD'" :category="'rouble'"></balance>
        </div>
        <md-divider></md-divider>
        <div class="item stats-items" :class="{'active': store.cur.account && store.cur.account.name == 'ITEMS'}" @click="selectSpecialAccount('ITEMS')">
            <cat-icon :category="'items'"></cat-icon>
            <div class="account-name">Имущество</div>
            <balance :amount="store.stats.personal_things" :currency="'RUB'" :category="'rouble'"></balance>
        </div>

        <div class="item stats-flat" :class="{'active': store.cur.account && store.cur.account.name == 'FLAT'}" @click="selectSpecialAccount('FLAT')">
            <cat-icon :category="'flat'"></cat-icon>
            <div class="account-name">Квартира</div>
            <balance :amount="store.stats.flat_value" :currency="'RUB'" :category="'rouble'"></balance>
        </div>
        <div class="item stats-mortgage" :class="{'active': store.cur.account && store.cur.account.name == 'MORTGAGE'}" @click="selectSpecialAccount('MORTGAGE')">
            <cat-icon :category="'mortgage'"></cat-icon>
            <div class="account-name">Ипотека</div>
            <balance :amount="store.stats.mortgage" :currency="'RUB'" :category="'rouble'"></balance>
        </div>
        <md-divider></md-divider>
        <div class="item " >
            <div class="account-name">Инвестировано</div>
            <balance :amount="store.stats.flat_invested" :currency="'RUB'" :category="'rouble'" ></balance>
        </div>
        <div class="item ">
            <div class="account-name">Эквити квартиры</div>
            <balance :amount="store.stats.flat_equity" :currency="'RUB'" :category="'rouble'"></balance>
        </div>
        <div class="item">
            <div class="account-name">Доля квартиры в NW</div>
            <balance :amount="store.stats.flat_nw_ratio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <div class="item">
            <div class="account-name">ROI квартиры</div>
            <balance :amount="store.stats.flat_roi" :currency="'%'" :category="'1d'"></balance>
        </div>

        <md-divider></md-divider>

        <div class="item stats-ratio">
            <cat-icon :category="'rouble'"></cat-icon>
            <div class="account-name">Рубли</div>
            <balance :amount="store.stats.rub_ratio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'currency'"></cat-icon>
            <div class="account-name">Валюта</div>
            <balance :amount="store.stats.curr_ratio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'securities'"></cat-icon>
            <div class="account-name">Ценные бумаги</div>
            <balance :amount="store.stats.sec_ratio" :currency="'%'" :category="'1d'"></balance>
        </div>
        <div class="item stats-ratio">
            <cat-icon :category="'crypto'"></cat-icon>
            <div class="account-name">Криптовалюта</div>
            <balance :amount="store.stats.crypto_ratio" :currency="'%'" :category="'1d'"></balance>
        </div>

        <md-divider></md-divider>

        <rate-item :item="store.stats.rateItems['USDRUB']"></rate-item>
        <rate-item :item="store.stats.rateItems['EURRUB']"></rate-item>
        <rate-item :item="store.stats.rateItems['BTCUSD']"></rate-item>
        <rate-item :item="store.stats.rateItems['BNBUSD']"></rate-item>
        <rate-item :item="store.stats.rateItems['ETHUSD']"></rate-item>

        <md-divider></md-divider>
        <div class="item stats-rates last-updated">
            <div class="ib pl">Обновлено:</div>
            <div class="ib pr">{{last_updated_time}}</div>
        </div>
        <div class="item stats-rates" style="padding:0;display:flex;justify-content:center" v-show="isFirstDayOfMonth()" >
            <md-button class="md-raised md-dense" @click="saveRates()">
                Сохранить курсы
            </md-button>
        </div>
    </div>
    `,

    methods: {
        selectSpecialView(view) {
            $bus.$emit("special-view", view);
        },

        selectSpecialAccount(acc_name) {
            var acc = _.find(this.store.accounts, acc => acc.special && acc.name == acc_name);
            if (acc) {
                $bus.$emit("account-selected", acc);
            }
        },

        isFirstDayOfMonth() {
            return (new Date()).getDate() == 1;
        },

        saveRates() {
            $bus.$emit("save-rates-clicked");
        },
    }
});

Vue.component("tx-form", {
    data() {
        return {
            ntx: {
                type: "income",
                amount: "",
                dst_amount: "",
                src: "MAIN",
                dst: null,
                created: null,
                edited: null,
                date: new Date(),
                rate: 1,
                tag: "",
                tags: [],
                desc: "",
                f41_id: -1,
                removed: false,
                isRemoved: false,
                isEdited: false
            },
            store: $store
        };
    },

    computed: {
        rate() {
            let n = this.ntx;
            if (!n.dst_amount || !n.amount)
                return 1.0;
            else
                return n.dst_amount / n.amount;
        },

        tags() {
            return _.sortBy(_.pluck(this.store.base_tags, "name"));
        },

        accounts() {
            return _.pluck(_.filter(this.store.accounts, a => !a.special && !a.hidden), "name");
        }
    },

    created() {
        this.$material.locale.firstDayOfAWeek = 1;
    },

    mounted() {
        $bus.$on("tx-saved-ok", this.blank);
        $bus.$on("account-selected", this.modAcc);
        $bus.$on("tag-selected", this.modTag);
        $bus.$on("preferred-date", this.modDate);
        this.$watch("ntx.dst", this.watchDst);
        this.$watch("ntx.amount", this.watchAmount);
    },

    template: `
    <div class="md-layout md-gutter">
    <div class="md-layout-item" style="max-width:96px">
        <md-field md-dense>
            <label>Тип</label>
            <md-select name="type" v-model="ntx.type" md-dense>
                <md-option value="income">Доход</md-option>
                <md-option value="expense" v-show="!store.is_acc_special()">Расход</md-option>
                <md-option value="transfer" v-show="!store.is_acc_special()">Перевод</md-option>
                <md-option value="balance_reset" v-show="!store.is_acc_special()">Сброс</md-option>
            </md-select>
        </md-field>
    </div>
    <div class="md-layout-item" style="max-width:60px">
        <md-field class="mb0">
            <label>Сумма</label>
            <md-input class="tar" v-model="ntx.amount"/>
        </md-field>
        <md-field class="mb0" v-if="ntx.type == 'transfer'">
            <label>Сумма2</label>
            <md-input class="tar" v-model="ntx.dst_amount"/>
        </md-field>
    </div>
    <div class="md-layout-item" style="max-width:130px">
        <md-autocomplete class="mb0" name="tags" v-model="ntx.tag" :md-options="tags" md-dense>
            <label>Тэг</label>
        </md-autocomplete>
        <div class="tx-rate" v-if="ntx.type=='transfer'">
            <md-chip>{{rate.toFixed(3)}} / {{(1/rate).toFixed(3)}}</md-chip>
        </div>
    </div>
    <div class="md-layout-item">
        <md-field>
            <label>Описание</label>
            <md-input name="desc" v-model="ntx.desc"/>
        </md-field>
    </div>
    <div class="md-layout-item" style="max-width:130px;margin-left:20px">
        <md-autocomplete class="mb0" name="src" v-model="ntx.src" :md-options="accounts" md-dense>
            <label v-if="ntx.type != 'transfer'">Счет</label>
            <label v-else>Откуда</label>
        </md-autocomplete>
        <md-autocomplete  style="margin-top:0" name="dst" v-model="ntx.dst" v-if="ntx.type=='transfer'" :md-options="accounts" md-dense>
            <label>Куда</label>
        </md-autocomplete>
        <md-button class="md-icon-button md-dense" v-if="ntx.type=='transfer'" @click="swapFromTo()" style="margin:0;position:relative;top:-75px;left:-35px;">
            <md-icon>repeat</md-icon>
        </md-button>
    </div>
    <div class="md-layout-item">
        <md-datepicker name="date" v-model="ntx.date" md-immediately></md-datepicker>
    </div>
    <div>
        <md-button class="md-raised md-primary md-dense" @click="save()" style="position:relative;top:8px">Добавить</md-button>
    </div>
</div>
    `,

    methods: {
        blank() {
            this.ntx = {
                type: this.ntx.type,
                amount: 0,
                dst_amount: 0,
                src: this.ntx.src || "MAIN",
                dst: this.ntx.type == "transfer" ? this.ntx.dst : null,
                created: null,
                edited: null,
                date: this.ntx.date,
                rate: 1,
                tag: this.ntx.tag || "",
                tags: [],
                desc: "",
                f41_id: this.store.next_f41_id(),
                removed: false,
                isRemoved: false,
                isEdited: false
            };
        },

        watchDst(value) {
            let n = this.ntx;
            let $s = this.store;
            if (n.type === "transfer" && n.amount && $s.acc(n.src) && $s.acc(value)) {
                if ($s.acc_currency(value) === $s.acc_currency(n.src)) {
                    n.dst_amount = n.amount;
                } else if (!n.dst_amount) {
                    n.dst_amount = this.store.convert(n.amount, $s.acc_currency(n.src), $s.acc_currency(value)); //OK
                }
            }
        },

        watchAmount(value) {
            let n = this.ntx;
            let $s = this.store;
            if (n.type === "transfer" && n.src && n.dst && $s.acc(n.src) && $s.acc(n.dst) && $s.acc_currency(n.dst) === $s.acc_currency(n.src)) {
                this.ntx.dst_amount = value;
            }
        },

        swapFromTo() {
            let swap = this.ntx.src;
            this.ntx.src = this.ntx.dst;
            this.ntx.dst = swap;
        },

        modTag(tag) {
            if (tag && this.ntx.tag !== tag) {
                this.ntx.tag = tag;
            }
        },

        modDate(date) {
            if (date)
                this.ntx.date = date;
        },

        modAcc(acc) {
            this.ntx.src = acc ? acc.name : "MAIN";
        },

        save() {
            $bus.$emit("tx-added", this.ntx);
        }
    }
});

//PINNED TAGS

Vue.component("pinned-tag-item", {
    data() {
        return {
            store: $store
        }
    },

    props: ["tag"],

    template: `
    <div class="tag-item" @click.left="select()" @click.right.prevent="edit()" :class="{'active': store.cur.tag == tag.bt.name, 'disabled': !tag.enabled}">
        <div class="tag-color" :style="{'background-color': color}"></div>
        <div class="tag-info" v-show="!tag.isEdited">
            <div class="tag-name">{{tag.bt.name}}</div>
            <div class="tag-budget" v-if="store.no_acc() && tag.budget.max && !(!store.cur.isMonthView && tag.budget.type == 'monthly')"
                :class="{'transfer': tag.budget.type=='yearly', 'income': tag.budget.type=='monthly' && tag.budget.percentage <= 100.0, 'expense': tag.budget.type=='monthly' && tag.budget.percentage > 100}">
                <span>{{tag.budget.spent}} / {{tag.budget.max}} ({{tag.budget.percentage}}%)</span>
            </div>
            <div class="tag-budget no-border" v-else>&nbsp;</div>
            <div class="tag-delete" v-if="!tag.enabled">
                <md-button class="md-icon-button md-dense show-hovered" @click.stop="remove()" style="margin:0">
                    <md-icon>clear</md-icon>
                </md-button>
            </div>
            <div class="tag-amount" v-if="tag.enabled">
                <amount :amount="tag.amount" :type="type" :category="category"></amount>
            </div>
        </div>
        <div class="edited tag-info" v-if="!tag.empty && tag.isEdited">
            <div class="md-layout md-gutter">
                <div class="md-layout-item" style="max-width:80px">
                <md-field>
                        <md-input v-model="tag.bt.name"></md-input>
                </md-field>
                </div>
                <div class="md-layout-item" style="max-width:70px">
                    <md-field>
                        <md-input v-model="tag.bt.color"></md-input>
                    </md-field>
                </div>
                <div class="md-layout-item" style="max-width:70px">
                    <md-field>
                        <md-input class="tar" v-model.number="tag.bt.budget"></md-input>
                    </md-field>
                </div>
                <div class="md-layout-item" style="max-width:100px">
                    <md-field>
                        <md-select v-model="tag.bt.budget_type" md-dense>
                            <md-option value="monthly">Мес.</md-option>
                            <md-option value="yearly">Год</md-option>
                        </md-select>
                    </md-field>
                </div>
                <div>
                    <md-button class="md-primary md-raised md-dense" @click.stop="save()">ОК</md-button>
                    <md-button class="md-raised md-dense" @click.stop="cancel()">Отмена</md-button>
                </div>
            </div>
        </div>
    </div>
    `,
    computed: {
        category() {
            if (this.store.no_acc()) {
                return "";
            } else
                return this.store.acc_category(this.store.cur.account.name);
        },

        color() {
            return this.store.tag_color(this.tag.bt.name);
        },

        type() {
            if (this.store.no_acc() && this.tag.bt.name.includes("Invest"))
                return "transfer";
            else
                return "";
        }
    },
    methods: {
        select() {
            if (!this.tag.isEdited) {
                $bus.$emit("tag-selected", this.tag.bt.name);
            }
        },

        edit() {
            if (!this.tag.empty && this.tag.enabled && !this.tag.isEdited) {
                this.tag.isEdited = true;
                this.tag.oldName = this.tag.bt.name;
                this.tag.oldColor = this.tag.bt.color;
            }
        },

        cancel() {
            this.tag.isEdited = false;
            this.tag.isRemoved = false;
            this.tag.bt.name = this.tag.oldName;
            this.tag.bt.color = this.tag.oldColor;
        },

        save() {
            let _bt = _.clone(this.tag.bt, true);
            $bus.$emit("tag-saved", _bt);
            if (this.tag.oldName != this.tag.bt.name) {
                if (!this.tag.bt.name && _.find(this.store.transactions, {
                        tag: this.tag.bt.name
                    }).length) {
                    this.error(`[removeTag] There are transactions with tag ${this.tag.bt.name}`);
                    this.cancel();
                    return;
                }
                $bus.$emit("tag-renamed", {
                    oldName: this.tag.oldName,
                    newName: this.tag.bt.name
                });
            }
        },

        tryremove() {
            this.tag.isRemoved = true;
        },

        remove() {
            $bus.$emit("tag-removed", this.tag.bt);
        }
    }
});

Vue.component("pinned-tags-list", {
    data() {
        return {
            store: $store
        };
    },
    
    template: `
    <div id="right-col">
        <div id="right-col-header" class="item" >
            <div id="right-col-header-menu" >
                <md-button class="md-icon-button md-dense" @click="selectType(null)" style="margin:0">
                    <md-icon>filter_list</md-icon>
                    <md-tooltip>Сбросить фильтр</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': store.cur.txType == 'income'}" @click="selectType('income')" style="margin:0">
                    <md-icon>add_circle</md-icon>
                    <md-tooltip>Доходы</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': store.cur.txType == 'expense'}" @click="selectType('expense')" style="margin:0">
                    <md-icon>remove_circle</md-icon>
                    <md-tooltip>Расходы</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': store.cur.txType == 'transfer'}" @click="selectType('transfer')" style="margin:0">
                    <md-icon>send</md-icon>
                    <md-tooltip>Переводы</md-tooltip>
                </md-button>
                <md-button class="md-icon-button md-dense" :class="{'md-accent': store.cur.txType == 'balance_reset'}" @click="selectType('balance_reset')" style="margin:0">
                    <md-icon>input</md-icon>
                    <md-tooltip>Сброс баланса</md-tooltip>
                </md-button>
            </div>

            <div id="total-budget" class="tag-budget" v-if="store.no_acc() && store.cur.isMonthView"
                :class="{'income': store.cur.budget.percentage <= 100.0, 'expense': store.cur.budget.percentage > 100}">
                <span>{{store.cur.budget.spent}} / {{store.cur.budget.max}} ({{store.cur.budget.percentage}}%)</span>
                <md-tooltip>Общий месячный бюджет</md-tooltip>
            </div>

        </div>
        <div class="pinned-tags-list">
            <pinned-tag-item v-for="tag in store.cur.tags" :tag="tag" :key="tag.name"></pinned-tag-item>
        </div>
    </div>    
    `,

    methods: {
        selectAll() {
            $bus.$emit("tag-selected", null);
        },

        selectType(type) {
            if (type === null) {
                $bus.$emit("filter-cleared");
            }
            $bus.$emit("tx-type-selected", type);
        }
    }
});

Vue.component("rate-item", {
    props: ["item"],
    data() {
        return {
            store: $store
        };
    },
    computed: {
        rateValue() {
            return this.store.rate(this.item.sym1, 0) / this.store.rate(this.item.sym2, 0)
        },

        rateDelta() {
            let now_ym = this.store.ym((new Date()).getFullYear(), (new Date()).getMonth());
            return this.rateValue - this.store.rate(this.item.sym1, now_ym) / this.store.rate(this.item.sym2, now_ym);
        },

        rateSecondary() {
            if (this.item.sym2 == "RUB" || !this.item.avg_entrance) {
                return null;
            } else {
                return this.store.rate(this.item.sym1, 0);
            }
        }
    },
    template: `
    <div class="item stats-rates">
        <div class="account-name">{{item.sym1}}{{item.sym2}}</div>
        <div class="account-balance">
            <amount class="mini" style="margin-right:5px":amount="rateDelta" :category="item.category" :options="{delta: 1}"></amount>
            <amount :amount="rateValue" :category="item.category" :type="'rate'"></amount>            
        </div>
        <div class="rate-profit" v-if="item.avg_entrance">● {{item.avg_entrance | fmtAmount({places:2, no_thousand: 1})}} Δ {{item.profit | fmtAmount({places:1, no_thousand:1, delta: 1})}} ({{item.profit_pct | fmtAmount({places:1, delta: 1})}}%)</div>
        <div class="secondary-amount rate" v-if="rateSecondary">{{rateSecondary | fmtAmount({places: 0})}} RUB</div>
    </div>
    `
});