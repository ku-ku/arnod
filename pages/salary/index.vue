<template>
    <div class="ar-salary">
        <v-tabs v-model="tab" color="primary"
                density="compact">
            <v-menu>
                <template v-slot:activator="{props}">
                    <v-btn flat 
                           text
                           v-bind="props"
                           variant="tonal"
                           color="primary"
                           append-icon="mdi-chevron-down">
                        {{ MONTHS[month].name }}
                    </v-btn>
                </template>    
                <v-list density="compact">
                    <v-list-item v-for="(m, n) in MONTHS"
                                 :key="'month-' + n"
                                 :title="m.name"
                                 v-on:click="month = n"
                                 :value="n"></v-list-item>
                </v-list>
            </v-menu>
            <v-tab :value="1" prepend-icon="mdi-cash-fast">Начисления</v-tab>
            <v-tab :value="2" prepend-icon="mdi-text-box-outline">Отчет</v-tab>
        </v-tabs>
        <v-window v-model="tab">
            <v-window-item key="enrollments" 
                           :value="1">
                <v-list class="ar-salary__enrollments">
                    <template v-for="d in data">
                        <v-list-item v-for="item in d.items"
                                     :key="'salary-'+item.income_id">
                            <v-row>
                                <v-col cols="2">{{ d.day }}</v-col>
                                <v-col cols="auto" class="text-truncate">{{ item.title }}</v-col>
                                <v-col cols="3" class="ml-auto text-right">{{ item.sum }}</v-col>
                            </v-row>
                        </v-list-item>
                    </template>
                </v-list>
            </v-window-item>
            <v-window-item key="details" 
                           :value="2">
                <v-list class="ar-salary__details">
                    <template v-for="d in data">
                        <v-list-item title="суточные">
                            <template v-slot:append>{{ d.daily }}</template>
                        </v-list-item>
                        <v-list-item title="заработная плата тонно/км">
                            <template v-slot:append>{{ d.tonne_km }}</template>
                        </v-list-item>
                        <v-list-item title="простои">
                            <template v-slot:append>{{ d.immobility }}</template>
                        </v-list-item>
                        <v-list-item title="всего начисленно за месяц">
                            <template v-slot:append>{{ d.total_income_period }}</template>
                        </v-list-item>
                        <v-list-item title="выплачено в виде официальной выплаты">
                            <template v-slot:append>{{ d.total_payed }}</template>
                        </v-list-item>
                        <v-list-item title="получено в виде авансов на карту">
                            <template v-slot:append>{{ d.prepayment }}</template>
                        </v-list-item>
                        <v-list-item title="ТМЦ приобритенные за свой счет">
                            <template v-slot:append>{{ d.inventory_items }}</template>
                        </v-list-item>
                        <v-list-item title="штрафы водителя">
                            <template v-slot:append>{{ d.penalty }}</template>
                        </v-list-item>
                        <v-list-item title="премия">
                            <template v-slot:append>{{ d.bonus }}</template>
                        </v-list-item>
                        <v-list-item title="за экономию ГСМ">
                            <template v-slot:append>{{ d.fuel_economy_income }}</template>
                        </v-list-item>
                        <v-list-item title="ИТОГО на руки по итогам месяца">
                            <template v-slot:append>{{ d.total }}</template>
                        </v-list-item>
                    </template>
                </v-list>
            </v-window-item>
        </v-window>    
    </div>
</template>
<script setup>
import { MONTHS } from "app-ext/utils";

    const now = new Date(),
          tab = ref(1);
    
    const month = ref( now.getMonth() );
        
    const {pending, data, error} = useAsyncData('salary', ()=>{
        return new Promise( async (resolve, reject) => {
            const start = $moment([now.getFullYear(), month.value, 1]);
            const end   = $moment(start).add(1, 'month').add(-1, 'days');
            const url = (1 === tab.value) ? '/mobile/driver/income' : '/mobile/driver/incomes';
            try {
                const res = await $jet.api({
                    url,
                    params: {
                        start_date: start.format('YYYY-MM-DD'),
                        end_date: end.format('YYYY-MM-DD')
                    }
                });
                console.log('salary ', res);
                if (res.success){
                    let all;
                    if (1 === tab.value){
                        all = Object.keys(res.result.days).map( d => {
                            return {
                                day: $moment(d, 'YYYY-MM-DD').format('DD.MM'),
                                items: res.result.days[d]
                            };
                        });
                    } else {
                        all = res.result.item;
                    }
                    console.log('all', all);
                    resolve(all);
                } else {
                    throw {message: res.error};
                }
            } catch(e){
                console.log('ERR (salary)', e);
                reject(e);
            }
            
        });
    }, { watch: [tab, month] });
    
</script>
<style lang="scss">
    .ar-salary{
        & .v-list{
            &-item{
                font-size: 0.9rem;
                min-height: 32px;
                &:not(:last-child){
                    border-bottom: 1px solid rgba(0,0,0,0.18);
                }
            }
        }
    }
</style>