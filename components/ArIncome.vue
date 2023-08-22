<template>
        <v-btn :loading="pending"
               append-icon="mdi-chevron-down"
               size="small"
               :to="{name: 'salary'}">
            {{ title }}
        </v-btn>
</template>
<script>
import { all } from "~/composables/data";
    
export default{
    name: 'ArIncome',
    async setup(){
        const {pending, error, data: income} = useLazyAsyncData('income', all.getincome);
        return {
            pending,
            error,
            income
        };
    },
    computed: {
        title(){
            return (this.income?.sum > 0) ? Number(this.income.sum).toFixed(2) + ' ₽' : '';
        }
    }
}    
</script>