<template>
    <template v-if="has('chief')">
        <ar-reports />
    </template>
    <template v-if="has('driver')">
        <ar-vehicle v-on:odometer="$refs['odometer'].open()" />
        <ar-orders />
        <ar-odometer ref="odometer" />
    </template>    
</template>
<script>
import { profile } from "app-ext/composables/profile";
import ArVehicle from "~/components/ArVehicle";
import ArOrders from "~/components/ArOrders";
import ArOdometer from "~/components/ArOdometer";
import ArReports from "~/components/ArReports";

export default {
    name: 'pageIndex',
    components: {
        ArVehicle,
        ArOrders,
        ArOdometer,
        ArReports
    },
    methods: {
        has(q){
            switch(q){
                case "chief":
                    return profile.hasrole("руководитель");
                case "driver":
                    return profile.hasrole("водитель");
            }
        }
    }
}
</script>