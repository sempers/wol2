<template>
  <div class="wol-navbar">
    <wol-navbtn
      v-show="MODULES.includes('wol')"
      :icon="'directions_run'"
      :class="{'active': current == 'wol'}"
      :link="'/'"
      :text="'Weeks of Life'"
    ></wol-navbtn>
    <wol-navbtn
      v-show="MODULES.includes('money')"
      :icon="'monetization_on'"
      :class="{'active': current == 'money'}"
      :link="'/money'"
      :text="'Money'"
    ></wol-navbtn>
    <wol-navbtn
      v-show="MODULES.includes('msg')"
      :icon="'message'"
      :class="{'active': current == 'msg'}"
      :link="'/msg'"
      :text="'Messages'"
    ></wol-navbtn>
    <wol-navbtn
      v-show="current == 'wol' && MODULES.includes('travel')"
      :icon="'location_on'"
      :link="'javascript:;'"
      v-on:clicked="showMapDialog()"
      :text="'Travel'"
    ></wol-navbtn>
    <wol-navbtn
      v-show="current == 'wol' || current == 'money'"
      :icon="'exit_to_app'"
      :link="'javascript:;'"
      v-on:clicked="logout()"
      :text="'Log out'"
    ></wol-navbtn>
  </div>
</template>

<script>
export default {
  props: ["current"],

  data() {
    return {
      MODULES: window.$server.MODULES
    };
  },

  methods: {
    showMapDialog() {
      this.$emit("show-map-dialog");
    },

    logout() {
      this.$emit("logout");
    }
  }
};
</script>

<style>
</style>