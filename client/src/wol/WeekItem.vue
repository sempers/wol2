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

<style lang="less">
@import "./assets/wol-vars.less";
@import "./assets/wol-icons.less";

.wi-outer {
    margin: 0;
    padding: 0;
    border: 3px solid @window-background;
    display: inline-block;

    &.selected {
        border-color: @color-selected;
    }

    &.tagged {
        border-color: @color-tagged;
    }
}

.wi-inner {
    width: 12px;
    height: 12px;
    border: 1px solid @color-gray;
    position: relative;

    &.future {
        border: 1px dotted @window-foreground;
        background-color: white;
    }

    .infoed & {
        border: 1px solid @window-foreground;
    }
}

.wi-bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    border: 0;
    opacity: 0.5;
    z-index: 1;

    .infoed & {
        opacity: 1.0;
    }
}

.wi-bg2 {
    position: absolute;
    left: 0;
    top: -12px;
    width: 0;
    height: 0;
    z-index: 2;
    border-width: 12px;
    border-top: 12px solid transparent;
    border-left: 12px solid transparent;
    opacity: 0.5;

    .infoed & {
        opacity: 1.0;
    }
}

.wi-icon-placeholder {
    width: 12px;
    height: 12px;
    margin-right: 4px;
    display: inline-block;
    vertical-align: middle;

    &:last-child {
        margin-right: 0;
    }
}

.wi-icon {
    position: absolute;
    left: 0;
    top: 0;
    width: 12px;
    height: 12px;
    border: 0;
    z-index: 3;
}

.wi-popup-triangle {
    width: 16px;
    height: 16px;
    background-image: url(./assets/tags/triangle.png);
    position: absolute;
    left: 3px;
    display: none;
    z-index: 5;
}

.wi-popup {
    width: 280px;
    border: 1px solid @window-foreground;
    border-radius: 4px;
    background: #eee;
    color: @window-foreground;
    font-style: italic;
    font-size: 0.75em;
    padding: 0 4px 4px 4px;
    overflow-x: auto;
    display: none;
    position: absolute;
    left: 18px;
    top: -4px;
    z-index: 4;
}

.wi-outer:hover .wi-popup,
.wi-outer:hover .wi-popup-triangle {
    display: block !important;
}

.desc {
    color: @window-foreground;
    line-height: 1.2;
}

.desc-flags {
    display: inline-block
}

.desc-info {
    font-style: normal;
    font-size: 11px;
    line-height: 1.2 !important;
    color: @window-foreground;
    white-space: pre-wrap;
}
</style>