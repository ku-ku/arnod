<template>
    <teleport to="#ar-tb__prepend"> 
        <v-btn prepend-icon="mdi-plus"
               color="primary"
               class="mx-3"
               variant="tonal"
               v-on:click="ondriver(null)">
            добавить
        </v-btn>
    </teleport>
    <teleport to="body">
        <ar-driver ref="dlg" 
                   v-on:success="onmodify" />
    </teleport>
    <v-data-table-server density="compact"
                  class="ar-drivers"
                  :loading="pending"
                  :headers="hdrs"
                  :items-length="pages.total"
                  :items="drivers"
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
                   v-on:click="ondriver(item)"></v-btn>
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-close"
                   v-on:click="del(item)"></v-btn>
        </template>
    </v-data-table-server>
</template>
<script setup>
    import {ref, toRef, onMounted} from "vue";
    
    import { empty } from "app-ext/utils";
    import { all } from "~/composables/data";
    import ArDriver from "./ArDriver";
    
    const props = defineProps({search: String});
    const $emit = defineEmits(["count"]);
    
    const hdrs = [
        {title: 'ФИО',    key: 'user.full_name', sortable: false},
        {title: 'Тел.',   key: 'user.phone', sortable: false},
        {title: 'Организация', key: 'user.organization.title', sortable: false},
        {title: ' ',            key: 'actions', sortable: false, align: "center", width: 108}
    ];
    const pages = ref({
                        page: 1,
                        perPage: 25,
                        total: 0,
                        sort: []
                    }),
          s = toRef(props, 'search');
    
    const drivers = ref([]),
          selected = ref([]),
          dlg      = ref(null);
    
    const { pending, error } = useAsyncData('transport-drivers', async ()=>{
        drivers.value = [];
        try {
            const params = {
                    page: pages.value.page,
                    perPage: pages.value.perPage,
                    include: '*'
                };
            if ( !empty(s.value) ){
                params.filters = `users.full_name:${ s.value }`;
            }
            const res = await $jet.api({
                url: '/drivers',
                params
            });
            if (res.success){
                drivers.value = res.result.items;
                pages.value.total = res.result.total;
                $emit("count", res.result.total);
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
    
    function ondriver(item){
        console.log('dlg', dlg);
        dlg.value.open(item);
    };  //
    
    function onoptions(opts){
        pages.value.page = opts.page;
        pages.value.perPage = opts.itemsPerPage;
        pages.value.sort = opts.sortBy;
        if ( 0 === pages.value.total ){
            return;
        }
        refreshNuxtData('transport-drivers');
    };  //onoptions
    
    function onclickrow(e, { item }){
        selected.value = [ item ];
        $('.ar-drivers table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };  //onclickrow
    
    
    function onmodify(driver){
        let n = drivers.value.findIndex( v => v.id === driver.id );
        if ( n < 0 ){
            drivers.value.push(driver);
        } else {
            drivers.value.splice(n, 1, driver);
        }
    }   //onmodify
    
    
    function del(driver){
        $jet.msg({
            text: `Подтвердите удаление записи "${ driver.user.full_name }"`,
            color: 'indigo',
            click: ok => {
                    if ( !ok ){
                        return;
                    }
                    const opts = {
                        url: `/drivers/${ driver.id }`,
                        method: 'DELETE'
                    };
                    $jet.api(opts).then(res =>{
                        if (res.success){
                            let n = drivers.value.findIndex( v => (v.id ===driver.id) );
                            if ( n > -1 ){
                                drivers.value.splice(n, 1);
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
