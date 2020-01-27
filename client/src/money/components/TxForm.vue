<template>
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
</template>

<script>
import $bus from '../../bus.js'
import $store from '../store.js'

export default {
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
}
</script>

<style lang="less">

</style>
