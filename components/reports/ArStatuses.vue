<template>
    <v-skeleton-loader type="list-item@3" 
                       v-if="pending" />
    <v-data-table v-else
                  density="compact"
                  ref="table"
                  class="ar-statuses"
                  fixed-header
                  disable-sort
                  no-filter
                  height="100%"
                  hover
                  :headers="headers"
                  :items="items"
                  :items-per-page="-1"
                  :model-value="selected"
                  item-value="id"
                  single-select
                  disable-pagination
                  hide-default-footer
                  no-data-text="..."
                  return-object>
        <template v-slot:item.reg_number="{ item }">
            {{ item.raw.reg_number }}
            <div class="text-muted">{{ item.raw.trailer }}</div>
        </template>
        <template v-slot:item.status="{ item }">
            <div class="d-flex align-center">
                <v-chip class="ar-status" 
                        elevation="1"
                        pill
                        variant="tonal"
                        :color="item.raw.color">
                    <v-icon>
                        {{ item.raw.ico }}
                    </v-icon>
                </v-chip>
                {{ item.raw.status }}
            </div>
        </template>
        <template v-slot:item.at="{ item }">
            <v-chip v-if="item.raw.expired" color="red-accent-4">
                {{ dtformat(item.raw.at) }}
            </v-chip>
            <template v-else>
                {{ dtformat(item.raw.at) }}
            </template>
        </template>
    </v-data-table>
</template>
<script>
import { all } from "~/composables/data";
import { getstatuses } from "~/services/company";
import ArBaseReport from "./ArBaseReport";
import { colorize } from "./ArBaseReport";

const _HDRS = [
    {title: 'ТС',         key: 'reg_number', type: 'string', sortable: true, fixed: true, width: 52},
    {title: 'статус',     key: 'status',     type: 'string', sortable: true, fixed: true, width: 96},
    {title: 'контрагент', key: 'contractor', type: 'string', sortable: true, width: 200},
    {title: 'водитель',   key: 'drivers',    type: 'string', sortable: true, width: 100},
    {title: 'изм.',       key: 'at',         type: 'date',   sortable: true, width: 120},
    {title: 'время.',     key: 'timeWork',   type: 'string', sortable: false, width: 120},
    {title: 'макс.нагрузка',key: 'maxCapacity',type: 'float',sortable: false, width: 76},
    {title: 'загружено',  key: 'loaded',     type: 'float', sortable:  false, width: 76},
    {title: 'окл.',       key: 'diffWeight', type: 'float', sortable:  false, width: 76}
];

export default {
    name: 'ArStatuses',
    extends: ArBaseReport,
    async setup(props, { emit }){
        const now = new Date();
        const {data: items, pending, error} = useLazyAsyncData('company', async ()=>{
            try {
                const res = await getstatuses(all.period.start, all.period.end);
                emit('count', res.length);
                res.forEach( r => {
                    const status = r.last_status?.map( s => {
                        s.created = $moment(s.created_at, 'YYYY-MM-DD');
                        return s;
                    }).sort( (s1, s2) => {
                        return s1.created.isBefore(s2) ? -1 : s1.created.isAfter(s2) ? 1 : 0
                    }).at(0); 
                    const order = status?.pivot?.vehicle_order;
                    
                            //r.active_status;
                    r.expired = false;
                    r.drivers = r.drivers?.filter( d => {
                        let end = !!d.pivot.end_date ? $moment(d.pivot.end_date, 'YYYY-MM-DD HH:mm:ss') : null;
                        return !end || end.isSameOrAfter(now);
                    })?.map( d => d.user.full_name )?.join(', ');
                    r.status = status?.title || '';
                    if ( /^(загру)+.*(назна)+/i.test(r.status) ){
                        r.ico = "mdi-clock-alert-outline";
                        r.color = "blue";
                    } else if (/^(прибыл)+.*(загр)+/i.test(r.status) ){
                        r.ico = "mdi-truck-delivery-outline";
                        r.color = "indigo";
                    } else if (/^(загружен)+/i.test(r.status) ){
                        r.ico = "mdi-truck-check-outline"
                        r.color = "teal";
                    } else if (/^(прибыл)+.*(выгр)+/i.test(r.status) ){
                        r.ico = "mdi-forklift";
                        r.color = "light-green";
                    } else if (/^(выгружен)+/i.test(r.status) ){
                        r.ico = "mdi-truck-flatbed";
                        r.color = "blue-grey";
                    } else if (/(ТО)+/.test(r.status) ){
                        r.ico = "mdi-engine-outline";
                        r.color = "amber";
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
                });
                colorize(".v-table.ar-statuses");
                return res;
            } catch(e){
                console.log('ERR (statuses)', e);
                emit('error', e);
            }
        });
        
        return {
            headers: _HDRS,
            pending,
            error,
            items
        };
    },   //setup
    data(){
        return {
            selected: []
        };
    },
    methods: {
        refresh(){
            refreshNuxtData('company');
        }
    },
    computed: {
        count(){
            return this.items?.length > 0 ? this.items?.length : '';
        }
    }
}    
</script>
<style lang="scss">
    .ar-statuses{
        & table {
            font-size: 0.65rem;
            line-height: 1.115;
            & tr{
                & th{
                    font-weight: 600 !important;
                }
                & td:nth-child(1), & td:nth-child(2){
                    font-weight: 600;
                    z-index: 1;
                    background-color: #fff !important;
                    overflow: hidden;
                }
                & .ar-status{
                    margin-right: 0.25rem;
                }
            }
        }
        & .v-data-table-footer{
            display: none;
        }
    }
</style>