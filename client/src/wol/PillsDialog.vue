<template>
    <md-dialog id="pillsDialog" :md-active.sync="store.shownPillsDialog">
        <md-dialog-content>
            <div class="ib">Последний пересчет: {{obj.lastSave | fmtDate}}</div>
            <md-button class="md-icon-button md-dense action-btn" @click="close()">
                <md-icon>clear</md-icon>
            </md-button>
            <md-button class="md-icon-button md-dense action-btn" @click="save()">
                <md-icon>done</md-icon>
            </md-button>
            <md-table class="pills-table">
                <md-table-row>
                    <md-table-head>Препарат</md-table-head>
                    <md-table-head>1 таб (мг)</md-table-head>
                    <md-table-head>Доза (мг)</md-table-head>
                    <md-table-head>Количество</md-table-head>
                    <md-table-head>Закончится</md-table-head>
                </md-table-row>
                <md-table-row v-for="pill in obj.pills" :key="pill.name">
                    <md-table-cell >{{pill.name}}</md-table-cell>
                    <md-table-cell >{{pill.unit}}</md-table-cell>
                    <md-table-cell >{{pill.dose}}</md-table-cell>
                    <md-table-cell ><input type="text" v-model="pill.available" /></md-table-cell>
                    <md-table-cell >{{pill.finish}}</md-table-cell>
                </md-table-row>
            </md-table>
        </md-dialog-content>
    </md-dialog>
</template>

<style lang="less">
#pillsDialog {
    width: 750px;
    height: 500px;
    display: inline-table;
}

.pills-table {
    clear:both;

    td.md-table-cell {
        padding: 0;
        height: 16px;

        &.ar {
            text-align: right;
        }

        input {
            width: 50px;
        }
    }
}
</style>

<script>
import $store from './store.js'
import { LOG } from '../utils/logging.js'

export default {
    data() {
        return {
            store: $store,
            obj: {
                lastSave: null,
                pills: []
            }
        }
    },

    created() {
        var obj = JSON.parse(localStorage.getItem('wol_pills_obj'));
        if (!obj || !obj.lastSave) {
            //default
            obj = {
                lastSave: new Date(),
                pills: [
                    {
                        name: 'Арипипразол',
                        unit: 10,
                        dose: 10,
                        available: 30
                    },
                    {
                        name: 'Сертралин',
                        unit: 100,
                        dose: 200,
                        available: 30
                    },
                    {
                        name: 'Биперидин',
                        unit: 2,
                        dose: 2,
                        available: 100
                    },
                    {
                        name: 'Ламотриджин',
                        unit: 100,
                        dose: 300,
                        available: 30
                    },
                    {
                        name: 'Вальпроевая кислота',
                        unit: 300,
                        dose: 300,
                        available: 100
                    },
                    {
                        name: 'Тразодон',
                        unit: 150,
                        dose: 75,
                        available: 30
                    },
                    {
                        name: 'Вортиоксетин',
                        unit: 10,
                        dose: 10,
                        available: 30
                    }
                ]
            };
            localStorage.setItem('wol_pills_obj', JSON.stringify(obj));
        }
        this.obj = obj;
        this.count();
    },

    methods: {
        count() {
            this.obj.pills.forEach(pill => {
                let diffDays = Math.abs(Math.floor(moment(this.obj.lastSave).diff(moment(new Date()), 'days')));
                pill.available -= (pill.dose / pill.unit) * diffDays;
                if (pill.available < 0 )
                    pill.available = 0;
                let days = Math.floor(pill.available * pill.unit / pill.dose);
                let ls = moment(this.obj.lastSave);
                ls.add(days, 'day');
                pill.finish = ls.local().format('D MMMM YYYY');
                this.obj.lastSave = new Date();
            });
            LOG('count()', `Pills recalculated at ${this.obj.lastSave}`)
        },

        close() {
            this.count();
            localStorage.setItem('wol_pills_obj', JSON.stringify(this.obj));
            this.store.shownPillsDialog = false;
        },

        save() {
            this.count();
            localStorage.setItem('wol_pills_obj', JSON.stringify(this.obj));
            toastr.success('Pills saved');
        }
    }
}
</script>