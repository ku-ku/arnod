import { phpdate2m, date2php } from "app-ext/utils";

export async function getorders(params){
    const res = await $jet.api({
        url: '/orders_moderate',
        method: 'GET',
        params
    });
    if (res.success){
        res.result.items.forEach( item => {
            item.at = phpdate2m(item.created_at).format("DD.MM.YYYY");
            item.period_loading = `${ item.loading_start_date ? phpdate2m(item.loading_start_date).format("DD.MM.YYYY") : '[не указано]'} - ${ item.loading_end_date ? phpdate2m(item.loading_end_date).format("DD.MM.YYYY") : '[не указано]' }`;
            item.period_unloading = `${ item.unloading_start_date ? phpdate2m(item.unloading_start_date).format("DD.MM.YYYY") : '[не указано]' } - ${ item.unloading_end_date ? phpdate2m(item.unloading_end_date).format("DD.MM.YYYY"): '[не указано]' }`;
        });
    }
    return res;
};  //getorders