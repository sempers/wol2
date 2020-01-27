<template>
    <div
        class="tx-item"
        @click="edit()"
        :class='{"income": tx.type == "income", "expense": tx.type == "expense", "transfer": tx.type=="transfer", "balance_reset": tx.type == "balance_reset"}'
    >
        <div class="viewed" v-show="!tx.isEdited" @click="edit()">
            <div class="tx-amount">
                <div class="tx-id">{{tx.f41_id}}</div>
                <amount :amount="amount" :type="tx.type" :category="category"></amount>
            </div>
            <div
                class="tx-tags-text"
                v-if="tx.type != 'balance_reset' && tx.tag"
                :style="{'background-color': tag_color}"
            >{{tx.tag}}</div>
            <div class="tx-tags-text-blank" v-if="!(tx.type != 'balance_reset' && tx.tag)"></div>
            <div class="tx-name" v-if="tx.desc">{{tx.desc}}</div>
            <div class="tx-difference" v-if="store.cur.account && tx.type=='balance_reset'">
                <amount :amount="tx.difference" :category="category" :type="'balance_reset'"></amount>
            </div>
            <div class="tx-delete">
                <md-button
                    class="md-icon-button md-dense show-hovered"
                    @click.stop="tryremove()"
                    style="margin:0"
                >
                    <md-icon>clear</md-icon>
                </md-button>
            </div>
            <div
                class="tx-date"
                v-if="!store.is_acc_special() && store.cur.isMonthView"
            >{{show_date}}</div>
            <div class="tx-date" v-else>{{special_date}}</div>

            <div class="tx-balance" v-if="store.cur.account && !store.is_acc_special()">
                <amount class="account-balance" :amount="balance" :category="category"></amount>
            </div>

            <div class="tx-account" v-if="!store.cur.account && tx.dst">{{tx.dst}}</div>
            <div class="tx-account" v-if="!store.cur.account" :class="{'tar': tx.dst}">
                {{tx.src}}
                <div v-if="tx.dst" style="text-decoration:none;float:right">&#8594;</div>
            </div>
            <div
                class="tx-account"
                v-if="store.cur.account && tx.type=='transfer' && tx.src == store.cur.account.name"
            >&#8594; {{tx.dst}}</div>
            <div
                class="tx-account"
                v-if="store.cur.account && tx.type=='transfer' && tx.dst == store.cur.account.name"
            >&#8592; {{tx.src}}</div>
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
                            <md-input class="tar" v-model="tx.amount" v-on:keyup.13.stop="save()" />
                        </md-field>
                        <md-field class="mb0" v-if="tx.type == 'transfer'">
                            <md-input
                                class="tar"
                                v-model="tx.dst_amount"
                                v-on:keyup.13.stop="save()"
                            />
                        </md-field>
                    </div>
                    <div class="md-layout-item" style="max-width:130px">
                        <md-autocomplete
                            class="mb0"
                            name="tags"
                            v-model="tx.tag"
                            :md-options="tags"
                            md-dense
                        ></md-autocomplete>
                        <div class="tx-rate" v-if="tx.type=='transfer'">
                            <md-chip>{{rate.toFixed(3)}} / {{(1/rate).toFixed(3)}}</md-chip>
                        </div>
                    </div>
                    <div class="md-layout-item">
                        <md-field>
                            <md-input name="desc" v-model="tx.desc" v-on:keyup.13.stop="save()" />
                        </md-field>
                    </div>
                    <div class="md-layout-item" style="max-width:130px">
                        <md-autocomplete
                            class="mb0"
                            name="src"
                            v-model="tx.src"
                            :md-options="accounts"
                            md-dense
                        ></md-autocomplete>
                        <md-autocomplete
                            name="dst"
                            v-model="tx.dst"
                            v-if="tx.type=='transfer'"
                            :md-options="accounts"
                            md-dense
                        ></md-autocomplete>
                    </div>
                    <div class="md-layout-item">
                        <md-datepicker name="date" v-model="tx.date" md-dense md-immediately></md-datepicker>
                    </div>
                </div>
            </div>
            <div class="btn-item">
                <div class="tx-balance-detail" style="padding-left:16px">order: {{tx.order}}</div>
                <md-button class="md-raised md-primary md-dense" @click.stop="save()">ОК</md-button>
                <md-button class="md-raised md-dense" @click.stop="cancel()">Отмена</md-button>
            </div>
        </div>
    </div>
</template>

<script>
import $store from "../store.js";
import _ from "underscore";
import moment from "moment";
import $bus from "../../bus.js";
import Amount from "./Amount.vue";

export default {
    components: { Amount },

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
            if (!n.dst_amount || !n.amount) return 1.0;
            else return n.dst_amount / n.amount;
        },

        tags() {
            return _.sortBy(_.pluck(this.store.base_tags, "name"));
        },

        accounts() {
            return _.pluck(this.store.normal_accounts(), "name");
        },

        amount() {
            if (this.store.no_acc()) {
                //когда не выбран аккаунт
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
            if (this.store.no_acc()) {
                //когда не выбран аккаунт
                return "";
            }
            if (this.store.is_acc_current(this.tx.src)) {
                //если текущий аккаунт - исходный
                return this.tx.src_balance;
            }
            if (this.store.is_acc_current(this.tx.dst)) {
                return this.tx.dst_balance;
            }
        },

        category() {
            if (this.store.cur.account === null) {
                //когда не выбран аккаунт
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
            };
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
};
</script>

<style lang="less">
</style>
