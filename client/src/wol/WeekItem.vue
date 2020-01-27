<template>
    <div class="wi-outer" :class="{selected: week.selected, infoed: !!week.info, tagged: week.tagged}" @click="onClick()">
        <div class="wi-inner" :class="week.future">
            <template v-if="!week.future">
                <div class="wi-bg" :style="'background-color:' + week.bgcolor"></div>
                <div class="wi-bg2" :style="'border-bottom: 12px solid '+ week.bgcolor2" v-if="week.bgcolor2"></div>
                <div class='wi-icon' :class="tags"></div>
            </template>
            <div class="wi-popup-triangle"></div>
            <div class="wi-popup md-elevation-4" >
                <span class="desc" >{{week.desc}}</span>&nbsp;
                <div  class="desc-flags" >{{week.flags}}</div>
                <div  class="desc-info">{{week.info}}</div>
            </div>
        </div>
    </div>
</template>

<script>
import $bus from '../bus.js'

export default {
    props: ['week'],

    computed: {
        tags() {
            return this.week.getTags({stripped: true, asstring: true});
        }
    },

    methods: {
        onClick () {
            $bus.$emit("week-clicked", this.week);
        }
    },

    created() {
        $bus.$emit("week-created", this.week);
        this.created = (new Date()).getTime();
    },

    mounted() {
        $bus.$emit("wit", (new Date()).getTime() - this.created);
    }
}
</script>