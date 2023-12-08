<template>
    <teleport to="#ar-tb__prepend">
        <v-btn prepend-icon="mdi-plus"
               variant="tonal"
               color="primary"
               class="ml-auto mr-3"
               v-on:click="oncarrier(null)">новый</v-btn>
    </teleport>
    <v-data-table-server density="compact"
                  class="ar-carriers"
                  :loading="pending"
                  :headers="hdrs"
                  :items-length="pages.total"
                  :items="carriers"
                  fixed-header
                  hover
                  item-key="id"
                  select-strategy="single"
                  :model-value="selected"
                  v-on:click:row="onclickrow"
                  :items-per-page="25"
                  v-on:update:options="onoptions"
                  height="calc(100vh - 178px)">
        <template v-slot:item.status="{ item }">
            <v-icon size="small">{{ !!item.isTransportation ? 'mdi-checkbox-outline' : 'mdi-checkbox-blank-outline' }}</v-icon>
        </template>
        <template v-slot:item.title="{ item }">
            <a href="#" v-on:click.prevent="oncarrier(item)">{{ item.title }}</a>
        </template>
        <template v-slot:item.vehicle_types="{ item }">
            {{ item.vehicle_types?.map( t => t.title )?.join(' | ') }}
        </template>
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-pencil"
                   v-on:click="oncarrier(item)"></v-btn>
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-close"
                   v-on:click="del(item)"></v-btn>
        </template>
    </v-data-table-server>
    <teleport to="body">
        <ar-carrier-dlg ref="dlg" 
                        v-on:success="onmodify" />
    </teleport>
</template>
<script setup>
    import { ref, toRef } from "vue";
    import { empty } from "app-ext/utils";
    import ArCarrierDlg from "./ArCarrierDlg";
    
    const props = defineProps({search: String});
    
    const hdrs = [
        {title: 'Наименование',  key: 'title',  sortable: false},
        {title: 'ИНН',           key: 'tin',    sortable: false},
        {title: 'Перевозчик',    key: 'status', sortable: false, align: "center"},
        {title: 'Тип ТС',        key: 'vehicle_types', sortable: false},
        {title: '...',           key: 'actions', sortable: false, align: "center"}
    ];
    const pages = ref({
                            page: 1,
                            perPage: 25,
                            total: 0,
                            sort: []
                    }),
          s = toRef(props, 'search');
    
    const carriers = ref([]),
          selected = ref([]),
          dlg      = ref(null);
    
    const { pending, error } = useAsyncData('users-carriers', async ()=>{
        try {
            const opts = {
                url: '/carriers',
                method: 'GET',
                params: {
                    page: pages.value.page,
                    perPage: pages.value.perPage,
                    include: 'vehicle_types'
                }
            };
            if ( !empty(s.value) ){
                opts.params.filters = `title:${ s.value }`;
            }
            
            const res = await $jet.api(opts);
            if (res.success){
                carriers.value = res.result.items;
                pages.value.total = res.result.total;
            } else {
                throw {message: res.error};
            }
        } catch(e){
            console.log('ERR (carriers)', e);
            $jet.msg({
                        text:`Ошибка получения данных о перевозчиках.<br /><small>Информация для техподдержки: ${e.message} ${$jet.api.$errm}`,
                        type: 'warning'
                    });
        }
    }, { 
        watch: [s]
    });
    
    function onoptions(opts){
        pages.value.page = opts.page;
        pages.value.perPage = opts.itemsPerPage;
        pages.value.sort = opts.sortBy;
        if ( 0 === pages.value.total ){
            return;
        }
        refreshNuxtData('users-carriers');
    };  //onoptions
    
    function onclickrow(e, { item }){
        selected.value = [ item ];
        $('.ar-carriers table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };
    
    function oncarrier(item){
        selected.value = [ item ];
        if ( dlg.value && (dlg.value.open) ){
            dlg.value.open(item);
        }
    };   //oncarrier
    
    async function onmodify(id){
        try {
            let res = await $jet.api({
                url: `/carriers/${ id }`,
                method: 'GET',
                params: {
                    include: 'vehicle_types'
                }
            });
            if (res.success){
                let n = carriers.value.findIndex( c => (c.id ===id) );
                if ( n > -1 ){
                    carriers.value.splice(n, 1, res.result);
                } else {
                    carriers.value.push(res.result);
                }
            }
        } catch(e){
            console.log('ERR (carrier)', e);
        }
    }   //onmodify
    
    function del(item){
        $jet.msg({
            text: `Подтвердите удаление записи перевозчика "${ item.title }"`,
            color: 'indigo',
            click: ok => {
                    if ( !ok ){
                        return;
                    }
                    const opts = {
                        url: `/carriers/${ item.id }`,
                        method: 'DELETE'
                    };
                    $jet.api(opts).then(res =>{
                        if (res.success){
                            let n = carriers.value.findIndex( c => (c.id ===item.id) );
                            if ( n > -1 ){
                                carriers.value.splice(n, 1);
                            }
                        }
                    }).catch(e => {
                        console.log('ERR (del)', e);
                        $jet.msg({
                            text: `Ошибка удаления<br />${ $jet.api.$errm || e.message }`, 
                            color: 'warning'
                        });
                    });
            },
            click_title: 'подтвердить',
            timeout: 60000
        });
    }   //del
    
</script>
