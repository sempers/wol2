<template>
    <div class="app-layout">
        <wol-spinner :store="store"></wol-spinner>
        <chart-dialog></chart-dialog>
        <transition name="fade">
            <div v-show="!store.loading">
                <div id="money-header">
                    <div class="tx-form">
                        <tx-form></tx-form>
                    </div>
                </div>
                <div id="money-main" v-if="!store.loading">
                    <div id="money-container">
                        <stats-list></stats-list>
                        <accounts-list></accounts-list>
                        <transactions-list></transactions-list>
                        <tags-list></tags-list>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
<style lang="less">
body {
    font-family: "Roboto", sans-serif;
    background-color: inherit;
    font-size: 13px !important;
}

a:focus {
    outline: none;
}

.show-hovered {
    display: none;
}

/*LAYOUT*/
#money-header {
    width: 100%;
    border-bottom: 1px solid #eee;
}

#money-main {
    #money-container {
        width: 1920px;
        margin: 0 auto;
    }
}

.md-checkbox .md-checkbox-label {
    padding-left: 12px;
}

/* md-money.css */

.md-field {
    min-height: 28px;
    font-family: Roboto, "Helvetica Neue", sans-serif;
    font-size: 13px;
    margin-bottom: 12px;

    label {
        font-size: 13px;
    }

    .md-input, .md-textarea {
        font-size: 13px;
        height: 30px;
    }
}

.md-field.md-focused .md-input,
.md-field.md-focused .md-textarea,
.md-field.md-has-value .md-input,
.md-field.md-has-value .md-textarea {
    font-size: 13px;
}

.md-layout.md-gutter>.md-layout-item {
    padding-right: 8px;
    padding-left: 8px;
}

.md-layout.md-gutter {
    margin-right: 0;
    margin-left: 0;
}

.md-autocomplete button {
    position: relative;
    top: -2px;
}

.md-datepicker {
    margin-top: 0;

    .md-icon {
        position: relative;
        top: -2px;
    }
}

.item {
    box-sizing: border-box;
    height: 48px;
    width: 260px;
    padding: 15px 16px 17px 16px;
    display: block;

    &.active {
        font-weight: bold;
        background-color: #d0d0d0;
    }

    &:hover:not(.active) {
        background-color: #d0d0d0;
    }
}
</style>

<script>
import { LOG, ERROR, FIX_TIME } from '../utils/logging.js'
import { TRY_AUTH, LOGOUT } from '../utils/fb.js'
import $store from './store.js'
import $bus from '../bus.js'
import $filters from './filters.js'
import TxForm from './components/TxForm.vue'
import ChartDialog from './components/ChartDialog.vue'
import StatsList from './components/StatsList.vue'
import AccountsList from './components/AccountsList.vue'
import TransactionsList from './components/TransactionsList.vue'
import TagsList from './components/TagsList.vue'

export default {
    components :{
        TxForm, ChartDialog, StatsList, AccountsList, TransactionsList, TagsList
    },

    data: function () {
        return {
            store: $store
        };
    },

    computed: {},

    created() {
        this.store.loading = true;
        LOG('created()', 'checking the auth with firebase');
        //fb.bindAuth(async () => {
            this.init();
        //}, 'money');
    },

     mounted() {
        $bus.$on('account-selected', this.selectAccount);
        $bus.$on('special-view', this.showSpecialView);
        $bus.$on('tag-selected', this.selectTag);
        $bus.$on('tx-type-selected', this.selectTxType);
        $bus.$on('filter-cleared', this.clearTxFilter);
        $bus.$on('move', this.moveMonth);
        $bus.$on('tx-added', this.addTx);
        $bus.$on('tx-saved', this.saveTx);
        $bus.$on('tx-removed', this.removeTx);
        $bus.$on('tag-saved', this.saveTag);
        $bus.$on('tag-removed', this.removeTag);
        $bus.$on('tag-renamed', this.renameTag);
        $bus.$on('show-chart', this.showChart);
        $bus.$on('month-view-toggled', this.showMonth);
        $bus.$on('account-renamed', this.renameAcc);
        $bus.$on('account-saved', this.saveAcc);
        $bus.$on('save-rates-clicked', this.saveRates);
    },

    updated() {
        if (this.store.loading)
            this.store.loading = false;
    },

    methods: {
        async init() {
            LOG('created()', 'REQUESTING THE DATA')
            const response = await axios.get(`${$server.BASE_URL}/api/money`);
            if (response.data) {
                let raw_data = response.data;
                this.store.accounts = raw_data.accounts;
                this.store.transactions = raw_data.transactions;
                this.store.base_tags = raw_data.pinned_tags;
                this.initRates(raw_data.rates);
                this.initAccounts();
                this.initBaseTags();
                this.initTransactions();
                this.calcAll();
                this.moveToday();
                this.store.loading = false;
                $bus.$emit('data-loaded');
                LOG('created()', 'DATA LOADED');
                setInterval(this.recalc, 60 * 30 * 1000);
            } else {
                ERROR('created()', "loading /api/money failed");
            }
        },

         error(msg, response, fname) {
            if (fname)
                ERROR(fname, `[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            else
                FIX_TIME(`[ERROR]: ${msg} ${response && response.status ? " status =  " + response.status : ''}`);
            toastr.error(`${msg} ${response && response.status ? " status =  " + response.status : ''}`);
        },

        success(msg, fname) {
            if (fname)
                LOG(fname, `[SUCCESS]: ${msg}`);
            else
                FIX_TIME(`[SUCCESS]: ${msg}`);
            toastr.success(msg);
        },

        logout() {
            this.store.loading = true;
            fb.logout('money');
            window.location.replace('/login?back=money');
        },

        showChart() {
            if (!this.store.chartShown) {
                this.store.chartShown = true;
                $bus.$emit('show-chart-clicked');
            }
        },

        async saveRates() {
            let _rates = this.store.rates[0];
            delete _rates.date;
            try {
                await axios.post(`${$server.BASE_URL}/api/money/rates`, _rates)
                this.success('Rates have been saved', 'saveRates');
            } catch (err) {
                this.error('Error saving rates', err, 'saveRates');
            }
        },

        /**
         * initialize rates
         * @param arr_rates
         */
        initRates(arr_rates) {
            arr_rates.forEach(r => {
                this.store.rates[r.YM] = r;
            });
            this.store.lastUpdated = new Date(this.store.rates[0].date);
        },

        updateRates() {
            this.store.rates[0] = r;
            this.store.lastUpdated = new Date();
        },

        /**
         * initializing accounts array
         */
        initAccounts() {
            this.store.accounts = _.reject(this.store.accounts, acc => !acc._id);

            //Баланс на начало месяца
            function _beginBalance(ym) {
                for (let i = ym - 1; i >= 1000; i--) {
                    if (typeof this.history[i] !== "undefined") {
                        return this.history[i];
                    }
                }
                return 0;
            }

            //Баланс на конец месяца
            function _endBalance(ym) {
                return typeof this.history[ym] !== "undefined" ? this.history[ym] : this.beginBalance(ym);
            }

            this.store.accounts = _.sortBy(this.store.accounts,
                acc => {
                    let sort = acc.sort;
                    if (acc.category === "crypto")
                        sort *= 10;
                    if (acc.hidden)
                        sort *= 100;
                    return sort;
                });

            this.store.accounts.forEach(acc => {
                acc.id = acc.name.toUpperCase();
                acc.endBalance = _endBalance;
                acc.beginBalance = _beginBalance;
            });
        },

        /**
         * initializing pinned tags array
         */
        initBaseTags() {
            //FIX
            this.store.base_tags = _.reject(this.store.base_tags, bt => !bt.name);
        },

        /**
         * initializing transactions array
         */
        initTransactions() {
            this.store.transactions = _.reject(this.store.transactions, tx => tx.removed);
            let _tx_ids = [];
            this.store.transactions.forEach(tx => {
                //исправляем id
                if (!tx.f41_id || _tx_ids[tx.f41_id]) {
                    tx.f41_id = this.store.next_f41_id();
                    this.saveTx(tx);
                } else {
                    _tx_ids[tx.f41_id] = true;
                }
                tx.date = new Date(tx.date);
                tx.created = new Date(tx.created);
                if (tx.edited)
                    tx.edited = new Date(tx.edited);
                this.$set(tx, "isRemoved", false);
                this.$set(tx, "isEdited", false);
                //проставляем buy-sell
                if (tx.type == "transfer" && tx.tag.includes("Invest_")) {
                    switch (tx.tag) {
                        case "Invest_Usd":
                            if (tx.dst == "SUSD")
                                tx.trade = "buy";
                            else if (tx.src == "SUSD")
                                tx.trade = "sell";
                            break;
                        case "Invest_Eur":
                            if (tx.dst == "SEUR")
                                tx.trade = "buy";
                            else if (tx.src == "SEUR")
                                tx.trade = "sell";
                            break;
                        case "Invest_Btc":
                            if (tx.dst == "BTC")
                                tx.trade = "buy";
                            else if (tx.src == "BTC")
                                tx.trade = "sell";
                            break;
                        case "Invest_Bnb":
                            if (tx.dst == "BNB")
                                tx.trade = "buy";
                            else if (tx.src == "BNB")
                                tx.trade = "sell";
                            break;
                    }
                } else tx.trade = null;
            });

            let sorted = _.sortBy(this.store.transactions, tx => tx.date.getTime());
            sorted.forEach(tx => {
                this.store.order(tx);
            });
        },

        /**
         * recalculate everything after receiving rate updates
         */
        async recalc() {
            try {
                const response = await axios.get(`${$server.BASE_URL}/api/money/rates`);
                if (response.data) {
                    LOG('recalc', "received new rates");
                    this.initRates(response.data);
                    this.calcAll();
                }
            } catch (err) {
                ERROR("recalc", "error while recalculating new rates")
            }
        },

        /**
         * calculating all account balances
         */
        calcAll() {
            //blank stats
            _.extend(this.store.stats, {
                totalBalance: 0,
                totalBalance_USD: 0,
                net_worth: 0,
                personal_things: 0,
                net_balance: 0,
                flat_value: 0,
                mortgage: 0,
                flat_invested: 0,
                flat_equity: 0,
                flat_nw_ratio: 0,
                flat_roi: 0,
                rub_ratio: 0,
                curr_ratio: 0,
                sec_ratio: 0,
                crypto_ratio: 0
            });

            let __s = this.store.stats;

            //special accounts
            __s.personal_things = this.store.sum_txs(tx => tx.src === "ITEMS", "RUB", "special");
            __s.flat_value = this.store.sum_txs(tx => tx.src === "FLAT", "RUB", "special");
            __s.mortgage = this.store.sum_txs(tx => tx.src == "MORTGAGE", "RUB", "special");

            //taking total balance
            this.store.normal_accounts().forEach(acc => {
                this.calcAccount(acc);
                if (!acc.hidden) {
                    let balance = this.store.convert(acc.balance, acc.currency, "RUB"); //OK - we count this at NOW moment
                    __s.totalBalance += balance;

                    switch (acc.category) {
                        case "rouble":
                            __s.rub_ratio += balance;
                            break;
                        case "currency":
                            __s.curr_ratio += balance;
                            break;
                        case "securities":
                            __s.sec_ratio += balance;
                            break;
                        case "crypto":
                            __s.crypto_ratio += balance;
                    }
                }
            });

            //ratios
            __s.rub_ratio /= __s.totalBalance / 100;
            __s.curr_ratio /= __s.totalBalance / 100;
            __s.sec_ratio /= __s.totalBalance / 100;
            __s.crypto_ratio /= __s.totalBalance / 100;

            //flat
            const FLAT_TAGS = ["Mortgage", "Apartment", "Downpayment", "Repayment", "Remodeling", "House"];
            __s.flat_invested = this.store.sum_txs(tx => FLAT_TAGS.includes(tx.tag), "RUB", "special");
            __s.flat_equity = __s.flat_value + __s.mortgage;
            __s.net_balance = __s.totalBalance + __s.personal_things + __s.mortgage;
            __s.flat_roi = (-__s.flat_equity / __s.flat_invested - 1) * 100;

            //net worth
            __s.net_worth = __s.flat_equity + __s.personal_things + __s.totalBalance;
            __s.flat_nw_ratio = __s.flat_equity / __s.net_worth * 100;

            const self = this;

            //avg entrance
            function _calcAvgEntrance(invest_curr, base_curr, _tag, _acc, _startYear) {
                let txs = self.store.filter_txs(tx => tx.type == "transfer" && tx.tag == _tag && (tx.dst == _acc || tx.src == _acc) && tx.year >= _startYear);
                let sum_base_curr = 0,
                    sum_invest_curr = 0;

                for (var i = 0; i < txs.length; i++) {
                    let tx = txs[i];
                    let src_currency = self.store.acc_currency(tx.src);
                    if (src_currency == base_curr[0]) { //BUYING
                        sum_base_curr += tx.amount;
                        sum_invest_curr += tx.dst_amount;
                    } else if (base_curr.length > 1 && src_currency == base_curr[1]) {
                        let secondary_rate_re = (/\$\(([\d\.]+)\)/gi);
                        var result = secondary_rate_re.exec(tx.desc);
                        if (result) {
                            var secondary_rate = +result[1];
                            sum_base_curr += tx.amount / secondary_rate;
                            sum_invest_curr += tx.dst_amount;
                        }
                    } else if (self.store.acc_currency(tx.src) == invest_curr) { //SELLING
                        sum_base_curr -= tx.dst_amount;
                        sum_invest_curr -= tx.amount;
                    }
                }
                let avg_entrance = sum_base_curr / sum_invest_curr;

                let rate = self.store.rate(invest_curr, 0) / self.store.rate(base_curr[0], 0);
                let profit = Math.round((rate - avg_entrance) * self.store.acc(_acc).balance);

                let profit_pct = profit / sum_base_curr * 100;
                if (sum_base_curr < 0) {
                    avg_entrance = 0.001;
                    profit_pct = profit / -sum_base_curr * 100;
                }
                return {
                    avg_entrance,
                    profit,
                    profit_pct
                };
            }

            _.extend(__s.rateItems["USDRUB"], _calcAvgEntrance("USD", ["RUB"], "Invest_Usd", "SUSD", 2017));
            _.extend(__s.rateItems["EURRUB"], _calcAvgEntrance("EUR", ["RUB"], "Invest_Eur", "SEUR", 2017));
            _.extend(__s.rateItems["BTCUSD"], _calcAvgEntrance("BTC", ["USD", "RUB"], "Invest_Btc", "BTC", 2019));
            _.extend(__s.rateItems["BNBUSD"], _calcAvgEntrance("BNB", ["USD"], "Invest_Bnb", "BNB", 2019));
            _.extend(__s.rateItems["ETHUSD"], _calcAvgEntrance("ETH", ["USD"], "Invest_Eth", "ETH", 2020));

            __s.totalBalance_USD = $filters.fmtAmount(this.store.convert(__s.totalBalance, "RUB", "USD"), {
                places: 0
            }); //OK - we count this at the NOW moment
        },


        /**
         * calculating ACCOUNT BALANCE
         * @param acc -- account object
         */
        calcAccount(acc) {
            let txs = this.store.filter_txs(tx => (tx.src === acc.name || tx.dst === acc.name) && this.store.ymd(tx.date) <= this.store.ymd(new Date()));

            acc.balance = acc.startBalance;

            acc.history = [];

            for (let i = 0; i < txs.length; i++) {
                let tx = txs[i];
                let ym = this.store.ym(tx.year, tx.month);

                if (tx.type === "income" || tx.type === "expense") {
                    tx.src_balance_before = acc.balance;
                    acc.balance += tx.amount;
                    tx.src_balance = acc.balance;
                }

                if (tx.type === "transfer") {
                    if (tx.src === acc.name) {
                        tx.src_balance_before = acc.balance;
                        acc.balance -= tx.amount;
                        tx.src_balance = acc.balance;
                    } else if (tx.dst === acc.name) {
                        tx.dst_balance_before = acc.balance;
                        acc.balance += tx.dst_amount;
                        tx.dst_balance = acc.balance;
                    }
                }

                if (tx.type === "balance_reset") {
                    tx.src_balance_before = acc.balance;
                    tx.difference = tx.amount - acc.balance;
                    acc.balance = tx.amount;
                    tx.src_balance = acc.balance;
                }

                // заполняем историю балансами на конец месяца
                acc.history[ym] = acc.balance;
            }
        },

        showSpecialView(view) {
            if (view == "FLAT_INVESTED") {
                const FLAT_TAGS = ["Mortgage", "Apartment", "Downpayment", "Repayment", "Remodeling", "House"];
                let txf = this.store.filter_txs(tx => FLAT_TAGS.includes(tx.tag));
                this.store.cur.begin = this.store.stats.flat_invested;
                this.store.cur.net = 0;
                this.store.cur.delta_pct = 0;
                this.store.cur.tag = null;
                this.store.cur.end = 0;
                this.store.cur.txType = null;
                this.store.cur.tags = [];
                this.store.cur.tx = txf;
                this.store.cur.budget = {
                    spent: 0,
                    max: 0,
                    type: 'monthly',
                    percentage: 0
                };
            }
        },

        /**
         * showMonth() for SPECIAL ACCOUNTS
         */
        showMonthSpecial() {
            let txf = this.store.filter_txs(tx => this.store.cur.account.name === tx.src, 'special');
            this.store.cur.begin = this.store.sum_txs(tx => this.store.cur.account.name === tx.src, "RUB", 'special');
            this.store.cur.net = 0;
            this.store.cur.delta_pct = 0;
            this.store.cur.tag = null;
            this.store.cur.end = 0;
            this.store.cur.txType = null;
            this.store.cur.tags = [];
            this.store.cur.tx = txf;
            this.store.cur.budget = {
                spent: 0,
                max: 0,
                type: 'monthly',
                percentage: 0
            };
            LOG('showMonthSpecial', `acc ${this.store.cur.account.name} is shown, balance is ${this.store.cur.begin}`);
        },

        /**
         * calculating and showing a MONTH or a YEAR - main function
         */
        showMonth() {
            const __cur = this.store.cur; //synonyms
            const __acc = __cur.account;
            const EMPTY_TAG = "<Пусто>";
            const self = this;

            if (__acc && __acc.special) {
                this.showMonthSpecial();
                return;
            }

            //1. FILTERING
            //1.1. ACCOUNT FILTER
            let txf = []; //filter stage 1
            txf = __cur.isMonthView ?
                this.store.filter_txs(tx => __acc ? (tx.src === __acc.name || tx.dst === __acc.name) && tx.year === __cur.year && tx.month === __cur.month : tx.year === __cur.year && tx.month === __cur.month) :
                this.store.filter_txs(tx => __acc ? (tx.src === __acc.name || tx.dst === __acc.name) && tx.year === __cur.year : tx.year === __cur.year);

            let txf2 = txf; //filter stage 2
            //1.2. TYPE FILTER
            if (__cur.txType) {
                txf2 = _.filter(txf2, tx => tx.type === __cur.txType);
            }
            //1.3. TAG FILTER
            if (__cur.tag) {
                txf2 = _.filter(txf2, tx => tx.tag == __cur.tag || (!tx.tag && __cur.tag == EMPTY_TAG));
            }

            let tagStats = {};
            let net = 0;

            //Расчет для переводов
            function _calcTransferNoAcc(tx, src, dst) {
                if (!dst)
                    return 0;
                if (src.category == dst.category && !tx.tag.startsWith("Invest_"))
                    return 0;
                if (src.category == "rouble" && dst.category != "rouble" || src.category == "rouble" && dst.category == "rouble" && tx.tag.startsWith("Invest_"))
                    return -tx.amount;
                if (src.category != "rouble" && dst.category == "rouble" && tx.tag.startsWith("Invest_"))
                    return self.store.convertTxAmount(tx, "RUB");
                return 0;
            }

            //2. Вычисляем тэги - не отфильтрованное
            txf.forEach(tx => {
                if (tx.type === "balance_reset")
                    return;

                let _src = this.store.acc(tx.src);
                let _dst = this.store.acc(tx.dst);

                let amount = __acc ?
                    (tx.type === "income" || tx.type === "expense" ? tx.amount : (__acc.name === _src.name ? -tx.amount : tx.dst_amount)) :
                    (tx.type === "income" || tx.type === "expense" ? this.store.convertTxAmount(tx, "RUB") : _calcTransferNoAcc(tx, _src, _dst));

                //fill in tag stats
                if (!tx.tag) {
                    tagStats[EMPTY_TAG] = !tagStats[EMPTY_TAG] ? amount : tagStats[EMPTY_TAG] + amount;
                } else {
                    tagStats[tx.tag] = !tagStats[tx.tag] ? amount : tagStats[tx.tag] + amount;
                }
            });

            //3. CALCULATE viewNet - the same calculation as above only on txf2, therefore in cur.account == null cur.viewNet always equals cur.net
            txf2.forEach(tx => {
                if (tx.type === "balance_reset")
                    return;

                let _src = this.store.acc(tx.src);
                let _dst = this.store.acc(tx.dst);

                let amount = __acc ?
                    (tx.type === "income" || tx.type === "expense" ? tx.amount : (__acc.name === _src.name ? -tx.amount : tx.dst_amount)) :
                    (tx.type === "income" || tx.type === "expense" ? this.store.convertTxAmount(tx, "RUB") : (__cur.txType == "transfer" ? _calcTransferNoAcc(tx, _src, _dst) : 0));

                net += amount;
            });

            __cur.viewNet = net;

            //4. DETERMINE BEGIN END
            let begin = 0;
            let end = 0;
            let ym = this.store.ym(__cur.year, __cur.month); //current YM
            if (__cur.isMonthView) { //-----------------------//monthly mode
                if (__acc) { //account mode
                    if (txf.length > 0) {
                        end = __acc.endBalance(ym);
                        begin = __acc.beginBalance(ym);
                    } else {
                        begin = end = __acc.beginBalance(ym);
                    }
                } else { //total mode
                    this.store.normal_accounts().forEach(acc => {
                        end += this.store.convert(acc.endBalance(ym), acc.currency, "RUB", ym + 1); //OK
                        begin += this.store.convert(acc.beginBalance(ym), acc.currency, "RUB", ym); //OK
                    });
                }
            } else { //----------------------------------------//yearly mode
                let ymEnd = this.store.ym(__cur.year, 11);
                let ymBegin = this.store.ym(__cur.year, 0);
                if (__acc) { //account mode
                    begin = __acc.beginBalance(ymBegin);
                    end = __acc.endBalance(ymEnd);
                } else { //total mode
                    this.store.normal_accounts().forEach(acc => {
                        end += this.store.convert(acc.endBalance(ymEnd), acc.currency, "RUB", ymEnd + 1); //OK
                        begin += this.store.convert(acc.beginBalance(ymBegin), acc.currency, "RUB", ymBegin); //OK
                    });
                }
            }

            __cur.begin = begin;
            __cur.end = end;
            __cur.delta = end - begin;
            __cur.deltaPercent = __cur.delta / Math.abs(begin) * 100;
            __cur.rateNet = __cur.delta - __cur.viewNet;
            if (__cur.tag && __cur.tag.startsWith("Invest_")) {
                let txfBuy = _.filter(txf2, tx => tx.trade == "buy");
                let mapped = _.map(txfBuy, tx => [tx.amount, tx.rate]);
                let sum = 0;
                let amount = 0;
                txfBuy.forEach(tx => {
                    let _rate = (!tx.dst_amount || !tx.amount) ? 1.0 : tx.dst_amount / tx.amount;
                    sum += tx.amount * _rate;
                    amount += tx.amount;
                })
                __cur.avgRateBuy = amount / sum;

                let txfSell = _.filter(txf2, tx => tx.trade == "sell");
                sum = 0;
                amount = 0;
                txfSell.forEach(tx => {
                    let _rate = (!tx.dst_amount || !tx.amount) ? 1.0 : tx.dst_amount / tx.amount;
                    sum += tx.amount * _rate;
                    amount += tx.amount;
                });
                __cur.avgRateSell = sum / amount;
            }

            //5. SORT TAGS AND CALCULATE BUDGETS
            let pinnedTags = [];

            __cur.budget = {
                spent: 0,
                max: 0,
                type: 'monthly',
                percentage: 0
            };

            function _emptyTag() {
                return {
                    name: EMPTY_TAG,
                    color: '#ffffff',
                    budget: 0,
                    budget_type: 'monthly'
                };
            }

            //5.1. Проходимся по тэгам из статистики
            for (let tagName in tagStats) {
                let baseTag = this.store.base_tag(tagName); //Не найден, только если транзакция реально не тегирована
                let sum = tagStats[tagName] || 0;
                let spent = 0;
                let max = 0;
                let percentage = 0;
                let type = (baseTag && baseTag.budget_type) || "monthly";

                //constructing budget
                if (baseTag && baseTag.budget && sum <= 0) {
                    if (type === "monthly") {
                        spent = -sum;
                        max = baseTag.budget;
                        percentage = Math.round(spent / baseTag.budget * 100);
                        __cur.budget.max += baseTag.budget;
                        __cur.budget.spent += Math.round(spent);
                        __cur.budget.percentage = Math.round(__cur.budget.spent / __cur.budget.max * 100);
                    } else if (!__acc) {
                        spent = -Math.round(this.store.sum_txs(tx => tx.year === __cur.year && tx.tag == baseTag.name && (tx.type === "income" || tx.type === "expense"), "RUB"));
                        max = baseTag.budget;
                        percentage = Math.round(spent / baseTag.budget * 100);
                    }
                }

                //конструируем pinned_tag
                pinnedTags.push({
                    bt: baseTag || _emptyTag(),
                    amount: sum,
                    budget: {
                        type,
                        spent,
                        max,
                        percentage
                    },
                    enabled: true,
                    isEdited: false,
                    empty: !baseTag
                });
            }

            //5.2. Добавляем те тэги, которых не было в статистике
            let zeroPinnedTags = [];
            //Если есть в пиннед, но нет в статистике
            this.store.base_tags.forEach(bt => {
                if (!_.find(pinnedTags, pt => pt.bt.name === bt.name)) {
                    zeroPinnedTags.push({
                        bt: bt,
                        amount: 0,
                        budget: {
                            type: bt.budget_type,
                            spent: 0,
                            max: 0,
                            percentage: 0
                        },
                        enabled: false,
                        isEdited: false,
                        empty: false
                    });
                    if (bt.budget_type === "monthly") {
                        __cur.budget.max += bt.budget;
                        __cur.budget.percentage = Math.round(__cur.budget.spent / __cur.budget.max * 100);
                    }
                }
            });
            zeroPinnedTags = _.sortBy(zeroPinnedTags, tag => tag.bt.name);
            pinnedTags = _.sortBy(pinnedTags, tag => -Math.abs(tag.amount));
            __cur.tags = pinnedTags.concat(zeroPinnedTags); //соединяем оба списка
            __cur.tx = txf2;

            if (__cur.isMonthView)
                LOG('showMonth', `Month ${__cur.month + 1} year ${__cur.year} shown, delta is ${__cur.delta}, viewNet is ${__cur.viewNet}, account: ${!__acc ? "null" : __acc.name}, txType: ${__cur.txType}, tag: ${__cur.tag}`);
            else
                LOG('showMonth', `Year ${__cur.year} shown, delta is ${__cur.delta}, viewNet is ${__cur.viewNet}, account: ${!__acc ? "null" : __acc.name}, txType: ${__cur.txType}, tag: ${__cur.tag}`);
        },


        /**
         * select a tag
         * @param tag
         */
        selectTag(tag) {
            if (this.store.cur.tag !== tag) {
                this.store.cur.tag = tag;
                this.showMonth();
            }
        },

        /**
         * select a transaction type
         * @param type
         */
        selectTxType(type) {
            this.store.cur.txType = type;
            this.showMonth();
        },

        /**
         * clear a transaction filter
         */
        clearTxFilter() {
            this.store.cur.txType = null;
            this.store.cur.tag = null;
            this.showMonth();
        },

        /**
         * select an account
         * @param acc
         */
        selectAccount(acc) {
            this.store.cur.account = acc;
            this.showMonth();
        },

        /**
         * all going wherever is here
         * @param where
         */
        moveMonth(where) {
            switch (where) {
                case 'prev':
                    this.prevMonth();
                    break;
                case 'next':
                    this.nextMonth();
                    break;
                case 'today':
                    this.moveToday();
                    break;
                case 'first':
                    this.moveFirst();
                    break;
            }
        },

        /**
         * go back a month
         */
        prevMonth() {
            const __cur = this.store.cur;
            if (__cur.isMonthView) {
                if (__cur.month === 0) {
                    __cur.month = 11;
                    __cur.year--;
                } else {
                    __cur.month--;
                }
            } else {
                __cur.month = 0;
                __cur.year--;
            }
            let preferredDate = moment(new Date(__cur.year, __cur.month, 1));
            preferredDate.add(1, 'month');
            preferredDate.subtract(1, 'day');
            $bus.$emit("preferred-date", preferredDate._d);
            this.showMonth();
        },


        /**
         * go for a next month
         */
        nextMonth() {
            const __cur = this.store.cur;
            if (__cur.isMonthView) {
                if (__cur.month === 11) {
                    __cur.month = 0;
                    __cur.year++;
                } else {
                    __cur.month++;
                }
            } else {
                __cur.month = 0;
                __cur.year++;
            }
            $bus.$emit("preferred-date", new Date(__cur.year, __cur.month, 1));
            this.showMonth();
        },

        /**
         * go to the current date
         */
        moveToday() {
            this.store.cur.isMonthView = true;
            const now = new Date();
            this.store.cur.month = now.getMonth();
            this.store.cur.year = now.getFullYear();
            $bus.$emit("preferred-date", new Date(this.store.cur.year, this.store.cur.month, now.getDate()));
            this.showMonth();
        },

        /**
         * go to the earliest date
         */
        moveFirst() {
            this.store.cur.isMonthView = true;
            this.store.cur.month = 0;
            this.store.cur.year = 2010;
            $bus.$emit("preferred-date", new Date(this.store.cur.year, this.store.cur.month, 1));
            this.showMonth();
        },

        /**
         * create a new tag
         * @param tag_name
         * @returns {{hidden: boolean, budget: number, expanded: boolean, color: *, f41_id: string, name: *, created: Date, budget_type: string, chart: boolean}}
         */
        newTag(tag_name) {
            return {
                hidden: false,
                budget: 0,
                expanded: false,
                color: this.store.random_tag_color(),
                f41_id: "0",
                name: tag_name,
                created: (new Date()),
                budget_type: "monthly",
                chart: true
            };
        },

        /**
         * validate a transaction
         * @param tx
         * @returns {boolean|string|string|*|null|number}
         */
        validateTx(tx) {
            tx.amount = !isNaN(this.store.parseAmount(tx.amount)) ? this.store.parseAmount(tx.amount) : tx.amount;
            tx.dst_amount = !isNaN(this.store.parseAmount(tx.dst_amount)) ? this.store.parseAmount(tx.dst_amount) : tx.dst_amount;

            let ok = (((tx.type === "income" || tx.type === "expense") && tx.amount && !isNaN(tx.amount) && tx.src && tx.date) ||
                ((tx.type === "transfer" && tx.amount && !isNaN(tx.amount) && tx.src && tx.dst && tx.rate && tx.dst_amount && !isNaN(tx.dst_amount) && tx.date)) ||
                (tx.type === "balance_reset" && !isNaN(tx.amount) && tx.src && tx.date));

            if (this.store.is_acc_special()) {
                ok = !isNaN(tx.amount) && tx.amount != 0 && tx.src && tx.date;
            }

            return ok;
        },

        /**
         * prepare a transaction just before saving
         * @param tx
         */
        prepareTx(tx) {
            if (tx.f41_id === -1 || !tx.f41_id)
                tx.f41_id = this.store.next_f41_id();

            if (tx.type === "expense" && tx.amount > 0) {
                tx.amount = -tx.amount;
            } else if (tx.type == "income" && tx.amount < 0) {
                tx.type = "expense";
            }

            if (tx.type !== "transfer")
                tx.dst = null;
            if (!tx.date)
                tx.date = new Date();
            else if (typeof tx.date == "string")
                tx.date = new Date(tx.date);

            tx.date.setHours(3);
            tx.date.setMinutes(0);
            tx.date.setSeconds(0);
            tx.date.setMilliseconds(+tx.f41_id * 1000);
            if (!tx.order || Math.floor(tx.order / 100) * 100 != this.store.ymd(tx.date))
                this.store.order(tx);

            if (!tx.created)
                tx.created = new Date();
            tx.edited = new Date();
            tx.year = tx.date.getFullYear();
            tx.month = tx.date.getMonth();
            tx.tag = tx.tag.trim();

            //проверка на новый тэг
            if (tx.tag && !this.store.base_tag(tx.tag)) {
                let nTag = this.newTag(tx.tag);
                this.addTag(nTag);
                this.store.base_tags.push(nTag);
            }
        },

        /**
         * save a modified transaction
         * @param tx
         */
        async saveTx(tx) {
            let ntx = tx;

            if (!this.validateTx(ntx)) {
                toastr.warning("Please correct errors");
                return;
            }

            this.prepareTx(ntx);

            let ntx_clone = _.clone(ntx, true);
            delete ntx_clone.__v;

            try {
                await axios.put(`${$server.BASE_URL}/api/money/tx`, ntx_clone);
                this.$set(ntx, 'isEdited', false);
                this.calcAll();
                this.showMonth();
                this.success(`tx id = ${tx.f41_id} updated in DB`, "saveTx");
            } catch (err) {
                this.error(`Error while saving tx ${tx.f41_id}`, response, "saveTx");
            }
        },

        /**
         * add a new transaction
         * @param tx
         */
        async addTx(tx) {
            let ntx = tx;
            if (!this.validateTx(ntx)) {
                toastr.warning("Please correct errors");
                return;
            }
            this.prepareTx(ntx);

            try {
                const response = await axios.post(`${$server.BASE_URL}/api/money/tx`, ntx);
                ntx._id = response.data._id;
                this.store.transactions.push(ntx);
                this.calcAll();
                this.showMonth();
                $bus.$emit("tx-saved-ok");
                this.success(`new tx id = ${ntx.f41_id} added to DB`, 'addTx');
            } catch (err) {
                this.error(`Error while adding new tx id = ${ntx.f41_id}`, err, 'addTx');
            }
        },

        /**
         * remove a transaction
         * @param tx
         */
        async removeTx(tx) {
            try {
                await axios.delete(`${$server.BASE_URL}/api/money/tx/${tx._id}`);
                this.store.transactions = _.reject(this.store.transactions, _tx => _tx._id == tx._id);
                this.calcAll();
                this.showMonth();
                $bus.$emit("tx-removed-ok");
                this.success(`tx id = ${tx.f41_id} removed`, 'removeTx');
            } catch (err) {
                this.error(`Error while removing tx id = ${tx.f41_id}`, err, 'removeTx');
            }
        },

        /**
         * add new pinned tag
         * @param pt
         */
        async addTag(bt) {
            try {
                const response = await axios.post(`${$server.BASE_URL}/api/money/tags`, bt);
                bt._id = response.data._id;
                this.store.base_tags.push(bt);
                this.success(`successfully saved tag ${bt.name}`, 'addTag');
            } catch (err) {
                this.error(`Error while saving tag ${bt.name}`, err, 'addTag');
            }
        },

        /**
         * save (modified) base tag
         * @param pt
         */
        async saveTag(bt) {
            if (!bt.name) {
                toastr.warning("Empty tag not allowed");
                return;
            }
            try {
                await axios.put(`${$server.BASE_URL}/api/money/tags`, bt);
                this.calcAll();
                this.showMonth();
                this.store.cur.tags.forEach((tag) => {
                    if (tag.name === bt.name) {
                        this.$set(tag, 'isEdited', false);
                    }
                });
                this.success(`Successfully saved base tag ${bt.name}`, 'saveTag');
            } catch (err) {
                this.error(`Error while saving base tag ${bt.name}`, err, 'saveTag');
            }
        },

        async removeTag(bt) {
            try {
                await axios.delete(`${$server.BASE_URL}/api/money/tags/${bt._id}`);
                this.store.base_tags = _.reject(this.store.base_tags, _bt => _bt.name == bt.name);
                this.calcAll();
                this.showMonth();
                this.success(`tag ${bt.name} was removed successfully`, 'removeTag');
            } catch (err) {
                this.error(`Error while removing tag ${bt.name}`, err, 'removeTag')
            }
        },

        async renameTag(opt) {
            try {
                await axios.post(`${$server.BASE_URL}/api/money/tags/rename`, opt);
                this.store.transactions.forEach(tx => {
                    if (tx.tag == opt.oldName)
                        tx.tag = opt.newName;
                });
                this.calcAll();
                this.showMonth();
                this.success(`Base tag ${opt.oldName} successfully renamed to ${opt.newName}`, 'renameTag');
            } catch (err) {
                this.error(`Error while renaming base tag ${opt.oldName}`, err, "renameTag");
            }
        },

        /**
         * renaming an account
         * @param {*} opt 
         */

        async renameAcc(opt) {
            try {
                await axios.post(`${$server.BASE_URL}/api/money/accounts/rename`, opt);
                this.store.transactions.forEach(tx => {
                    if (tx.src == opt.oldName)
                        tx.src = opt.newName;
                    if (tx.dst = opt.oldName)
                        tx.dst = opt.newName;
                });
                this.calcAll();
                this.showMonth();
                this.success(`Account ${opt.oldName} successfully renamed to ${opt.newName}`, 'renameAcc');
            } catch (err) {
                this.error(`Error while renaming txs account from ${opt.oldName} to ${opt.newName}`, err, 'renameAcc');
            }
        },

        /**
         * saving an account
         * @param {*} acc 
         */
        async saveAcc(acc) {
            try {
                await axios.put(`${$server.BASE_URL}/api/money/accounts`, acc)
                this.success(`Account ${acc.name} was saved`, 'saveAcc');
            } catch (err) {
                this.error(`Error while saving account ${acc.name}`, err, 'saveAcc');
            };
        }
    }
}
</script>