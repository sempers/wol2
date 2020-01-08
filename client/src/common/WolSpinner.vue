<template>
    <div class="spinner-parent" v-if="store.loading">
        <div class="spinner-elem">
            <md-progress-spinner md-mode="indeterminate" :md-diameter="160"></md-progress-spinner>
        </div>
    </div>
</template>

<script>
export default {
    props: ['store']    
}
</script>
