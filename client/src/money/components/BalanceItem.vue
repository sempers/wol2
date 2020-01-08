<template>
<div class="balance-item">
        <div class="currency-code" v-if="currency">{{currency}}</div>
        <div class="account-balance">
            <div class="amount" :class='{"income": amount >= 0 && (currency != "%"), "expense": amount < 0 && (currency !="%")}'>
                <span>{{amount | fmtAmount(options)}}</span>
            </div>
        </div>
        <div class="secondary-amount" v-if="secondary  && amount !== 0">{{secondary_amount | fmtAmount({places: 0})}}&nbsp;&nbsp;{{secondary}}</div>
</div>
</template>

<script>
import $store from '../store.js'

export default {
    props: ["amount", "currency", "category", "secondary"],

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
        },

        eth_amount() {
            return this.store.convert(this.amount, this.currency, "ETH");
        }
    },

    created() {
        this.currency = this.currency || "RUB";
        this.category = this.category || "rouble";
    }
}
</script>

<style lang="less">
.balance-item {
    display:block;
}

.currency-code {
    font-size: 11px;
    font-weight: 100;
    float: right;
    margin-top: 3px;
    position: relative;
    left: -3px;
    top: -2px;
}

.secondary-amount {
    float: right;
    color: darkgray !important;
    font-size: 11px !important;
    padding-right: 13px;
    clear: both;
    position: relative;
    top: -8px;
    left: 10px;
    font-weight: normal !important;

    &.rate {
        clear:none;
        top:-4px;
        left:5px;
    }    
}
</style>