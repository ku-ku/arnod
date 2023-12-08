<template>
    <teleport to="#ar-title">
        <v-tabs v-model="tab"
                density="compact"            
                color="primary">
            <v-tab :value="0">На модерации</v-tab>
            <v-tab :value="1">На исполнении</v-tab>
            <v-tab :value="2">Закрытые</v-tab>
            <v-tab :value="3">Завершенные</v-tab>
        </v-tabs>
        
    </teleport>
    <v-data-table-server density="compact"
                  class="ar-lorders"
                  :loading="pending"
                  :items="orders"
                  :items-length="pages.total"
                  :headers="hdrs"
                  :fixed-header="true"
                  :fixed-footer="true"
                  :sticky="true"
                  hover
                  item-key="id"
                  select-strategy="single"
                  :model-value="selected"
                  return-object
                  v-on:click:row="onclickrow"
                  v-on:update:options="onoptions"
                  :items-per-page="25"
                  height="calc(100vh - 178px)">
        <template v-slot:item.move_direction.title="{ item }">
            <a href="#"
               class="ar-order__link"
               v-on:click.stop.="onorder(item)">{{ item.move_direction.title }}</a>
        </template>    
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" flat icon="mdi-pencil"
                   v-on:click="onorder(item)"></v-btn>
        </template>    
    </v-data-table-server>
    <teleport to="body">
        <ar-logi-order ref="dlg" 
                     v-on:success="onmodify" />
    </teleport>
</template>
<script>
import { profile } from "app-ext/composables/profile";
import { getorders } from "~/services/orders";
import { all } from "~/composables/data";
import ArLogiOrder from "~/components/ArLogiOrder";

const _HDRS = [
    {title: 'Дата', key: 'at', sortable: false},
    {title: '№', key: 'number', sortable: true},
    {title: 'Маршрут', key: 'move_direction.title', sortable: false},
    {title: 'Расстояние', key: 'move_direction.distance', sortable: false},
    {title: 'Груз', key: 'cargo_name.title', sortable: false},
    {title: 'Кол-во', key: 'cargo_units_count', sortable: false},
    {title: 'Остаток', key: 'cargo_units_count_left', sortable: false},
    {title: 'Ед.изм', key: 'cargo_unit.title', sortable: false},
    {title: 'Стоимость', key: 'price', sortable: false},
    {title: 'Стоимость с НДС', key: 'price_vat', sortable: false},
    {title: 'Примечания', key: 'comment', sortable: false},
    {title: ' ', key: 'actions', sortable: false}
];
    
export default {
    name: 'ArCompanyLogisticianPage',
    components: {
        ArLogiOrder
    },
    async setup(){
        definePageMeta({
            key: 'logisticianPage',
            keepalive: true
        });
        useHead({
            title: "Заказы (логист)"
        });
        
        
        const tab = ref(0),
              pages = ref({
                  page: 1,
                  perPage: 10,
                  orders: [],
                  total: 0,
                  sort: []
              }),
              orders = ref([]);
        const at = computed( ()=>all.at ); //for reloading
    
        const { pending, error } = useAsyncData('logistic-orders', async ()=>{
            const params = {
                page: pages.value.page,
                perPage: pages.value.perPage,
                filters: 'status:on_moderate',
                orders:  '-loading_start_date'
            };
            switch (tab.value){
                case 0:
                    params.filters = 'status:on_moderate';
                    break;
                case 1:
                    params.filters = 'status:opened_bids';
                    break;
                case 2:
                    params.filters = 'status:closed_bids';
                    break;
                case 3:
                    params.filters = 'status:completed';
                    break;
            }
            if (pages.value.sort.length > 0){
                params.orders = pages.value.sort.map( s => {
                    return `${ "asc"===s.order ? "" : "-" }${ s.key }`;
                }).join(",");
            } 
            const res = await getorders(params);
            if ( res.success ){
                orders.value = res.result.items;
                pages.value.total = res.result.total;
                console.log('orders', orders);
            } else {
                throw {message: res.error};
            }
            return true;
        }, {
            watch: [tab, at]
        });
        
        return {
            tab,
            pages,
            hdrs: _HDRS,
            orders,
            pending, 
            error
        };
    },
    data(){
        return {
            selected: []
        };
    },
    methods: {
        onoptions(opts){
            this.pages.page = opts.page;
            this.pages.perPage = opts.itemsPerPage;
            this.pages.sort = opts.sortBy;
            refreshNuxtData('logistic-orders');
        },
        onclickrow(e, {item}){
            this.selected = [item];
            $('.ar-lorders table tr.v-data-table__selected').removeClass('v-data-table__selected');
            $(e.target).closest('tr').addClass('v-data-table__selected');
        },
        onorder(o){
            this.selected = [o];
            this.$refs["dlg"].open(o);
        },
        onmodify(order){
            getorders({filters:`id:${order.id}`,page:1,perPage:1}).then( res => {
                if (res.success){
                    const o = res.result.items.at(0);
                    this.selected = [ o ];
                    let n = this.orders.findIndex( _o => _o.id === o.id );
                    this.orders.splice(n, 1, o);
                }
            });
        }
    }
}    
</script>
<style lang="scss">
    .ar-lorders{
        & table {
            & tr {
                & td {
                    &:nth-child(2){
                        text-align: center;
                    }
                    &:nth-child(4), 
                    &:nth-child(6),
                    &:nth-child(7),
                    &:nth-child(9),
                    &:nth-child(10){
                        text-align: right;
                    }
                    &:nth-child(11){
                        max-width: 20rem;
                    }
                }
            }
        }
    }
    .ar-order{
        &__link{
            color: unset;
        }
    }
</style>