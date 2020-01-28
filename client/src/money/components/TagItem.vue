<template>
    <div
        class="tag-item"
        @click.left="select()"
        @click.right.prevent="edit()"
        :class="{'active': store.cur.tag == tag.bt.name, 'disabled': !tag.enabled}"
    >
        <div class="tag-color" :style="{'background-color': color}"></div>
        <div class="tag-info" v-show="!tag.isEdited">
            <div class="tag-name">{{tag.bt.name}}</div>
            <div
                class="tag-budget"
                v-if="store.no_acc() && tag.budget.max && !(!store.cur.isMonthView && tag.budget.type == 'monthly')"
                :class="{'transfer': tag.budget.type=='yearly', 'income': tag.budget.type=='monthly' && tag.budget.percentage <= 100.0, 'expense': tag.budget.type=='monthly' && tag.budget.percentage > 100}"
            >
                <span>{{tag.budget.spent}} / {{tag.budget.max}} ({{tag.budget.percentage}}%)</span>
            </div>
            <div class="tag-budget no-border" v-else>&nbsp;</div>
            <div class="tag-delete" v-if="!tag.enabled">
                <md-button
                    class="md-icon-button md-dense show-hovered"
                    @click.stop="remove()"
                    style="margin:0"
                >
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
</template>

<script>
import $store from "../store.js";
import $bus from "../../bus.js";
import Amount from "./Amount.vue";

export default {
    components: { Amount },

    data() {
        return {
            store: $store
        };
    },

    props: ["tag"],

    computed: {
        category() {
            if (this.store.no_acc()) {
                return "";
            } else return this.store.acc_category(this.store.cur.account.name);
        },

        color() {
            return this.store.tag_color(this.tag.bt.name);
        },

        type() {
            if (this.store.no_acc() && this.tag.bt.name.includes("Invest"))
                return "transfer";
            else return "";
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
                if (
                    !this.tag.bt.name &&
                    _.find(this.store.transactions, {
                        tag: this.tag.bt.name
                    }).length
                ) {
                    //this.error(`[removeTag] There are transactions with tag ${this.tag.bt.name}`);
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
};
</script>