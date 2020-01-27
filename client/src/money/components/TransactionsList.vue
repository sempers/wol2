<template>
    <div id="middle-col">
        <div class="txlist-header">
            <div style="width:300px">
                <md-button
                    class="md-icon-button md-dense"
                    :class="{'md-accent': !store.cur.isMonthView}"
                    @click="toggleView()"
                    style="margin:0"
                >
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
                <div class="txlist-header-month" v-else>
                    <strong>{{store.cur.year}}</strong>
                </div>
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
                    <amount
                        class="delta-pct"
                        v-if="!isNaN(store.cur.deltaPercent)"
                        :amount="store.cur.deltaPercent"
                        :options="{delta: 1, places: 1, prefix: '(', suffix:'%)', max_n: 10000}"
                    ></amount>
                </div>
                <div v-if="true || store.cur.txType || store.cur.tag">
                    <md-icon>functions</md-icon>
                </div>
                <div style="width:120px" v-if="true || store.cur.txType || store.cur.tag">
                    <amount
                        :amount="store.cur.viewNet"
                        :type="store.cur.txType == 'transfer' ? 'transfer': ''"
                        :category="category"
                        :options="{bug: 1}"
                    ></amount>
                    <md-tooltip>Нетто по показанным транзакциям (курсовая разница)</md-tooltip>
                    <amount
                        :amount="store.cur.rateNet"
                        v-if="!store.cur.account && store.cur.rateNet && !(store.cur.txType || store.cur.tag)"
                        :type="'transfer-fix'"
                        class="delta-pct"
                        :options="{delta: 1, prefix:'(', suffix: ')', places:0, t: 'rate'}"
                    ></amount>
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
        <div class="txlist-below">
            <div v-show="store.cur.tag && store.cur.avgRateBuy">
                <md-icon>compare_arrows</md-icon>Покупка:
                <amount :amount="store.cur.avgRateBuy" :type="''" :options="{places: 2}"></amount>Продажа:
                <amount :amount="store.cur.avgRateSell" :type="''" :options="{places: 2}"></amount>
            </div>
        </div>
    </div>
</template>

<script>
import $store from "../store.js";
import _ from "underscore";
import moment from "moment";
import $bus from "../../bus.js";
import TxItem from "./TxItem.vue";
import Amount from "./Amount.vue";

export default {
    components: { TxItem, Amount },

    data() {
        return {
            store: $store
        };
    },

    computed: {
        category() {
            if (this.store.no_acc()) {
                return "rouble";
            } else return this.store.acc_category(this.store.cur.account.name);
        },

        minHeight() {
            return Math.max(this.store.cur.tx.length * 51, 15 * 51);
        },

        curMonthText() {
            const MONTHS = this.store.MONTHS;
            return this.store.cur.year === new Date().getFullYear()
                ? MONTHS[this.store.cur.month]
                : `${MONTHS[this.store.cur.month]} ${this.store.cur.year}`;
        },

        transactions() {
            return _.sortBy(this.store.cur.tx, tx => -tx.order);
        }
    },

    methods: {
        move(where) {
            $bus.$emit("move", where);
        },

        toggleView() {
            this.store.cur.isMonthView = !this.store.cur.isMonthView;
            $bus.$emit("month-view-toggled");
        }
    }
};
</script>

<style lang="less">
</style>
