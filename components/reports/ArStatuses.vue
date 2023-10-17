<template>
    <v-data-table density="compact"
                  class="ar-statuses"
                  disable-sort
                  no-filter
                  :fixed-header="true"
                  height="calc(100vh - 186px)"
                  hover
                  :headers="headers"
                  :items="items"
                  :items-per-page="-1"
                  :loading="pending"
                  single-select
                  disable-pagination
                  hide-default-footer
                  no-data-text="...">
        <template v-slot:item.reg_number="{ item }">
            <div class="d-flex align-center">
                <v-chip class="ar-status" 
                        elevation="1"
                        pill
                        variant="tonal"
                        :color="item.color">
                    <v-icon>{{ item.ico }}</v-icon>
                </v-chip>
                <div>
                    {{ item.reg_number }}
                    <div class="text-muted">{{ item.trailer }}</div>
                </div>
            </div>
        </template>
        <template v-slot:item.status="{ item }">
            <span v-if="(item.bad)" 
                  :style="'color:' + item.color">
                {{ item.status }}
            </span>
            <span v-else>
                {{ item.status }}
            </span>
        </template>
        <template v-slot:item.at="{ item }">
            {{ dtformat(item.at) }}
        </template>
        <template v-slot:item.activity="{ item }">
            <template v-if="!(item.actidays > 1)">
                {{ dtformat(item.activity) }}
            </template>
            <v-chip v-else color="red-accent-4">
                {{ item.activity ? dtformat(item.activity) + ' (' + item.actidays + ' дн)': 'н/д' }}
            </v-chip>
        </template>
        <template v-slot:bottom v-if="(totals.length > 0)">
            <v-slide-group class="ar-statuses__totals">
                <v-slide-group-item v-for="(t, n) in totals"
                                    :key="'tota-' + n">
                    <v-chip :color="t.color"
                            :prepend-icon="t.ico"
                            pill
                            size="small"
                            class="mr-3">
                        <v-badge :content="t.n"
                                 inline
                                 :color="t.color"
                                 :offset-x="30">
                            {{ t.status }}
                        </v-badge>
                    </v-chip>
                </v-slide-group-item>    
            </v-slide-group>
        </template>
    </v-data-table>
</template>
<script>
import { all } from "~/composables/data";
import { getstatuses } from "~/services/company";
import ArBaseReport from "./ArBaseReport";
import { colorize } from "./ArBaseReport";

const _HDRS = [
    {title: 'ТС',           key: 'reg_number', sortable: true,  fixed: true, width: 96},
    {title: 'статус',       key: 'status',     sortable: true,  fixed: true, width: 38},
    {title: 'контрагент',   key: 'contractor', sortable: true,  width: 200},
    {title: 'водитель',     key: 'drivers',    sortable: true,  width: 100},
    {title: 'изм.',         key: 'at',         sortable: true,  width: 120},
    {title: 'время',        key: 'timeWork',   sortable: false, width: 120},
    {title: 'макс.нагрузка',key: 'maxCapacity',sortable: false, width: 76},
    {title: 'загружено',    key: 'loaded',     sortable: false, width: 76},
    {title: 'окл.',         key: 'diffWeight', sortable: false, width: 76},
    {title: 'активность',   key: 'activity',   sortable: true,  width: 76}
];

export default {
    name: 'ArStatuses',
    extends: ArBaseReport,
    async setup(props, { emit }){
        const now = new Date(),
              s_now = $moment().format("DD.MM.YYYY"),
              items = ref([]),
              totals = ref([]);
        const { pending, error } = useLazyAsyncData('company', async ()=>{
            try {
                const res = await getstatuses(all.period.start, all.period.end);
                const _totals = [];
                
                let n;
                
                res.forEach( r => {
                    const status = r.active_status;
                    const order = status?.pivot?.vehicle_order;
                    r.expired = false;
                    r.bad     = false;
                    
                    if ( (status)&&(r.last_status?.at(0) ) ) {
                        const last = r.last_status.at(0);
                        if ( status.pivot.id !== last.pivot.id ){
                            r.status2 = `${ last.title }: ${ $moment(last.pivot.start_date, 'YYYY-MM-DD').format('DD.MM.YYYY') }`;
                        }
                    }
                    
                    let driver = r.drivers?.filter( d => {
                        let end = $moment().fromSql(d.pivot.end_date);
                        return !end || end.isSameOrAfter(now);
                    })?.at(0);
                    
                    if ( driver ){
                        r.activity = driver.activity;
                    } else {
                        driver = order?.driver;
                    }
                    
                    r.drivers = driver?.user.full_name;
                    
                    r.status = status?.title || '';
                    
                    if ( !(r.trailers?.length > 0) ){
                        r.ico = "mdi-truck-minus-outline";
                        r.color = "#D50000";    //red
                        r.bad = true;
                        r.status = 'нет сцепки';
                    } else if ( /^(загру)+.*(назна)+/i.test(r.status) ){
                        r.status = 'з/назн.';
                        r.ico = "mdi-clock-alert-outline";
                        r.color = "blue";
                    } else if (/^(прибыл)+.*(загр)+/i.test(r.status) ){
                        r.status = 'прибыл';
                        r.ico = "mdi-truck-delivery-outline";
                        r.color = "indigo";
                    } else if (/^(загружен)+/i.test(r.status) ){
                        r.status = 'загр.';
                        r.ico = "mdi-truck-check-outline"
                        r.color = "teal";
                    } else if (/^(прибыл)+.*(выгр)+/i.test(r.status) ){
                        r.status = 'пр/выг.';
                        r.ico = "mdi-forklift";
                        r.color = "light-green";
                    } else if (/^(выгружен)+/i.test(r.status) ){
                        r.status = 'выгружен';
                        r.ico = "mdi-truck-flatbed";
                        r.color = "#D50000";    //red
                        r.bad   = true;
                    } else if (/(ТО)+/.test(r.status) ){
                        r.status = "ТО";
                        r.ico = "mdi-engine-outline";
                        r.color = "#D50000";    //red
                        r.bad   = true;
                    } else if (/^(водит)+.*(не)+/i.test(r.status)) {
                        r.ico = "mdi-account-off-outline";
                        r.color = "#D50000";    //red
                        r.bad   = true;
                    }
                    
                    if (r.bad){ //bad only calculating
                        n = _totals.findIndex( t => t.status === r.status);
                        if ( n < 0 ){
                            _totals.push({status: r.status, n: 1, color: r.color, ico: r.ico, bad: r.bad});
                        } else {
                            _totals[n].n++;
                        }
                    }
                    
                    r.timeWork = '';
                    r.at = (status) ? status.pivot?.start_date : null;
                    if (r.at){
                        r.at = $moment(r.at, 'YYYY-MM-DD HH:mm:ss').toDate();
                        let duru = $moment.duration( $moment(now).diff(r.at));
                        if ( duru.months() > 0 ){
                            r.timeWork = `${ duru.months() > 0 ? duru.months() + ' мес. ' : '' } 
                                          ${ duru.days()   > 0 ? duru.days()   + ' дн. ' : '' }`;
                        } else {
                            r.timeWork = `${ duru.days()   > 0 ? duru.days()   + ' дн. ' : '' }
                                          ${ duru.hours()  > 0 ? duru.hours()  + ' ч. ' : ''} 
                                          ${ duru.minutes() } мин.`;
                        }
                    }
                    if (status?.code < 6){   //выгружен
                        r.end = order?.end_date;
                        if ( r.end ){
                            r.end = $moment(r.end, 'YYYY-MM-DD HH:mm:ss');
                            if ( r.at ){
                                r.expired = r.end.add(1, 'days').isBefore(r.at);
                            }
                        }
                    }

                    r.contractor = r.last_vehicle_order?.contractor?.title || '';   //TODO:

                    let trailer = r.trailers?.at(0);
                    if  (trailer){ 
                        r.trailer = trailer.reg_number;
                        let capacity = trailer.pivot?.vehicle_load_capacity;
                        r.maxCapacity = (capacity) ? Number((capacity.weight - (r.weight ?? 0) - (trailer.weight ?? 0)) / 1000).toFixed(2) : null;
                    } else {
                        r.trailer = 'нет сцепки';
                        r.maxCapacity = null;
                    }

                    r.diffWeight = null;
                    if ( 
                            (r.maxCapacity)
                         && (order)
                       ){
                        r.loaded = order.loaded;
                        if ( (r.loaded ?? 0) > 0 ){
                            let diff = (r.maxCapacity - (r.loaded ?? 0)) * 100;
                            r.diffWeight = - Number(diff / 100).toFixed(2);
                        } else if (status.code >= 4) {
                            r.loaded = 'вес не указан';
                        }
                    }
                    
                    if ( r.activity ){
                        r.activity = $moment(r.activity, 'YYYY-MM-DD HH:mm:ss').toDate();
                        r.actidays = $moment().diff(r.activity, 'days');
                    } else {
                        r.actidays = 999;
                    }
                });
                
                //TODO: colorize(".v-table.ar-statuses");
                emit('count', res.length);
      
                items.value = res;
                totals.value = _totals.sort( (t1, t2) => {
                    return t1.bad ? -1 : t1.status.localeCompare(t2.status);
                });
                
                console.log('_totals', _totals);
                return true;
            } catch(e){
                console.log('ERR (statuses)', e);
                emit('error', e);
            }
        });
        
        return {
            headers: _HDRS,
            pending,
            error,
            items,
            totals
        };
    },   //setup
    beforeUnmount(){
        this.items = [];
        clearNuxtData('company');
        console.log('beforeUnmount', this);
    }
}
</script>
<style lang="scss">
    .ar-statuses{
        & table {
            & tr{
                & td:nth-child(1), & td:nth-child(2){
                    font-weight: 600;
                    z-index: 1;
                    background-color: #fff !important;
                    overflow: hidden;
                }
                & .ar-status{
                    margin-right: 0.5rem;
                }
            }
            & .text-muted{
                font-weight: 400;
            }
        }
        & .v-data-table-footer{
            display: none;
        }
    }
    .ar-statuses__totals{
        margin: 0.5rem 0 0.5rem 0.5rem;
        & .v-badge{
            &__badge{
                margin-left: 0.33rem;
            }
        }
    }
</style>