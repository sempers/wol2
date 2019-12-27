<template>
    <div class="amount" :class='{"income": amount > 0 && (!type || type=="income"), "expense": amount < 0 && (!type || type=="expense"), "transfer": (type=="transfer" || type=="transfer-fix"), "balance_reset": type == "balance_reset"}'>{{amount | fmtAmount(c_options)}}</div>
</template>

<script>
export default {
    props: ["amount", "type", "category", "options"],
    
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
}
</script>

<style lang="less">
.amount {
    display: inline-block;

    &.income {
        color: green;
    }

    &.expense {
        color: #E72020;
    }

    &.balance {
        color: #222;
    }

    &.transfer {
        color: #0E64BA;
    }

    &.mini {
        font-size: 0.85em;
        font-weight: normal;
    }

    .balance_reset {
        color: #222;
    }
}


</style>