<template>
    <teleport to="#ar-tb__prepend"> 
        <v-btn prepend-icon="mdi-plus"
               color="primary"
               class="mx-3"
               variant="tonal"
               v-on:click="onvehicle(null)">
            добавить
        </v-btn>
    </teleport>
    <v-data-table-server density="compact"
                  class="ar-vehicles"
                  :loading="pending"
                  :headers="hdrs"
                  :items-length="pages.total"
                  :items="vehicles"
                  fixed-header
                  hover
                  item-key="id"
                  select-strategy="single"
                  :model-value="selected"
                  v-on:click:row="onclickrow"
                  :items-per-page="25"
                  v-on:update:options="onoptions"
                  height="calc(100vh - 178px)">
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-pencil"
                   v-on:click="onvehicle(item)"></v-btn>
            <v-btn size="x-small" 
                   flat 
                   icon="mdi-close"
                   v-on:click="del(item)"></v-btn>
        </template>
    </v-data-table-server>
    <teleport to="body">
        <ar-vehicle ref="dlg" 
                    v-on:success="onmodify" />
    </teleport>
</template>
<script setup>
    import { empty } from "app-ext/utils";
    import { all } from "~/composables/data";
    import ArVehicle from "./ArVehicle";
    
    const props = defineProps({search: String});
    const $emit = defineEmits(["count"]);
    
    const hdrs = [
        {title: 'Рег.номер',    key: 'reg_number', sortable: false},
        {title: 'ЮЛ',           key: 'legal_entity.title', sortable: false},
        {title: 'Марка/модель', key: 'name', sortable: false},
        {title: 'Вес',          key: 'weight', sortable: false, align: "end"},
        {title: 'Г/В',          key: 'release_year', sortable: false, align: "end"},
        {title: 'Бак,л',        key: 'fuel_capacity', sortable: false, align: "end"},
        {title: ' ',            key: 'actions', sortable: false, align: "center", width: 108}
    ];
    const pages = ref({
                            page: 1,
                            perPage: 25,
                            total: 0,
                            sort: []
                    }),
          s = toRef(props, 'search');
    
    const vehicles = ref([]),
          selected = ref([]),
          dlg      = ref(null);
    
    const { pending, error } = useAsyncData('transport-vehicles', async ()=>{
        vehicles.value = [];
        try {
            const params = {
                    page: pages.value.page,
                    perPage: pages.value.perPage,
                    include: 'legal_entity',
                    only: '1'
                };
            if ( !empty(s.value) ){
                params.filters = `reg_number:${ s.value }`;
            }
            const res = await $jet.api({
                url: '/vehicles',
                params
            });
            if (res.success){
                vehicles.value = res.result.items;
                pages.value.total = res.result.total;
                $emit("count", res.result.total);
            }
        } catch(e){
            console.log('ERR (vehicles)', e);
            $jet.msg({
                        text:`Ошибка получения данных ТС.<br /><small>Информация для техподдержки: ${e.message} ${$jet.api.$errm}`,
                        type: 'warning'
                    });
        }
    }, {
        watch: [ s, all ]
    });
    
    
    function onvehicle(item){
        dlg.value?.open(item);
    };  //
    
    function onoptions(opts){
        pages.value.page = opts.page;
        pages.value.perPage = opts.itemsPerPage;
        pages.value.sort = opts.sortBy;
        if ( 0 === pages.value.total ){
            return;
        }
        refreshNuxtData('transport-vehicles');
    };  //onoptions
    
    function onclickrow(e, { item }){
        selected.value = [ item ];
        $('.ar-vehicles table tr.v-data-table__selected').removeClass('v-data-table__selected');
        $(e.target).closest('tr').addClass('v-data-table__selected');
    };  //onclickrow
    
    
    function onmodify(vehicle){
        let n = vehicles.value.findIndex( v => v.id === vehicle.id );
        if ( n < 0 ){
            vehicles.value.push(vehicle);
        } else {
            vehicles.value.splice(n, 1, vehicle);
        }
    }   //onmodify
    
    
    function del(vehicle){
        $jet.msg({
            text: `Подтвердите удаление записи ТС "${ vehicle.name }: ${vehicle.reg_number}"`,
            color: 'indigo',
            click: ok => {
                    if ( !ok ){
                        return;
                    }
                    const opts = {
                        url: `/vehicles/${ vehicle.id }`,
                        method: 'DELETE'
                    };
                    $jet.api(opts).then(res =>{
                        if (res.success){
                            let n = vehicles.value.findIndex( v => (v.id ===vehicle.id) );
                            if ( n > -1 ){
                                vehicles.value.splice(n, 1);
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