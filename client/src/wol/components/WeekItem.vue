<template>
<div class='wi' :class='{selected: week.selected, infoed: !!week.info, tagged: week.tagged}' @click='onClick()' >
    <div class='wi-inner' :class='week.future'>
        <div class="wi-bg" :style="{'background-color': week.bgcolor}"></div>
        <div class="wi-bg2" :style="{'border-bottom': '12px solid '+ week.bgcolor2}" v-if="week.bgcolor2 && !week.future"></div>
        <div class='wi-icon' :class='tags'></div>
        <div class='wi-popup-tri' ></div>
        <div class='wi-popup md-elevation-3' >
            <span class='desc-desc' v-once>{{week.desc}}</span>&nbsp;
            <div class='desc-flags' v-once>{{week.flags}}</div><br/>
            <div class='desc-info'>{{week.info}}</div>
        </div>
	</div>
</div>
</template>

<script>
export default {
    props: ['week'],

    computed: {
        tags() {
            return this.week.getTags({stripped: true, asstring: true});
        }
    },

    methods: {
        onClick () {
            this.$emit("week-clicked", this.week);
        }
    },

    mounted() {
        if (!this.mounted) {
            this.$emit("week-mounted", this.week);
        }
    }
}
</script>