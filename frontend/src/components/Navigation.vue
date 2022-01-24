<template>
  <div class="flex-grow-1">
    <div class="navbar navbar-expand-lg">
      <ul class="navbar-nav flex-grow-1 flex-row">
        <li class="nav-item">
          <a class="nav-link" v-on:click="setActive('create')"
            >Create Invoice</a
          >
        </li>
        <li class="nav-item">
          <a class="nav-link" v-on:click="setActive('view')">View Invoice</a>
        </li>
      </ul>
    </div>
    <div class="navbar-text">
      <em>Company: {{ company }}</em>
    </div>
    <div class="navbar-text h3">Welcome, {{ name }}</div>
  </div>
</template>

<script>
export default {
  name: "Navigation",
  props: ["name", "company"],
  methods: {
    setActive(option) {
      this.$parent.$parent.isactive = option;
    },
  },
};
</script>
