<template>
    <v-data-table-server density="compact"
                  class="ar-odometers"
                  :loading="pending"
                  :items="odometers"
                  :items-length="pages.total"
                  :headers="hdrs"
                  :fixed-header="true"
                  :fixed-footer="true"
                  :sticky="true"
                  hover
                  item-key="id"
                  select-strategy="single"
                  :model-value="selected"
                  v-on:click:row="onclickrow"
                  v-on:update:options="onoptions"
                  :items-per-page="25"
                  height="calc(100vh - 200px)">
        <template v-slot:top>
            <div class="text-right ma-3">
                <v-btn size="small"
                       prepend-icon="mdi-plus"
                       v-on:click="onodometer(null)">
                    указать пробег
                </v-btn>
            </div>
        </template>    
        <template v-slot:item.distance="{ item }">
            {{ format(item.distance) }}
        </template>    
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" flat icon="mdi-pencil"
                   v-on:click="onodometer(item)"></v-btn>
        </template>    
    </v-data-table-server>
    <ar-coup-odo ref="odoDlg"
                 v-on:save="onmodify($event)" />
</template>
<script setup>
    import { phpdate2m } from "app-ext/utils";
    import ArCoupOdo from "./ArCoupOdo";
    
    const hdrs = [
        {title: '№',      key: 'n', sortable: false, width: '16px'},
        {title: 'дата',   key: 'date', sortable: false},
        {title: 'пробег', key: 'distance', sortable: false},
        {title: ' ',      key: 'actions', sortable: false, align: 'center', width: '16px'}
    ];
    
    const props = defineProps({
        coupling: Object
    });
    
    const coup      = toRef(props, 'coupling'),
          odometers = ref([]),
          selected  = ref([]),
          odoDlg    = ref(null),
          pages     = ref({
              page: 1,
              perPage: 25,
              total: 0
          });
          
    
    const { pending, error } = useLazyAsyncData('coup-odometers', async ()=>{
        odometers.value = [];
        selected.value  = [];
        const params = {
            page: pages.value.page,
            perPage: pages.value.perPage,
        };
        
        try {
            const res = await $jet.api({
                url: `/odometers/by/vehicle/${ coup.value.id }`,
                params
            });
            if ( res.success ){
                pages.value.total = res.result.total;
                res.result.items.forEach( (item, n) => {
                    item.n = n + 1;
                    item.date = phpdate2m(item.created_at).format('DD.MM.YYYY');
                });
                odometers.value   = res.result.items;
                console.log('odometers', odometers);
            } else {
                throw {message: res.error};
            }
            return true;
        } catch(e){
            console.log('ERR (odo)', e);
            $jet.msg({
                        text: `Ошибка получения данных о пробеге.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: 'warning'
            });
            
        }
    }, {
        watch: [ coup ]
    });
    
    
    function onoptions(opts){
        pages.value.page = opts.page;
        pages.value.perPage = opts.itemsPerPage;
        refreshNuxtData('coup-odometers');
    };
      
    function onclickrow(e, {item}){
        selected.value = [item.id];
        $('.ar-odometers table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };  //onclickrow
    
    function format(n){
        if ( n ){
            var n = Number(n);
            return Number.isNaN(n) ? '' : new Intl.NumberFormat("ru-RU", {minimumFractionDigits: 0}).format(n);
        }
        return '';
    }

    function onodometer(item){
        console.log('item', item);
        let day = {
            id: item?.id || null,
            start: item ? phpdate2m(item.created_at).toDate() : new Date(),
            distance: item?.distance,
            vehicle_id: coup.value.id,
            driver_id:  coup.value.drivers?.at(0)?.id
        };
        odoDlg.value.open(day);
    }   //onodometer
    
    function onmodify(item){
        console.log(item);
    }

</script>