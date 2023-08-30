<template>
    <v-dialog v-model="show"
              scrollable
              max-width="720"
              content-class="ar-driver__incdetails"
              :fullscreen="mobile">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title><b>{{ title }}</b>&nbsp;(расшифровка начислений)</v-toolbar-title>
            <v-spacer />
            <v-btn size="small"
                   icon="mdi-close"
                   v-on:click="show = false"></v-btn>
        </v-toolbar>
        <v-card flat
                rounded="0">
            <v-card-text v-if="pending">
                <v-skeleton-loader type="list-item@3" />
            </v-card-text>
            <v-card-text v-else-if="error">
                {{ error.message }}
            </v-card-text>
            <v-card-text v-else>
                <v-list density="compact">
                    <template v-for="( d, n ) in data">
                        <v-list-subheader v-if="d.date">
                            {{ d.date }}
                        </v-list-subheader>
                        <v-list-item v-for="item in d.items"
                                     :key="item.income_id"
                                     :class="{'font-weight-bold': /итог/i.test(item.title)}">
                            {{ item.title }}
                            <template v-slot:append>
                                {{ format(item.sum, 2) }}
                            </template>
                        </v-list-item>
                    </template>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn size="small"
                       variant="elevated"
                       prepend-icon="mdi-close"
                       v-on:click="show = false">
                    закрыть
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { all } from "~/composables/data";
import { useDisplay } from 'vuetify';
import { getincome } from "~/services/driver";
    
export default {
    name: 'ArIncomeDetails',
    async setup(){
        const driver = ref({driver_id: -1});
        
        const {data, pending, error} = useAsyncData('driver-incomes', async () => {
            console.log('driver', driver);
            
            if ( !(driver.value?.driver_id > 0) ){
                return [];
            }
            
            
            const res = await $jet.api({
                url: `/incomes/by/driver/${ driver.value.driver_id }`,
                params: {
                    start_date: $moment(all.start).format("YYYY-MM-DD"),
                    end_date: $moment(all.end).format("YYYY-MM-DD")
                }
            });
                    
            console.log('incomes', res);
            if (res.success){
                let total = 0;
                const incs = Object.keys(res.result.days).map( k => {
                    res.result.days[k].forEach( d => total += Number(d.sum));
                    return {
                        date: $moment(k, "YYYY-MM-DD").format("DD.MM.YYYY"),
                        items: res.result.days[k]
                    };
                });
                incs.push({
                    date: null,
                    items: [{title: 'ИТОГО', sum: total}]
                });
                console.log('incs', incs);
                return incs;
            } else {
                throw {message: res.error};
            }
            
        }, {
            watch: [driver]
        });
        
        return {
            driver,
            data,
            pending,
            error
        };
        
    },
    data(){
        return {
            show: false,
            driver: null,
            mobile: useDisplay().mobile
        };
    },
    computed: {
        title(){
            return this.driver?.driver || '';
        }
    },
    methods: {
        open(driver){
            this.driver = driver;
            this.show = true;
        },
        format(n, digits = 2){
            if ( n ){
                var n = Number(n);
                return Number.isNaN(n) ? '' : new Intl.NumberFormat("ru-RU", {minimumFractionDigits: digits}).format(n);
            }
            return '';
        }
    }
}
</script>
<style lang="scss">
    .ar-driver{
        &__incdetails{
            & .v-toolbar{
                &-title{
                    font-size: 0.9rem;
                }
            }
        }
        &__incdetails{
            & .v-list{
                font-size: 0.85rem;
                & .v-list-item{
                    min-height: 28px !important;
                }
            }
        }
    }
</style>