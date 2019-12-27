<template>
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
</template>

<script>
import $store from '../store.js'
import _ from 'underscore'
import moment from 'moment'
import $bus from '../../../bus.js'


export default {
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
}
</script>

<style lang="less">

</style>
