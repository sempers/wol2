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