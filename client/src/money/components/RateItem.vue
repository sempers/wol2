<template>
<div class="item stats-rates">
        <div class="account-name">{{item.sym1}}{{item.sym2}}</div>
        <div class="account-balance">
            <amount class="mini" style="margin-right:5px":amount="rateDelta" :category="item.category" :options="{delta: 1}"></amount>
            <amount :amount="rateValue" :category="item.category" :type="'rate'"></amount>            
        </div>
        <div class="rate-profit" v-if="item.avg_entrance">● {{item.avg_entrance | fmtAmount({places:2, no_thousand: 1})}} Δ {{item.profit | fmtAmount({places:1, no_thousand:1, delta: 1})}} ({{item.profit_pct | fmtAmount({places:1, delta: 1})}}%)</div>
        <div class="secondary-amount rate" v-if="rateSecondary">{{rateSecondary | fmtAmount({places: 0})}} RUB</div>
    </div>
</template>

<script>
import $store from '../store.js'
import $bus from '../../bus.js'
import $filters from '../filters.js'
import Amount from './Amount.vue'

export default {
    components: { Amount },

    filters: $filters,

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
}
</script>