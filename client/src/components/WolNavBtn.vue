<template>
    <div class='wol-navbtn'><a :href="link" @click="clicked()"><md-icon style="position:relative;top:-3px">{{icon}}</md-icon>&nbsp;{{text}}</a></div>
</template>

<script>
export default {
    props: ['link', 'icon', 'text', 'current'],
    methods: {
        clicked() {
            this.$emit("clicked");
        }
    } 
}
</script>

<style>
.wol-navbtn a, .wol-navbtn a:hover, .wol-navbtn a:link, .wol-navbtn a:visited, .wol-navbtn a:focus, .wol-navbtn a:active {
    text-decoration: none !important;
    color: initial !important;
}

.wol-navbtn {
    font-family: Dosis, "Source Sans Pro", "Helvetica Neue", Arial, sans-serif;
    font-size: 16px;
    padding: 6px 12px 3px 6px;
    border: 1px solid #eee;
    border-radius: 3px;
    background-color: #eee;
    color:#555;
    margin:3px;
    z-index:1000;
    opacity:1.0;
}

.wol-navbtn.active {
    background-color:lightblue;
}

.wol-navbtn:not(.active):hover {
    background-color: #dadada;
}

.wol-navbtn i.md-icon {
    position:relative;
    top:-2px;
}
</style>