<template>
  <div>
    <div class="tab-pane p-3 fade show active">
      <div class="row">
        <div class="col-md-12">
          <h3>Here is a list of your invoices</h3>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Invoice #</th>
                <th scope="col">Invoice Name</th>
                <th scope="col">Status</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="invoice in invoices">
                <tr :key="invoice.id">
                  <th scope="row">{{ invoice.id }}</th>
                  <td>{{ invoice.name }}</td>
                  <td v-if="invoice.paid == 0">Unpaid</td>
                  <td v-else>Paid</td>
                  <td><router-link :to="{name: 'SingleInvoice', params: {invoice_id: invoice.id}}" class="btn btn-success">To Invoice</router-link></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ViewInvoices",
  data() {
    return {
      invoices: [],
      user: "",
    };
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem("user"));
    axios
      .get(`http://localhost:3000/invoice/user/${this.user.id}`, {
        headers: { "x-access-token": localStorage.getItem("token") },
      })
      .then((res) => {
        if (res.data.status) {
          // console.log(res.data.invoices)
          this.invoices = res.data.invoices;
        }
      });
  },
};
</script>
