<template>
    <teleport to="#ar-tb__prepend"> 
        <v-btn prepend-icon="mdi-plus"
               color="primary"
               class="mx-3"
               variant="tonal"
               v-on:click="ontrailer(null)">
            добавить
        </v-btn>
    </teleport>
    <v-data-table-server density="compact"
                  class="ar-trailers"
                  :loading="pending"
                  :headers="hdrs"
                  :items-length="pages.total"
                  :items="trailers"
                  fixed-header
                  hover
                  item-key="id"
                  select-strategy="single"
                  :model-value="selected"
                  v-on:click:row="onclickrow"
                  :items-per-page="25"
                  v-on:update:options="onoptions"
                  height="calc(100vh - 178px)">
        <template v-slot:item.vehicles_loading_types="{ item }">
            {{ item.vehicles_loading_types?.map( lt => lt.title ).join(" | ") }}
        </template>    
        <template v-slot:item.vehicles_unloading_types="{ item }">
            {{ item.vehicles_unloading_types?.map( ut => ut.title ).join(" | ") }}
        </template>    
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-pencil"
                   v-on:click="ontrailer(item)"></v-btn>
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-close"
                   v-on:click="del(item)"></v-btn>
        </template>
    </v-data-table-server>
    <teleport to="body">
        <ar-trailer ref="dlg" 
                    v-on:success="onmodify" />
    </teleport>
</template>
<script setup>
    import { empty } from "app-ext/utils";
    import { all } from "~/composables/data";
    import ArTrailer from "./ArTrailer";
    
    const props = defineProps({search: String});
    
    const hdrs = [
        {title: 'Рег.номер',    key: 'reg_number', sortable: false},
        {title: 'Тип',           key: 'vehicle_type.title', sortable: false},
        {title: 'Марка/модель', key: 'name', sortable: false},
        {title: 'Вес',          key: 'weight', sortable: false, align: "end"},
        {title: 'Объем',        key: 'volume', sortable: false, align: "end"},
        {title: 'Г/В',          key: 'release_year', sortable: false, align: "end"},
        {title: 'Тип загрузки', key: 'vehicles_loading_types', sortable: false},
        {title: 'Тип выгрузки', key: 'vehicles_unloading_types', sortable: false},
        {title: ' ',            key: 'actions', sortable: false, align: "center", width: 108}
    ];
    const pages = ref({
                            page: 1,
                            perPage: 25,
                            total: 0,
                            sort: []
                    }),
          s = toRef(props, 'search');
    
    const trailers = ref([]),
          selected = ref([]),
          dlg      = ref(null);
    
    const { pending, error } = useAsyncData('transport-trailers', async ()=>{
        trailers.value = [];
        try {
            const params = {
                    page: pages.value.page,
                    perPage: pages.value.perPage,
                    include: '*'
                };
            if ( !empty(s.value) ){
                params.filters = `reg_number:${ s.value }`;
            }
            const res = await $jet.api({
                url: '/trailers',
                params
            });
            if (res.success){
                trailers.value = res.result.items;
                pages.value.total = res.result.total;
            }
        } catch(e){
            console.log('ERR (vehicles)', e);
            $jet.msg({
                        text:`Ошибка получения данных.<br /><small>Информация для техподдержки: ${e.message} ${$jet.api.$errm}`,
                        type: 'warning'
                    });
        }
    }, {
        watch: [ s, all ]
    });
    
    
    function ontrailer(item){
        dlg.value?.open(item);
    };  //
    
    function onoptions(opts){
        pages.value.page = opts.page;
        pages.value.perPage = opts.itemsPerPage;
        pages.value.sort = opts.sortBy;
        if ( 0 === pages.value.total ){
            return;
        }
        refreshNuxtData('transport-trailers');
    };  //onoptions
    
    function onclickrow(e, { item }){
        selected.value = [ item ];
        $('.ar-trailers table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };  //onclickrow
    
    
    function onmodify(trailer){
        let n = trailers.value.findIndex( v => v.id === trailer.id );
        if ( n < 0 ){
            trailers.value.push(trailer);
        } else {
            trailers.value.splice(n, 1, trailer);
        }
    }   //onmodify
    
    
    function del(trailer){
        $jet.msg({
            text: `Подтвердите удаление записи ТС "${ trailer.name }: ${trailer.reg_number}"`,
            color: 'indigo',
            click: ok => {
                    if ( !ok ){
                        return;
                    }
                    const opts = {
                        url: `/trailers/${ trailer.id }`,
                        method: 'DELETE'
                    };
                    $jet.api(opts).then(res =>{
                        if (res.success){
                            let n = trailers.value.findIndex( v => (v.id ===trailer.id) );
                            if ( n > -1 ){
                                trailers.value.splice(n, 1);
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
    }
</script>