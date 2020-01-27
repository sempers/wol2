<template>
    <div id="left-col">
        <div class="item">
            <md-button
                class="md-icon-button md-dense"
                @click="showChart()"
                style="margin:0;position:relative;top:-8px;"
            >
                <md-icon>show_chart</md-icon>
            </md-button>
        </div>
        <div class="accounts-list">
            <div
                class="acc-item"
                :class="{'active': store.cur.account === null}"
                style="font-weight:bold"
                @click="selectAll()"
            >
                <div class="account-name">Баланс</div>
                <balance
                    style="font-size:16px"
                    :amount="store.stats.totalBalance"
                    :currency="'RUB'"
                    :secondary="'USD'"
                    :category="'rouble'"
                ></balance>
            </div>
            <account-item v-for="account in accounts" :account="account" :key="account.id"></account-item>
        </div>
    </div>
</template>

<script>
import $store from "../store.js";
import AccountItem from "./AccountItem.vue";
import _ from "underscore";

export default {
    components: {
        AccountItem
    },

    data() {
        return {
            store: $store
        };
    },

    computed: {
        accounts() {
            return _.sortBy(
                _.filter(this.store.accounts, acc => !acc.special && acc._id),
                acc => {
                    let sort = +acc.sort;
                    if (acc.hidden) sort *= 1000;
                    return sort;
                }
            );
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
};
</script>

<style lang="less">
</style>
