<template>
<div style="position:relative">
    <table class="yeartable clearfix">
        <tr v-for="(year_weeks, year, index) in store.years" :key="year">
            <td class="yeartd year-header" valign="middle">{{year}}<span class="uninfoed" v-if="countUninfoed(year_weeks)">({{countUninfoed(year_weeks)}})</span></td>
            <td class="yeartd year-weeks" valign="middle">
                <div class="week-placeholder" v-if="index === 0" :style="'width:' + store.firstYearPlaceHolderWidth + 'px'"></div>
                <week-item v-for="week in year_weeks" :key="week.weekNum" :week="week"></week-item>
            </td>
        </tr>
    </table>             
</div>
</template>

<script>
import $store from "./store.js"
import WeekItem from "./WeekItem.vue"

export default {
    components: { WeekItem },

    data() {
        return {
            store: $store
        }
    },

    methods: {
        //---------------------------- Расчеты в режиме недельки -----------------------------------------------------
        //посчитать сколько не заполнено в году
        countUninfoed(year_weeks) {
            return _.reduce(year_weeks, (memo, week) => memo + +(!week.info & !week.future), 0)
        }
    }
}
</script>

<style lang="less">
@import "./assets/wol-vars.less";

.yeartable {
    margin: 0;
    width: 1120px;
}

.yeartd {
    height: 20px;
}

.year-header {
    color: @window-foreground;
    font-weight: bold;
    display: inline-block;
    width: 50px;
    font-size: 16px;
}

.uninfoed {
    color: @color-gray;
    font-size: 10px;
    font-weight: normal;
    position: relative;
    top: -3px;
}

.week-placeholder {
    border: 0;
    margin: 0;
    display: inline-block;
    background: @window-background;
}
</style>