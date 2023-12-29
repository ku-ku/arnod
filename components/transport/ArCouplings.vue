<template>
    <ar-coupling ref="dlg" 
                 v-on:success="onmodify" />
    <v-data-table density="compact"
                  class="ar-couplings"
                  :loading="pending"
                  :headers="hdrs"
                  :items="couplings"
                  fixed-header
                  hover
                  item-key="id"
                  select-strategy="single"
                  :model-value="selected"
                  v-on:click:row="onclickrow"
                  :items-per-page="25"
                  height="calc(100vh - 178px)">
        <template v-slot:item.reg_number="{ item }">
            <v-icon v-if="!(item.trailers?.length > 0)"
                    class="mr-1"
                    size="x-small" color="orange">
                mdi-alert
            </v-icon>
            {{ item.reg_number }}&nbsp;/&nbsp;{{ item.trailers.at(0)?.reg_number }}
        </template>    
        <template v-slot:item.drivers="{ item }">
            <template v-if="item.drivers?.length > 0">
                {{ item.drivers.map( d => d.user.full_name).join(", ") }}
            </template>
            <v-icon v-else
                    size="x-small" color="orange">
                mdi-account-alert
            </v-icon>
        </template>    
        <template v-slot:item.status="{ item }">
            {{ item.active_status?.title }}
        </template>    
        <template v-slot:item.status2="{ item }">
            {{ item.active_status?.at }}&nbsp;/&nbsp;<b>{{ item.statusTime }}</b>
        </template>    
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-pencil"
                   v-on:click="oncoup(item)"></v-btn>
        </template>
    </v-data-table>
</template>
<script setup>
    import {ref, toRef} from "vue";
    
    import { empty, phpdate2m } from "app-ext/utils";
    import { all } from "~/composables/data";
    import ArCoupling from "./ArCoupling";
    
    const props = defineProps({search: String});
    
    const hdrs = [
        {title: 'ТС/прицеп', key: 'reg_number', sortable: false},
        {title: 'Водитель',  key: 'drivers',   sortable: false},
        {title: 'Статус',    key: 'status',    sortable: false},
        {title: 'Время',     key: 'status2',    sortable: false},
        {title: ' ',         key: 'actions',   sortable: false, align: "center", width: 108}
    ];

    const s = toRef(props, 'search');
    
    const couplings= ref([]),
          selected = ref([]),
          dlg      = ref(null);
    
    const { pending, error } = useAsyncData('transport-couplings', async ()=>{
        couplings.value = [];
        
        try {
            const now = $moment();
            const res = await $jet.api({
                url: `/vehicles/schedule?start_date=${ now.format('YYYY-MM-DD') }&end_date=${ now.format('YYYY-MM-DD 23:59:59') }&is_active=true`
            });
            if (res.success){
                res.result.forEach( r => {
                    if (r.active_status){
                        let at   = phpdate2m(r.active_status.pivot.start_date);
                        let duru = $moment.duration( now.diff(at) );
                        if ( duru.months() > 0 ){
                            r.statusTime = `${ duru.months() > 0 ? duru.months() + ' мес. ' : '' } 
                                            ${ duru.days()   > 0 ? duru.days()   + ' дн. ' : '' }`;
                        } else {
                            r.statusTime = `${ duru.days()   > 0 ? duru.days()   + ' дн. ' : '' }
                                            ${ duru.hours()  > 0 ? duru.hours()  + ' ч. ' : ''} 
                                            ${ duru.minutes() } мин.`;
                        }
                        r.active_status.at = at.format("DD.MM.YYYY HH:mm");
                    }
                });
                couplings.value = res.result;
            }
        } catch(e){
            console.log('ERR (vehicles)', e);
            $jet.msg({
                        text:`Ошибка получения данных.<br /><small>Информация для техподдержки: ${e.message} ${$jet.api.$errm}`,
                        type: 'warning',
                        timeout: 20000
                    });
        }
    }, {
        watch: [ s, all ]
    });
    
    function oncoup(item){
        console.log('dlg', dlg);
        dlg.value.open(item);
    };  //
    
    function onclickrow(e, { item }){
        selected.value = [ item ];
        $('.ar-couplings table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };  //onclickrow
    
    
    function onmodify(item){
        let n = couplings.value.findIndex( v => v.id === item.id );
        if ( n < 0 ){
            couplings.value.push(item);
        } else {
            couplings.value.splice(n, 1, item);
        }
    }   //onmodify
</script>

