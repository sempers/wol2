<template>    
    <div class="wol-header">
        <div class="lived">
            <strong>Прожито {{store.lived.percentage}}</strong>, недель: <strong>{{store.lived.weeks}}</strong>, дней: <strong>{{store.lived.days}}</strong>, часов: <strong>{{store.lived.hours}}</strong>
        </div>
        <div class="weeks-infoed">
            Недель заполнено: <strong>{{c_infoed}} ({{((c_infoed / store.lived.weeks) * 100).toFixed(1) + '%'}})</strong>
        </div>
        <div class="remained" style="">
            <strong>Осталось {{store.remained.percentage}}</strong>, недель: <strong>{{store.remained.weeks}}</strong>, дней: <strong>{{store.remained.days}}</strong>, часов: <strong>{{store.remained.hours}}</strong>
        </div>
    </div>    
</template>

<style lang="less">
.wol-header {
    padding-bottom: 30px;
    padding-top:58px;

    .lived {
        float:left;
    }

    .weeks-infoed {
        color: #448aff;
        margin-left: 45px;
        float:left;
    }

    .remained {
        float: right;
        position:relative;
        left:-27px
    }
}
</style>

<script>
import $store from "./store.js"
export default {
    data() {
        return {store: $store}
    },

    computed: {
        c_infoed() {
            return _.reduce(this.store.weeks, (memo, w) => +(!!w.info & !w.future) + memo, 0);
        }
    }
}
</script>