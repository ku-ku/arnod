import { phpdate2m } from "app-ext/utils";

export async function getorders(filters){
    const res = await $jet.api({
        url: '/organizations_order/filtered',
        method: 'POST',
        params: {
            include: 'order',
            perPage: 1000
        },
        body: {
            filters
        }
    });
    if (res.success){
        res.result.items.forEach( item => {
            item.order.period = `${ phpdate2m(item.order.loading_start_date).format('DD.MM.YYYY') }-${ phpdate2m(item.order.unloading_start_date).format('DD.MM.YYYY') }`;
            item.distributed_cargo_count = Number(item.distributed_cargo_count).toFixed(2);
            item.executed_cargo_count = Number(item.executed_cargo_count).toFixed(2);
            if ( item.order.cargo_units_count ){
                item.order.cargo_units_count = Number(item.order.cargo_units_count).toFixed(2);
                item.order.pc_distributed = Math.trunc( (item.distributed_cargo_count / item.order.cargo_units_count)*100 );
                item.order.pc_executed = Math.trunc( (item.executed_cargo_count / item.order.cargo_units_count)*100 );
            }
        });
        return res.result.items;
        
    } else {
        throw res.error;
    }
}   //getorders