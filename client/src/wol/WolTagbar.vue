<template>
    <div class="tag-bar">
        <div class="tag-bar-item" v-for="ti in c_tags" :key="ti.tag">
            <div
                :class="'wi-outer wi-inner ' + ti.tag.replace('#','')"
                v-if="c_tagIcons.includes(ti.tag)"
            ></div>
            <a
                href
                @click.prevent="setTagged(ti)"
                class="tag-link"
                :class="{'strong': ti.weekNums.length>20, 'tag-selected': ti.tag == store.curTag}"
            >
                {{ti.tag}}
                <small>&nbsp;</small>
                ({{ti.weekNums.length}})&nbsp;&nbsp;&nbsp;
            </a>
        </div>
        <md-field>
            <label>Поиск</label>
            <md-input type="text" v-model="store.searchedWord" style="width:300px" />
        </md-field>
        <div style="text-align:center">
            <md-button type="button" @click="searchWord()">Искать в описаниях</md-button>
        </div>
    </div>
</template>

<script>
import $store from "./store.js"
import $bus from "../bus.js"

export default {
    data() {
        return {
            store: $store
        }
    },
    computed: {
        c_tags() {
            return _.sortBy(this.store.tags.stats, ti => ti.tag);
        },

        c_tagIcons() {
            return ['#ng', '#dr', '#buy', '#mov', '#games', '#major', '#interview', '#buh', '#acid', '#meet', '#crush', '#love', '#breakup', '#ill', '#exam', '#death', '#bad', '#sea', '#abroad'];
        },
    },
    methods: {
        searchWord() {
            $bus.$emit("search-word");
        },

        setTagged(ti) {
            $bus.$emit("set-tagged", ti);
        }
    }
};
</script>

<style lang="less">
@import "./assets/wol-vars.less";

.tag-bar {
    float: right;
    position: absolute;
    left: 1140px;
    top: 0;
    background-color: #f0f0f0;
    border-radius: 4px;
    border: 3px solid transparent;
    list-style: none;
    padding: 10px 15px;
    width: 300px;

    .tag-bar-item {
        display:inline-block;

        .wi-outer {
            position:relative;
            top: 2px;
        }
    }

    a:hover {
        text-decoration: none;
        color: blue;
    }

    a,
    a:visited,
    a:active {
        text-decoration: none;
        font-size: 0.9em;
        color: #448aff;
    }

    a.tag-link.tag-selected {
        font-weight: bold;
        color: @color-selected !important;
    }
}
</style>