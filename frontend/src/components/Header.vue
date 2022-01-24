<template>
  <nav class="navbar navbar-light bg-light">
    <div class="navbar-brand m-0 p-3 h1 align-self-start">{{ title }}</div>
    <template v-if="user != null">
      <Navigation v-bind:name="user.name" v-bind:company="user.company_name" />
    </template>
  </nav>
</template>

<script>
import Navigation from "./Navigation";

export default {
  name: "Header",
  props: ["user"],
  components: {
    Navigation,
  },
  data() {
    return {
      title: "Invoicing App",
    };
  },
};
</script>
